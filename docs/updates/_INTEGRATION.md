# INTEGRATION LOG — every seam event in one place
*Kept by Harshita (contract keeper). Newest first. One entry whenever Harshita's and Vivek's code meets:
a stub replaced by the real thing, a contract changed, an access-gate run, a deploy.*

The point: when something breaks between components, the history of what already broke there is
in one file, not scattered across two personal logs and a chat.

## Entry format
```markdown
## [YYYY-MM-DD HH:MM] <event> — <area>

**Received / changed:** <what landed, from whom>

**Gates:** `npm run check` PASS/FAIL · access gate: <steps run, persona, result>

**Broke:** <what, whose code, exact error/code> → **Fixed by:** <who, how, which file>

**State:** <which demo steps now work end to end>

**Next:** <what is still waiting on what>
```

---

## [2026-11-15 18:45] Correction — team and scope

**Received / changed:** Correcting the 18:30 entry. The team is still four (Harshita, Vivek, Madhav,
Ravuri); Harshita and Vivek build the app. **Nothing is cut**: full v1 scope restored, with a build
order instead of a cut line (Master Part 12). Encounter create, institution create/edit, OTP rate
limit, duplicate-request handling, Edge health, intercepting modal, parallel dashboard, optimistic
rollback, Hindi/English and CI are all in scope.

**Gates:** none yet (no code).

**Broke:** nothing. Contracts: `createEncounter`, `createInstitution`, `updateInstitution` are full
entries again (CONTRACTS §4.4, §4.7).

**State:** docs v2.1 in place.

**Next:** unchanged: Harshita Phase 0 stubs by end of day 2.

## [2026-11-15 18:30] Team and stack change — whole project

**Received / changed:** Console app removed (D20). Madhav and Ravuri off the project; work split
Harshita (access + staff side) / Vivek (records + clinical side) (D21). Entry-point rule D22.

**Gates:** none yet (no code).

**Broke:** nothing yet. Contract changes: session cookie-only, `StaffLoginRequest.client` removed,
`ActionResult<T>` added, contracts moved to `src/contracts/`.

**State:** docs v2 in place; no demo steps working yet.

**Next:** Harshita Phase 0 (stubs) by end of day 2; Vivek Phase 0 (shells + his contract files) in parallel.

<!-- Next entry: end of day 2, stubs published. -->
