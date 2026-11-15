## What this changes

<!-- One paragraph. What a user can do after this merges, and which demo step (Master §2.1) it enables. -->

Demo step(s):

## Run command

<!-- One pasteable command, plus the persona to log in as. -->

```bash

```
Log in as:

## Checklist

- [ ] `npm run check` passes
- [ ] Every new data read/write goes through a `src/server/<domain>/` function that calls `authorize()`
- [ ] New Server Actions start with `requireSession()` + `authorize()` and validate input with Zod
- [ ] Tested as the right role **and** as a wrong role; tested as a doctor **without** consent
- [ ] `CONSENT_REQUIRED` renders as "Consent required", not as an empty list
- [ ] No per-user data on a cached/static page
- [ ] Responses are built from an explicit `select` (no Prisma row spread into JSON)
- [ ] `DEV_FAKE_USER` not relied on
- [ ] Timestamps UTC/`Z` in the API, `formatIST()` on screen
- [ ] Any new dependency is pinned, justified below, and announced in the group
- [ ] `docs/updates/<yourname>.md` has an entry for this phase
- [ ] Only seed data in code, tests and screenshots
- [ ] **I can explain every line in this PR without notes** (D16)

## AI used

<!-- none | debugging: … | review: … | learning: …   (Master D16, docs/operations/ai-usage.md) -->

none

## Contract changes

<!-- Changes anything in src/contracts/ or prisma/schema.prisma? Name the shape, who consumes it,
     and tag them. If none, write "none". -->

none

## New dependencies

none
