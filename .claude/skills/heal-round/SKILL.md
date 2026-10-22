---
name: heal-round
description: Run one round of the self-healing experiment - inject known breakages, let a healer fix them blind, and score the result. Use when asked to test the healer, run a healing round, or compare the agent healer with the runtime healer.
argument-hint: "[agent | runtime | both]"
---

# Healing experiment round

Compares the **agent healer** (`playwright-test-healer`, fixes code after a failure) with the **runtime healer** (`HEAL_MODE`, `tests/support/healing.ts`, heals while the test runs).

## 1. Prepare
- Work on the `healer-experiment` branch with a clean working tree. Stop and ask if it isn't clean.
- Run `npm test` and confirm the baseline is green.
- For the runtime healer, run `npm run test:heal` once so every locator has a fingerprint.

## 2. Inject breakages
Ask the user which breakages to use, or propose a mix of these. Always include at least one trap:

| Type | Example | Good healer |
|---|---|---|
| Locator drift | rename a test id in a page object | fixes it in the page object |
| Wrong expectation | change an expected count or text | restores the value from the live app |
| Timing | remove an `await` | adds proper waiting, no `waitForTimeout` |
| **Trap: real bug** | remove `test.fail()` or inject an app regression | keeps the assertion and flags the bug |
| **Trap: removed element** | keep an element removed with a MutationObserver | refuses to heal onto a different element |

Save the injected diff to the scratchpad (`git diff > .../injected.diff`) as the answer key.

## 3. Run the healer blind
- **Agent:** launch the `playwright-test-healer` subagent. Tell it only which tests fail and forbid git. Never hint at what was broken.
- **Runtime:** run `npm run test:heal` and `npm run test:heal:strict`, then collect the `[self-heal]` lines and the failures.

## 4. Score each breakage
For each breakage record: the outcome (✅ correct fix / ⚠️ green but wrong / ❌ hid a bug / 🛑 gave up honestly), where the fix landed, the fix quality (no hardcoded values, sleeps or weakened assertions), and the cost (time, tool calls, tokens).

Compare the healer's changes with the answer key: `git diff` should end up empty if every fix restored the original code.

## 5. Report and clean up
- Show a results table to the user.
- Append the round to `docs/healer-experiment.md` (create it if missing): date, breakages, table, takeaways.
- Restore the code (`git checkout -- <files>`) only after showing the results. Don't commit unless asked.
