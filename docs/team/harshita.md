# HARSHITA — Access control, consent, audit, and the staff side (pharmacy, admin)
*v2. Read with [`00_MASTER_PLAN.md`](../00_MASTER_PLAN.md). Organised in phases, not days.
Written by hand (D16): reading list per phase in [`LEARNING.md`](../LEARNING.md#harshita).*

> **You own the one thing everything depends on, and the one place where a bug is a data leak.**
> Vivek builds most of the screens; you decide who is allowed to see them. Since v2 you also own
> the staff side Ravuri had (pharmacy, admin, deployment). Those screens are small. The hard part
> is still `authorize()` and consent.

---

# PART A — WHAT YOU OWN

| Area | Backend (`src/server/…`) | Frontend (`src/app/…`) |
|---|---|---|
| Repo + platform | Next.js app, `db.ts` (Prisma singleton), `http.ts` (`apiError`, `actionError`), Edge `/api/v1/health` | Root layout, `components/ui/` basics (with Vivek) |
| Database | `prisma/schema.prisma`, migrations, `seed.ts` | — |
| Contracts | `src/contracts/shared.ts`, `format.ts`, `auth.ts`, `consent.ts`, `audit.ts`, `pharmacy.ts`, `admin.ts`; review Vivek's | — |
| ABHA identity | `auth/abha/`: `AbhaProvider` + `MockAbhaProvider` | `(auth)/login`, `(auth)/login/otp` |
| Sessions | `auth/session.ts` (`getSession`, `requireSession`), staff login (`bcryptjs`) | `(auth)/staff/login` (redirects by role) |
| Coarse gate | `src/proxy.ts` | — |
| **Access control** | **`auth/authorize.ts` + `authorize.test.ts` (policy matrix)** | — |
| Consent | `consent/engine.ts`: request, approve (narrow only), deny, revoke, `activeGrant()`; Server Actions | `patient/consents/` Consent Center |
| Audit | `audit/write.ts` (called only by `authorize`), `audit/queries.ts` | `patient/access-log/` |
| Pharmacy *(from Ravuri)* | `pharmacy/`: `lookupPrescription`, `dispensePrescription` | `pharmacy/`, `pharmacy/rx/[code]` |
| Admin *(from Ravuri)* | `admin/`: `listStaff`, `verifyStaff`, `queryAudit`, `listInstitutions` | `admin/staff`, `admin/audit`, `admin/institutions` |
| Deployment + CI *(from Ravuri)* | Vercel + hosted Postgres, env per environment, error logging helper, GitHub Actions | — |

**Why it's the hardest:**
1. **Vivek depends on it.** If `authorize()` and the schema don't exist on day 2, he stalls. That's
   why Phase 0 is stubs, not features.
2. **Its bugs are silent.** An over-permissive check looks like a working feature.
3. **The edge cases cluster here:** expiry at the boundary second, narrowing on approve, revoked then
   re-requested, doctor at two institutions, unverified staff, author access after consent lapses.

---

# PART B — PHASES

## Phase 0 — Unblock Vivek (deadline: end of day 2) · BLOCKS VIVEK
**In this order:**
1. `create-next-app` at the repo root (TypeScript, Tailwind, App Router, `src/`, import alias `@/*`).
   Folder skeleton from Master Part 4.3. Push to GitHub so Vivek can clone.
2. Prisma 7: `schema.prisma` exactly as [`CONTRACTS.md`](../CONTRACTS.md) §2, `prisma.config.ts`
   (with `dotenv/config`), generator `prisma-client` + explicit `output`, `@prisma/adapter-pg`,
   `src/server/db.ts` singleton. First migration.
3. `seed.ts`: every persona and row in Master Part 3, including the pending lab order and `ASHA7K`.
   `npm run db:reset` = drop + migrate + seed.
4. `src/contracts/shared.ts` (enums, error codes, `ApiErrorBody`, `ActionResult<T>`, `SessionUser`,
   `Page<T>`) and `format.ts` (`formatIST`, `formatAbha`, `maskAbha`, `parseAbhaInput`) with tests.
5. Stubs: `getSession()` reads `DEV_FAKE_USER`; `authorize()` returns `{ allowed: true,
   allowedTypes: all, reason: 'STUB' }` **and writes the audit row**; `apiError()`, `actionError()`.
6. Hosting decision (Master Part 13): create the hosted Postgres now so the deploy at the end isn't
   the first time you see it.

**Checkpoint:** message Vivek the `npm run db:reset` output and `DEV_FAKE_USER=kavya` →
`GET /api/v1/auth/me` returning Kavya. **This is the most important message of the project.**

## Phase 1 — Mock ABHA provider
```ts
interface AbhaProvider {
  requestOtp(abha: string): Promise<{ txnId: string; maskedMobile: string; devOtp?: string }>;
  verifyOtp(txnId: string, otp: string): Promise<{ abhaNumber: string }>;   // throws OTP_INVALID
  getProfile(abhaNumber: string): Promise<AbhaProfileDTO>;
}
```
- `parseAbhaInput()` accepts `91-1000-0000-0001`, `91100000000001` or `asha.verma@abdm` (lowercased).
- Txn store: in-memory `Map`, 5-minute TTL, 3 wrong attempts kills the txn, 3 OTP requests per
  ABHA per 10 minutes → `RATE_LIMITED`.
- Unknown ABHA → same response shape as a known one, but verify always fails.
- **Checkpoint:** Vitest: happy path, wrong OTP ×3, expired txn, rate limit, unknown ABHA.

## Phase 2 — Sessions, staff login, proxy
- `jose` HS256 JWT carrying `SessionUser`, in cookie `portal_session` (CONTRACTS §5). Cookie only.
- `requireSession()` throws `UNAUTHENTICATED`.
- Staff login: `bcryptjs` compare; `verified=false` → `STAFF_UNVERIFIED`; same error for unknown
  email and wrong password. Response includes `redirectTo` by role.
- `proxy.ts`: logged-out → `/login` (patient area) or `/staff/login` (doctor, lab, pharmacy, admin);
  wrong role → their own home. **No DB calls.**
- **Checkpoint:** log in as Asha, Kavya, lab, pharmacy, admin with `DEV_FAKE_USER` unset; a patient
  visiting `/doctor` or `/admin` is redirected; a tampered cookie → 401.

## Phase 3 — `authorize()` for real + audit · THE CORE
- The policy matrix in [`CONTRACTS.md`](../CONTRACTS.md) §3 as a pure function
  `decide(user, action, resource, grant)` plus a thin `authorize()` that loads the grant, calls
  `decide`, writes the audit row **first**, and returns the decision.
- Audit `reason` always set: `AUTHOR`, `CONSENT`, `NO_ACTIVE_CONSENT`, `SCOPE_EXCLUDED`,
  `WRONG_ROLE`, `NOT_OWNER`, `UNVERIFIED`.
- **`authorize.test.ts`: one test per matrix cell**, plus: expired grant (validTo = now − 1 s),
  grant starting in the future, revoked grant, author access with no grant, lab staff asking for
  another lab's orders, unverified doctor.
- **Checkpoint:** delete the stub. Tell Vivek to unset `DEV_FAKE_USER` and run his screens as real
  users. Anything that breaks now was a real hole.

## Phase 4 — Consent engine
- `request`: doctor must be verified; an open `REQUESTED` grant for the same pair is returned, not
  duplicated.
- `approve(patient, id, scopes?)`: owner only; from `REQUESTED` only; `approved = requested ∩ submitted`
  (TRAPS §7); `validFrom = now`, `validTo = now + durationDays`.
- `deny`, `revoke` (from `GRANTED` only). Revoke is effective on the next read.
- Server Actions `requestConsent`, `approveConsent`, `denyConsent`, `revokeConsent` + Route Handler
  `/consents/latest` (CONTRACTS §4.2). **Vivek's consent-request form calls `requestConsent`.**
- **Checkpoint:** `consent.test.ts` + Vivek's form creates a request that shows up in Asha's Consent Center.

## Phase 5 — Patient-side screens
- **ABHA login** (`/login`) and **OTP** (`/login/otp`): `useCountdown(30)` custom hook for resend
  (effect **with cleanup**, TRAPS §13); error states for `OTP_INVALID`; dev shows the `devOtp` hint.
- **Staff login** (`/staff/login`): one form for all staff, redirect by role.
- **Consent Center** (`/patient/consents`, Server Component + actions): *Waiting for you* · *Active* ·
  *Past*. Approve opens a dialog with the requested scopes pre-ticked (others not shown). Revoke
  confirms and says what will stop working.
- **Access log** (`/patient/access-log`): who, what, when (`formatIST`), under which consent. Denied
  attempts shown muted with "No consent at the time".
- **Checkpoint:** demo steps 1 (login), 4, 9, 10.

## Phase 6 — Pharmacy *(from Ravuri)* · seeded `ASHA7K` unblocks you
- `lookupPrescription`: `authorize('prescription:lookup')`; DTO built **field by field** (TRAPS §17):
  patient name only, items, issuing doctor + institution, issued/dispensed times. Unknown or expired →
  `NOT_FOUND`, same as a code that never existed (TRAPS §11).
- `dispensePrescription` Server Action: transaction; `CONFLICT` if already dispensed.
- Screens: `/pharmacy` (code input) → `/pharmacy/rx/[code]` (dynamic route, Server Component) with a
  confirm-then-dispense form; `CONFLICT` shows "Already dispensed at …".
- **Checkpoint:** demo step 8.

## Phase 7 — Admin *(from Ravuri)*
- **Staff verification** (`/admin/staff`): unverified list, `verifyStaff` action. Test: Dr Neel can't
  log in, gets verified, now can.
- **Audit log** (`/admin/audit`): Server Component reading `queryAudit` with filters in `searchParams`
  (outcome, patient, actor, date range), page numbers in the URL, DENIED rows
  visually distinct. No record titles or content.
- **Institutions** (`/admin/institutions`): list + create/edit form (`createInstitution`,
  `updateInstitution`, Zod `InstitutionCreate`).
- **Checkpoint:** demo step 11: admin sees Kavya's denied read after revocation; opening
  `/api/v1/records/<id>` as admin → 404.

## Phase 8 — Deploy + integration
- Vercel project, env vars per environment (TRAPS §9: no secret gets a `NEXT_PUBLIC_` prefix), prod
  database migrated and seeded, Edge `/api/v1/health`, `logError()` helper used by the
  handler and action wrappers.
- Run the full demo story (Master §2.1) on the deployed build as each persona.
- Run the seven checks in [`operations/demo-runbook.md`](../operations/demo-runbook.md) §3.
- Log every seam event in [`updates/_INTEGRATION.md`](../updates/_INTEGRATION.md).

## Phase 9 — CI
- GitHub Actions workflow: on every PR, `npm ci`, `npm run check`, `npm run build`, with a throwaway
  Postgres service for the tests. A red check blocks the merge.

---

# PART C — YOUR TRAPS
TRAPS §1 (proxy ≠ security), §2 (your Server Actions are public too), §6 (expiry), §7 (approve
widening), §9 (public env prefixes), §10 (Prisma client), §11 (403 vs 404), §13 (double OTP),
§17 (DTO field by field), §18 (server code imported into client components). Plus:
- **`authorize()` that throws on deny** makes every caller wrap it in try/catch, and one will forget.
  Return the decision.
- **Audit written after the query** loses the row when the query throws. Write it first.
- **Staff at two institutions:** `institutionIds` is an array. Check membership with `includes`, not `[0]`.

# PART D — DONE MEANS
- [ ] `npm run check` green; `authorize.test.ts` covers every matrix cell
- [ ] `DEV_FAKE_USER` code path deleted
- [ ] Demo steps 1, 4, 8, 9, 10, 11 work on the deployed build
- [ ] Institution create/edit, OTP rate limit, Edge health route and CI all working
- [ ] Meera's expired consent refuses; Dr Neel can't log in until verified
- [ ] [`architecture/identity-and-consent.md`](../architecture/identity-and-consent.md) matches the code

# PART E — VIVA QUESTIONS
1. Why isn't `proxy.ts` enough to protect patient data?
2. A consent expires at 10:00:00. What happens to a request at 10:00:00? Where in the code?
3. Why `403 CONSENT_REQUIRED` for doctors but `404` for a pharmacy?
4. Why an httpOnly cookie, and what does it protect against?
5. How would you swap the mock for real ABDM? What changes, what doesn't?
6. What stops a patient approving a scope the doctor never asked for?
7. Why log denied requests?
8. Why does the pharmacy look up by share code instead of by patient?
