// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { LOGGED_OUT, PASSWORD } from './support/auth';

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

    // 1. Login form is visible
    await expect(loginPage.username).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // 2-3. Log in with valid credentials
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.title).toHaveText('Products');
    await expect(inventory.items).toHaveCount(6);
    await expect(inventory.cartBadge).toBeHidden();
  });

  test('Login by pressing Enter in password field', async ({ page }) => {
    // 1. Fill credentials and press Enter
    await loginPage.username.fill('standard_user');
    await loginPage.password.fill(PASSWORD);
    await loginPage.password.press('Enter');
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  test('Both fields empty', async ({ page }) => {
    // 1. Click Login without filling any field
    await loginPage.loginButton.click();
    await expect(loginPage.error).toHaveText('Epic sadface: Username is required');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Empty username, valid password', async () => {
    // 1. Fill only Password and click Login
    await loginPage.login('', PASSWORD);
    await expect(loginPage.error).toHaveText('Epic sadface: Username is required');
  });

  test('Valid username, empty password', async () => {
    // 1. Fill only Username and click Login
    await loginPage.login('standard_user', '');
    await expect(loginPage.error).toHaveText('Epic sadface: Password is required');
  });

  test('Wrong password', async ({ page }) => {
    // 1. Fill valid username with wrong password
    await loginPage.login('standard_user', 'wrong_pass');
    await expect(loginPage.error).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('Unknown username', async () => {
    // 1. Fill unknown username with valid password
    await loginPage.login('no_such_user', PASSWORD);
    await expect(loginPage.error).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
  });

  test('Username is case-sensitive', async ({ page }) => {
    // 1. Fill username with different casing
    await loginPage.login('Standard_User', PASSWORD);
    await expect(loginPage.error).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('Locked out user cannot log in', async ({ page }) => {
    // 1. Log in as locked_out_user
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(loginPage.error).toHaveText('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Dismiss error message', async () => {
    // 1. Trigger an error
    await loginPage.loginButton.click();
    await expect(loginPage.error).toBeVisible();
    await expect(loginPage.errorCloseButton).toBeVisible();

    // 2. Close the error
    await loginPage.errorCloseButton.click();
    await expect(loginPage.error).toBeHidden();
  });

  test('Inventory is protected without login', async ({ page }) => {
    // 1. Open /inventory.html directly
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.error).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });

  for (const path of ['/cart.html', '/checkout-step-one.html', '/checkout-step-two.html', '/checkout-complete.html']) {
    test(`Checkout pages are protected without login: ${path}`, async ({ page }) => {
      // 1. Open the page directly
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
      await expect(loginPage.error).toHaveText(
        `Epic sadface: You can only access '${path}' when you are logged in.`,
      );
    });
  }

  test('Logout ends the session', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // 1. Log in as standard_user
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    // 2. Log out via the menu
    await inventory.logout();
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.loginButton).toBeVisible();

    // 3. Browser Back must not restore the session
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.error).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });

  test('Cart is not carried over to a different user after logout', async ({ page }) => {
    // BUG: logout does not clear the cart. The next user who logs in on the same
    // browser sees the previous user's Sauce Labs Backpack in their cart.
    test.fail();

    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    // 1. standard_user adds an item
    await loginPage.login('standard_user', PASSWORD);
    await inventory.addToCart('Sauce Labs Backpack');
    await expect(inventory.cartBadge).toHaveText('1');

    // 2. Log out and log in as a different user
    await inventory.logout();
    await loginPage.login('visual_user', PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    // 3. The second user's cart is empty
    await expect(inventory.cartBadge).toBeHidden();
    await inventory.openCart();
    await expect(cart.items).toHaveCount(0);
  });
});
