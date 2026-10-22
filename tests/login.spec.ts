// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LOGIN_ERRORS, LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { LOGGED_OUT, PASSWORD } from './support/auth';
import { PRODUCTS } from './support/data';

// The only spec that logs in through the UI; every test starts logged out.
test.use({ storageState: LOGGED_OUT });

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Valid login with standard_user', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login form is visible', async () => {
      await expect(loginPage.username).toBeVisible();
      await expect(loginPage.password).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });

    await test.step('Log in with valid credentials', async () => {
      await loginPage.login('standard_user', PASSWORD);
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.title).toHaveText('Products');
      await expect(inventory.items).toHaveCount(6);
      await expect(inventory.cartBadge).toBeHidden();
    });
  });

  test('Login by pressing Enter in password field', async ({ page }) => {
    await loginPage.username.fill('standard_user');
    await loginPage.password.fill(PASSWORD);
    await loginPage.password.press('Enter');
    await expect(page).toHaveURL(InventoryPage.url);
  });

  test('Both fields empty', async ({ page }) => {
    await loginPage.loginButton.click();
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.usernameRequired);
    await expect(page).toHaveURL(LoginPage.url);
  });

  test('Empty username, valid password', async () => {
    await loginPage.login('', PASSWORD);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.usernameRequired);
  });

  test('Valid username, empty password', async () => {
    await loginPage.login('standard_user', '');
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.passwordRequired);
  });

  test('Wrong password', async ({ page }) => {
    await loginPage.login('standard_user', 'wrong_pass');
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.noMatch);
    await expect(page).toHaveURL(LoginPage.url);
  });

  test('Unknown username', async () => {
    await loginPage.login('no_such_user', PASSWORD);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.noMatch);
  });

  test('Username is case-sensitive', async ({ page }) => {
    await loginPage.login('Standard_User', PASSWORD);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.noMatch);
    await expect(page).toHaveURL(LoginPage.url);
  });

  test('Locked out user cannot log in', async ({ page }) => {
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.lockedOut);
    await expect(page).toHaveURL(LoginPage.url);
  });

  test('Dismiss error message', async () => {
    await test.step('Trigger an error', async () => {
      await loginPage.loginButton.click();
      await expect(loginPage.error).toBeVisible();
      await expect(loginPage.errorCloseButton).toBeVisible();
    });

    await test.step('Close the error', async () => {
      await loginPage.errorCloseButton.click();
      await expect(loginPage.error).toBeHidden();
    });
  });

  test('Inventory is protected without login', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(LoginPage.url);
    await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired('/inventory.html'));
  });

  for (const path of ['/cart.html', '/checkout-step-one.html', '/checkout-step-two.html', '/checkout-complete.html']) {
    test(`Checkout pages are protected without login: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(LoginPage.url);
      await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired(path));
    });
  }

  test('Logout ends the session', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Log in as standard_user', async () => {
      await loginPage.login('standard_user', PASSWORD);
      await expect(page).toHaveURL(InventoryPage.url);
    });

    await test.step('Log out via the menu', async () => {
      await inventory.logout();
      await expect(page).toHaveURL(LoginPage.url);
      await expect(loginPage.loginButton).toBeVisible();
    });

    await test.step('Browser Back does not restore the session', async () => {
      await page.goBack();
      await expect(page).toHaveURL(LoginPage.url);
      await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired('/inventory.html'));
    });
  });

  test('Cart is not carried over to a different user after logout', async ({ page }) => {
    // BUG: logout does not clear the cart. The next user who logs in on the same
    // browser sees the previous user's Sauce Labs Backpack in their cart.
    test.fail();

    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('standard_user adds an item', async () => {
      await loginPage.login('standard_user', PASSWORD);
      await inventory.addToCart(PRODUCTS.backpack);
      await expect(inventory.cartBadge).toHaveText('1');
    });

    await test.step('Log out and log in as a different user', async () => {
      await inventory.logout();
      await loginPage.login('visual_user', PASSWORD);
      await expect(page).toHaveURL(InventoryPage.url);
    });

    await test.step("The second user's cart is empty", async () => {
      await expect(inventory.cartBadge).toBeHidden();
      await inventory.openCart();
      await expect(cart.items).toHaveCount(0);
    });
  });
});
