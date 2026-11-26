# INTEGRATION LOG — every seam event in one place
*Kept by Harshita (contract keeper). Newest first. One entry whenever two builders' code meets:
a stub replaced by the real thing, a contract changed, an access-gate run, a deploy.*

The point: when something breaks between components, the history of what already broke there is
in one file, not scattered across three personal logs and a chat.

## Entry format
```markdown
## [YYYY-MM-DD HH:MM] <event> — <area>

**Received / changed:** <what landed, from whom>

**Gates:** `npm run check` PASS/FAIL · access gate: <steps run, persona, result>

**Broke:** <what, whose code, exact error/code> → **Fixed by:** <who, how, which file>

**State:** <which demo steps now work end to end>

**Next:** <what is still waiting on what>
```

---

## [2026-11-26 22:30] Schema change — uploaded files stored in Postgres (Harshita → Vivek, Ravuri)

**Received / changed:** **[schema]** new `StoredFile { key @id, data Bytes, createdAt }` (migration
`stored_files`, add only). `src/server/records/storage.ts` keeps the same `put(buffer, mime) → key` and
`stream(key) → Node stream`, so `records/upload.ts` and `records/stream.ts` are unchanged; it now saves and
reads bytes in Postgres instead of `.uploads/`. New `remove(key)`; `lab/upload.ts` uses it to clean up after
a failed transaction (was `fs.unlink`). `FILE_STORAGE_DIR` removed. Reason: Vercel's disk is read-only, so
document and lab-result uploads failed there.

**Gates:** `npm run check` PASS (445 tests; storage tests now use a fake `db`).

**Broke:** nothing for callers. Files already in a local `.uploads/` folder are not moved; re-upload them.
**Everyone:** `npx prisma migrate dev` after pulling. The migration was written offline
(`prisma migrate diff`) because the author's `.env` pointed at Neon.

**State:** uploads work on the deployed build.

**Next:** Vivek to review `storage.ts`.

## [2026-11-26 20:15] Schema change — OTPs in the database + real OTP by email (Harshita → everyone)

**Received / changed:** **[schema]** new `OtpTransaction` table, new `AbhaProfile.email String?`
(migration `otp_transactions_and_email`: adds only, safe on Neon's data). OTPs are now random, hashed,
single use and stored in the DB instead of server memory, which fixes "OTP_INVALID with the right code" on
Vercel. If a patient has an email and `RESEND_API_KEY` is set, the OTP is emailed (Resend HTTP API via
`fetch`, **no new dependency**); otherwise the demo OTP `ABHA_DEV_OTP` still works. No contract change:
`AbhaOtpResponse` is the same shape. New env: `RESEND_API_KEY`, `OTP_EMAIL_FROM` (optional),
`DEMO_PATIENT_EMAIL` (seed only, Asha's email). `package.json` gained `vercel-build` =
`prisma migrate deploy && next build`.

**Gates:** `npm run check` PASS (272 tests; 6 new email tests in `abha/mock.test.ts`).

**Broke:** nothing for callers. **Everyone:** run `npx prisma migrate dev` after pulling, and restart
`npm run dev` (the old provider was cached in memory).

**State:** login works the same for all personas; Asha gets a real email once `DEMO_PATIENT_EMAIL` is
seeded and the Resend key is set.

**Next:** set `RESEND_API_KEY` in Vercel; seed Neon with `DEMO_PATIENT_EMAIL`.

## [2026-11-24 23:55] UI — Ravuri's admin + pharmacy screens moved to the shared design (Harshita → Ravuri)

**Received / changed:** Look only; no data functions, actions or contracts touched. `admin/page.tsx`
(dashboard: waiting staff, institutions, refused attempts), `admin/staff/*`, `admin/audit/page.tsx`,
`admin/institutions/*`, `pharmacy/page.tsx`, `pharmacy/rx/[code]/*`. Inline styles removed (shared
classes in `globals.css`), sentence case, `ADMIN_LINKS` / `PHARMACY_LINKS` shared lists, new `PageHead`
component. Pharmacy "Demo tip" removed (product look). Bug fixed on the way: audit paging dropped the
Actor ID filter; `pageHref()` now keeps every filter.

**Gates:** `npm run check` PASS (262 tests) · browser: admin home, audit log filtered, pharmacy lookup
`asha7k` → `ASHA7K` page. Dispense not pressed (kept for manual testing).

**Broke:** nothing.

**Next:** Ravuri to review the diff of his files before merging.

## [2026-11-24 22:55] Contract change — one active consent per doctor + patient (Harshita → Vivek)

**Received / changed:** **[contract]** CONTRACTS §4.2: `requestConsent` while the doctor already has an
active grant for that patient → `CONFLICT` ("You already have access to this patient…"). Before, a
second request could be approved, leaving two active grants; revoking the newer one silently
re-enabled the older one.

**Gates:** `npm run check` PASS (262 tests).

**Broke:** nothing yet. **Vivek:** your request form must show the `CONFLICT` message (or hide the
button when `/consents/latest` shows `GRANTED`), not treat it as an error page.

**State:** a revoke always ends the doctor's access (demo step 10).

**Next:** Vivek's request form handles `CONFLICT`.

## [2026-11-24 22:45] Review — Ravuri's pharmacy + admin (e161297) against authorize()

**Received / changed:** Ravuri's `pharmacy.ts`, `admin.ts` contracts, data functions, Server Actions,
screens, Edge `/health`, `logError`, CI. Every data function calls `authorize()` first; DTOs are built
field by field; no `src/server/` import in a client file; nothing private is cached.

**Gates:** `npm run check` PASS (233 tests).

**Broke:** `dispensePrescription` checked "expired" / "already dispensed" **before** `authorize()`, so a
patient or doctor sending any `recordId` got `CONFLICT "Already dispensed at …"` instead of `NOT_FOUND`
(D10), with no audit row. The update had no `dispensedAt: null` guard, so two counters could both
dispense. `lookupPrescription` skipped the audit row for expired codes. → **Fixed by:** Harshita,
`src/server/pharmacy/pharmacy.ts`: `authorize()` right after the existence check, state checks after
it, `updateMany … where dispensedAt: null` + `count === 0 → CONFLICT` (same pattern as the consent
engine). 3 tests added in `pharmacy.test.ts`.

**Still for Ravuri (not changed, his files / contract):**
- `ListStaffQuery.verified` uses `z.coerce.boolean()`: the string `"false"` becomes `true`. Fine for
  today's callers (they pass real booleans) but wrong the day it's read from a URL. Contract change.
- `updateInstitution` with an unknown id → Prisma throws → `INTERNAL`. Should be `NOT_FOUND`.
- Inline conditional spreads in `listStaff`, `queryAudit` and `logError` (CLAUDE.md: rewrite in plain steps).

**State:** demo steps 6–7 (pharmacy) and 11 (admin audit) now safe at the policy level.

**Next:** Vivek's records + doctor portal (nothing landed yet), then the full demo story.

## [2026-11-21 19:45] Ravuri joins the build — pharmacy, admin, platform, deployment, CI

**Received / changed:** Ravuri is building again (Master D23). Pharmacy, admin (staff verification,
audit log, institutions), the Edge health route, `logError`, deployment (Vercel + Neon) and CI move
from Harshita's brief to his new brief `team/ravuri.md`. Vivek's brief unchanged apart from pointing
pharmacy and deploy questions at Ravuri. Contracts `pharmacy.ts` and `admin.ts` are now Ravuri's to
write; Harshita reviews.

**Gates:** no code changed.

**Broke:** nothing. Seams added: Ravuri's admin audit reads `authorize()`'s rows; his staff
verification completes Harshita's `registerStaff`; his `logError` hooks into `http.ts`; his pharmacy
reads Vivek's share codes.

**State:** Harshita phases 0–3 done; Ravuri starts at his Phase 0 unblocked (real `authorize()`,
seeded `ASHA7K`, unverified Dr Neel, Neon already migrated + seeded).

**Next:** Ravuri Phase 0: schemas + hello-world deploy. Harshita: give him Neon access.

## [2026-11-21 20:05] Consent engine live — Phase 4 (Harshita → Vivek)

**Received / changed:** `requestConsent` / `approveConsent` / `denyConsent` / `revokeConsent` in
`src/app/actions/consent.ts` (plain object input, return `ActionResult<ConsentDTO>`),
`GET /api/v1/consents/latest?patientId=`. **[contract]** `ConsentGrant.durationDays` (new migration:
run `npx prisma migrate dev`), `ConsentRequest.institutionId?`, `ConsentDTO` fields in CONTRACTS §4.2.

**Gates:** `npm run check` PASS (200 tests) · access gate: demo steps 2 → 3 → 4 → 5 → 10 at the action
level as real users: request, no duplicate, widening blocked, scopes limited, revoke immediate.

**Broke:** nothing on the seam yet.

**State:** Vivek's request form can call the real action; Kavya gets real `allowedTypes` after Asha approves.

**Next:** Harshita Phase 5 screens (login, Consent Center). Neon needs `prisma migrate deploy`.

## [2026-11-16 20:30] Stub replaced — real authorize() (Harshita → Vivek)

**Received / changed:** `authorize()` now enforces the CONTRACTS §3 matrix (same signature, no
caller changes). Real login exists (Phase 2): `/auth/abha/otp` + `/verify`, `/auth/staff/login`,
`/auth/logout`, cookie `portal_session`. CONTRACTS §3 gained "How the cells are applied":
`record:list` needs consent even for the doctor's own records; `types: []` = all types; which
resource kind each action takes.

**Gates:** `npm run check` PASS (187 tests, 90 matrix cells) · access gate: Kavya → Asha
`CONSENT_REQUIRED`; Kavya → Meera (expired) `CONSENT_REQUIRED`; admin → record `NOT_FOUND`; Asha → own
records allowed; one audit row per call.

**Broke:** nothing known yet. Vivek: anything that worked only because the stub allowed everything
will now be refused; that's a real hole, not a regression. Kavya has no consent for Asha until
Phase 4 (approve) lands.

**State:** policy for demo steps 2 and 11 in place; no screens yet.

**Next:** Harshita Phase 4 (consent engine), so Vivek's request-consent form has a real action.
`DEV_FAKE_USER` stays until the Phase 5 login screens exist.

## [2026-11-16 19:50] Stubs published — Phase 0 (Harshita → Vivek)

**Received / changed:** Harshita's Phase 0 is in `main`: Prisma schema + `init` migration, seed with
fixed ids, `src/contracts/shared.ts` + `format.ts`, stub `getSession()` (`DEV_FAKE_USER`), stub
`authorize()` (final signature, allows all, writes audit), `http.ts` helpers, `GET /api/v1/auth/me`.
Contract changes for Vivek to review: `registerStaff` (§4.1, new); ids are plain strings, never
`.cuid()` (§0); `@unique` on `HealthRecord.fileId` and `LabOrder.resultRecordId` (§2).

**Gates:** `npm run check` PASS (typecheck, lint, 28 tests) · access gate: `/auth/me` as Kavya →
200 Kavya; no fake user → 401 `UNAUTHENTICATED`; stub `authorize()` writes the audit row.

**Broke:** nothing yet on the seam.

**State:** no demo steps yet; Vivek can build against real seeded data and real signatures.

**Next:** Vivek pulls, runs `db:reset`, builds Phase 0–1 against the stubs. Harshita: hosted
Postgres (0.8), then Phase 1 (mock ABHA).

## [2026-11-15 18:45] Correction — team and scope

**Received / changed:** Correcting the 18:30 entry. The team is still four (Harshita, Vivek, Madhav,
Ravuri); Harshita and Vivek build the app. **Nothing is cut**: full v1 scope restored, with a build
order instead of a cut line (Master Part 12). Encounter create, institution create/edit, OTP rate
limit, duplicate-request handling, Edge health, intercepting modal, parallel dashboard, optimistic
rollback, Hindi/English and CI are all in scope.

**Gates:** none yet (no code).

**Broke:** nothing. Contracts: `createEncounter`, `createInstitution`, `updateInstitution` are full
entries again (CONTRACTS §4.4, §4.7).

**State:** docs v2.1 in place.

**Next:** unchanged: Harshita Phase 0 stubs by end of day 2.

## [2026-11-15 18:30] Team and stack change — whole project

**Received / changed:** Console app removed (D20). Madhav and Ravuri off the project; work split
Harshita (access + staff side) / Vivek (records + clinical side) (D21). Entry-point rule D22.

**Gates:** none yet (no code).

**Broke:** nothing yet. Contract changes: session cookie-only, `StaffLoginRequest.client` removed,
`ActionResult<T>` added, contracts moved to `src/contracts/`.

**State:** docs v2 in place; no demo steps working yet.

**Next:** Harshita Phase 0 (stubs) by end of day 2; Vivek Phase 0 (shells + his contract files) in parallel.

<!-- Next entry: end of day 2, stubs published. -->
