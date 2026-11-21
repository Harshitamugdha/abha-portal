# HARSHITA — Access control, consent, audit
*v3. Read with [`00_MASTER_PLAN.md`](../00_MASTER_PLAN.md). Organised in phases, not days.
AI writes the code, you own it (D16): reading list per phase in [`LEARNING.md`](../LEARNING.md#harshita).*

> **You own the one thing everything depends on, and the one place where a bug is a data leak.**
> Vivek and Ravuri build most of the screens; you decide who is allowed to see them. Since v3 the
> pharmacy, admin and deployment work is Ravuri's again. Yours is `authorize()`, consent, identity and
> the seams between everyone's code.

---

# PART A — WHAT YOU OWN

| Area | Backend (`src/server/…`) | Frontend (`src/app/…`) |
|---|---|---|
| Repo | Next.js app, `db.ts` (Prisma singleton), `http.ts` (`apiError`, `actionError`) | Root layout, `components/ui/` basics (with Vivek and Ravuri) |
| Database | `prisma/schema.prisma`, migrations, `seed.ts` | — |
| Contracts | `src/contracts/shared.ts`, `format.ts`, `auth.ts`, `consent.ts`, `audit.ts`; review Vivek's and Ravuri's | — |
| ABHA identity | `auth/abha/`: `AbhaProvider` + `MockAbhaProvider` | `(auth)/login`, `(auth)/login/otp` |
| Staff registration | `auth/register.ts` (`registerStaff`) | `(auth)/staff/register` |
| Sessions | `auth/session.ts` (`getSession`, `requireSession`), staff login (`bcryptjs`) | `(auth)/staff/login` (redirects by role) |
| Coarse gate | `src/proxy.ts` | — |
| **Access control** | **`auth/authorize.ts` + `authorize.test.ts` (policy matrix)** | — |
| Consent | `consent/engine.ts`: request, approve (narrow only), deny, revoke, `activeGrant()`; Server Actions | `patient/consents/` Consent Center |
| Audit | `audit/write.ts` (called only by `authorize`), `audit/queries.ts` | `patient/access-log/` |
| Integration | `docs/updates/_INTEGRATION.md`, merges to `main` | — |

**Why it's the hardest:**
1. **Vivek and Ravuri depend on it.** If `authorize()` and the schema don't exist, they stall. That's
   why Phase 0 was stubs, not features.
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
- **Staff registration** (`registerStaff` Server Action, CONTRACTS §4.1): Zod `StaffRegisterRequest`;
  role is `DOCTOR`, `PHARMACY` or `LAB` only (never `ADMIN`); the institution's type must match the
  role (doctor → hospital, pharmacy → pharmacy, lab → lab); doctors must give an HPR id; password
  hashed with `bcryptjs`; user created with `verified: false` plus a `Membership`. Does **not** log
  them in. Email already used → `CONFLICT`. Public action (no session yet), so it is the one Server
  Action without `requireSession()` + `authorize()`; Zod + the role/institution checks are its guard.
- `proxy.ts`: logged-out → `/login` (patient area) or `/staff/login` (doctor, lab, pharmacy, admin);
  wrong role → their own home. **No DB calls.**
- **Checkpoint:** log in as Asha, Kavya, lab, pharmacy, admin with `DEV_FAKE_USER` unset; a patient
  visiting `/doctor` or `/admin` is redirected; a tampered cookie → 401. Register a new doctor →
  login refused with `STAFF_UNVERIFIED` until an admin verifies them (Ravuri's admin screen).

## Phase 3 — `authorize()` for real + audit · THE CORE
- The policy matrix in [`CONTRACTS.md`](../CONTRACTS.md) §3 as a pure function
  `decide(user, action, resource, grant)` plus a thin `authorize()` that loads the grant, calls
  `decide`, writes the audit row **first**, and returns the decision.
- Audit `reason` always set: `AUTHOR`, `CONSENT`, `NO_ACTIVE_CONSENT`, `SCOPE_EXCLUDED`,
  `WRONG_ROLE`, `NOT_OWNER`, `UNVERIFIED`.
- **`authorize.test.ts`: one test per matrix cell**, plus: expired grant (validTo = now − 1 s),
  grant starting in the future, revoked grant, author access with no grant, lab staff asking for
  another lab's orders, unverified doctor.
- **Checkpoint:** delete the stub. Tell Vivek and Ravuri to unset `DEV_FAKE_USER` and run their screens as real
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
- **Staff login** (`/staff/login`): one form for all staff, redirect by role. Link to registration.
- **Staff registration** (`/staff/register`): name, email, password, role, institution (filtered by
  role), HPR id (doctors). On success: "Registered. An admin must verify your account before you can
  log in."
- **Consent Center** (`/patient/consents`, Server Component + actions): *Waiting for you* · *Active* ·
  *Past*. Approve opens a dialog with the requested scopes pre-ticked (others not shown). Revoke
  confirms and says what will stop working.
- **Access log** (`/patient/access-log`): who, what, when (`formatIST`), under which consent. Denied
  attempts shown muted with "No consent at the time".
- **Checkpoint:** demo steps 1 (login), 4, 9, 10.

## Phase 6 — Integration (you hold the seams)
- Review every contract PR (Vivek's and Ravuri's schemas) before code relies on it.
- Run the full demo story (Master §2.1) as each persona with `DEV_FAKE_USER` unset, first locally,
  then on Ravuri's deployed build.
- Run the seven checks in [`operations/demo-runbook.md`](../operations/demo-runbook.md) §3 with Ravuri.
- Log every seam event in [`updates/_INTEGRATION.md`](../updates/_INTEGRATION.md).

---

# PART C — YOUR TRAPS
TRAPS §1 (proxy ≠ security), §2 (your Server Actions are public too), §6 (expiry), §7 (approve
widening), §10 (Prisma client), §11 (403 vs 404), §13 (double OTP), §18 (server code imported into
client components). Plus:
- **`authorize()` that throws on deny** makes every caller wrap it in try/catch, and one will forget.
  Return the decision.
- **Audit written after the query** loses the row when the query throws. Write it first.
- **Staff at two institutions:** `institutionIds` is an array. Check membership with `includes`, not `[0]`.

# PART D — DONE MEANS
- [ ] `npm run check` green; `authorize.test.ts` covers every matrix cell
- [ ] `DEV_FAKE_USER` code path deleted
- [ ] Demo steps 1, 4, 9, 10 work on the deployed build; the denied read in step 11 is in the audit log
- [ ] OTP rate limit and duplicate consent-request handling working
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
