# RAVURI — Pharmacy, admin, platform and deployment
*v1. Read with [`00_MASTER_PLAN.md`](../00_MASTER_PLAN.md). Organised in phases, not days.
AI writes the code, you own it (D16): reading list per phase in [`LEARNING.md`](../LEARNING.md#ravuri).*

> **You own the staff side nobody else touches, and the place the whole app runs.** Pharmacy and
> admin are the two roles an examiner uses to check that the access rules hold *for staff*: a
> pharmacy sees one prescription and nothing else; an admin runs the system and still can't read a
> single record. And if the deployed build breaks on demo day, nobody's work is visible.

You join a running project: Harshita's phases 0–3 are done (schema, seed, login, sessions, `proxy.ts`
and the real `authorize()` with its policy-matrix tests). **You're not blocked on anything.** The
access rules your screens need are already in the matrix, and the seeded prescription `ASHA7K` and
unverified Dr Neel give you test data from day one.

---

# PART A — WHAT YOU OWN

| Area | Backend (`src/server/…`) | Frontend (`src/app/…`) |
|---|---|---|
| Contracts | `src/contracts/pharmacy.ts`, `admin.ts` (Harshita reviews) | — |
| Pharmacy | `pharmacy/`: `lookupPrescription`, `dispensePrescription` | `pharmacy/`, `pharmacy/rx/[code]` |
| Admin | `admin/`: `listStaff`, `verifyStaff`, `queryAudit`, `listInstitutions`, `createInstitution`, `updateInstitution` | `admin/staff`, `admin/audit`, `admin/institutions` |
| Platform | `log.ts` (`logError`), Edge `/api/v1/health` | — |
| Deployment | Vercel project + Neon Postgres (Master Part 13), env vars per environment, prod migrate + seed | — |
| CI | `.github/workflows/ci.yml` | — |

**Demo steps:** 8 (pharmacy dispenses) and 11 (admin sees the denied read, can't open a record).

**What you don't build:** `authorize()`, sessions, login or staff registration (Harshita), and any
patient, doctor or lab screen (Vivek). You call `authorize()`; you never change the policy in it.
If a rule seems wrong for your screen, tell Harshita.

---

# PART B — PHASES

## Phase 0 — Get running, write your schemas
- Clone, `npm install`, `.env` from `.env.example`, `npm run db:reset`, `npm run dev`, `npm run check`.
  Log in as `counter@greencross.test` and `admin@portal.test` (`Demo@1234`): each should land on its
  own empty area.
- Read [`CONTRACTS.md`](../CONTRACTS.md) §3 (the policy matrix rows for pharmacy and admin) and §4.6–4.7.
- Write your schemas (D18): `src/contracts/pharmacy.ts` (`PharmacyPrescriptionDTO`, dispense input) and
  `admin.ts` (`StaffDTO`, `AuditQuery`, `AuditEntryDTO`, `InstitutionDTO`, `InstitutionCreate`), field
  for field from CONTRACTS, one valid + one invalid test each. Harshita reviews.
- **Deploy hello-world now:** the Neon database already exists (Harshita created it in her Phase 0:
  Singapore region, migrated and seeded); ask her for access. Connect the GitHub repo to Vercel, set
  `DATABASE_URL` and `JWT_SECRET` in Vercel, deploy. The last day is not the time to see the deploy
  for the first time.
- **Checkpoint:** the deployed URL shows the landing page and Asha can log in on it.

## Phase 1 — Pharmacy · seeded `ASHA7K` unblocks you
- `lookupPrescription(user, shareCode)`: `authorize('prescription:lookup')`; DTO built **field by
  field** (TRAPS §17): patient **name only**, items, issuing doctor + institution, issued/dispensed
  times. Unknown or expired code → `NOT_FOUND`, exactly like a code that never existed (TRAPS §11).
- `dispensePrescription` Server Action: `requireSession` → Zod → `authorize('prescription:dispense')`
  → transaction (set `dispensedAt`, `dispensedBy`); `CONFLICT` if already dispensed or expired.
- Screens: `/pharmacy` (code input) → `/pharmacy/rx/[code]` (dynamic route, Server Component) with a
  confirm-then-dispense form; `CONFLICT` shows "Already dispensed at …"; `notFound()` for a bad code.
- **Checkpoint:** demo step 8 with `ASHA7K`; a second dispense shows the conflict; a made-up code 404s.
  Once Vivek's `createPrescription` lands, a fresh share code works too.

## Phase 2 — Admin
- **Staff verification** (`/admin/staff`): `listStaff({ verified: false })` + `verifyStaff` action
  (`authorize('staff:verify')`). This is the other half of Harshita's staff registration: a newly
  registered doctor can't log in until you verify them. Test with Dr Neel, then with a fresh
  registration.
- **Audit log** (`/admin/audit`): Server Component reading `queryAudit` (`authorize('audit:read:all')`)
  with filters in `searchParams` (outcome, patient, actor, date range), page numbers in the URL,
  DENIED rows visually distinct. Shows ids, roles, actions, outcomes, reasons, never record titles or
  content. Read the audit table through your own query; `audit/write.ts` stays Harshita's.
- **Institutions** (`/admin/institutions`): list + create/edit form (`createInstitution`,
  `updateInstitution`, `authorize('institution:manage')`, Zod `InstitutionCreate`).
- **Checkpoint:** demo step 11: after Asha revokes, admin finds Kavya's DENIED read; opening
  `/api/v1/records/<id>` as admin → 404.

## Phase 3 — Platform
- `/api/v1/health` with `export const runtime = 'edge'`: no Prisma (Edge can't run it), returns
  `{ ok: true, at }`. That's the INT257 Unit VI Edge-runtime topic, kept deliberately tiny.
- `src/server/log.ts`: `logError(err, context)` (server-only), used by the Route Handler and Server
  Action wrappers in `http.ts` (agree the hook with Harshita, whose file it is). In production the
  output lands in Vercel's logs; that plus Vercel Analytics is the "monitoring and error logging"
  practical.
- Env per environment documented in your log (local, preview, production). Before every production
  deploy, check the build output doesn't contain the `JWT_SECRET` value (TRAPS §9).

## Phase 4 — CI
- `.github/workflows/ci.yml`: on every PR and push to `main`: `npm ci`, `npm run check`, `npm run
  build`, with a Postgres service container so the tests run against a real database. A red check
  blocks the merge.
- **Checkpoint:** open a PR with a deliberately failing test, watch CI go red, fix, watch it go green.

## Phase 5 — Production and demo
- Production database migrated and re-seeded right before the demo (you own the reseed;
  [`operations/demo-runbook.md`](../operations/demo-runbook.md) §1).
- Run the whole demo story (Master §2.1) on the deployed build with Harshita, plus the seven checks in
  the runbook §3. Log anything that breaks in [`updates/_INTEGRATION.md`](../updates/_INTEGRATION.md)
  (Harshita keeps that file; tell her).

---

# PART C — YOUR TRAPS
TRAPS §2 (your Server Actions are public endpoints), §3 (pharmacy and admin pages are never cached),
§9 (no secret with `NEXT_PUBLIC_`), §11 (403 vs 404: a pharmacy learns nothing about codes that don't
match), §16 (test as every persona, including the wrong ones), §17 (DTO field by field: the pharmacy
gets the patient's name and nothing else), §18 (server code never imported into a client component).
Plus four of your own:
- **Edge + Prisma.** Anything with `runtime = 'edge'` can't import `db.ts`. Keep the health route free
  of server imports.
- **Port 5432 is blocked on some networks.** Harshita's first migration to Neon failed on a network
  that blocked outbound Postgres and worked from a phone hotspot. Run production migrations from
  Vercel's build or from CI, not from the college network.
- **The mock OTP store is in memory.** On Vercel each serverless instance has its own memory, so an
  OTP requested on one instance may fail to verify on another. Known and accepted for the demo (see
  Harshita's Phase 1 log). If ABHA login fails intermittently on the deployed site, this is the first
  suspect; tell Harshita rather than patching it.
- **Admin is not a superuser.** It's tempting to skip `authorize()` "because it's the admin". The
  admin must be refused clinical data like everyone else (step 11). Call `authorize()` anyway.

# PART D — DONE MEANS
- [ ] Demo steps 8 and 11 work on the deployed build
- [x] A newly registered doctor can log in only after you verify them
- [x] Institution create/edit works; audit filters (outcome, patient, actor, date range) work
- [x] `/api/v1/health` answers from the Edge runtime; `logError` is wired in
- [x] CI runs on every PR and blocks a red build; the deployed build carries no secrets in its bundle

# PART E — VIVA QUESTIONS
1. Why does the pharmacy look up by share code instead of by patient?
2. Why does a made-up share code return the same 404 as an expired one?
3. The admin can see every audit row. Why can't the admin open a record?
4. Why can't the Edge health route use Prisma?
5. Where do your Server Actions check permissions, and why isn't hiding the button enough?
6. What does CI prove that "it works on my laptop" doesn't?
7. What happens to a doctor who registers but hasn't been verified yet, and where is that enforced?
