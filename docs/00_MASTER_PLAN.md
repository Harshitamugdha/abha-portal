# ABHA PORTAL — MASTER PLAN v2
## INT257 (Next.js) project · Problem statement G4 · Team of two: Harshita, Vivek

> **v2 (15 Nov 2026) replaces v1.1.** Two changes drive everything in it: the React/Vite console
> app is gone (the project is **pure Next.js**, D20), and the team is now **two people** (D21).
> Madhav's and Ravuri's work is split between Harshita and Vivek, and the scope is cut to fit (Part 12).
>
> **This is the single source of truth** for scope, architecture, ownership, dependencies and
> decisions. If your brief conflicts with this file, this file wins. If this file conflicts with
> reality, tell the other person. Never improvise a schema or an endpoint.
>
> **How to use it.** Read Parts 1–5 once, fully. Keep Part 6 and [`CONTRACTS.md`](CONTRACTS.md)
> open while you code. Check Part 8 before you say you are blocked.
>
> **Work is organised in PHASES, not dates.** Finish a phase, log it in `docs/updates/<you>.md`,
> move on.
>
> **Start date:** _fill in_ · **Demo:** _fill in when the teacher confirms_

---

# PART 1 — WHAT WE ARE BUILDING

## 1.1 One sentence
A unified health-record portal: patients log in with their ABHA identity, and a doctor sees a
patient's records from every participating institution **only while the patient has granted
consent**.

## 1.2 The problem statement (verbatim)
> Build a unified health-record portal where patients authenticate using their ABHA identity and
> authorized doctors can securely access healthcare records from participating institutions.
> Implement separate access levels for patients, doctors, pharmacies, laboratories, and
> administrators.

## 1.3 What the statement actually demands
- **"authenticate using their ABHA identity"** means a 14-digit ABHA number or an ABHA address,
  verified by OTP. The real ABDM sandbox needs an approved application, so we build a **mock
  provider behind an adapter** that behaves like it (D1).
- **"authorized doctors"** means a doctor role is **not enough** to read a patient's records.
  Authorization is a doctor + patient + scope + time decision. That's **consent**, and it's what
  makes this more than a CRUD app.
- **"participating institutions"** means records are tagged by the hospital, lab or pharmacy that
  produced them, and the doctor's view **unifies** them. Institutions are rows in one database (D3).

## 1.4 The five roles
| Role | Logs in with | Sees | Never sees |
|---|---|---|---|
| Patient | ABHA number/address + OTP | All own records, own consents, who accessed what | Other patients |
| Doctor | Email + password (carries an HPR-style id) | Records of a patient **under an active consent**, filtered by its scopes; records they authored | Any patient without consent |
| Pharmacy | Email + password | One prescription, looked up by share code | Any other record |
| Laboratory | Email + password | Lab orders addressed to its institution; uploads results | Patient history |
| Admin | Email + password | Staff verification, institutions, the full audit log | **Any clinical data** |

## 1.5 The binding honesty rule
- **No real ABHA numbers, names or medical data, anywhere.** Seed data is fictional (Part 3).
- **"No records" and "not allowed to see records" look different.** A doctor without consent sees
  *"Consent required"*, never an empty timeline, which would be a false clinical statement.
- **Every access decision is logged, allowed and denied.**
- **The UI never decides who sees what.** The server decides (Part 5, rule 1).

---

# PART 2 — THE DEMO

## 2.1 One story, five roles
| # | Who | Does | Proves | Owner |
|---|---|---|---|---|
| 1 | Patient **Asha** | Logs in with ABHA number + OTP; sees records from **two** hospitals in one timeline | ABHA login, unified view | H (login) + V (timeline) |
| 2 | Dr **Kavya** (City General) | Searches Asha by ABHA number → sees **"Consent required"**, not an empty list | Role ≠ access | V |
| 3 | Dr Kavya | Requests consent: prescriptions + lab reports, 7 days, purpose "Follow-up" | Scoped, time-bound request | V (form) + H (engine) |
| 4 | Asha | Opens Consent Center, approves | Patient controls access | H |
| 5 | Dr Kavya | Sees prescriptions + lab reports from both hospitals, **grouped by institution**; does **not** see the excluded scope (documents) | Scope filtering, cross-institution | V |
| 6 | Dr Kavya | Writes a prescription and a lab order | Clinical write | V |
| 7 | Lab (Precision Diagnostics) | Sees the pending order, uploads the result PDF | Lab sees orders, not history | V |
| 8 | Pharmacy (Green Cross) | Enters the prescription's share code, marks it dispensed | Pharmacy sees one prescription only | H |
| 9 | Asha | Opens "Who viewed my records": Kavya's reads are there, with times | Audit visible to patient | H |
| 10 | Asha | Revokes consent → Dr Kavya's next view returns **"Consent required"** | Revocation is immediate | H + V |
| 11 | Admin | Sees the audit trail including the **denied** read; opens a record URL and is refused | Admin ≠ clinical access | H |

H = Harshita, V = Vivek. Steps 10 and 11 are the ones examiners remember. Rehearse them.

## 2.2 Screens (all in one Next.js app)
| Area | Screens | Owner |
|---|---|---|
| Public | Landing, institution directory (ISR) | Vivek |
| Auth | ABHA login, OTP, staff login (redirects by role) | Harshita |
| Patient | Dashboard, records timeline, record detail, upload | Vivek |
| Patient | Consent Center, "Who viewed my records" | Harshita |
| Doctor | Dashboard, patient search, unified viewer, request consent, prescription writer, lab order | Vivek |
| Lab | Pending orders, result upload | Vivek |
| Pharmacy | Share-code lookup, prescription + dispense | Harshita |
| Admin | Staff verification, audit log | Harshita |

---

# PART 3 — SEED DATA

All fictional. `npm run db:reset` must produce exactly this, every time, from nothing.

**Institutions**
| Id | Name | Type |
|---|---|---|
| `inst-citygen` | City General Hospital | HOSPITAL |
| `inst-sunrise` | Sunrise Multispeciality | HOSPITAL |
| `inst-lakeside` | Lakeside Community Health Centre | HOSPITAL |
| `inst-greencross` | Green Cross Pharmacy | PHARMACY |
| `inst-precision` | Precision Diagnostics Lab | LAB |

**People.** Dev OTP `123456` for every patient. Staff password `Demo@1234`.
| Persona | Role | Login | Notes |
|---|---|---|---|
| Asha Verma | Patient | ABHA `91-1000-0000-0001` · `asha.verma@abdm` | The demo patient. Records at City General **and** Sunrise |
| Rohan Mehta | Patient | ABHA `91-1000-0000-0002` | Records at Lakeside only; **no consent to anyone** |
| Meera Pillai | Patient | ABHA `91-1000-0000-0003` | Consent that **expired** yesterday (tests D9) |
| Dr Kavya Iyer | Doctor | `kavya@citygen.test` | City General, verified |
| Dr Arjun Rao | Doctor | `arjun@sunrise.test` | Sunrise, verified |
| Dr Neel Shah | Doctor | `neel@lakeside.test` | **Unverified** until admin verifies |
| Green Cross staff | Pharmacy | `counter@greencross.test` | |
| Precision staff | Lab | `desk@precision.test` | |
| Admin | Admin | `admin@portal.test` | |

Asha has at least 2 encounters, 2 prescriptions, 2 lab reports and 1 uploaded document across the
two hospitals, so scope filtering in step 5 is visible. **Encounters are seeded only**; there's no
form to create one (Part 12).

Seeded so neither of you waits for the other's write path:
- A **pending lab order** for Asha at Precision, ordered by Dr Arjun (Vivek's lab upload works
  before his own `createLabOrder` does).
- An **undispensed prescription** for Asha with share code `ASHA7K` (Harshita's pharmacy screens
  work before Vivek's `createPrescription` does).

ABHA numbers starting `91-1000-0000-` are our fake range. Never seed a number outside it.

---

# PART 4 — ARCHITECTURE

## 4.1 The rule that makes this safe
**Every read or write of patient data goes through one function, `authorize()`, and one audit
writer.** Pages, Route Handlers and Server Actions never query clinical tables directly. They call
a data function in `src/server/<domain>/`, which calls `authorize()` first.

## 4.2 One app: front end and back end in Next.js
```
Browser ── httpOnly cookie ──▶ Next.js 16 app
                                │
   proxy.ts ── logged in? right area for this role?          (coarse gate, no DB)
                                │
   Server Components (pages)  ·  Server Actions (form writes)  ·  Route Handlers (/api/v1, REST reads)
                                │
   src/server/<domain>/  ── data functions
        authorize(user, action, resource) ── RBAC + consent   (the real gate)
        audit.write() ── every decision, allowed and denied
                                │
        ┌───────────────────────┼───────────────────┐
   AbhaProvider            PostgreSQL           File storage
   (mock adapter)          via Prisma 7         (local dir in dev, blob store in prod)
```

**Which entry point when** (D22):
| Use | For |
|---|---|
| **Server Component** calls a data function directly | Pages that render data on the server (timeline, Consent Center, admin audit, pharmacy) |
| **Server Action** | Every form write: upload, request/approve/deny/revoke consent, prescribe, lab order, lab result, dispense, verify staff |
| **Route Handler** `/api/v1/*` | Auth (OTP, login, logout), reads from client components using React Query (doctor viewer), file downloads, the Edge health check |

## 4.3 Repo layout
```
abha-portal/                  one Next.js 16 app at the repo root (D20)
├─ prisma/                    schema.prisma, migrations, seed.ts                       H
├─ src/
│  ├─ proxy.ts                coarse session + role gate                               H
│  ├─ contracts/              Zod schemas + types + formatters, shared by server and client
│  ├─ components/ui/          shared Button, Card, Badge, EmptyState, ConsentRequired   both
│  ├─ app/
│  │  ├─ (public)/            landing, institution directory (ISR)                     V
│  │  ├─ (auth)/              ABHA login, OTP, staff login                             H
│  │  ├─ patient/             dashboard, records, upload                               V
│  │  │  ├─ consents/         Consent Center                                           H
│  │  │  └─ access-log/       who viewed my records                                    H
│  │  ├─ doctor/              dashboard, search, viewer, consent request, prescribe    V
│  │  ├─ lab/                 pending orders, result upload                            V
│  │  ├─ pharmacy/            share-code lookup, dispense                              H
│  │  ├─ admin/               staff verification, audit log                            H
│  │  └─ api/v1/              Route Handlers                                           both
│  └─ server/
│     ├─ auth/  consent/  audit/  pharmacy/  admin/  db.ts  http.ts                     H
│     └─ records/  clinical/  lab/                                                     V
└─ docs/
```

## 4.4 Consent, precisely
A doctor may read a record **if and only if**:
1. the doctor authored it, or
2. there's a `ConsentGrant` with `patientId` = the record's patient, `doctorId` = the doctor,
   `status = GRANTED`, `validFrom ≤ now < validTo`, and the record's `type` is in `scopes`.

Everything else is denied and logged. Expiry is evaluated **at read time** (D9).

---

# PART 5 — FROZEN CONVENTIONS

1. **All patient data goes through `authorize()`.** No `prisma.healthRecord`, `prisma.consentGrant`
   etc. outside `src/server/<domain>/`.
2. **`proxy.ts` is not security.** It redirects and keeps roles out of the wrong areas. No database
   lookups, no consent decisions (D6, TRAPS §1).
3. **Timestamps are UTC in the database and ISO 8601 with a trailing `Z` in the API**, shown in IST
   through **one** formatter, `formatIST()` in `src/contracts/format.ts`.
4. **ABHA number is stored as 14 digits, no hyphens**, displayed through `formatAbha()`. ABHA address
   is lowercase, `name@abdm`.
5. **One error shape**: `{ "error": { "code": "CONSENT_REQUIRED", "message": "…" } }` with a correct
   HTTP status (codes in [`CONTRACTS.md`](CONTRACTS.md) §1). Server Actions return the same `error`
   object instead of throwing to the client.
6. **`CONSENT_REQUIRED` ≠ empty list.**
7. **No tokens in `localStorage` or `sessionStorage`.** The session is an httpOnly cookie, nothing else.
8. **Every input and response is validated with the Zod schema from `src/contracts/`**, on the
   server always and on the client for forms.
9. **Node 22 LTS. Pinned dependencies.** A new one is pinned, justified in the PR, and agreed by both.
10. **Mock data only.** ABHA numbers in the `91-1000-0000-` range.

---

# PART 6 — THE FROZEN CONTRACTS

Full contract in [`CONTRACTS.md`](CONTRACTS.md). The executable copy is `src/contracts/`: each of
you writes the schemas for your own domain by hand (D18).

Frozen: §1 error shape + codes · §2 data model · §3 `authorize()` + policy matrix · §4 entry points
· §5 session shape.

**Changing a contract:** a PR that touches only `src/contracts/` + `CONTRACTS.md` (+ `prisma/` if the
DB changes), approved by the other person before any code uses it.

---

# PART 7 — OWNERSHIP

Each of you owns backend **and** frontend for your area (D21).

| | **Harshita**: access + staff side | **Vivek**: records + clinical side |
|---|---|---|
| **Backend** | Mock ABHA OTP (`AbhaProvider`), sessions, staff login, `proxy.ts`, **`authorize()`** + policy tests, consent engine, audit writer + queries, Prisma schema + seed, shared contracts, pharmacy (lookup, dispense), admin (staff verify, audit query), Edge health route | Records list/detail, uploads, file serving, patient lookup, cross-institution summary, prescriptions (+ share code), lab orders, lab result upload |
| **Frontend** | ABHA login + OTP, staff login, Consent Center, access log, pharmacy screens, admin screens | Patient dashboard + timeline + record detail + upload, doctor dashboard + search + viewer + consent request + prescription writer + lab order, lab screens, public pages |
| **Also** | Deployment, `_INTEGRATION.md`, merges | — |
| **Inherited from** | Ravuri (pharmacy, admin, health route, deploy) | Madhav (whole doctor portal), plus his own records/patient/lab work |
| **Demo steps** | 1 (login), 3 (engine), 4, 8, 9, 10, 11 | 1 (timeline), 2, 3 (form), 5, 6, 7, 10 (viewer) |

**Why this split:** Harshita's side is the hardest logic (everything depends on `authorize()` and
consent) plus the narrow staff screens. Vivek's side is the most screens, but they all sit on one
data path (records), so one person owns the doctor viewer from query to UI. Nobody edits the other's
page to finish their own feature.

Briefs: [`team/harshita.md`](team/harshita.md) · [`team/vivek.md`](team/vivek.md).

---

# PART 8 — WHO WAITS ON WHOM

## 8.1 Blocked on nobody, from day 1
- **Harshita:** repo + Next.js app, Prisma schema + seed, shared contracts, `getSession()` +
  `authorize()` **stubs**
- **Vivek:** patient and doctor UI shells against fixture JSON, timeline and viewer components,
  his own contract files

## 8.2 The real dependencies
```
Harshita: schema + shared contracts + auth stubs  (END OF DAY 2)
   └──▶ Vivek: records, lookup, clinical data functions against real tables

Harshita: consent engine (real)  ──▶ Vivek: consent request form + viewer's "Consent required" state
Vivek: createPrescription        ──▶ Harshita: pharmacy works on any new prescription (seeded ASHA7K until then)
Vivek: createLabOrder            ──▶ Vivek: lab upload works on new orders (seeded order until then)
Harshita: audit writer           ──▶ Harshita: access log + admin audit
```

## 8.3 Stub first
By the end of day 2 Harshita merges:
- `getSession()` returning a seeded user picked by `DEV_FAKE_USER=asha|kavya|arjun|lab|pharmacy|admin`
- `authorize()` that **allows everything and still writes the audit row**
- the final Prisma schema, migrated, seeded
- `src/contracts/shared.ts` + `format.ts`

Vivek builds against those. When the real `authorize()` lands (Harshita Phase 3), Vivek's code
doesn't change. **If either of you is about to wait for real auth, re-read this section.**

## 8.4 The integration gate
A feature is "done" only when:
1. **`npm run check` passes** (typecheck + lint + contract tests + `authorize()` policy tests), and
2. **Access gate:** the demo steps it touches work with the **real** `authorize()` as the right role,
   **and** fail correctly as a wrong role and as a doctor without consent.

---

# PART 9 — DECISION LOG

Settled. Superseded rows are kept, struck through by a later decision, so the history stays honest.

| # | Decision | Reason |
|---|---|---|
| D1 | **Mock ABHA provider behind an `AbhaProvider` interface** | ABDM sandbox access needs an approved application with unpredictable timing. The interface keeps a real one swappable. Teacher informed. |
| D2 | ~~Two apps: Next.js web + Vite console~~ **Superseded by D20** | |
| D3 | **Institutions simulated in one database** | Real federation (HIP/HIU, consent manager) is out of scope. |
| D4 | **Consent is per doctor, scoped by record type, time-bound** | The minimum that makes "authorized doctors" meaningful and demoable. |
| D5 | **A doctor can always read records they authored** | Otherwise they can't see their own prescription once consent lapses. |
| D6 | **`proxy.ts` is a coarse gate; `authorize()` is the security boundary** | Proxy stays fast (no DB). Middleware-only auth has a public bypass history (CVE-2025-29927). |
| D7 | ~~Console token in memory only~~ **Superseded by D20**: cookie sessions only | |
| D8 | **Staff log in with email + password; patients with ABHA + OTP** | The statement says *patients* authenticate with ABHA. Passwords via `bcryptjs` (D19). |
| D9 | **Consent expiry evaluated at read time; no cron** | A missed cron run leaves access open. `EXPIRED` is a derived display status. |
| D10 | **Denied reads: `403 CONSENT_REQUIRED` to doctors, `404` to everyone else** | Doctors learn they can request consent; others learn nothing about what exists. |
| D11 | **Pharmacy finds a prescription by a 6-character share code** | Mirrors real practice; pharmacies never get a patient search. Valid until dispensed or 30 days. |
| D12 | **Audit rows for allowed *and* denied decisions** | The denied row proves the system works (step 11). |
| D13 | ~~Zustand for console state~~ **Superseded by D20** | No console. Client state is local `useState`; server state is React Query or Server Components. |
| D14 | **PostgreSQL + Prisma 7** | Prisma 7 needs `prisma.config.ts`, an explicit generator `output`, and `@prisma/adapter-pg`. |
| D15 | ~~npm workspaces~~ **Superseded by D20**: single app, no workspaces | |
| D16 | **Code written by hand; AI only for debugging, review and learning** | We explain every line in the viva. [`operations/ai-usage.md`](operations/ai-usage.md). |
| D17 | **Offset pagination (`page`, `pageSize`, `total`)** | Simple to write by hand, fine at demo scale. |
| D18 | **Each person writes their own domain's Zod schemas in `src/contracts/`; Harshita writes the shared ones; each reviews the other's** | You learn Zod by writing real shapes. (Amended for two people.) |
| D19 | **`bcryptjs` for staff passwords** | Pure JavaScript, installs identically on every laptop. |
| D20 | **Pure Next.js: one app at the repo root; React/Vite console removed (Nov 2026)** | INT252 is now a separate solo project. Pharmacy, lab and admin become route groups in the same app, behind the same `authorize()`. Removes bearer tokens, CORS and a second deploy. |
| D21 | **Team of two. Harshita: access + staff side. Vivek: records + clinical side** | Madhav's and Ravuri's work split by data path, so no page has two owners (Part 7). |
| D22 | **Server Components read, Server Actions write, Route Handlers for auth + client-side reads + files** | One rule for where code goes, and it still covers the INT257 Route Handler practical (Part 4.2). |

---

# PART 10 — SYLLABUS COVERAGE

Every INT257 practical maps to a real feature and an owner:
[`evaluation/syllabus-coverage.md`](evaluation/syllabus-coverage.md). INT252 is no longer covered
by this project (D20).

---

# PART 11 — RULES

1. **Stub first.** First commit renders/returns the right shape with fake data.
2. **Every handover includes one pasteable command** and the demo step it enables.
3. **45-minute rule.** Stuck that long on tooling, auth or deploy? Message the other person with what
   you tried, the exact error and a minimal repro.
4. **Branch per person, PR to `main`, the other person reviews.** Harshita merges.
5. **Log after every phase** in `docs/updates/<you>.md` ([template](updates/TEMPLATE.md)).
6. **Fix the cause, not the symptom.** Never hand-edit seed data or a response to make a screen work.
7. **You can explain every line you commit** (D16).
8. **Read before you write.** Reading list per phase: [`LEARNING.md`](LEARNING.md).

---

# PART 12 — CUT LINE (re-cut for two people)

Half the team means this list matters more than anything else in the plan. **When behind, cut from
the bottom, never the top**, and log the cut in `updates/_INTEGRATION.md`.

| Priority | What | Owner |
|---|---|---|
| **Must** | Demo steps 1–11 (Part 2.1) with real `authorize()` | both |
| **Must** | Every row in [`evaluation/syllabus-coverage.md`](evaluation/syllabus-coverage.md) | both |
| **Must** | `authorize()` policy-matrix tests | H |
| **Must** | Staff verification (Dr Neel) + audit view with an ALLOWED/DENIED filter | H |
| **Should** | Intercepting-route record modal, parallel-route doctor dashboard | V |
| **Should** | Optimistic prescription with rollback | V |
| **Should** | Edge health route, access-log display of denied attempts, audit filters beyond outcome | H |
| **Could** | OTP rate limiting, duplicate-request handling in consent | H |
| **Could** | Institution create/edit in admin (seeded and read-only until then) | H |
| **Could** | Encounter create form (seeded until then) | V |
| **Could** | Lighthouse pass, GitHub Actions CI, Hindi/English toggle | either |

**Removed entirely:** the console app, bearer tokens, CORS, React Router, Vite, Zustand, Axios.

If a **Must** is at risk, say so the same day.

---

# PART 13 — OPEN ITEMS

- [ ] Fill start and demo dates in the header.
- [ ] Hosting: Vercel (app) + Neon or Supabase (Postgres). Harshita confirms in her Phase 0.
- [ ] Tell the INT257 teacher that the team is now two people and the console is gone (D20, D21).

## Deliberately not building
Real ABDM integration · real HPR/HFR registries · FHIR bundles · emergency "break-glass" access ·
e-signatures · SMS/email delivery · mobile app · a separate React app (D20) · the ADK/MCP agent work
(separate personal project).

---

# PART 14 — GLOSSARY

| Term | Meaning |
|---|---|
| **ABHA** | Ayushman Bharat Health Account: 14-digit health id (`XX-XXXX-XXXX-XXXX`) + ABHA address (`name@abdm`) |
| **ABDM** | Ayushman Bharat Digital Mission, which issues ABHA |
| **HPR** | Healthcare Professionals Registry. Ours is a seeded field |
| **Consent grant** | Patient → doctor permission: which record types, from when to when, for what purpose |
| **Scope** | A record type a consent covers: `ENCOUNTER`, `PRESCRIPTION`, `LAB_REPORT`, `DOCUMENT` |
| **Share code** | 6-character code on a prescription that a pharmacy uses to look it up |
| **Audit row** | One logged access decision: who, what, which patient, allowed/denied, when |
| **Proxy** | Next.js 16's `proxy.ts` (formerly `middleware.ts`), runs before routing |
| **Server Action** | A server function called from a form; a public HTTP endpoint underneath (TRAPS §2) |
