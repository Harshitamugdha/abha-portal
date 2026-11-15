# ABHA Health-Record Portal

A unified health-record portal where patients sign in with their **ABHA** identity, and a doctor
can see a patient's records from every participating hospital and lab, **only while the patient
has granted consent**. Pharmacies, laboratories and administrators each get exactly the access
their job needs, and every access decision is logged.

Built in **Next.js** for **INT257 (Modern Web Application Development)**, problem statement G4.

> **ABHA sign-in is simulated.** Real ABDM sandbox access requires an approved application. The
> portal talks to a mock provider through the same interface a real integration would use
> (decision D1). All patients, ABHA numbers and medical records are fictional.

---

## What it does

| Role | Can | Cannot |
|---|---|---|
| **Patient** | Sign in with ABHA number/address + OTP; see every record from every institution in one timeline; approve, narrow, deny or revoke a doctor's consent request; see who viewed their records and when | Edit clinical records |
| **Doctor** | Find a patient by ABHA; request scoped, time-bound consent; while it's active, read records grouped by institution; write prescriptions and lab orders | See any record without consent, or outside the consented scopes |
| **Pharmacy** | Look up one prescription by its share code; mark it dispensed | See any other record or search patients |
| **Laboratory** | See lab orders addressed to it; upload results | Read patient history |
| **Admin** | Verify staff, read the full audit log | Read clinical data |

## How access works
```
request ─▶ proxy.ts (logged in? right area?) ─▶ authorize(user, action, resource) ─▶ data
                                                     │
                                                     └─▶ audit log (allowed AND denied)
```
`authorize()` is the single security boundary. A doctor's read is allowed only if they authored
the record, or a consent grant for that patient is `GRANTED`, inside `validFrom … validTo`, and
covers the record's type. Expiry is checked at read time, so a lapsed consent stops working the
second it lapses. Details: [`docs/architecture/README.md`](docs/architecture/README.md).

## Stack
| | |
|---|---|
| App | One **Next.js 16** app (App Router): Server Components, Server Actions, Route Handlers, `proxy.ts`, parallel + intercepting routes, ISR |
| UI | React 19 (via Next.js), Tailwind, React Query for the doctor's live viewer |
| Data | Prisma 7 + PostgreSQL |
| Auth | Mock ABHA OTP, `jose` JWT in an httpOnly cookie, `bcryptjs` for staff passwords |
| Validation | Zod schemas in `src/contracts/`, shared by server and client |
| Tests | Vitest: the full `authorize()` policy matrix, consent engine, contract schemas |

## Run it
See [`QUICKSTART.md`](QUICKSTART.md). Short version:
```bash
npm install
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm run db:reset              # migrate + seed the demo personas
npm run dev                   # http://localhost:3000
```
Sign in as patient **Asha**: ABHA `91-1000-0000-0001`, OTP `123456`.

## Documentation
Start at [`docs/README.md`](docs/README.md). The master plan is
[`docs/00_MASTER_PLAN.md`](docs/00_MASTER_PLAN.md).

## Team
| | Area |
|---|---|
| Harshita | Identity, access control, consent, audit, pharmacy, admin, deployment |
| Vivek | Health records, patient portal, doctor portal, lab |
