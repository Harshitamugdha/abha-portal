# The team

**Team:** Harshita, Vivek, Madhav, Ravuri. **Build owners:** Harshita and Vivek, one Next.js app,
each owning backend **and** frontend for their area (Master D21). Since v2 (15 Nov 2026), the doctor
portal planned for Madhav is Vivek's, and the pharmacy, admin and deployment planned for Ravuri are
Harshita's. Full scope, nothing cut (Master Part 12).

Check Master Part 8 before saying you're blocked: seeded rows and stubs cover most of what looks
like a dependency.

---

## Who owns what

| Person | Owns | Brief | Work log |
|---|---|---|---|
| **Harshita** | Access + staff side: mock ABHA, sessions, `proxy.ts`, **`authorize()`**, consent engine, audit, Prisma schema + seed, shared contracts; login, Consent Center, access log, pharmacy, admin; deployment | [`harshita.md`](harshita.md) | [`../updates/harshita.md`](../updates/harshita.md) · [`../updates/_INTEGRATION.md`](../updates/_INTEGRATION.md) |
| **Vivek** | Records + clinical side: records API, uploads, files, patient portal, doctor portal (lookup, viewer, consent request form, prescriptions, lab orders), lab, public pages | [`vivek.md`](vivek.md) | [`../updates/vivek.md`](../updates/vivek.md) |

## Where your code is

| | `src/app/` | `src/server/` | `src/contracts/` | Other |
|---|---|---|---|---|
| **Harshita** | `(auth)/`, `patient/consents/`, `patient/access-log/`, `pharmacy/`, `admin/`, `api/v1/auth/`, `api/v1/consents/`, `api/v1/health/` | `auth/`, `consent/`, `audit/`, `pharmacy/`, `admin/`, `db.ts`, `http.ts` | `shared`, `format`, `auth`, `consent`, `audit`, `pharmacy`, `admin` | `prisma/`, `src/proxy.ts`, deploy |
| **Vivek** | `(public)/`, `patient/` (rest), `doctor/`, `lab/`, `api/v1/patients/`, `api/v1/records/`, `api/v1/files/` | `records/`, `clinical/`, `lab/` | `records`, `clinical`, `lab` | — |

`src/components/ui/` is shared; whoever adds a component tells the other.

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
| 8 Pharmacy dispenses | Harshita |
| 9 Asha sees access log | Harshita |
| 10 Revoke → consent required again | Harshita + Vivek |
| 11 Admin sees denied read, can't open record | Harshita |

## Working as the two builders
- **Review each other's PRs.** Harshita merges.
- **Contracts:** each writes their own schemas in `src/contracts/`; the other reviews before use.
- **One seam to watch:** the consent request form (Vivek) calls `requestConsent` (Harshita). Agree the
  `ConsentRequest` schema on day 1.
- **A short daily message:** what you finished, what's next, what's blocking. Two lines is enough.

## Keeping a log
After each phase, append to your file in [`../updates/`](../updates/) using
[`../updates/TEMPLATE.md`](../updates/TEMPLATE.md), newest entry at the top. Before you start a
session, read your top entry: it ends with **Next**, and that's where you start.

## Learning and AI
AI writes the code (D16); you review it and can explain it. Before each phase, read its section in
[`../LEARNING.md`](../LEARNING.md) so you can. Every commit is made by hand, never by an AI agent.
