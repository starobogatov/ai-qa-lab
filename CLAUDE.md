# ai-qa-lab

Playwright + TypeScript test suite for https://www.saucedemo.com, built with Playwright Test Agents (planner, generator, healer). See README.md for the full picture.

## Commands

- `npm test`: Chromium only (fast feedback, use this by default)
- `npm run test:all`: Chromium, Firefox and WebKit (run before calling a change done if it touches shared code)
- `npm run test:heal` / `npm run test:heal:strict`: runtime self-healing, see `tests/support/healing.ts`
- `npm run allure`: Allure report

## Code style

Write clean code that explains itself. If a reader needs a comment to understand *what* the code does, rename or restructure the code instead.

**Comments explain why, never what.** Only write a comment when the code cannot say it:
- a workaround or hack, and the reason for it
- a known app bug (`// BUG: ...` above `test.fail()`)
- a non-obvious constraint, e.g. a timeout, an app quirk, an ordering dependency

```ts
// ❌ narrates the code
// Click the login button
await loginPage.loginButton.click();

// ❌ placeholder noise
// starts here
// generate code here.

// ✅ explains a decision the code cannot express
// SauceDemo's session cookie expires 10 minutes after login, which a slow CI
// run can outlast. Re-save the cookies with a 2-hour expiry.
```

- Prefer `test.step('Add two items to the cart', ...)` over numbered `// 1. ...` comments. Steps show up in the HTML and Allure reports, while comments do not.
- Names carry the meaning: `checkout.fillInformation(...)`, not `fillForm2(...)`. No abbreviations except well-known ones (`url`, `id`).
- Small functions with one job. Extract a helper when a block needs a comment to explain what it does.
- No dead code, commented-out code, or unused imports.
- Match the surrounding style: 2-space indent, single quotes, trailing commas.

## Test conventions

- All selectors live in page objects in `tests/pages/`. Specs never use raw selectors.
- Locator priority: `getByRole` > `getByTestId` (SauceDemo uses `data-test`) > `getByPlaceholder` / `getByText` > CSS. Never XPath.
- Never use `waitForTimeout`. Rely on auto-waiting and web-first assertions (`await expect(...).toHaveText(...)`).
- Expected values come from the live app or the plan in `specs/`, never from what makes the test pass.
- A real app bug is never "fixed" in the test. Keep the correct assertion, mark it with `test.fail()` and add a `// BUG:` comment saying what actually happens.
- Each test is independent: no shared state, no ordering between tests. Logged-in sessions come from `auth.setup.ts` via `storageState`.

## Git

- Never commit, push or change anything on GitHub without asking first.
- Experiments go on their own branch, never straight on `master`.
