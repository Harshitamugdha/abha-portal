# Syllabus coverage — INT257: every practical, the feature that shows it, and who owns it

The examiner reads the syllabus, not our master plan. Every practical below must point to a real
screen or file we can open in the viva. **A row with no feature is a gap. Fix it before the demo.**

Since v2 this project covers **INT257 only** (Master D20). INT252 is a separate solo React project.

Status: ☐ not started · ◐ in progress · ☑ demonstrable on the deployed build.

---

## Practicals

| # | Practical | Where it's demonstrated | Owner | Status |
|---|---|---|---|---|
| 1 | Next.js app with App Router; structure + workflow | The repo itself: route groups `(public)`, `(auth)`, role areas, `src/server/`, `src/contracts/` | Harshita | ☐ |
| 2 | File-based, nested, dynamic routing; layouts, navigation, loading + error UI | `patient/records/[id]`, `doctor/patients/[patientId]/…`, `lab/orders/[orderId]`, `pharmacy/rx/[code]`; role layouts; `loading.tsx` + `error.tsx` per segment | Vivek (+ Harshita for pharmacy/admin) | ☐ |
| 3 | Server vs client fetching; compare rendering strategies | Patient timeline = Server Component with `searchParams`; doctor viewer = client component with React Query. Comparison written in Vivek's log | Vivek | ☐ |
| 4 | Caching + revalidation | Institution directory ISR (`revalidate = 3600`); `revalidatePath` after uploads and clinical writes; **why every role area is dynamic** (TRAPS §3) | Vivek | ☐ |
| 5 | REST APIs with Route Handlers, HTTP methods | `/api/v1/auth/*` (POST), `/patients/[patientId]/records`, `/patients/lookup`, `/records/[id]`, `/files/[id]`, `/consents/latest`, `/health` (GET) | both | ☐ |
| 6 | Forms with validation, file handling, mutations via Server Actions | `uploadDocument`, `uploadLabResult` (files); `createPrescription` (dynamic rows), `createEncounter`; `approveConsent`, `dispensePrescription`, `verifyStaff`, `createInstitution` | Vivek, Harshita | ☐ |
| 7 | Database with an ORM, CRUD | Prisma 7 + PostgreSQL: schema, migrations, seed; create (encounters, prescriptions, uploads, institutions), read (everywhere), update (consent status, dispense, verify, institution edit), delete-equivalent (revoke) | Harshita (+ Vivek) | ☐ |
| 8 | Auth, sessions, protected routes, RBAC | ABHA OTP login, JWT cookie session, `proxy.ts`, `authorize()` policy matrix + consent | Harshita | ☐ |
| 9 | Image optimization, metadata, code splitting, lazy loading | `next/image` + `generateMetadata` on public pages; `next/dynamic` PDF viewer | Vivek | ☐ |
| 10 | Production deploy with env config, monitoring, error logging | Vercel + hosted Postgres; env per environment; `logError()`; host logs/analytics | Harshita | ☐ |

## Unit VI topics (taught, not in the practical list)
| Topic | Where | Owner |
|---|---|---|
| Parallel routes | Doctor dashboard `@pending` + `@recent` | Vivek |
| Intercepting routes | Record detail modal `@modal/(.)records/[id]` | Vivek |
| Proxy | `proxy.ts` coarse gate | Harshita |
| Edge runtime | `/api/v1/health` | Harshita |
| Internationalization | Hindi/English on landing + patient nav | Vivek |
| Security best practices | `authorize()`, httpOnly cookie, `server-only`, no public secrets, DTO selects | Harshita |
| Testing overview | Vitest: policy matrix, consent engine, contracts | Harshita |
| Project architecture / component organization | `docs/architecture/`, `src/server/<domain>/`, `components/ui/` | both |

---

## Viva readiness
Each of you should be able to open your rows above on the deployed build and explain them without
notes. The "Viva questions" section at the end of your brief is the rehearsal list.
