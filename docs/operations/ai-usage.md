# AI usage

**The code in this repo is written by hand.** We're learning React and Next.js, and each of us will
explain our code line by line in the viva. AI tools are allowed for three things: **debugging,
evaluating (reviewing) and learning**. Some of us won't use them at all, and that's fine. Nothing
in this project depends on them.

---

## 1. The rule
**You can explain every line you commit, without notes.** If you can't, it isn't done, whoever
or whatever wrote it.

What that means in practice:
- Don't paste generated code. If an AI (or Stack Overflow, or a tutorial) shows you a snippet,
  **close it and retype it yourself** from understanding. Retyping is where you notice what you
  don't understand.
- A fix of more than a few lines from an AI: ask it to explain the cause instead, then write the fix.
- Every PR says what AI was used for: `none` · `debugging` · `review` · `learning` (PR template).

The repo's root `CLAUDE.md` tells Claude Code to behave this way automatically: hints before
answers, small fixes, no whole features. Paste it into any other tool you use.

## 2. Where to get help, in order
1. **Your brief and [`TRAPS.md`](../TRAPS.md).** Most bugs in this project are already written down.
2. **Official docs**, topic by topic: [`../LEARNING.md`](../LEARNING.md).
3. **The domain owner** (Master Part 7). A question about `authorize()` goes to Harshita, about
   records, the doctor portal or lab to Vivek. Message them with the exact error.
4. **An AI tool**, in one of the three modes below.

The 45-minute rule still applies: stuck that long, message the other person.

---

## 3. Three modes, with prompts that work

Start any AI chat by pasting the root `CLAUDE.md` (Claude Code does this itself), then:

### Debug: "why does this fail?"
> I'm working on `<file>`. Here's the function, the input, and the exact error. Don't rewrite it;
> tell me what's causing this and what I should check.
>
> ```
> <function>
> <error text>
> ```

For an access problem, add: persona, URL, expected status/code, actual status/code.

### Evaluate: "is this right?"
> Review this against the rules in CLAUDE.md and docs/TRAPS.md. List problems only: what, where,
> why it matters. Don't rewrite it.
>
> ```
> <your code>
> ```

Good things to ask it to check: *Does every path call `authorize()`? Can this show an
out-of-scope record? What happens for a doctor with no consent? Is any user data cached?*

### Learn: "how does this work?"
> Explain `<concept>` with a small example that has nothing to do with my project. Then tell me
> which part of the official docs to read next.

Examples: *How does `useEffect` cleanup work with an interval?* · *What's the difference
between a Server Action and a Route Handler?* · *Why does React Query need a query key?* · *What
does `revalidatePath` actually invalidate?*

After you understand it, write your version and use **Evaluate** on it.

---

## 4. Answers to throw away
Even in review or debug mode, AI tools suggest things that break this project. Reject:
- `middleware.ts` (we're on Next.js 16: `proxy.ts`) or `prisma-client-js` (we're on Prisma 7)
- spreading a Prisma row into a response (`...record`)
- filtering by consent or scope inside a React component
- `"use cache"`, `revalidate` or `force-cache` on anything under `patient/` or `doctor/`
- storing a token in `localStorage`
- "just make it optional" / `z.any()` to get past a validation error

## 5. Before you commit, whoever wrote it
1. `npm run check` passes.
2. It works for the right persona.
3. **It fails correctly for the wrong persona, and for a doctor with no consent.**
4. The audit row is there.
5. You can explain it.
