# VIVEK — Health records, patient portal, doctor portal, lab
*v2. Read with [`00_MASTER_PLAN.md`](../00_MASTER_PLAN.md). Organised in phases, not days.
Written by hand (D16): reading list per phase in [`LEARNING.md`](../LEARNING.md#vivek).*

> **You own the records and everyone who reads or writes them clinically: the patient's timeline,
> the doctor's viewer, prescriptions, lab orders and lab results.** Since v2 that includes the whole
> doctor portal Madhav had. That's the most screens in the project, but they all sit on one data
> path you control end to end. The doctor's viewer is where an examiner checks whether
> "authorized doctors" means anything. Its most important state isn't the record list. It's
> *Consent required*.

---

# PART A — WHAT YOU OWN

| Area | Backend (`src/server/…`) | Frontend (`src/app/…`) |
|---|---|---|
| Contracts | `src/contracts/records.ts`, `clinical.ts`, `lab.ts` (Harshita reviews) | — |
| Records | `records/`: `listPatientRecords`, `getRecord`, pagination, filters; Route Handlers `/patients/:id/records`, `/records/:id` | `patient/` dashboard, `patient/records` timeline, `patient/records/[id]` + intercepted modal |
| Uploads + files | `records/storage.ts`, `uploadDocument` action, `/files/:id` | `patient/upload` |
| Doctor portal *(from Madhav)* | `clinical/`: patient lookup, summary, `createEncounter`, `createPrescription` (+ share code), `createLabOrder` | `doctor/` dashboard (parallel routes), `doctor/patients` search, `doctor/patients/[patientId]` viewer, `…/request-consent`, `…/encounter`, `…/prescribe`, `…/lab-order` |
| Lab | `lab/`: `listLabOrders`, `uploadLabResult` | `lab/`, `lab/orders/[orderId]` |
| Public | — | `(public)/` landing, `(public)/institutions` (ISR), Hindi/English toggle, Lighthouse pass |

INT257 practicals you carry ([`evaluation/syllabus-coverage.md`](../evaluation/syllabus-coverage.md)):
nested/dynamic routes, loading + error UI, SSR vs client fetching, caching + revalidation, Server
Actions + file upload, image optimization + metadata + lazy loading, and the Unit VI parallel and
intercepting routes.

**What you don't build:** the consent engine (you call Harshita's `requestConsent` action from your
form), login, pharmacy, admin.

---

# PART B — PHASES

## Phase 0 — Shells against fixtures · blocked on nobody
- Write your schemas first (D18): `src/contracts/records.ts` (`RecordDTO`, `RecordListQuery`,
  `DocumentUpload`), `clinical.ts` (`PatientLookupDTO`, `SummaryDTO`, `PrescriptionItem`,
  `PrescriptionCreate`, `LabOrderCreate`), `lab.ts` (`LabOrderDTO`, `LabResultUpload`), field for
  field from [`CONTRACTS.md`](../CONTRACTS.md) §4.3–4.5, one valid + one invalid test each.
- Patient: `patient/layout.tsx` (nav: Dashboard, Records, Upload, Consents, Access log), dashboard
  cards, `RecordCard`, `RecordTimeline` (grouped by month, `formatIST`), type badges, institution chip.
- Doctor: `doctor/layout.tsx`, viewer page with **all three states built against fixtures first**:
  `ConsentRequired` (with a "Request access" button), `EmptyState` ("No records in the scopes you
  have access to"), records grouped by institution.
- Fixture JSON parsed with your own schemas, so mismatches show up now.
- **Checkpoint:** screenshots of the timeline and the three viewer states, sent to Harshita.

## Phase 1 — Records API
- `src/server/records/list.ts` exactly like the template in [`src/server/README.md`](../../src/server/README.md):
  `authorize(user, 'record:list', { kind: 'patientRecords', … })`, then **query with
  `d.allowedTypes`** (TRAPS §5).
- Page-based pagination (`skip`/`take`), ordered by `occurredAt desc, id desc`; `total` from `count()`
  with the **same** `where`.
- Patient pages: Server Components call the data function directly, filters from `searchParams`.
- Route Handlers `/patients/:id/records` and `/records/:id` for the doctor's client-side viewer.
- **Checkpoint:** as Asha: all records. As Kavya with a partial-scope consent: only those types, and
  the excluded ones **not in the network response**. As Kavya with no consent: `403 CONSENT_REQUIRED`.

## Phase 2 — Uploads and files
- `storage.ts`: `put(buffer, mime) → key`, `stream(key)`. Local dir (`FILE_STORAGE_DIR`) in dev; a
  blob store in prod (agree it with Harshita, who deploys). **Never `public/`** (TRAPS §12).
- `uploadDocument` Server Action: `requireSession` → `authorize('record:create:self')` → Zod → size
  ≤ 5 MB and MIME ∈ {pdf, png, jpeg} **checked from the file bytes**, not the extension → `FileObject`
  + `HealthRecord(DOCUMENT)` in one transaction → `revalidatePath('/patient/records')`.
- `serverActions.bodySizeLimit` raised so 5 MB actually reaches you (default 1 MB).
- `GET /files/:id`: authorize `file:read` against the owning record; correct `Content-Type`.
- **Checkpoint:** upload as Asha, see it in the timeline without a manual refresh; the file URL opened
  as Rohan → 404.

## Phase 3 — Doctor: lookup, viewer, consent request *(from Madhav)*
- Lookup (`/api/v1/patients/lookup`): `authorize('patient:lookup')`, `parseAbhaInput`, returns name +
  masked ABHA only. **Lookup is not access.**
- Summary (`/patients/:id/summary`): counts by institution × type, using `allowedTypes`.
- Viewer (`doctor/patients/[patientId]`, client component): React Query
  `useQuery(['records', patientId, filters])`, **check `error.code === 'CONSENT_REQUIRED'` before
  `data`** (TRAPS §4), group by institution with `useMemo`, `refetchOnWindowFocus` so the view updates
  after Asha approves.
- Consent request form (`…/request-consent`): scopes, duration (1–30 days), purpose; calls Harshita's
  `requestConsent` action. Until her Phase 4 lands, it returns a stub `REQUESTED`. Build it anyway.
- Lab report PDFs open in a viewer loaded with `next/dynamic`.
- **Checkpoint:** demo steps 2, 3 and 5. Revoking in another tab turns the viewer back into *Consent
  required* on the next focus.

## Phase 4 — Clinical writes *(from Madhav)*
- `createPrescription`: `requireSession` → Zod → `authorize('record:create:clinical')` → transaction
  (record + prescription + share code). Share code: 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`,
  retry on a unique-constraint collision. Show the code large on success.
- Prescription writer: dynamic drug rows (add/remove, 1–10), every row controlled, validated with
  `PrescriptionCreate`.
- `createLabOrder`: lab picker (seeded labs), tests list.
- `createEncounter` + form (`…/encounter`): title, summary, date; same session → Zod → `authorize` pattern.
- Optimistic prescription with rollback (`useOptimistic`, TRAPS §15): the new prescription appears
  instantly; on failure (e.g. consent revoked) it's removed and the reason is shown.
- **Checkpoint:** demo step 6; Harshita's pharmacy finds your new share code.

## Phase 5 — Lab · seeded pending order unblocks you
- `listLabOrders`: only orders where `labInstitutionId` is in `user.institutionIds`; patient **name** +
  tests + ordering doctor, nothing else.
- `uploadLabResult` action: `authorize('labResult:upload')`, transaction: file +
  `HealthRecord(LAB_REPORT, authorId = lab user, institutionId = lab)` + order `COMPLETED` +
  `resultRecordId`. A second upload → `CONFLICT`.
- Screens: `/lab` orders table (loading/error/empty) and `/lab/orders/[orderId]` upload form.
- **Checkpoint:** demo step 7; Asha sees the new lab report in her timeline.

## Phase 6 — Routing extras
- Record detail intercepted at `patient/@modal/(.)records/[id]`: modal from the timeline, full page on
  refresh or a shared link.
- Doctor dashboard with parallel routes `@pending` (my requests awaiting patients) and `@recent`, each
  with its own `loading.tsx`.
- `loading.tsx` and `error.tsx` per segment (a practical in their own right).

## Phase 7 — Public pages
- Landing: what the portal is, the five roles, two CTAs (patient login, staff login).
- Institution directory: list + `[id]` detail, `export const revalidate = 3600`,
  `generateStaticParams`, `generateMetadata`, `next/image`. Public data only.
- Five lines in your log comparing the SSR records page with the client-fetched doctor viewer (what's
  in the HTML, time to first content). That's the "compare rendering strategies" practical.

## Phase 8 — Hindi/English + Lighthouse
- Language toggle on the landing page and the patient nav: a `messages/en.json` + `messages/hi.json`
  dictionary, the choice kept in a cookie (not `localStorage`), read on the server so the first render
  is already in the right language. Public and patient-nav strings only, not clinical content.
- Lighthouse on the landing page and institution directory; record performance, accessibility and SEO
  scores in your log, fix what's red.

---

# PART C — YOUR TRAPS
TRAPS §2 (Server Actions are public), §3 (never cache patient/doctor pages), §4 (consent-required ≠
empty), §5 (scope filtering on the server), §12 (files outside `public/`, 1 MB action limit), §14
(query cache across logins), §15 (optimistic rollback), §16 (test every persona), §18 (server code in
client components). Plus: **a doctor at two institutions.** A consent request carries the institution
the doctor is acting for. If they have more than one, ask in the form; don't take `[0]`.

# PART D — DONE MEANS
- [ ] Demo steps 1 (timeline), 2, 3 (form), 5, 6, 7 work on the deployed build
- [ ] Encounter form, optimistic prescription, intercepting modal, parallel dashboard, Hindi/English toggle all working
- [ ] Out-of-scope records never appear in any network response
- [ ] Files can't be fetched without an authorized session
- [ ] `patient/*` and `doctor/*` are dynamic; only `(public)/*` is static/ISR

# PART E — VIVA QUESTIONS
1. What does the intercepting route do on a hard refresh, and why?
2. Why is the institution directory ISR but the records page never cached?
3. Where exactly does scope filtering happen, and why not in the component?
4. How does the viewer tell "no records" from "no consent"?
5. Why is the lab result upload a transaction?
6. Why does lookup return a masked ABHA and no records?
7. Why does the viewer use React Query while the patient timeline is a Server Component?
