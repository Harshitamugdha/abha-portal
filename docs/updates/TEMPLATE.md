# UPDATE LOG — protocol and template
*Each person keeps `docs/updates/<yourname>.md`. **Newest entry at the TOP**, so whoever opens it
reads the current state first and can stop reading.*

## Why
- **A teammate can pick up your work** if you're ill or stuck, without a call.
- **You can pick it up yourself** after a weekend, by reading one entry.
- **It's your viva notes.** The *Learned* line in each entry is a record of what you understood
  and how. Read your log the night before the viva.

**Five minutes after each phase, written by you. Non-negotiable.**

## How to resume
Open your file, read the top entry, start from its **Next** line.

## Rules
- Newest first. Never delete or rewrite old entries.
- **The run command must be real and pasteable**, with the persona to log in as. If you can't
  paste it and have it work, the phase isn't done.
- **Access check is mandatory**: which wrong role / no-consent case you tried, and what happened.
- **Learned** is one honest line. "Nothing" is allowed. A copied definition isn't.
- **AI used** is one of `none` · `code` · `debugging` · `review` · `learning`, with a few words (D16).
- Open issues are for things genuinely unresolved. An empty list on a phase that had problems is
  a lie your future self pays for.
- Commit it with your code, same push.

---

# TEMPLATE — copy the block below

```markdown
## [YYYY-MM-DD HH:MM] Phase N — <short title>

**Done:** <2–3 sentences. What exists now that didn't before. Concrete.>

**Files touched:** `src/server/x/y.ts` (new) · `src/app/z/page.tsx` (modified)

**Run command:**
```bash
npm run dev
```
Log in as: <persona> → go to <URL> → <what you should see>

**Access check:** <wrong role / no consent / expired consent you tried → result (status + code)>

**Demo steps enabled:** <numbers from Master §2.1, or "none yet">

**Learned:** <one line: what you didn't know before this phase, or what surprised you>

**AI used:** <none | debugging: … | review: … | learning: …>

**Open issues:**
- <broken or unverified thing, and what you'd try next>
- <or: none>

**Next:** <the single next step>
```

---

# Worked example (Vivek, Phase 3)

```markdown
## [2026-11-20 21:15] Phase 3 — patient lookup + consent-required state

**Done:** `GET /api/v1/patients/lookup` accepts ABHA number (with or without hyphens) or address,
returns name + masked ABHA + Kavya's latest grant. Viewer branches on CONSENT_REQUIRED before
data; three states render from live API, not fixtures.

**Files touched:** `src/server/clinical/lookup.ts` (new) ·
`src/app/api/v1/patients/lookup/route.ts` (new) ·
`src/app/doctor/patients/[patientId]/viewer.tsx` (modified)

**Run command:**
```bash
npm run db:reset && npm run dev
```
Log in as: Dr Kavya → /doctor/patients → search `91-1000-0000-0001` → Asha, "Consent required"

**Access check:** as Asha (patient) → GET lookup → 403 FORBIDDEN, audit row DENIED/WRONG_ROLE.
As Kavya, viewer network tab: /records → 403 CONSENT_REQUIRED (not 200 []).

**Demo steps enabled:** 2

**Learned:** React Query puts a failed request in `error`, not `data`, so my
`if (!data?.items.length)` check was showing "No records" for a 403. Checking `error` first fixed it.

**AI used:** debugging: asked why the 403 showed as an empty list; it pointed at the order of my
checks, and I rewrote the branch myself.

**Open issues:**
- Lookup by ABHA address is case-sensitive: `Asha.Verma@abdm` misses. Lowercase in
  `parseAbhaInput`? That's Harshita's file, messaged her 21:10.

**Next:** consent request form against Harshita's `requestConsent` stub.
```
