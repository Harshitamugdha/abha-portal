# src/server — the backend

The only place that touches the database. Full contract: `docs/CONTRACTS.md`. Every file starts with
`import 'server-only'`, so importing it into a client component fails the build (TRAPS §18).

## The shape of every data function
```ts
export async function listPatientRecords(user: SessionUser, input: unknown) {
  const q = RecordListQuery.parse(input);                                   // 1. validate
  const d = await authorize(user, 'record:list',
                            { kind: 'patientRecords', patientId: q.patientId, types: q.types }); // 2. decide + audit
  if (!d.allowed) throw new ApiError(d.code);                               // 3. deny
  const rows = await db.healthRecord.findMany({
    where: { patientId: q.patientId, type: { in: d.allowedTypes } },        // 4. query with what authorize allowed
    select: recordSelect,                                                   // 5. explicit select
  });
  return rows.map(toRecordDTO);                                             // 6. DTO, never the raw row
}
```
Callers are thin:
- **Server Component:** `const user = await requireSession(); const data = await listPatientRecords(user, searchParams);`
- **Server Action:** session → Zod → data function → `{ ok: true, data }`, or catch `ApiError` → `actionError(code)`.
- **Route Handler:** session → data function → `Response.json(...)`, or `apiError(code)`.

## Directory ownership
| Folder | Owner | Holds |
|---|---|---|
| `auth/` | Harshita | `session.ts` (`getSession`, `requireSession`), `abha/` (`AbhaProvider`, `MockAbhaProvider`), `authorize.ts`, `authorize.test.ts`, `password.ts` |
| `consent/` | Harshita | `engine.ts` (request/approve/deny/revoke, `activeGrant()`), `rules.ts`, `consent.test.ts`; its Server Actions are in `src/app/actions/consent.ts` |
| `audit/` | Harshita | `write.ts` (called only by `authorize`), `queries.ts` (patient access log) |
| `pharmacy/` | Ravuri | `lookupPrescription`, `dispensePrescription` |
| `admin/` | Ravuri | `listStaff`, `verifyStaff`, `queryAudit`, `listInstitutions`, `createInstitution`, `updateInstitution` |
| `records/` | Vivek | record list/get, `uploadDocument`, `storage.ts` (file adapter), file stream |
| `clinical/` | Vivek | patient lookup, summary, `createPrescription` (+ share code), `createLabOrder` |
| `lab/` | Vivek | `listLabOrders`, `uploadLabResult` |
| `db.ts`, `http.ts` | Harshita | Prisma singleton (TRAPS §10), `apiError`, `actionError`, `ApiError` |
| `log.ts` | Ravuri | `logError(err, context)`, called from the `http.ts` wrappers |

## Rules
- `authorize()` is called **once per decision**, before the query, and its `allowedTypes` /
  `consentId` are used in the query. Don't re-implement any part of the policy in your folder.
- Never `...row` into a response. DTO mappers select fields explicitly (TRAPS §17).
- Writes that change two rows (lab result → complete order; dispense) run in `db.$transaction`.
- Throw `ApiError(code)`; the caller turns it into the error shape. Never send a Prisma error
  message to the client.
- Tests (Vitest) sit next to the file: `engine.ts` → `engine.test.ts`. The policy-matrix test is a
  table: one row per cell of `docs/CONTRACTS.md` §3.
