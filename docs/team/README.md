# The team

**Team:** Harshita, Vivek, Madhav, Ravuri. **Builders:** Harshita, Vivek and Ravuri, one Next.js
app, each owning backend **and** frontend for their area (Master D21, D23). Since v3 (21 Nov 2026),
Ravuri builds pharmacy, admin, deployment and CI again; the doctor portal planned for Madhav stays
with Vivek. Full scope, nothing cut (Master Part 12).

Check Master Part 8 before saying you're blocked: seeded rows and the real `authorize()` cover most
of what looks like a dependency.

---

## Who owns what

| Person | Owns | Brief | Work log |
|---|---|---|---|
| **Harshita** | Identity + access: mock ABHA, sessions, staff login + registration, `proxy.ts`, **`authorize()`**, consent engine, audit, Prisma schema + seed, shared contracts + contract review; login screens, Consent Center, access log; integration | [`harshita.md`](harshita.md) | [`../updates/harshita.md`](../updates/harshita.md) · [`../updates/_INTEGRATION.md`](../updates/_INTEGRATION.md) |
| **Vivek** | Records + clinical: records API, uploads, files, patient portal, doctor portal (lookup, viewer, consent request form, encounters, prescriptions, lab orders), lab, public pages | [`vivek.md`](vivek.md) | [`../updates/vivek.md`](../updates/vivek.md) |
| **Ravuri** | Staff side + platform: pharmacy, admin (staff verification, audit log, institutions), Edge health route, `logError`, deployment (Vercel + Neon), CI | [`ravuri.md`](ravuri.md) | [`../updates/ravuri.md`](../updates/ravuri.md) |

## Where your code is

| | `src/app/` | `src/server/` | `src/contracts/` | Other |
|---|---|---|---|---|
| **Harshita** | `(auth)/`, `patient/consents/`, `patient/access-log/`, `api/v1/auth/`, `api/v1/consents/` | `auth/`, `consent/`, `audit/`, `db.ts`, `http.ts` | `shared`, `format`, `auth`, `consent`, `audit` | `prisma/`, `src/proxy.ts` |
| **Vivek** | `(public)/`, `patient/` (rest), `doctor/`, `lab/`, `api/v1/patients/`, `api/v1/records/`, `api/v1/files/` | `records/`, `clinical/`, `lab/` | `records`, `clinical`, `lab` | — |
| **Ravuri** | `pharmacy/`, `admin/`, `api/v1/health/` | `pharmacy/`, `admin/`, `log.ts` | `pharmacy`, `admin` | `.github/workflows/`, Vercel + Neon |

`src/components/ui/` is shared; whoever adds a component tells the others.

## Demo steps by owner (Master §2.1)
| Step | Owner |
|---|---|
| 1 Asha logs in, unified timeline | Harshita (login) + Vivek (timeline) |
| 2 Kavya finds Asha → consent required | Vivek |
| 3 Kavya requests consent | Vivek (form) + Harshita (engine) |
| 4 Asha approves | Harshita |
| 5 Kavya sees scoped records by institution | Vivek |
| 6 Prescription + lab order | Vivek |
| 7 Lab uploads result | Vivek |
| 8 Pharmacy dispenses | Ravuri |
| 9 Asha sees access log | Harshita |
| 10 Revoke → consent required again | Harshita + Vivek |
| 11 Admin sees denied read, can't open record | Ravuri (+ Harshita's audit) |

## Working as three builders
- **Another builder reviews each PR.** Harshita merges and reviews every contract change.
- **Contracts:** each writes their own schemas in `src/contracts/`; Harshita reviews before use.
- **Seams to watch:**
  - Vivek's consent request form calls Harshita's `requestConsent`.
  - Ravuri's pharmacy reads prescriptions Vivek's `createPrescription` writes (share code format).
  - Ravuri's admin audit reads the rows Harshita's `authorize()` writes; Ravuri's staff verification
    is the other half of Harshita's staff registration.
  - Ravuri's `logError` hooks into Harshita's `http.ts` wrappers.
- **A short daily message:** what you finished, what's next, what's blocking. Two lines is enough.

## Keeping a log
After each phase, append to your file in [`../updates/`](../updates/) using
[`../updates/TEMPLATE.md`](../updates/TEMPLATE.md), newest entry at the top. Before you start a
session, read your top entry: it ends with **Next**, and that's where you start.

## Learning and AI
AI writes the code (D16); you review it and can explain it. Before each phase, read its section in
[`../LEARNING.md`](../LEARNING.md) so you can. Every commit is made by hand, never by an AI agent.
