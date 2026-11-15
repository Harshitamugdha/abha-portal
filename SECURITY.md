# Security

This is a course project that models how a health-record system should control access. It is
**not** deployed for real patients and holds **no real health data**.

## What the design guarantees, and where
| Guarantee | Enforced in | Tested in |
|---|---|---|
| A doctor reads a record only as its author or under an active consent covering its type | `authorize()` | `authorize.test.ts` policy matrix |
| Consent expiry takes effect immediately, with no job to run | consent query (`now < validTo`) | seed persona Meera (expired consent) |
| A patient can narrow, never widen, requested scopes | consent engine (`approve`) | `consent.test.ts` |
| Pharmacy sees one prescription, by share code, with patient name only | pharmacy DTO (explicit `select`) | contract test on `PharmacyPrescriptionDTO` |
| Admin never reads clinical content | policy matrix + admin DTOs | `authorize.test.ts` |
| Every allowed **and** denied decision is logged | `authorize()` writes `AuditLog` | access gate, Master §8.4 |
| Files are never public | files outside `public/`, served via `GET /api/v1/files/:id` | access gate |
| No session token readable by JavaScript | httpOnly cookie, the only session carrier | review |

## Known limitations (deliberate, for scope)
- ABHA sign-in is a **mock** (D1). OTP is fixed in development.
- No rate limiting beyond OTP requests.
- No encryption at rest beyond what the hosted database provides.
- No break-glass emergency access.

## Reporting a problem
Found a way to see data you shouldn't? That's the most valuable bug in this project. Open an
issue with the **access bug** label: which persona, which URL or action, what you saw, what you
expected. Don't post screenshots containing anything other than seed data.
