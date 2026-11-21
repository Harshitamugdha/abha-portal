# TRAPS — the bugs that will actually happen
*Read before debugging anything to do with auth, caching or data access. Most entries here are bugs
that **run fine** and quietly show the wrong person the wrong data. Syntax errors are easy. These
are what fail a viva.*

---

## The universal first move
Log in as the **wrong** role and try it. Then as a doctor **without** consent. Then as a doctor
whose consent **expired** (seed persona Meera). If those three fail correctly, most of the traps
below are already ruled out.

Then check `/audit/me` as the patient: every read you just made should be there, allowed or denied.

---

## 1. Treating `proxy.ts` as the security check · Harshita, everyone
`proxy.ts` (Next.js 16's rename of `middleware.ts`) runs before routing. It's the right place to
redirect a logged-out user to `/login` or keep a patient out of `/doctor/*`. It is **not** where
access is decided.
- **Why:** proxy matchers miss paths (a new route group, `/api/v1/...` vs `/api/...`), Server
  Actions are POSTs to the page route, and middleware-only auth has a public bypass history
  (CVE-2025-29927, a header that skipped middleware entirely in older Next.js).
- **Rule:** every data function calls `authorize()`. Proxy does no DB queries and no consent logic.
- **Check:** delete `proxy.ts` locally and run the access tests. Nothing should leak. Pages would
  redirect less nicely, and that is the only change you should see.

## 2. A Server Action with no auth check · everyone
A Server Action is a **public HTTP endpoint**. Anyone who finds its id can call it with any
arguments. Rendering the form only for doctors protects nothing.
- **Symptom:** none, until someone calls `createPrescription` as a patient.
- **Rule:** the first two lines of every action: `const user = await requireSession()` and
  `authorize(user, …)`. Validate the input with Zod **inside** the action. Never trust a
  `patientId` because it came from a hidden input.

## 3. Caching one user's data for another · Vivek
Anything cached at the route/data level (`"use cache"`, `unstable_cache`, ISR, `fetch` with
`force-cache`, a `revalidate` export) is shared across users unless the cache key includes the user.
- **Symptom:** doctor B sees doctor A's view of a patient. Or a patient sees records after revoking a consent.
- **Rule:** **ISR/static only on public pages** (landing, institution directory). Every page under
  `patient/` and `doctor/` is dynamic. Reading `cookies()` in it makes it dynamic, so do that
  through `getSession()` at the top. Never cache a function that returns patient data.

## 4. Empty list vs consent required · Vivek
`200 { items: [] }` and `403 CONSENT_REQUIRED` render identically if you write
`if (!data?.items.length) return <Empty/>`.
- **Symptom:** a doctor without consent sees "No records". That's a false clinical statement (Master §1.5).
- **Rule:** branch on the error code first. React Query: check `error.code === 'CONSENT_REQUIRED'`
  before `data`. Three distinct UI states: *consent required*, *no records in scope*, *records*.

## 5. Filtering by scope on the client · Vivek
Fetching all records and hiding the out-of-scope ones in the component leaks them in the network
tab. Any examiner who opens DevTools will see them.
- **Rule:** the `WHERE type IN (allowedTypes)` happens in the data function, using the
  `allowedTypes` that `authorize()` returned. The client never receives what it shouldn't render.

## 6. Consent expiry checked with a cron, or not at all · Harshita
- **Symptom:** Meera's expired consent still works, because nobody ran the job.
- **Rule:** `validFrom <= now AND now < validTo AND status = 'GRANTED'` inside the query, every
  time (D9). `EXPIRED` is computed for display.
- **Second-order trap:** compare in UTC. `new Date()` on the server is UTC-correct. A date string
  without `Z` parsed in the browser is local time (IST, +5:30) and will be off by 5½ hours.

## 7. Approve that widens scope · Harshita
Approve accepts optional `scopes` so the patient can **narrow**. If you assign them directly, a
crafted request can approve `DOCUMENT` that the doctor never asked for. Small, but it's exactly
what a "security" question in viva probes.
- **Rule:** `approvedScopes = requested ∩ submitted`. Reject an empty intersection.

## 8. Tokens in `localStorage` · Harshita
Any XSS reads `localStorage`. A health-data app storing session tokens there is the first thing a
security-minded examiner asks about.
- **Rule:** the session is the httpOnly `portal_session` cookie and nothing else (D20). No token
  ever reaches JavaScript, so there's nothing to store.

## 9. `NEXT_PUBLIC_` on a secret · Ravuri, everyone
Any env var prefixed `NEXT_PUBLIC_` is **baked into the browser
bundle**. `NEXT_PUBLIC_JWT_SECRET` is a published secret.
- **Rule:** only the app name is public. `JWT_SECRET`, `DATABASE_URL` and storage keys never get a
  public prefix. Ravuri checks the built `.next/` output for the secret's value before every deploy.

## 10. Many Prisma clients in dev · Harshita
Next.js dev hot-reload re-imports modules. `new PrismaClient()` in a module creates a new
connection pool every save until Postgres refuses connections.
- **Rule:** one client in `src/server/db.ts`, cached on `globalThis` in dev.
- **Prisma 7 specifics (D14):** generator `provider = "prisma-client"` with an explicit `output`,
  config in `prisma.config.ts`, a driver adapter (`@prisma/adapter-pg`), and `.env` is **not**
  auto-loaded, so import `dotenv/config` in the config. Old tutorials show `prisma-client-js`. Don't mix.

## 11. Leaking existence through 403 vs 404 · Ravuri, Vivek, Harshita
If the pharmacy endpoint returns `403` for a real record id and `404` for a fake one, a pharmacy
can enumerate which record ids exist.
- **Rule:** D10. Non-doctors get `404 NOT_FOUND` for anything they can't see, real or not.

## 12. Files served from `public/` · Vivek
Anything in `public/` is downloadable by anyone with the URL. A lab report in `public/uploads/`
has no access control at all.
- **Rule:** files live outside `public/`, keyed by `FileObject.id`, served only through
  `GET /api/v1/files/:id`, which calls `authorize(user, 'file:read', …)`.
- **Also:** Server Actions reject bodies over **1 MB by default**. Our limit is 5 MB, so set
  `experimental.serverActions.bodySizeLimit` in `next.config` *and* check size + MIME type yourself.

## 13. `useEffect` running twice in dev · everyone
React StrictMode mounts, unmounts and remounts in development. An effect that "requests an OTP on
mount" sends two OTPs and trips the rate limit.
- **Rule:** user actions (button clicks) trigger requests, not mount effects. Effects that subscribe
  (the OTP resend countdown) must return a cleanup.

## 14. React Query cache surviving logout · Vivek
Log out as Dr Kavya, log in as Dr Arjun: the cached `['records', patientId]` from Kavya renders
for a moment, or forever if `staleTime` is long.
- **Rule:** on logout and on login, `queryClient.clear()`. Include nothing user-specific in a
  query that isn't in its key.

## 15. Optimistic UI that lies · Vivek
An optimistic prescription that appears instantly and then fails authorization stays on screen
if you don't roll it back.
- **Rule:** `useOptimistic` (or React Query `onMutate`) with an explicit rollback path. Test it
  by revoking consent in another tab, then submitting.

## 16. The demo works only on the seed · everyone
Every screen works for Asha because Asha was the only one you clicked. Rohan has records at one
institution and no consents. Meera's consent is expired. Dr Neel is unverified.
- **Rule:** before calling a phase done, run your screen as **every** persona that can reach it.

## 17. Date of birth and other "harmless" fields to the pharmacy · Ravuri
`PharmacyPrescriptionDTO` has patient **name** and nothing else about the patient. Spreading the
Prisma object into the response (`...patient`) ships DOB, ABHA number and gender.
- **Rule:** DTOs are built field by field from an explicit `select`. Never return a Prisma row as-is.

## 18. Server code pulled into a client component · everyone
A file with `'use client'` that imports `src/server/db.ts`, `authorize.ts`, or anything that imports
them, tries to ship Prisma and your secrets to the browser. Sometimes the build fails with a
confusing module error; sometimes it quietly bundles server code that then crashes at runtime.
- **Rule:** client components get data from props (passed by a Server Component), from a Server
  Action, or from a Route Handler via React Query. Never by importing `src/server/`.
- **Guard:** put `import 'server-only'` at the top of every file in `src/server/`. Importing one of
  them into a client component then fails the build with a clear message.
- `src/contracts/` is safe to import anywhere: it's pure Zod and helpers, no server code.

## 19. Fixing seed data by hand · everyone
Editing a row in Prisma Studio to make your screen work means the bug returns on the next
`db:reset`, in front of the examiner.
- **Rule:** fix `seed.ts` or the producing code. `npm run db:reset` must always give a working demo.

---

## Escalation
Stuck 45 minutes on any of these, or on tooling/deploy? Message the group: what you tried, the
exact error text, the smallest reproduction. That's the protocol, not a failure.
