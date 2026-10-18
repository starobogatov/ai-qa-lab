// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('Checkout – form validation (negative)', () => {
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const inventory = new InventoryPage(page);
    checkout = new CheckoutPage(page);
    await inventory.goto();
    await inventory.addToCart('Sauce Labs Backpack');
    await inventory.openCart();
    await new CartPage(page).checkout();
  });

  // Plan 5.1–5.4
  const cases = [
    { name: 'all fields are empty', first: '', last: '', zip: '', error: 'Error: First Name is required' },
    { name: 'last name is missing', first: 'John', last: '', zip: '12345', error: 'Error: Last Name is required' },
    { name: 'postal code is missing', first: 'John', last: 'Doe', zip: '', error: 'Error: Postal Code is required' },
    { name: 'first name is missing', first: '', last: 'Doe', zip: '12345', error: 'Error: First Name is required' },
  ];

  for (const c of cases) {
    test(`shows "${c.error}" when ${c.name}`, async ({ page }) => {
      // 1. Fill the form and continue
      await checkout.fillInformation(c.first, c.last, c.zip);
      await checkout.continue();
      await expect(checkout.error).toHaveText(c.error);
      await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    });
  }

  test('Dismiss checkout error', async () => {
    // 1. Trigger a validation error, then close it
    await checkout.continue();
    await expect(checkout.error).toBeVisible();
    await checkout.errorCloseButton.click();
    await expect(checkout.error).toBeHidden();
  });

  test('Whitespace-only postal code is rejected', async ({ page }) => {
    // BUG: input is not trimmed, so a postal code of only spaces passes validation
    // and the user reaches the Overview.
    test.fail();

    // 1. Fill a whitespace-only postal code and continue
    await checkout.fillInformation('John', 'Doe', '   ');
    await checkout.continue();
    await expect(checkout.error).toHaveText('Error: Postal Code is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });
});
