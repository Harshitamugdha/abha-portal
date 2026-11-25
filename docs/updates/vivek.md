# Vivek — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/`](../team/README.md).*

---

## [2026-11-26 01:20] Slice P3.3 — Doctor consent request form

**Done:** Built `ConsentRequestForm` and pure helper `buildConsentRequest` with unit tests for validation rules. Form provides scope checkboxes (all 4 clinical scopes, $\ge 1$), duration (1–30 days, default 7), clinical purpose (3–120 characters), and dynamic institution `<select>` only when the doctor belongs to $> 1$ institution (sending `undefined` otherwise, never defaulting to `[0]` per Part C). Integrated with Harshita's `requestConsent` Server Action, presenting field errors on `VALIDATION_FAILED` and handling pending state and duplicate requests. Implemented `/doctor/patients/[patientId]/request-consent/page.tsx` with role checking that redirects patients to `/patient`.

**Files touched:** `src/app/doctor/patients/[patientId]/request-consent/page.tsx` (modified) · `src/app/doctor/patients/[patientId]/request-consent/consent-request-form.tsx` (new) · `src/app/doctor/patients/[patientId]/request-consent/form-helper.ts` (new) · `src/app/doctor/patients/[patientId]/request-consent/form-helper.test.ts` (new) · `CHANGELOG.md` (modified) · `docs/updates/vivek.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Dr Kavya (`kavya@citygen.test` / `Demo@1234`) → `/doctor/patients/user-asha/request-consent` → select Prescriptions and Lab reports, 7 days, purpose "Follow-up" → submit → see "Waiting for the patient". In second window log in as Asha (`91-1000-0000-0001` / OTP `123456`) → approve → refocus Dr Kavya window → see records update in real time.

**Access check:** Dr Kavya requests Prescriptions + Lab reports, 7 days, purpose "Follow-up". Asha approves in `/patient/consents`. Kavya refocuses viewer: prescriptions and lab reports grouped by institution, no documents or visits. Submitting twice shows request already open without creating duplicate rows. Empty purpose produces inline field error. Asha visiting the form URL is redirected to `/patient`.

**Demo steps enabled:** 3 (Doctor requests scoped, time-bound consent from patient)

**Learned:** Never blindly take `doctor.institutionIds[0]` when a doctor practices across multiple healthcare facilities; always prompt them in the UI to select their practicing institution for the consent request.

**AI used:** code: implemented form helper, client-side form with field error mapping, server page with role-redirection, and vitest validation suite.

**Open issues:**
- none

**Next:** Slice P3.4 (or next Phase 3 slice — e.g. Lab report PDF viewer with `next/dynamic`).

## [2026-11-26 01:05] Slice P3.2 — Doctor viewer with React Query

**Done:** Installed `@tanstack/react-query` (`5.108.4`) and wrapped doctor routes in `DoctorQueryProvider` (`src/app/doctor/layout.tsx`) whose `QueryClient` is created with `useState` so leaving `/doctor` clears cache (TRAPS §14). Replaced the fixture viewer with live client component `PatientViewer` calling `GET /api/v1/patients/[patientId]/records` with `refetchOnWindowFocus: true` and `staleTime: 0`. Implemented pure helper `viewerState(error, data)` checking `error.code === 'CONSENT_REQUIRED'` before data to prevent false "no records" states (TRAPS §4). Added active consent banner from `/api/v1/consents/latest` and memoized records grouping by institution with `useMemo`. Removed the `?state=` fixture switch and retrieved patient name via `getPatientHeader`.

**Files touched:** `package.json` (modified) · `package-lock.json` (modified) · `src/app/doctor/layout.tsx` (new) · `src/app/doctor/query-provider.tsx` (new) · `src/app/doctor/patients/[patientId]/page.tsx` (modified) · `src/app/doctor/patients/[patientId]/patient-viewer.tsx` (new) · `src/app/doctor/patients/[patientId]/viewer-state.ts` (new) · `src/app/doctor/patients/[patientId]/viewer-state.test.ts` (new) · `src/app/doctor/patients/[patientId]/request-consent/page.tsx` (new) · `src/components/ui/group-by-institution.ts` (modified) · `CHANGELOG.md` (modified) · `docs/updates/vivek.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Dr Arjun (`arjun@sunrise.test` / `Demo@1234`) → open `/doctor/patients/user-asha` (shows "Consent required") → Asha approves with Visits unticked → refocus Dr Arjun window → viewer immediately updates live to display Asha's lab reports grouped by institution with consent banner.

**Access check:** Dr Arjun sees "Consent required" (403 `CONSENT_REQUIRED`). Asha approves pending request with Visits unticked. Arjun refocuses window: viewer displays only lab reports grouped by institution; Network response has no `ENCOUNTER`, `PRESCRIPTION` or `DOCUMENT`. Asha revokes: refocusing Arjun's window returns to "Consent required". Logging out Arjun and logging in as Dr Kavya: `/doctor/patients/user-asha` shows "Consent required" with zero flash of Arjun's data. Dr Kavya on `/doctor/patients/user-meera`: shows "Consent required" (expired consent).

**Demo steps enabled:** 3, 5 (Doctor records viewer with reactive live consent gating, scope exclusion, and cache isolation)

**Learned:** Creating the React Query client within a route layout's `useState` ensures client-side cache is thrown away upon route exit or logout (TRAPS §14), and prioritizing `error.code === 'CONSENT_REQUIRED'` before inspecting data in `viewerState` guarantees doctors are never misinformed that a patient has "no records" when consent is required (TRAPS §4).

**AI used:** code: integrated TanStack Query, built QueryProvider, wrote pure viewerState helper with Vitest unit tests, updated viewer page and patient-viewer client component.

**Open issues:**
- none

**Next:** Slice P3.3 — Doctor consent request form (`/doctor/patients/[patientId]/request-consent`).

## [2026-11-26 00:20] Slice P3.1 — Patient lookup, summary and search page

**Done:** Implemented `lookupPatient`, `getPatientHeader`, and `getPatientSummary` in `src/server/clinical/lookup.ts`. Supported 14-digit numbers with/without hyphens and ABHA addresses via `parseAbhaInput`, returning strictly `patientId`, `name`, and `abhaNumberMasked` under `patient:lookup` authorization. Enforced role checks upfront so non-doctors get `FORBIDDEN` even for unknown ABHAs. Built `getPatientSummary` with `record:list` filtering strictly by active consent `allowedTypes` plus `latestAt`. Created route handlers `GET /api/v1/patients/lookup` and `GET /api/v1/patients/[patientId]/summary`. Built `/doctor/patients` Server Component search page with loading and error boundaries.

**Files touched:** `src/server/clinical/lookup.ts` (new) · `src/server/clinical/lookup.test.ts` (new) · `src/app/api/v1/patients/lookup/route.ts` (new) · `src/app/api/v1/patients/lookup/route.test.ts` (new) · `src/app/api/v1/patients/[patientId]/summary/route.ts` (new) · `src/app/api/v1/patients/[patientId]/summary/route.test.ts` (new) · `src/app/doctor/patients/page.tsx` (modified) · `src/app/doctor/patients/loading.tsx` (new) · `src/app/doctor/patients/error.tsx` (new) · `CHANGELOG.md` (modified) · `docs/updates/vivek.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Dr Kavya (`kavya@citygen.test` / `Demo@1234`) → go to `/doctor/patients` → search `91-1000-0000-0001` or `Asha.Verma@abdm` → see Asha Verma with masked ABHA `XX-XXXX-XXXX-0001` and "Open patient record ↗" button.

**Access check:** Dr Kavya searches `91-1000-0000-0001`, `91100000000001`, and `Asha.Verma@abdm`: same result (`XX-XXXX-XXXX-0001`). Invalid format shows validation message. Asha calling `/api/v1/patients/lookup?abha=91100000000002` receives 403 FORBIDDEN. Network response contains only 3 fields (`patientId`, `name`, `abhaNumberMasked`). Asha's access log displays "Looked you up". Dr Kavya (no consent) on `/api/v1/patients/user-asha/summary` returns 403 CONSENT_REQUIRED.

**Demo steps enabled:** 2 (Doctor finds a patient by ABHA number or address without exposing clinical records)

**Learned:** Upfront authorization check on `patient:lookup` prevents enumeration of valid vs invalid ABHAs by unauthorized callers (a non-doctor receives 403 `FORBIDDEN` regardless of whether the queried ABHA exists).

**AI used:** code: implemented lookup/summary data functions, route handlers, search page, loading/error boundaries, and comprehensive unit tests.

**Open issues:**
- none

**Next:** Slice P3.2 — Doctor patient summary and records viewer page (client-side React Query viewer, `CONSENT_REQUIRED` vs empty states).

## [2026-11-25 23:55] Slice P2.2 — File download route (Phase 2 complete)

**Done:** Built `getFileStream` data function and route handlers `GET /api/v1/files/[id]` and `GET /files/[id]` enforcing `authorize("file:read")` against owning records. Files stream inline with stored MIME type and size. Integrated "Open file ↗" links on the patient record detail page (`/patient/records/[id]`) and timeline cards. Phase 2 is complete.

**Files touched:** `src/server/records/stream.ts` (new) · `src/server/records/stream.test.ts` (new) · `src/app/api/v1/files/[id]/route.ts` (new) · `src/app/api/v1/files/[id]/route.test.ts` (new) · `src/app/files/[id]/route.ts` (new) · `src/app/patient/records/[id]/page.tsx` (modified) · `src/components/ui/record-card.tsx` (modified) · `docs/updates/vivek.md` (modified) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Asha (`91-1000-0000-0001`, OTP `123456`) → open document record → click "Open file ↗" (opens PDF or image inline in new tab).

**Access check:** Asha opens her uploaded file URL: rendered inline. Rohan: 404 NOT_FOUND. Logged out: 401 UNAUTHENTICATED. Admin: 404 NOT_FOUND. Dr Kavya (no consent): 403 CONSENT_REQUIRED. Dr Arjun (consented for ENCOUNTER and LAB_REPORT only, but not DOCUMENT): 403 CONSENT_REQUIRED (scope excluded). Denied calls never invoke file disk streaming.

**Demo steps enabled:** 1, 5 (Document inline viewing for patient, and strict ABDM scope-exclusion enforcement on file reads)

**Learned:** Authorizing file access against the owning `HealthRecord` (rather than the raw `FileObject` ID) ensures that doctor consent scopes, patient ownership, and expiration are evaluated on every file read, returning 404 for wrong patients and admins so existence of private files is never leaked.

**AI used:** code: implemented streaming data function, route handlers, UI integration, and vitest test suites.

**Open issues:**
- none

**Next:** Phase 3 — Doctor: lookup, viewer, consent request (`/api/v1/patients/lookup`, patient summary, client-side viewer with React Query, and consent request form).

## [2026-11-25 22:45] Slice P2.1 — Upload a document (storage, action, form)

**Done:** Implemented file storage (`put`, `stream`) in `.uploads/` (outside `public/`, TRAPS §12) and MIME detection via binary magic bytes (`detectMime` for PDF, PNG, JPEG). Created `listInstitutionChoices` exposing public fields and `createDocumentRecord` with `authorize("record:create:self")` and a single atomic `db.$transaction` creating `FileObject` and `HealthRecord` (`type: "DOCUMENT"`, `authorId: null`). Implemented `uploadDocument` Server Action with 5 MB validation, raised `experimental.serverActions.bodySizeLimit` to `'10mb'` in `next.config.ts`, and built `/patient/upload` with instant revalidation on submit.

**Files touched:** `src/server/records/storage.ts` (new) · `src/server/records/storage.test.ts` (new) · `src/server/records/institutions.ts` (new) · `src/server/records/upload.ts` (new) · `src/server/records/upload.test.ts` (new) · `src/server/records/params.ts` (modified) · `src/server/records/list.ts` (modified) · `src/app/actions/records.ts` (new) · `src/app/actions/records.test.ts` (new) · `src/app/patient/upload/page.tsx` (new) · `src/app/patient/upload/upload-form.tsx` (new) · `next.config.ts` (modified) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Asha (`91-1000-0000-0001`, OTP `123456`) → http://localhost:3000/patient/upload → upload small PDF → redirects to /patient/records with document at the top of timeline.

**Access check:** Asha uploads a small PDF: it appears at the top of the timeline immediately without a manual refresh. A text file renamed `.pdf` is rejected ("Only PDF, PNG, or JPEG files are allowed."). A file > 5 MB shows "The file is larger than 5 MB." on the form. Uploaded file exists in `.uploads/`, not in `public/`. Non-patient upload attempts are rejected with 403 `FORBIDDEN`.

**Demo steps enabled:** 1 (Asha uploads her past discharge document and views it in her unified timeline)

**Learned:** In Next.js with Server Actions, `"use server"` files must export only async functions, and setting `bodySizeLimit` in `next.config.ts` above the application limit (e.g. 10 MB vs 5 MB) accounts for HTTP multipart boundary overhead so our application-level checks can display user-friendly form errors rather than crashing at the network parser level.

**AI used:** code & debugging: implemented storage service, byte inspection, Server Action, upload form, and fixed Next.js Server Action body limit overhead.

**Open issues:**
- none

**Next:** Phase 2, Slice P2.2 — File download / streaming (`GET /files/:id` with `authorize("file:read")` and `Content-Disposition: inline`).

## [2026-11-25 22:00] Slice P1.2 — Records route handlers (Phase 1 complete)

**Done:** Implemented `GET /api/v1/patients/[patientId]/records` and `GET /api/v1/records/[id]` Route Handlers with session enforcement, pure URL searchParams normalization helper (`parseRecordListParams`), and error mapping via `handleRouteError`. Built patient record detail page `/patient/records/[id]` using `getRecord` with hidden file download links until Phase 2.2, and linked timeline cards to details. Phase 1 is complete.

**Files touched:** `src/server/records/params.ts` (new) · `src/server/records/params.test.ts` (new) · `src/app/api/v1/patients/[patientId]/records/route.ts` (new) · `src/app/api/v1/patients/[patientId]/records/route.test.ts` (new) · `src/app/api/v1/records/[id]/route.ts` (new) · `src/app/api/v1/records/[id]/route.test.ts` (new) · `src/app/patient/records/[id]/page.tsx` (new) · `src/components/ui/record-card.tsx` (modified) · `docs/updates/vivek.md` (modified) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Dr Arjun (`arjun@sunrise.test` / `Demo@1234`) after Asha approves lab reports → http://localhost:3000/api/v1/patients/user-asha/records (returns 200 with only `LAB_REPORT` items, no visits/prescriptions/documents leaked).

**Access check:** Dr Kavya on `/api/v1/patients/user-asha/records` returns 403 `CONSENT_REQUIRED` (not 200 with empty array). Dr Kavya on `/api/v1/patients/user-meera/records` returns 403 `CONSENT_REQUIRED` (expired consent). Rohan on `/api/v1/records/rec-asha-cbc` returns 404 `NOT_FOUND`, admin returns 404 `NOT_FOUND`, unauthenticated returns 401 `UNAUTHENTICATED`. Asha's access log audits both allowed and refused reads.

**Demo steps enabled:** 1, 2, 5 (Unified timeline, doctor consent enforcement, and cross-institution scoped JSON delivery)

**Learned:** In Next.js App Router route handlers, `context.params` is a Promise that must be awaited, and returning a 404 for unconsented single records prevents leaking whether a specific record ID exists.

**AI used:** code: implemented route handlers, search params parsing helper, patient record detail page, and vitest suites.

**Open issues:**
- none

**Next:** Phase 2 — Uploads and files (`storage.ts`, `uploadDocument` Server Action, file size/MIME validation from byte magic numbers, and `GET /files/:id`).

## [2026-11-25 15:00] Slice P1.1 — Records list and detail, patient timeline on real data

**Done:** Implemented `listPatientRecords`, `getRecord`, and `listPatientInstitutions` in `src/server/records/list.ts` with `authorize()`, SQL scope filtering (`WHERE type IN (decision.allowedTypes)`), page-based pagination, and strict field-by-field DTO mapping. Switched `/patient/records` and the patient dashboard (`/patient`) to live database data with plain GET form filtering (`type`, `institutionId`, `from`, `to`) and pagination. Added `loading.tsx` and `error.tsx` for patient records and removed fixture files.

**Files touched:** `src/server/records/list.ts` (new) · `src/server/records/list.test.ts` (new) · `src/app/patient/records/page.tsx` (modified) · `src/app/patient/records/loading.tsx` (new) · `src/app/patient/records/error.tsx` (new) · `src/app/patient/page.tsx` (modified) · `src/app/patient/records/fixtures.ts` (deleted) · `src/app/patient/records/fixtures.test.ts` (deleted) · `CHANGELOG.md` (modified)

**Run command:**
```bash
npm run dev
```
Log in as Asha (`91-1000-0000-0001`, OTP `123456`) → http://localhost:3000/patient/records (views all 7 records across City General and Sunrise, newest first; filter by Lab reports shows 2). Log in as Rohan (`91-1000-0000-0002`) → sees strictly his 2 records from Lakeside.

**Access check:** Asha sees her 7 records from two hospitals, newest first; filter type Lab reports shows 2. Rohan sees only his 2. Cross-patient isolation verified: Rohan cannot view Asha's records and vice-versa. Calling `listPatientRecords` without authorization throws `CONSENT_REQUIRED` and does not invoke `findMany`.

**Demo steps enabled:** 1 (Asha sees her live timeline of records from two hospitals)

**Learned:** Calling `authorize()` before querying and applying `type IN (decision.allowedTypes)` directly in the SQL WHERE clause ensures that excluded scopes are never fetched or leaked over the network (TRAPS §5).

**AI used:** code: implemented server records data functions, page integration, GET filter form, loading/error boundaries, and unit tests.

**Open issues:**
- none

**Next:** Phase 1, Slice P1.2 / Route Handlers (`/patients/:id/records` and `/records/:id` for doctor viewer).

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
