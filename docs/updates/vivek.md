# Vivek — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/`](../team/README.md).*

---

## [2026-11-25 01:30] Slice P0.3 — Doctor viewer, three states, on fixtures (Phase 0 complete)

**Done:** Replaced doctor placeholder with clinical dashboard and patient search box. Implemented doctor patient record viewer displaying three distinct UI states on fixtures (`ConsentRequired`, `EmptyState` in scope, and `InstitutionGroup` grouped by institution). Added pure `group-by-institution.ts` with tests and production guard calling `notFound()`. Phase 0 is complete.

**Files touched:** `src/app/doctor/page.tsx` (modified) · `src/app/doctor/doctor-links.ts` (new) · `src/app/doctor/patients/page.tsx` (new) · `src/app/doctor/patients/[patientId]/page.tsx` (new) · `src/app/doctor/patients/[patientId]/fixtures.ts` (new) · `src/app/doctor/patients/[patientId]/fixtures.test.ts` (new) · `src/components/ui/consent-required.tsx` (new) · `src/components/ui/institution-group.tsx` (new) · `src/components/ui/group-by-institution.ts` (new) · `src/components/ui/group-by-institution.test.ts` (new) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Dr Kavya (`kavya@citygen.test` / `Demo@1234`) → /doctor/patients/user-asha?state=records (or use dev state switcher to toggle `consent` and `empty`).

**Access check:** Dr Kavya views /doctor/patients/user-asha across three distinct screens: `consent` renders an active amber alert with "Request access" (never an empty list, TRAPS §4), `empty` renders "No records in the scopes you have access to", `records` renders records grouped by institution (City General & Sunrise). Asha opening /doctor is redirected to /patient. Logged-out access redirects to /staff/login.

**Demo steps enabled:** 2 & 5 (viewer three states verified)

**Learned:** Explicitly designing the "Consent required" state as an alert banner rather than checking if items are empty prevents false clinical statements (TRAPS §4).

**AI used:** code: built viewer layout, institution grouping logic, fixture models, and vitest suites.

**Open issues:**
- none

**Next:** Phase 1 — Records API (`listPatientRecords` data function with `authorize()`, `d.allowedTypes`, pagination, and Route Handlers).

## [2026-11-25 00:30] Slice P0.2 — Patient screens on fixtures

**Done:** Built patient records timeline and dashboard cards on fixtures parsed with `RecordDTO`. Monthly grouping in IST with rollover boundary tests (`group-by-month.ts`), shared UI components (`RecordCard`, `RecordTimeline`, `Badge`, `EmptyState`), and production guard calling `notFound()`. Updated `PATIENT_LINKS` with Records and Upload.

**Files touched:** `src/app/patient/patient-links.ts` (modified) · `src/app/patient/page.tsx` (modified) · `src/app/patient/records/page.tsx` (new) · `src/app/patient/records/fixtures.ts` (new) · `src/app/patient/records/fixtures.test.ts` (new) · `src/components/ui/record-labels.ts` (new) · `src/components/ui/badge.tsx` (new) · `src/components/ui/empty-state.tsx` (new) · `src/components/ui/record-card.tsx` (new) · `src/components/ui/record-timeline.tsx` (new) · `src/components/ui/group-by-month.ts` (new) · `src/components/ui/group-by-month.test.ts` (new)

**Run command:**
```bash
npm run dev
```
Navigate to http://localhost:3000/patient/records (redirects to /login if unauthenticated).

**Access check:** Logged-out access to /patient/records redirects to /login. Non-patient (e.g. Dr Kavya) is redirected by proxy.ts to /doctor. Asha sees the grouped timeline on fixtures.

**Demo steps enabled:** 1 (patient timeline UI shell)

**Learned:** Timezone boundaries matter when grouping clinical records: converting UTC to IST before grouping puts `2026-09-30T20:00:00Z` (+5:30) into October 2026 instead of September (TRAPS §6).

**AI used:** code: built timeline components, IST grouping logic, fixture models, and vitest suites.

**Open issues:**
- Local PostgreSQL installation / database connection needed for full live authentication and Phase 1 data fetching.

**Next:** Phase 0, Slice P0.3 — Doctor viewer shell on fixtures (three states: Consent required, Empty in scope, Records grouped by institution).

## [2026-11-24 17:35] Slice P0.1 — Contracts for records, clinical, and lab

**Done:** Created executable Zod schemas and TypeScript types for `records.ts`, `clinical.ts`, and `lab.ts` matching CONTRACTS §4.3–4.5. Valid and invalid test suites added for all schemas, including share code validation (`CGEN52`/`ASHA7K` pass; invalid characters and lengths fail).

**Files touched:** `src/contracts/records.ts` (new) · `src/contracts/clinical.ts` (new) · `src/contracts/lab.ts` (new) · `src/contracts/records.test.ts` (new) · `src/contracts/clinical.test.ts` (new) · `src/contracts/lab.test.ts` (new) · `docs/CONTRACTS.md` (modified) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run test
```
Tests pass: 28 new tests across `records.test.ts`, `clinical.test.ts`, and `lab.test.ts` (228 total passing in repository).

**Access check:** None (pure Zod schemas and contracts).

**Demo steps enabled:** none yet

**Learned:** Defining contract schemas in pure Zod with zero server imports ensures they can be safely shared across server and client without pulling server code into client bundles (TRAPS §18).

**AI used:** code: generated schema definitions and Vitest contract tests.

**Open issues:**
- none

**Next:** Phase 0, Slice P0.2 — Patient shell UI with fixtures (layout, nav, timeline cards).
