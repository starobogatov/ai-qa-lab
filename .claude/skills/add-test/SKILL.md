---
name: add-test
description: Add or update a Playwright test for SauceDemo following this project's conventions. Use when asked to write a new test, cover a scenario from a plan in specs/, or turn a found bug into a test.
---

# Add a test

1. **Find the scenario.** Look for it in `specs/*.plan.md`. If it isn't there, add it to the right section of the plan first, in the same format (steps with `expect:` lines). If it describes a real defect, tag it `[KNOWN ISSUE]`.
2. **Check the live app** with the Playwright MCP browser tools before writing any expected value. Never guess texts, counts or prices.
3. **Pick the spec file** by feature (`login.spec.ts`, `cart.spec.ts`, `checkout.spec.ts`, `checkout-validation.spec.ts`, `user-defects.spec.ts`). Only create a new file for a new feature area.
4. **Reuse page objects** in `tests/pages/`. If a locator or action is missing, add it to the page object (wrapped in `healable(...)` like the others), not to the spec.
5. **Write the test:**
   - test title states the expected behaviour: `'Cart persists across reload'`
   - plan steps become `test.step('...', async () => { ... })`
   - web-first assertions only, no `waitForTimeout`
   - logged out tests use `test.use({ storageState: LOGGED_OUT })`; other users use `authFile(user)`
6. **Known bug?** Keep the correct assertion and add `test.fail()` with a `// BUG:` comment saying what actually happens.
7. **Run it** with `npx playwright test <file> --project=chromium`, then `--repeat-each=3` to catch flakiness. If shared code changed, run `npm run test:all`.
8. **Report** what was added, the run result, and any plan changes. Don't commit unless asked.
