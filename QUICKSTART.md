# Quickstart

From a clean machine to the demo story running locally in about 15 minutes.

## 1. Prerequisites
| Tool | Version | Check |
|---|---|---|
| Node | **22 LTS** (Prisma 7 needs ≥ 20.19) | `node -v` |
| npm | 10+ | `npm -v` |
| PostgreSQL | 16+, local **or** a free cloud database (Neon/Supabase) | `psql --version` |
| Git | any | `git --version` |

Windows: use PowerShell or Git Bash, not `cmd`. If `node -v` shows 18, install 22 first.

## 2. Install
```bash
git clone <repo-url> abha-portal
cd abha-portal
npm install
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL`: your Postgres connection string
- `JWT_SECRET`: any 32+ character random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## 3. Database
```bash
npm run db:reset                 # drop, migrate, seed — safe to run any time
npm run db:studio                # optional: browse tables
```
Expected: `Seeded 5 institutions, 3 patients, 6 staff, 11 records, 1 pending lab order, 2 prescriptions (ASHA7K undispensed), 1 expired consent (Meera), 1 pending request (Arjun to Asha)`.

## 4. Run
```bash
npm run dev                      # http://localhost:3000
```

## 5. Log in
| As | Page | Credentials |
|---|---|---|
| Asha (patient) | `/login` | ABHA `91-1000-0000-0001` or `asha.verma@abdm`, OTP `123456` |
| Dr Kavya (doctor) | `/staff/login` | `kavya@citygen.test` / `Demo@1234` |
| Pharmacy | `/staff/login` | `counter@greencross.test` / `Demo@1234` |
| Lab | `/staff/login` | `desk@precision.test` / `Demo@1234` |
| Admin | `/staff/login` | `admin@portal.test` / `Demo@1234` |

Staff login sends each role to its own area (`/doctor`, `/pharmacy`, `/lab`, `/admin`). Use a second
browser profile for staff so the patient stays logged in. All personas: Master Plan Part 3.

## 6. Check
```bash
npm run check                    # typecheck + lint + tests; must pass before any PR
npm run test                     # just the tests (authorize matrix, consent, contracts)
```

## Stub mode (removed)
`DEV_FAKE_USER` was removed on 21 Nov 2026 once the login screens existed. Log in through `/login`
(patients, OTP `123456`) or `/staff/login`.

## Common failures
| Symptom | Cause | Fix |
|---|---|---|
| `PrismaClientInitializationError` / env var not found | Prisma 7 doesn't auto-load `.env` | Check `prisma.config.ts` imports `dotenv/config` |
| `too many clients already` | Prisma client recreated on hot reload | TRAPS §10 |
| Build error mentioning `server-only` or Prisma in a client bundle | Server code imported into a `'use client'` file | TRAPS §18 |
| Two OTP requests on one click | StrictMode double effect | TRAPS §13 |
| Upload fails above ~1 MB | Server Action body limit | TRAPS §12 |
| Styles not applying after editing Tailwind config | Dev server didn't reload config | Restart `npm run dev` |
