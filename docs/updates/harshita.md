# Harshita — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/`](../team/README.md).*

---

## [2026-11-21 20:05] Phase 4 — Consent engine

**Done:** `requestConsent`, `approveConsent`, `denyConsent`, `revokeConsent` Server Actions
(`src/app/actions/consent.ts`) over engine functions in `consent/engine.ts`; `listConsents` and
`latestConsent` data functions; `GET /api/v1/consents/latest?patientId=`. Request: doctor only, patient
must exist, an open `REQUESTED` for the same pair is returned (no duplicate), institution chosen safely
for doctors at two institutions. Approve: owner only, from `REQUESTED` only, scopes = requested ∩
submitted (TRAPS §7), `validFrom = now`, `validTo = now + durationDays`. Deny from `REQUESTED`, revoke
from `GRANTED`, otherwise `CONFLICT`; status changes use `updateMany … where status` so two clicks can't
both win. Also: code simplified everywhere and all comments removed (same behaviour).

**Schema / contract (said first, then done):** `ConsentGrant.durationDays Int @default(7)` (migration
`consent_duration`; the default keeps it safe on Neon's existing row); `ConsentRequest.institutionId?`;
`ConsentDTO` shape written into CONTRACTS §4.2.

**Files touched:** `src/contracts/consent.ts`, `src/server/consent/rules.ts`, `consent.test.ts`,
`src/app/actions/consent.ts`, `src/app/api/v1/consents/latest/route.ts`, migration (new) ·
`consent/engine.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `docs/CONTRACTS.md`, `CHANGELOG.md`,
`src/server/README.md` (modified)

**Run command:**
```bash
npx prisma migrate dev && npm run db:seed && npm run check
```

**Access check (live, real logins):** Kavya → Asha before: `CONSENT_REQUIRED`. Kavya requests
(prescriptions + lab reports, 7 days, "Follow-up") → `REQUESTED`; asks again → same id. Kavya tries to
approve → `FORBIDDEN`. Asha approves while also ticking DOCUMENT → `GRANTED` with only PRESCRIPTION +
LAB_REPORT; approve again → `CONFLICT`. Kavya → Asha: allowed, `allowedTypes` = PRESCRIPTION, LAB_REPORT.
Asha revokes → Kavya's next list `CONSENT_REQUIRED`; revoke again → `CONFLICT`. Pharmacy requesting →
`FORBIDDEN`; logged out → `UNAUTHENTICATED`; 60 days → `VALIDATION_FAILED`; deny works. 200 tests pass.

**Demo steps enabled:** 3, 4, 5 (policy), 10 at the action level; screens in Phase 5.

**Learned:** Narrowing must be an intersection with what was REQUESTED, not just "what the patient
ticked", or a crafted request can approve a scope nobody asked for.

**AI used:** code: everything above · review: schema/contract additions announced before changing.

**Open issues:**
- Run `npx prisma migrate deploy` against Neon (from a network that allows port 5432) for the new column.
- Vivek: his request form calls `requestConsent` with a plain object; doctors with two institutions must send `institutionId`.
- `DEV_FAKE_USER` blocks in `session.ts` / `proxy.ts` still to delete once Phase 5 login screens exist.

**Next:** Phase 5 — login, OTP, staff login + registration, Consent Center, access log screens.

## [2026-11-16 20:30] Phase 3 — Real authorize() + policy matrix tests

**Done:** `authorize()` split into a pure `decide(user, action, resource, grant, now)` (the CONTRACTS §3
matrix) and a thin wrapper that loads the doctor's active consent, calls `decide`, writes the audit
row first and returns the decision (never throws on deny). `activeGrant()` in `consent/engine.ts`
checks `status = GRANTED AND validFrom <= now < validTo` in the query (D9, no cron).
`isGrantActive()` applies the same rule in `decide`. Deny codes: doctor → `CONSENT_REQUIRED`; others
reading patient data → `NOT_FOUND`; impossible role/action → `FORBIDDEN`. Clarifications added to
CONTRACTS §3 ("How the cells are applied").

**Files touched:** `src/server/auth/authorize.ts` (rewritten), `authorize.test.ts`,
`src/server/consent/engine.ts` (new) · `docs/CONTRACTS.md` (modified)

**Run command:**
```bash
npm run check     # 187 tests: 90 matrix cells + 28 edge cases + earlier phases
```

**Access check (live, real login, DEV_FAKE_USER unset):** Kavya → Asha's list and record:
`CONSENT_REQUIRED / NO_ACTIVE_CONSENT`; Kavya → Meera (expired yesterday): `CONSENT_REQUIRED`;
admin → any record: `NOT_FOUND / WRONG_ROLE`; Asha → own: `ALLOWED / OWNER`, Meera's:
`NOT_FOUND / NOT_OWNER`. One audit row per call, denied ones included.

**Demo steps enabled:** step 2's rule ("Consent required", not empty) and step 11's admin 404, at
the policy level.

**Learned:** At `validTo` itself the consent is already expired (`now < validTo`). A list needs
consent even for records the doctor wrote, or a revoke would show a partial list instead of
"Consent required".

**AI used:** code: authorize, engine, tests · review: matrix interpretation written into CONTRACTS §3.

**Open issues:**
- **`DEV_FAKE_USER` not deleted yet** (brief says Phase 3). Kept until the Phase 5 login screens
  exist, because without them Vivek can't log in from a browser. It's dev-only, used only when there's
  no cookie, and the fake user now goes through the REAL `authorize()`, so Vivek already tests as real
  roles. Two marked `STUB — DELETE` blocks (`session.ts`, `proxy.ts`).
- Vivek to review the CONTRACTS §3 clarifications (list needs consent even as author; `types: []`).

**Next:** Phase 4 — consent engine: request (no duplicates), approve (narrow only), deny, revoke,
Server Actions, `/consents/latest`.

## [2026-11-16 20:20] Phase 2 — Sessions (JWT), login routes, staff registration, proxy

**Done:** Signed HS256 JWT (`jose`) carrying `SessionUser` in the httpOnly cookie `portal_session`
(8 h, `SameSite=Lax`, `Secure` in production). Routes: `POST /auth/abha/otp`, `/auth/abha/verify`,
`/auth/staff/login` (redirect by role), `/auth/logout`. Staff login: bcrypt compare; unknown email
and wrong password give the same error; unverified → `STAFF_UNVERIFIED` only after the password is
right. `registerStaff` Server Action (public, Zod + role/institution checks, creates an unverified
user + membership). `proxy.ts` coarse gate: logged out → `/login` or `/staff/login`, wrong role →
own home, no DB calls. `DEV_FAKE_USER` still works when there's no cookie (dev only) and is marked
for deletion in Phase 3. `typecheck` now runs `next typegen` first so it works on a fresh clone.

**Files touched:** `src/server/auth/{token,login,register,gate}.ts` + `token.test.ts`,
`gate.test.ts`, `src/proxy.ts`, `src/app/api/v1/auth/{abha/otp,abha/verify,staff/login,logout}/route.ts`,
`src/app/(auth)/staff/register/actions.ts` (new) · `session.ts`, `http.ts`, `src/contracts/auth.ts`
+ tests, `package.json` (`jose`, typecheck script) (modified)

**Run command:**
```bash
npm run dev
curl -c jar -H content-type:application/json -d '{"email":"kavya@citygen.test","password":"Demo@1234"}' http://localhost:3000/api/v1/auth/staff/login
curl -b jar http://localhost:3000/api/v1/auth/me
```
`.env` needs `JWT_SECRET` (32+ random chars) and `SESSION_HOURS=8`.

**Access check (DEV_FAKE_USER unset):** Asha OTP login → `/auth/me` = Asha. Kavya, lab, pharmacy,
admin → `/doctor`, `/lab`, `/pharmacy`, `/admin`. Neel → 403 `STAFF_UNVERIFIED`. Wrong password and
unknown email → identical 401. Asha opening `/doctor` or `/admin` → 307 to `/patient`; Kavya opening
`/admin/audit` → `/doctor`; logged out `/patient` → `/login`, `/lab` → `/staff/login`. Tampered cookie
→ 401 and redirect to `/login`. Logout → 204, then 401. Registered a new doctor → login refused with
`STAFF_UNVERIFIED`; same email again → `CONFLICT`; lab role + hospital → `VALIDATION_FAILED`.
69 tests pass.

**Demo steps enabled:** step 1 login works at the API level (screens in Phase 5)

**Learned:** The proxy can check the JWT signature (no database needed), which is why a tampered
cookie is caught even there; but it's still not the security boundary. `next typegen` generates the
`LayoutProps` type, so `tsc` fails on a clean clone without it.

**AI used:** code: everything above · debugging: stale `.next` types after a deleted route.

**Open issues:**
- No `/login`, `/staff/login`, `/patient`… pages yet, so redirects land on 404s until Phase 5 / Vivek's screens.
- OTP transactions are in memory (see Phase 1): decide before Phase 8 whether to move them to a table.

**Next:** Phase 3 — the real `authorize()` policy matrix + `authorize.test.ts`, delete `DEV_FAKE_USER`.

## [2026-11-16 20:10] Phase 1 — Mock ABHA provider

**Done:** `AbhaProvider` interface and `MockAbhaProvider`: OTP transactions in memory with a
5-minute lifetime (expired at exactly 5:00), 3 wrong OTPs delete the transaction, OTPs are single
use, max 3 OTP requests per person per 10 minutes (number and address count as the same person),
unknown ABHAs get the same-shaped reply but can never log in. `getAbhaProvider()` picks the provider
from `ABHA_PROVIDER` and keeps it on `globalThis`; the mock's directory is the seeded `AbhaProfile`
table. ABHA request/response shapes in `src/contracts/auth.ts`.

**Files touched:** `src/server/auth/abha/{types,mock,index}.ts`, `mock.test.ts`,
`src/contracts/auth.ts`, `auth.test.ts` (new) · `vitest.config.mts` (`server-only` alias),
`.env.example` (modified)

**Run command:**
```bash
npm run check
```
17 provider tests + 4 contract tests pass (49 total). No screen yet: login routes come in Phase 2.

**Access check:** unknown ABHA `91-1000-0000-0099` → same reply shape, OTP `123456` refused
(`OTP_INVALID`), no profile (`NOT_FOUND`). 4th OTP request in 10 min → `RATE_LIMITED`.

**Demo steps enabled:** none yet (step 1 needs Phase 2 routes + Phase 5 screens)

**Learned:** Unknown ABHAs must look identical to real ones, or the OTP form becomes a way to test
which ABHA numbers exist (enumeration). Fake timers (`vi.useFakeTimers`) test a 5-minute expiry in
milliseconds.

**AI used:** code: provider, interface, contracts, tests · debugging: `server-only` throwing under
Vitest (aliased to its empty file).

**Open issues:**
- The OTP is always `ABHA_DEV_OTP` (123456), also on the deployed site, because the mock sends no
  SMS. Deliberate (D1); say so in the viva.
- In-memory store: fine for one dev server. On Vercel each serverless instance has its own memory,
  so an OTP requested on one instance may not verify on another. Acceptable for the demo; a real
  provider keeps transactions on ABDM's side.

**Next:** Phase 2 — JWT sessions (`jose`), ABHA + staff login routes, staff registration, `proxy.ts`.

## [2026-11-16 19:50] Phase 0 (part 2) — database, seed, shared contracts, stubs · Vivek unblocked

**Done:** Prisma 7 set up (`prisma.config.ts`, schema from CONTRACTS §2 with relations, `db.ts`
singleton, `init` migration) on local Postgres 18. `seed.ts` creates every Master Part 3 persona with
fixed ids (`user-asha`, `rec-asha-cbc`…) and fixed history dates; only ASHA7K's expiry, Meera's
consent and the pending lab order are relative to today. `shared.ts` (enums, error codes + HTTP
statuses, `ApiErrorBody`, `ActionResult<T>`, `SessionUser`, `PageQuery`, `Page<T>`) and `format.ts`
(`formatIST`, `formatAbha`, `maskAbha`, `parseAbhaInput`) with 28 tests. Stubs: `getSession()` reads
`DEV_FAKE_USER` (dev only), `requireSession()`, `authorize()` with the final CONTRACTS §3 signature
(allows everything, writes the audit row first), `writeAudit()`, `apiError()` / `actionError()` /
`ApiError`, and `GET /api/v1/auth/me`. Plan: staff self-registration added (`registerStaff`,
CONTRACTS §4.1, Phase 2 + 5).

**Files touched:** `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/…_init`,
`prisma/seed.ts`, `src/server/db.ts`, `src/server/http.ts`, `src/server/auth/session.ts`,
`src/server/auth/authorize.ts`, `src/server/audit/write.ts`, `src/app/api/v1/auth/me/route.ts`,
`src/contracts/shared.ts`, `src/contracts/format.ts` + tests, `vitest.config.mts` (new) ·
`package.json`, `.gitignore`, `QUICKSTART.md`, `CHANGELOG.md`, `docs/CONTRACTS.md`,
`docs/00_MASTER_PLAN.md`, `docs/team/harshita.md` (modified)

**Run command:**
```bash
npm run db:reset && npm run dev
```
`.env` has `DEV_FAKE_USER="kavya"` → `curl http://localhost:3000/api/v1/auth/me` →
`{"user":{"id":"user-kavya","role":"DOCTOR","name":"Dr Kavya Iyer",…,"institutionIds":["inst-citygen"]}}`

**Access check:** `DEV_FAKE_USER` unset → `/auth/me` → `401 UNAUTHENTICATED`. Stub `authorize()` as
Kavya on Asha's records → allowed (`STUB`) **and** an `AuditLog` row written (`user-kavya`,
`record:list`, patient `user-asha`, `ALLOWED`, `STUB`). Real denials come in Phase 3.

**Demo steps enabled:** none yet (foundations only)

**Learned:** Prisma 7 no longer seeds on `migrate reset` or generates on `migrate dev`, so
`db:reset` runs `prisma db seed` explicitly and `postinstall` runs `prisma generate`. Seeded history
must not have Kavya as author, or author access (D5) would hide "Consent required" in demo step 2.

**AI used:** code: Prisma setup, seed, contracts, stubs, tests · debugging: Vitest 5.1.0 crashing
on every test (fixed with `pool: "vmThreads"`), an npm resolver bug, Node 24 shadowing nvm's Node 22.

**Open issues:**
- 0.8 hosted Postgres: **done.** Neon project (Singapore), `prisma migrate deploy` + `prisma db seed`
  applied. The first network blocked outbound port 5432 (443 was open); worked from a phone hotspot.
  Remember for Phase 8/9: run migrations from Vercel/CI, not from a firewalled network.
- Vitest runs with `pool: "vmThreads"` as a workaround; retry the default pool after the next Vitest update.
- Vivek to review: `registerStaff` contract, `@unique` on `HealthRecord.fileId` and
  `LabOrder.resultRecordId`, `authorId = null` for imported history, ids validated as plain strings.
- Seeded lab reports and the document have no file attached until Vivek's `storage.ts` exists.

**Next:** 0.8 hosted Postgres (Neon), then Phase 1: mock ABHA provider.

## [2026-11-16 19:00] Phase 0 (part 1) — Next.js scaffold, folder skeleton, AI policy change

**Done:** Next.js 16.4 app scaffolded at the repo root (TypeScript, Tailwind 4, App Router, `src/`,
`@/*` alias) and the Master §4.3 folder skeleton created (`.gitkeep` in each empty folder). Removed
`cacheComponents` and `partialPrefetching` from `next.config.ts` so caching matches TRAPS §3 and
Vivek's ISR plan. Fixed `.gitignore` (`src/generated/`, `next-env.d.ts`, `*.tsbuildinfo`). Docs:
removed `ai-usage.md` and `syllabus-coverage.md`; D16 changed to "AI writes the code, we review,
own and commit it"; `CLAUDE.md` now tells AI to write simple code and explain why / what / what was
used after every file; every commit is made by hand, never by an agent.

**Files touched:** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`,
`eslint.config.mjs`, `public/`, `src/app/{layout,page}.tsx`, `src/app/globals.css` (new) ·
skeleton folders under `src/app/`, `src/server/`, `src/components/ui/`, `prisma/` (new) ·
`.gitignore`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`,
`docs/README.md`, `docs/LEARNING.md`, `docs/team/*`, `docs/updates/TEMPLATE.md`,
`src/contracts/README.md`, `.github/PULL_REQUEST_TEMPLATE.md` (modified) ·
`docs/operations/ai-usage.md`, `docs/evaluation/syllabus-coverage.md` (deleted)

**Run command:**
```bash
npm install && npm run dev
```
Open http://localhost:3000 → Next.js starter page.

**Access check:** n/a (no auth yet)

**Demo steps enabled:** none yet

**Learned:** `create-next-app` refuses a non-empty folder, so scaffold in a temp folder and copy in;
and Next 16's `cacheComponents` flag bans `export const revalidate`, which would have broken the ISR plan.

**AI used:** code: folder skeleton and config fixes · review: checked the scaffold and flagged
`cacheComponents`, Node version and `.gitignore` gaps · docs: AI-policy and commit-rule edits.

**Open issues:**
- Node is still v24.22; project requires 22. `nvm use 22`, delete `node_modules` +
  `package-lock.json`, `npm install` again so the lockfile matches CI/Vercel.
- Starter `src/app/page.tsx` will clash with Vivek's `(public)/page.tsx`; he deletes it in Phase 7.
- Tell Vivek about the D16 change (AI writes code) and that he can clone now.
- Confirm INT257 allows AI-written code in project work.

**Next:** Phase 0 step 0.4 — Prisma 7 install, `prisma.config.ts`, `schema.prisma` from
CONTRACTS §2, `db.ts`, first migration.

## [2026-11-15 18:45] Phase −1 (v2.1) — correction: team of four, full scope

**Done:** Corrected v2. The team is still Harshita, Vivek, Madhav and Ravuri; Harshita and Vivek
build the app. Full v1 scope restored: Master Part 12 is now a build order, not a cut line. Added
back to the briefs: OTP rate limit, duplicate consent requests, institution create/edit, Edge health
route and a CI phase (Harshita); encounter form, optimistic prescription, intercepting modal,
parallel dashboard, Hindi/English and Lighthouse (Vivek).

**Files touched:** `docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`, `docs/team/*`, `docs/LEARNING.md`,
`docs/evaluation/syllabus-coverage.md`, `src/app/README.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
`CHANGELOG.md`, `docs/updates/_INTEGRATION.md`

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: updating the docs for the correction.

**Open issues:**
- Start and demo dates still blank in the Master header.
- Repo is local only: needs a GitHub remote before Vivek can clone.

**Next:** Phase 0: `create-next-app` at the repo root, Prisma schema + seed, shared contracts, auth
stubs. Deadline end of day 2.

## [2026-11-15 18:30] Phase −1 (v2) — pure Next.js, team of two, work reassigned

**Done:** Restructured the plan for two changes: the React/Vite console is gone (one Next.js app at
the repo root, D20) and Madhav and Ravuri are off the project (D21). Madhav's doctor portal went to
Vivek; Ravuri's pharmacy, admin and deployment came to me. Master plan v2, contracts v2 (cookie-only
session, Server Components read / Server Actions write / Route Handlers for auth + client reads,
D22), new briefs `team/harshita.md` and `team/vivek.md`, scope re-cut for two (Master Part 12),
INT257-only syllabus coverage. Repo initialised with the docs in place.

**Files touched:** every doc · `src/app/README.md`, `src/server/README.md`, `src/contracts/README.md`
(moved from `apps/` and `packages/`) · removed Madhav/Ravuri briefs and logs, console README

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: restructuring and consistency-checking the docs.

**Open issues:**
- Tell the INT257 teacher the team is now two and the console is gone (Master Part 13).
- Start and demo dates still blank in the Master header.
- Repo is local only: needs a GitHub remote before Vivek can clone.

**Next:** Phase 0: `create-next-app` at the repo root, Prisma schema + seed, shared contracts, auth
stubs. Deadline end of day 2.

## [2026-10-19 15:10] Phase −1 (rev) — docs revised for hand-written code

**Done:** Reframed the documentation set for a team that writes code by hand and uses AI only for
debugging, review and learning (D16). Root `CLAUDE.md` now tells AI tools to act as tutor and
reviewer, not author; per-folder `CLAUDE.md` files became `README.md` for humans; the prompting
playbook became `operations/ai-usage.md`; added `LEARNING.md` (official-docs reading list per
person per phase). Scope adjusted for hand-coding: a Must/Should/Could cut line (Master Part 12),
offset pagination (D17), each owner writes their own Zod schemas (D18), bcryptjs instead of
argon2 (D19). Update-log template gained **Learned** and **AI used** lines; PR template gained
an explain-every-line checkbox.

**Files touched:** `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `.github/PULL_REQUEST_TEMPLATE.md` ·
`apps/*/README.md`, `packages/contracts/README.md` (renamed from CLAUDE.md) ·
`docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`, `docs/README.md`, `docs/LEARNING.md` (new),
`docs/operations/ai-usage.md` (new, replaces prompting-playbook), `docs/team/*`, `docs/updates/TEMPLATE.md`,
`docs/architecture/*`

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: drafting and consistency-checking the documentation.

**Open issues:**
- Same as previous entry: teachers' confirmation on D1/D2, lab module owner, start and demo dates.
- Team hasn't yet agreed the cut line (Master Part 12): walk through it at kickoff.

**Next:** Kickoff: walk the team through Master Parts 2, 7, 8, 12, then Phase 0.

## [2026-10-19 14:30] Phase −1 — system design + documentation set

**Done:** System design agreed: two apps (Next.js web + Vite console), one backend, `authorize()`
as the single security boundary, scoped time-bound consent, mock ABHA provider (D1). Wrote the
master plan, contracts, traps, four team briefs, per-directory CLAUDE.md files and templates,
modelled on the Udgam repo layout.

**Files touched:** `docs/**` (new) · `CLAUDE.md`, `README.md`, `QUICKSTART.md`, `CONTRIBUTING.md`,
`SECURITY.md`, `.env.example`, `.github/*` (new) · `apps/*/CLAUDE.md`, `packages/contracts/CLAUDE.md` (new)

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Open issues:**
- Teachers have not yet confirmed two apps in one repo (D2) or a mocked ABHA login (D1).
- Lab module owner (Vivek vs Ravuri) not settled; currently Vivek.
- Start date and demo date not filled in Master header.

**Next:** Phase 0: workspaces, Next.js app, Prisma schema + seed, contracts stubs,
`getSession`/`authorize` stubs. Deadline end of day 2.
