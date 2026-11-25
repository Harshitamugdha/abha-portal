# Changelog

Newest first. One entry per merged phase that changes what a user can do, or what a contract says.
Contract changes are marked **[contract]**.

## Unreleased
- **Phase 2 complete (25 Nov 2026):** Vivek completed Phase 2 (Uploads and files): disk storage with magic-byte MIME checking, patient self-upload with 5 MB limit and atomic transaction, authorized file route GET /api/v1/files/:id with inline streaming and scope-exclusion enforcement, and Open file links on records.
- **Slice P2.1 (25 Nov 2026):** Patient document upload with disk storage under .uploads/, magic-byte MIME validation (PDF, PNG, JPEG), 5 MB file size limit with 10 MB Next.js bodySizeLimit, and /patient/upload form with automatic revalidation (Vivek).
- **Phase 1 complete (25 Nov 2026):** Vivek completed Phase 1 (Records API): live data data functions (`listPatientRecords`, `getRecord`), patient records timeline and dashboard on live PostgreSQL with scope filtering, route handlers `GET /api/v1/patients/:patientId/records` and `GET /api/v1/records/:id`, and patient record detail page.
- **Slice P1.1 (25 Nov 2026):** Patient records timeline and dashboard switched from fixtures to live database data via `listPatientRecords` and `authorize()`, with GET form filtering (record type, institution, date range), pagination, and loading/error states (Vivek).
- **Phase 0 complete (25 Nov 2026):** Vivek completed Phase 0 shells: patient records timeline and doctor patient viewer with three distinct states (consent required, empty in scope, records grouped by institution) built against fixtures.
- **[contract]** (24 Nov 2026) Initial schemas for records, clinical, and lab domains: `RecordDTO`, `RecordListQuery`, `DocumentUpload`, `PatientLookupDTO`, `SummaryDTO`, `PrescriptionCreate`, `EncounterCreate`, `LabOrderCreate`, `LabOrderDTO`, `LabResultUpload` (Vivek, Slice P0.1).
- **[contract]** (21 Nov 2026) `ConsentGrant.durationDays` (schema, default 7) so approve can set `validTo`; `ConsentRequest.institutionId?` for doctors at two institutions.
- **v3 (21 Nov 2026):** Ravuri builds again (D23): pharmacy, admin, Edge health route, `logError`, deployment, CI. New brief `docs/team/ravuri.md` and log `docs/updates/ravuri.md`; Harshita's brief drops that work. **[contract]** owner of `pharmacy.ts` and `admin.ts` is now Ravuri (shapes unchanged).
- **[contract]** (16 Nov 2026) Staff self-registration: `registerStaff` Server Action + `StaffRegisterRequest` (CONTRACTS §4.1); new users are unverified until an admin verifies them. Ids validated as plain strings, not `.cuid()` (seeded ids are readable, e.g. `user-asha`).
- **v2.1 (15 Nov 2026):** team is four (Harshita, Vivek, Madhav, Ravuri), Harshita and Vivek build; full scope restored, Master Part 12 is a build order, not a cut line. **[contract]** `createEncounter`, `createInstitution`, `updateInstitution` back in.
- **v2 (15 Nov 2026):** pure Next.js, one app at the repo root (D20); console app, bearer tokens and CORS removed; Madhav's and Ravuri's planned work reassigned to Harshita and Vivek (D21); entry-point rule (D22).
- **[contract]** Session is cookie-only; `StaffLoginRequest` loses `client`, gains `redirectTo` in the response. Server Actions return `ActionResult<T>`. Contracts live in `src/contracts/`.
- Docs revised for hand-written code: AI policy (D16), `LEARNING.md`, cut line (Master Part 12), folder `README.md`s replace per-folder `CLAUDE.md`.
- **[contract]** List endpoints use offset pagination `{ items, page, pageSize, total }` (D17).
- **[contract]** Domain owners write their own schemas in the contracts package (D18).
- Documentation set, master plan v1, contracts v1, team briefs.
