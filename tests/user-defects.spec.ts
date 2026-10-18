// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { authFile } from './support/auth';

async function startCheckout(page: Page) {
  const inventory = new InventoryPage(page);
  await inventory.goto();
  await inventory.addToCart('Sauce Labs Backpack');
  await inventory.openCart();
  await new CartPage(page).checkout();
  return new CheckoutPage(page);
}

test.describe('problem_user', () => {
  test.use({ storageState: authFile('problem_user') });

  test('Checkout form keeps the typed values', async ({ page }) => {
    // BUG: typing into Last Name overwrites First Name (First Name ends up "Doe",
    // Last Name stays empty), so Continue fails with "Last Name is required".
    test.fail();

    // 1. Start checkout and fill the form
    const checkout = await startCheckout(page);
    await checkout.fillInformation('John', 'Doe', '12345');
    await expect(checkout.firstName).toHaveValue('John');
    await expect(checkout.lastName).toHaveValue('Doe');
    await expect(checkout.postalCode).toHaveValue('12345');

    // 2. Continue to the Overview
    await checkout.continue();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
  });
});

test.describe('error_user', () => {
  test.use({ storageState: authFile('error_user') });

  test('Checkout can be completed', async ({ page }) => {
    // BUG: Last Name ignores input (console error logged), Continue still goes to
    // the Overview with an empty Last Name, and Finish does nothing.
    test.fail();

    // 1. Start checkout and fill the form
    const checkout = await startCheckout(page);
    await checkout.fillInformation('John', 'Doe', '12345');
    await expect(checkout.lastName).toHaveValue('Doe');

    // 2. Continue and finish
    await checkout.continue();
    await checkout.finish();
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
  });
});

test.describe('performance_glitch_user', () => {
  test.use({ storageState: authFile('performance_glitch_user') });

  test('Checkout can be completed despite delays', async ({ page }) => {
    test.slow();

    // 1. Start checkout, fill the form, finish
    const checkout = await startCheckout(page);
    await checkout.fillInformation('John', 'Doe', '12345');
    await checkout.continue();
    await checkout.finish();
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
  });
});
