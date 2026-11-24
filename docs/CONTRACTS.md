# CONTRACTS — the frozen shapes (v2)

> **The executable copy is `src/contracts/`** (Zod schemas + inferred types). This file is the
> readable copy. **If the two disagree, the code wins and this file is the bug.** Fix it in the
> same PR.
>
> Changing anything here: a PR that touches only `src/contracts/` + this file (+ `prisma/` if the
> database changes), approved by Harshita and by anyone whose code uses it, before any code relies on it.
>
> **v2:** one Next.js app (Master D20), cookie sessions only, entry points split into Server
> Components, Server Actions and Route Handlers (D22). Owners per section below: Harshita, Vivek,
> Ravuri (D21, D23).

---

## 0. Conventions every shape obeys
- Ids are strings. New rows get a `cuid`; seeded rows have readable fixed ids (`user-asha`,
  `rec-asha-cbc`, `inst-citygen`). So validate ids as `z.string().min(1)`, **never** `.cuid()`.
  Never expose an auto-increment integer.
- Timestamps: ISO 8601 UTC with trailing `Z` (`"2026-10-21T09:30:00.000Z"`). Display via `formatIST()`.
- ABHA number in payloads: 14 digits, no hyphens (`"91100000000001"`). Display via `formatAbha()`.
- Enums are `UPPER_SNAKE`. Field names are `camelCase`.
- List endpoints take `?page=1&pageSize=20` and return `{ items: T[], page, pageSize, total }`.
  Default page size 20, max 50. Offset pagination (D17): simple to implement, fine at demo scale.
- Every response body is validated against its schema in dev (`parseResponse()` helper). A
  shape mismatch throws in dev rather than rendering garbage.
- **Server Actions return** `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`
  (`ActionResult<T>` in `src/contracts/shared.ts`). They never throw to the client, so a form can
  show the error under the right field.

---

## 1. Errors
```json
{ "error": { "code": "CONSENT_REQUIRED", "message": "Consent required to view this patient's records", "details": { "patientId": "…" } } }
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Zod rejected the body/query. `details` = flattened Zod issues |
| 401 | `UNAUTHENTICATED` | No or expired session |
| 401 | `OTP_INVALID` | Wrong or expired OTP |
| 403 | `FORBIDDEN` | Authenticated, wrong role for this action |
| 403 | `CONSENT_REQUIRED` | **Doctor only**: no active consent covering this record/scope (D10) |
| 403 | `STAFF_UNVERIFIED` | Staff account not yet verified by admin |
| 404 | `NOT_FOUND` | Doesn't exist **or** non-doctor isn't allowed to know it exists (D10) |
| 409 | `CONFLICT` | e.g. prescription already dispensed, consent already decided |
| 413 | `FILE_TOO_LARGE` | Upload over 5 MB |
| 429 | `RATE_LIMITED` | OTP requested too often (max 3 per 10 min per ABHA) |
| 500 | `INTERNAL` | Anything else. Never leak a stack trace or Prisma message |

Helpers in `src/server/http.ts`: `apiError(code, message?, details?)` for Route Handlers,
`actionError(code, …)` for Server Actions. Never build error JSON by hand.

---

## 2. Data model (Prisma)
Owner: Harshita. Everyone else reads it. This is the shape; exact Prisma syntax lives in
`prisma/schema.prisma`.

```prisma
enum Role            { PATIENT DOCTOR PHARMACY LAB ADMIN }
enum InstitutionType { HOSPITAL PHARMACY LAB }
enum RecordType      { ENCOUNTER PRESCRIPTION LAB_REPORT DOCUMENT }
enum ConsentStatus   { REQUESTED GRANTED DENIED REVOKED }        // EXPIRED is derived, never stored (D9)
enum LabOrderStatus  { PENDING COMPLETED CANCELLED }
enum AuditOutcome    { ALLOWED DENIED }

model User {
  id           String   @id @default(cuid())
  role         Role
  name         String
  email        String?  @unique          // staff only
  passwordHash String?                   // staff only, bcryptjs (D19)
  hprId        String?                   // doctors only, seeded
  verified     Boolean  @default(false)  // staff: admin flips this; patients: true
  createdAt    DateTime @default(now())
  abha         AbhaProfile?
  memberships  Membership[]
}

model AbhaProfile {            // patients only
  userId      String @id
  abhaNumber  String @unique   // 14 digits, no hyphens
  abhaAddress String @unique   // lowercase, name@abdm
  mobileLast4 String           // what the OTP screen shows: "******4821"
  dob         DateTime
  gender      String
}

model Institution {
  id   String          @id      // seeded slugs: inst-citygen …
  name String
  type InstitutionType
  city String
}

model Membership {             // staff ↔ institution
  userId        String
  institutionId String
  @@id([userId, institutionId])
}

model HealthRecord {
  id            String     @id @default(cuid())
  patientId     String
  institutionId String
  authorId      String?               // doctor/lab user; null for patient self-upload
  type          RecordType
  title         String
  summary       String?
  occurredAt    DateTime
  fileId        String?               // FileObject, for LAB_REPORT/DOCUMENT
  createdAt     DateTime   @default(now())
  prescription  Prescription?
  @@index([patientId, type, occurredAt])
}

model Prescription {           // 1:1 with a HealthRecord of type PRESCRIPTION
  recordId    String    @id
  items       Json                    // [{ drug, dose, frequency, durationDays, notes? }]
  shareCode   String    @unique       // 6 chars, A–Z 2–9, no 0/O/1/I
  dispensedAt DateTime?
  dispensedBy String?                 // pharmacy user id
  expiresAt   DateTime                // createdAt + 30 days
}

model LabOrder {
  id               String         @id @default(cuid())
  patientId        String
  orderedById      String                // doctor
  labInstitutionId String
  tests            String[]
  status           LabOrderStatus @default(PENDING)
  resultRecordId   String?               // HealthRecord LAB_REPORT, set on upload
  createdAt        DateTime       @default(now())
}

model ConsentGrant {
  id                String        @id @default(cuid())
  patientId         String
  doctorId          String
  institutionId     String                // the doctor's institution at request time
  scopes            RecordType[]
  purpose           String                // 3–120 chars
  durationDays      Int @default(7)       // 1–30, chosen by the doctor; used on approve
  status            ConsentStatus @default(REQUESTED)
  requestedAt       DateTime      @default(now())
  decidedAt         DateTime?
  validFrom         DateTime?             // set on GRANTED
  validTo           DateTime?             // validFrom + durationDays
  @@index([patientId, doctorId, status])
}

model AuditLog {
  id           String       @id @default(cuid())
  at           DateTime     @default(now())
  actorId      String
  actorRole    Role
  action       String                    // an Action from §3
  resourceType String                    // "HealthRecord" | "ConsentGrant" | …
  resourceId   String?
  patientId    String?                   // set whenever patient data is involved
  consentId    String?                   // the grant that allowed it, if any
  outcome      AuditOutcome
  reason       String?                   // "NO_ACTIVE_CONSENT" | "SCOPE_EXCLUDED" | "AUTHOR" | …
  @@index([patientId, at])
}

model FileObject {
  id        String   @id @default(cuid())
  key       String                       // storage key, never a public URL
  mimeType  String                       // application/pdf | image/png | image/jpeg
  sizeBytes Int                          // ≤ 5 MB
  uploadedBy String
  createdAt DateTime @default(now())
}
```

---

## 3. `authorize()` — the security boundary
```ts
// src/server/auth/authorize.ts
type Action =
  | 'record:read' | 'record:list' | 'record:create:self' | 'record:create:clinical'
  | 'file:read'
  | 'consent:request' | 'consent:decide' | 'consent:list'
  | 'labOrder:create' | 'labOrder:list:lab' | 'labResult:upload'
  | 'prescription:lookup' | 'prescription:dispense'
  | 'patient:lookup'
  | 'institution:manage' | 'staff:verify'
  | 'audit:read:self' | 'audit:read:all';

type Resource =
  | { kind: 'record'; record: Pick<HealthRecord, 'id'|'patientId'|'type'|'authorId'|'institutionId'> }
  | { kind: 'patientRecords'; patientId: string; types: RecordType[] }   // list queries
  | { kind: 'consent'; consent: ConsentGrant }
  | { kind: 'patient'; patientId: string }
  | { kind: 'labOrder'; order: LabOrder }
  | { kind: 'prescription'; prescription: Prescription & { patientId: string } }
  | { kind: 'none' };

type Decision =
  | { allowed: true;  consentId?: string; allowedTypes?: RecordType[]; reason: string }
  | { allowed: false; code: 'FORBIDDEN' | 'CONSENT_REQUIRED' | 'NOT_FOUND' | 'STAFF_UNVERIFIED'; reason: string };

function authorize(user: SessionUser, action: Action, resource: Resource): Promise<Decision>;
// Writes exactly one AuditLog row per call. Never throws for a deny; returns the decision.
// Callers turn a deny into apiError(decision.code).
```

**Policy matrix** (✓ allowed, C = only under active consent or as author, — denied):

| Action | Patient | Doctor | Pharmacy | Lab | Admin |
|---|---|---|---|---|---|
| `record:read` / `record:list` | own only | C | — | — | — |
| `record:create:self` (upload document) | own only | — | — | — | — |
| `record:create:clinical` (encounter, prescription) | — | C* | — | — | — |
| `file:read` | own only | C | — | own uploads | — |
| `consent:request` | — | ✓ | — | — | — |
| `consent:decide` | own only | — | — | — | — |
| `consent:list` | own | own requests | — | — | — |
| `patient:lookup` (by ABHA) | — | ✓ (returns name + id only) | — | — | — |
| `labOrder:create` | — | C* | — | — | — |
| `labOrder:list:lab` / `labResult:upload` | — | — | — | own institution's orders | — |
| `prescription:lookup` / `prescription:dispense` | — | — | by share code | — | — |
| `institution:manage` / `staff:verify` | — | — | — | — | ✓ |
| `audit:read:self` | own patientId | — | — | — | — |
| `audit:read:all` | — | — | — | — | ✓ |

\* Writing clinical records needs an active consent of **any** scope for that patient (the doctor
is treating them). The record written is then readable by the doctor as author (D5).

**How the cells are applied** (as implemented in `authorize.ts`, Phase 3):
- **Deny codes.** Doctor without a usable consent → `CONSENT_REQUIRED`. Reads of records, files and
  prescriptions by anyone else who isn't allowed → `NOT_FOUND` (D10, TRAPS §11). An action the role
  can never do (e.g. a patient requesting consent) → `FORBIDDEN`.
- **`record:list` needs consent even for records the doctor wrote.** Author access (D5) applies to
  `record:read` of one record. So after a revoke the viewer shows "Consent required", not a partial list.
- **`patientRecords.types: []` means all types.** `allowedTypes` = requested ∩ consented scopes; may be
  `[]` (then the data function returns an empty page).
- **Resources per action:** `record:create:self`, `record:create:clinical`, `labOrder:create`,
  `consent:request`, `patient:lookup`, `audit:read:self` and `consent:list` take
  `{ kind: 'patient', patientId }`; `file:read` takes the owning `record`; `labOrder:list:lab`,
  `institution:manage`, `staff:verify`, `audit:read:all` take `{ kind: 'none' }`. A wrong kind is denied
  (`FORBIDDEN`, reason `BAD_RESOURCE`).
- **Audit reasons:** `OWNER`, `ROLE`, `AUTHOR`, `CONSENT`, `NO_ACTIVE_CONSENT`, `SCOPE_EXCLUDED`,
  `NOT_OWNER`, `WRONG_ROLE`, `UNVERIFIED`, `BAD_RESOURCE`.

Unverified staff: every action → `STAFF_UNVERIFIED`. The policy matrix is tested as a table in
`authorize.test.ts`. **Every cell above has a test.**

---

## 4. Entry points
Rule (Master D22): **Server Components read** by calling a data function directly · **Server
Actions write** · **Route Handlers** (`/api/v1/*`) serve auth, reads made from client components
with React Query, file downloads and the health check. Schema names refer to `src/contracts/`.
Every entry point calls a data function in `src/server/<domain>/`, which calls `authorize()`.

### 4.1 Auth — Harshita · `src/contracts/auth.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Route Handler POST | `/auth/abha/otp` | `AbhaOtpRequest { abha }` (number or address) → `{ txnId, maskedMobile, devOtp? }` (`devOtp` only in development) |
| Route Handler POST | `/auth/abha/verify` | `AbhaVerifyRequest { txnId, otp }` → sets cookie; `{ user: SessionUser }` |
| Server Action | `registerStaff` | `StaffRegisterRequest { name, email, password (8+ chars), role: DOCTOR\|PHARMACY\|LAB, institutionId, hprId? (required for DOCTOR) }` → `{ userId }`. Creates an **unverified** user + membership; doesn't log in. `CONFLICT` if the email is taken; `VALIDATION_FAILED` if the institution type doesn't match the role. Public (no session) |
| Route Handler POST | `/auth/staff/login` | `StaffLoginRequest { email, password }` → sets cookie; `{ user, redirectTo }` (`/doctor`, `/lab`, `/pharmacy` or `/admin`) |
| Route Handler POST | `/auth/logout` | → `204`, cookie cleared |
| Route Handler GET | `/auth/me` | → `{ user: SessionUser }` |

### 4.2 Consent + audit — Harshita · `src/contracts/consent.ts`, `audit.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Server Action | `requestConsent` | `ConsentRequest { patientId, scopes: RecordType[], purpose, durationDays: 1..30, institutionId? }` (`institutionId` required only when the doctor works at more than one institution) → `ConsentDTO` (`REQUESTED`). **Called from Vivek's form** |
| Server Action | `approveConsent` | `{ consentId, scopes?: RecordType[] }` (narrow only, never widen) → `ConsentDTO` |
| Server Action | `denyConsent` / `revokeConsent` | `{ consentId }` → `ConsentDTO` (revoke only from `GRANTED`) |
| Data function | `listConsents(user, { status?, page })` | → `Page<ConsentDTO>` (patient: theirs; doctor: their requests). Used by Server Components |
| Route Handler GET | `/consents/latest?patientId=` | → `{ consent: ConsentDTO \| null }`: the doctor's latest grant for this patient, for the viewer (client side) |
| Data function | `listMyAccessLog(user, { page })` | → `Page<AccessLogEntryDTO>`: who read my data, when, under which consent |

`ConsentDTO.displayStatus`: `REQUESTED | GRANTED | DENIED | REVOKED | EXPIRED` (`EXPIRED` derived).

`ConsentDTO { id, patientId, patientName, doctorId, doctorName, institutionId, institutionName, scopes,
purpose, durationDays, status, displayStatus, requestedAt, decidedAt|null, validFrom|null, validTo|null }`
(timestamps ISO `Z`). The four Server Actions live in `src/app/actions/consent.ts` (not `src/server/`,
so client forms can import them, rule 11) and take a plain object, not `FormData`. Asking again while a
`REQUESTED` one is open returns that one; asking while an **active** grant exists (D9 rule) → `CONFLICT`
(one active consent per doctor + patient, so a revoke always ends access). Approve/deny only from `REQUESTED`, revoke only from `GRANTED`,
otherwise `CONFLICT`.

### 4.3 Records + files — Vivek · `src/contracts/records.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Route Handler GET | `/patients/:patientId/records?type=&institutionId=&from=&to=&page=` | → `Page<RecordDTO>`. Doctor: consented scopes only; **no active consent → `403 CONSENT_REQUIRED`** |
| Route Handler GET | `/records/:id` | → `RecordDTO` (+ `prescription` when type is PRESCRIPTION) |
| Data function | `listPatientRecords`, `getRecord` | Same shapes, called directly by the patient's Server Components |
| Server Action | `uploadDocument` | `FormData`: `file` + `DocumentUpload { title, occurredAt, institutionId }` → `RecordDTO` |
| Route Handler GET | `/files/:id` | → file stream, `Content-Disposition: inline`. Authorized per request; never a public URL |

### 4.4 Clinical — Vivek · `src/contracts/clinical.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Route Handler GET | `/patients/lookup?abha=` | → `PatientLookupDTO { patientId, name, abhaNumberMasked }` |
| Route Handler GET | `/patients/:patientId/summary` | → `{ byInstitution: [{ institution, counts, latestAt }] }`, consented scopes only |
| Server Action | `createPrescription` | `PrescriptionCreate { patientId, items: PrescriptionItem[1..10], notes? }` → `{ recordId, shareCode }` |
| Server Action | `createLabOrder` | `LabOrderCreate { patientId, labInstitutionId, tests: string[1..10] }` → `LabOrderDTO` |
| Server Action | `createEncounter` | `EncounterCreate { patientId, title, summary, occurredAt }` → `RecordDTO` |

### 4.5 Lab — Vivek · `src/contracts/lab.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Data function | `listLabOrders(user, { status, page })` | → `Page<LabOrderDTO>`: own institution's orders; patient **name** + tests + ordering doctor only |
| Server Action | `uploadLabResult` | `FormData`: `orderId` + `file` + `LabResultUpload { summary }` → `RecordDTO`; `409` if already completed |

### 4.6 Pharmacy — Ravuri · `src/contracts/pharmacy.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Data function | `lookupPrescription(user, shareCode)` | → `PharmacyPrescriptionDTO { recordId, patientName, items, issuedBy, issuedAt, dispensedAt }`. Nothing else about the patient. Unknown/expired → `NOT_FOUND` |
| Server Action | `dispensePrescription` | `{ recordId }` → `PharmacyPrescriptionDTO`; `CONFLICT` if already dispensed or expired |

### 4.7 Admin + platform — Ravuri · `src/contracts/admin.ts`
| Kind | Path / name | Input → Output |
|---|---|---|
| Data function | `listStaff(user, { verified })` | → `Page<StaffDTO>` |
| Server Action | `verifyStaff` | `{ userId }` → `StaffDTO` |
| Data function | `queryAudit(user, { patientId?, actorId?, outcome?, from?, to?, page })` | → `Page<AuditEntryDTO>`: ids, roles, actions, outcomes; **no clinical content** |
| Data function | `listInstitutions(user)` | → `InstitutionDTO[]` |
| Server Action | `createInstitution` / `updateInstitution` | `InstitutionCreate { name, type, city }` / `{ id, …InstitutionCreate }` → `InstitutionDTO` |
| Route Handler GET | `/health` | Edge runtime → `{ ok: true, at }`. No Prisma |

---

## 5. Session
```ts
type SessionUser = {
  id: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LAB' | 'ADMIN';
  name: string;
  verified: boolean;
  institutionIds: string[];   // staff; [] for patients
  patientId?: string;         // patients: same as id
};
```
- Signed JWT (HS256, `jose`) in cookie `portal_session`, `httpOnly; Secure; SameSite=Lax; Path=/`, 8 h.
  That's the only session carrier (D20).
- `getSession()` reads the cookie. `requireSession()` throws `UNAUTHENTICATED`. (The `DEV_FAKE_USER`
  stub was deleted on 21 Nov 2026.)

---

## 6. What the contracts don't catch
Zod proves the **shape**. It can't prove that:
- a doctor without consent was refused (that's `authorize.test.ts` + the access gate, Master §8.4)
- an expired consent stopped working (seed persona Meera exists for this)
- a list endpoint filtered by scope rather than returning everything (test with a partial-scope consent)
- the audit row was written (check `/audit/me` after every read you add)
