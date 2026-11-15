# Demo runbook

How to run the demo, and what to do when something breaks in front of the examiner.

## 1. The night before
- [ ] `main` deployed; the URL opens on a phone (different network from the laptop)
- [ ] Production database re-seeded: `npm run db:reset` against the prod `DATABASE_URL` (Harshita)
- [ ] Every persona logs in on the deployed build
- [ ] Section 3 checks pass on the deployed build
- [ ] Local fallback works: `npm run db:reset && npm run dev` on the demo laptop, **with wifi off**
      after install (local Postgres, or a pre-seeded Docker container)
- [ ] Two browser profiles ready: **A** = patient side (web), **B** = staff side (doctor, lab, pharmacy, admin: log out and in between roles).
      Separate profiles = separate cookies. Same profile = you log Asha out when you log Kavya in.

## 2. The click path (Master §2.1)
| # | Profile | Do | Say (one line) |
|---|---|---|---|
| 1 | A | `/login` → `91-1000-0000-0001` → OTP `123456` → Records | "Asha's records from two hospitals in one timeline." |
| 2 | B | Doctor login Kavya → search `91-1000-0000-0001` | "Kavya is a verified doctor, and she still can't see anything." |
| 3 | B | Request access: Prescriptions + Lab reports, 7 days, "Follow-up" | "Access is per doctor, per record type, time-limited." |
| 4 | A | Consents → Waiting → Approve | "Asha decides." |
| 5 | B | Viewer refreshes on focus → grouped by institution; no Documents | "Only what she consented to, from every institution." |
| 6 | B | Prescribe (2 drugs) → share code shown; Lab order → Precision | "Writes go through the same check." |
| 7 | B | Lab login → order → upload PDF | "The lab sees the order, not her history." |
| 8 | B | Pharmacy login → share code → Dispense | "The pharmacy sees one prescription, and only her name." |
| 9 | A | Access log | "Asha sees every read of her data." |
| 10 | A → B | Revoke → Kavya refreshes → *Consent required* | "Revocation is immediate. There's no job to wait for." |
| 11 | B | Admin → Audit, filter DENIED → Kavya's refused read; paste a record API URL → 404 | "The admin runs the system and still can't read records." |

Target: 6 minutes. Rehearse with a timer at least twice.

## 3. Seven checks (run on the deployed build before every demo)
1. Kavya, no consent, Asha's records → **403 CONSENT_REQUIRED** in the network tab (not 200 `[]`).
2. Meera's expired consent → refused.
3. Partial scope → out-of-scope records **absent from the response**, not just hidden.
4. Patient visiting `/doctor` → redirected; patient calling a doctor API → 403.
5. Admin calling `/api/v1/records/<id>` → 404.
6. Pharmacy with a wrong share code → 404; same code twice → 409 on second dispense.
7. Logged-out request to `/api/v1/files/<id>` → 401.

## 4. When something breaks
| Symptom | First move |
|---|---|
| Deployed site down / DB unreachable | Switch to the local fallback (§1). Don't debug live. |
| Login loops back to `/login` | Cookie not set: check you're on HTTPS in prod (Secure cookie); check `JWT_SECRET` set in prod |
| Doctor sees records with no consent | **Stop the demo.** Say so. That's a real access bug, and pretending it isn't is worse. |
| Viewer didn't update after approve | Click into the window (refetch on focus) or reload: data is never cached, so a reload is honest |
| Seed state wrong mid-demo | `npm run db:reset` (local) / the prod reseed script (Harshita). 20 seconds. |

## 5. After the demo
Log what broke in [`../updates/_INTEGRATION.md`](../updates/_INTEGRATION.md), even if you recovered.
