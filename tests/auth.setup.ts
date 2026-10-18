import { test as setup, expect } from '@playwright/test';
import { AUTH_USERS, PASSWORD, authFile } from './support/auth';
import { LoginPage } from './pages/LoginPage';

const SESSION_TTL_SECONDS = 2 * 60 * 60;

for (const user of AUTH_USERS) {
  setup(`authenticate as ${user}`, async ({ page }) => {
    // performance_glitch_user is deliberately slow to log in
    setup.slow(user === 'performance_glitch_user');

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user, PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/, { timeout: 30_000 });

    // SauceDemo's session cookie expires 10 minutes after login, which a slow CI
    // run can outlast. Re-save the cookies with a 2-hour expiry.
    const context = page.context();
    const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const cookies = await context.cookies();
    await context.addCookies(cookies.map((cookie) => ({ ...cookie, expires })));

    await context.storageState({ path: authFile(user) });
  });
}
