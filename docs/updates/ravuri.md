# Ravuri — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/ravuri.md`](../team/ravuri.md).*

---

## [2026-11-24 14:50] Phase 4 — CI Workflow

**Done:** Created GitHub Actions workflow `.github/workflows/ci.yml` that triggers on pushes and PRs to `main`. It spins up an ephemeral PostgreSQL 16 container, applies Prisma migrations, executes the seed script, runs `npm run check` (typecheck, eslint, Vitest suite), and executes `npm run build`.

**Files touched:** `.github/workflows/ci.yml` (new) · `docs/updates/ravuri.md` (modified)

**Run command:**
```bash
npm run check && npm run build
```
Typecheck, linter, all 231 tests pass, and Next.js production build completes cleanly with all 23 routes.

**Access check:** Pull requests with failing tests, broken authorization checks, or compilation errors will fail the CI pipeline and be blocked from merging into `main`.

**Demo steps enabled:** Platform CI/CD verification demonstrating automated build gates before deployment.

**Learned:** How service containers in GitHub Actions allow testing against a real PostgreSQL instance rather than relying on mocks or SQLite in CI.

**AI used:** code: authored GitHub Actions workflow and verified end-to-end local build.

---

## [2026-11-24 14:45] Phase 3 — Platform & Health Check

**Done:** Created the Edge-runtime health endpoint (`/api/v1/health`) with `runtime = 'edge'` (no Prisma dependency) returning `{ ok: true, at }`. Implemented `src/server/log.ts` (`logError`) and integrated it into the Route Handler and Server Action error wrappers in `src/server/http.ts` for structured error monitoring in production logs.

**Files touched:** `src/app/api/v1/health/route.ts` (new) · `src/app/api/v1/health/route.test.ts` (new) · `src/server/log.ts` (new) · `src/server/http.ts` (modified) · `docs/updates/ravuri.md` (modified)

**Run command:**
```bash
curl http://localhost:3000/api/v1/health
```
Outputs: `{"ok":true,"at":"2026-11-24T09:15:00.000Z"}`.

**Access check:** Edge health endpoint answers publicly without DB round-trips; server errors are captured with timestamp and context without leaking internal stack traces in production responses.

**Demo steps enabled:** Platform verification for INT257 Unit VI (Edge runtime and operational monitoring).

**Learned:** Edge runtime handlers cannot import Node.js-only native modules or the standard Prisma Client; keeping the health check completely decoupled ensures uptime checks remain independent of database connection pool health.

**AI used:** code: implemented edge route, structured error logger, and test suite.

---

## [2026-11-24 14:40] Phase 2 — Admin Module

**Done:** Implemented the full Admin backend logic (`listStaff`, `verifyStaff`, `queryAudit`, `listInstitutions`, `createInstitution`, `updateInstitution`) and user interface at `/admin`, `/admin/staff`, `/admin/audit`, and `/admin/institutions`. Admins can approve newly registered staff, query security audit logs with URL-driven filters (outcome, patient, actor) without exposing clinical details, and manage the institution registry.

**Files touched:** `src/server/admin/admin.ts` (new) · `src/server/admin/admin.test.ts` (new) · `src/app/actions/admin.ts` (new) · `src/app/admin/page.tsx` (modified) · `src/app/admin/staff/page.tsx` (new) · `src/app/admin/staff/verify-button.tsx` (new) · `src/app/admin/audit/page.tsx` (new) · `src/app/admin/institutions/page.tsx` (new) · `src/app/admin/institutions/institution-form.tsx` (new) · `docs/updates/ravuri.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as: `admin@portal.test` (`Demo@1234`) → go to `http://localhost:3000/admin` → verify pending staff member (Dr Neel) at `/admin/staff` → inspect denied/allowed access events with filters at `/admin/audit` → register a new institution at `/admin/institutions`.

**Access check:** Non-admin roles attempting any admin action or route are refused with 403 FORBIDDEN. Admins cannot read clinical records (returns 404).

**Demo steps enabled:** Step 11 (Admin verifies staff so they can log in; inspects audit log for DENIED reads; confirms clinical records are inaccessible to admin).

**Learned:** How Next.js 16 handles dynamic `searchParams` as a Promise in Server Components to enable bookmarkable, filterable audit tables without client-side state overhead.

**AI used:** code: implemented backend functions, Server Actions, Server Component pages, and unit test coverage.

---

## [2026-11-24 13:30] Phase 1 — Pharmacy Module

**Done:** Implemented prescription lookup and dispense logic (`lookupPrescription`, `dispensePrescription`), the Server Action `dispensePrescription`, and the UI at `/pharmacy` and `/pharmacy/rx/[code]`. Prescription lookup builds DTOs strictly field-by-field, hiding patient history/DOB, and returns 404 for unknown or expired codes. Double-dispense triggers a 409 conflict state.

**Files touched:** `src/server/pharmacy/pharmacy.ts` (new) · `src/server/pharmacy/pharmacy.test.ts` (new) · `src/app/actions/pharmacy.ts` (new) · `src/app/pharmacy/page.tsx` (modified) · `src/app/pharmacy/rx/[code]/page.tsx` (new) · `src/app/pharmacy/rx/[code]/dispense-form.tsx` (new) · `docs/updates/ravuri.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as: `counter@greencross.test` (`Demo@1234`) → go to `http://localhost:3000/pharmacy` → enter share code `ASHA7K` → view prescription details without demographic leaks → click "Confirm & Dispense Medication".

**Access check:** Non-pharmacy roles attempting prescription lookup receive 404; unknown/expired share codes return 404 rather than revealing code existence; double dispense returns 409 CONFLICT with "Already dispensed".

**Demo steps enabled:** Step 8 (Pharmacy looks up share code ASHA7K, dispenses medication, and demonstrates conflict prevention).

**Learned:** Why returning 404 (instead of 403) for unknown codes prevents timing/probing attacks against share codes, and why dynamic routes in Next.js Server Components require `await params`.

**AI used:** code: implemented server functions, Server Action, client form, and dynamic route with unit tests.

---

## [2026-11-24 13:25] Phase 0 — Schemas and Contracts

**Done:** Created Zod schemas and TypeScript contracts for Pharmacy (`PharmacyPrescriptionDTO`, `PrescriptionItem`, `DispensePrescriptionInput`) and Admin (`StaffDTO`, `ListStaffQuery`, `VerifyStaffInput`, `AuditQuery`, `AuditEntryDTO`, `InstitutionDTO`, `InstitutionCreate`, `InstitutionUpdate`). Added comprehensive Vitest tests verifying valid and invalid payloads.

**Files touched:** `src/contracts/pharmacy.ts` (new) · `src/contracts/pharmacy.test.ts` (new) · `src/contracts/admin.ts` (new) · `src/contracts/admin.test.ts` (new) · `docs/updates/ravuri.md` (modified)

**Run command:**
```bash
npm test
```
All 219 tests pass across 10 test suites, including 19 new tests for pharmacy and admin contracts.

**Access check:** Schema validation rejects invalid emails, non-positive durations, unallowed audit outcomes, and empty identifiers without passing through to the backend.

**Demo steps enabled:** none yet (contracts foundation)

**Learned:** Field-by-field DTO design prevents accidental leaks of sensitive patient data (like DOB and full ABHA) to pharmacy and admin views.

**AI used:** code: authored contracts and Vitest suites matching CONTRACTS.md specifications.
