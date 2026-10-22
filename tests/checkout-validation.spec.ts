// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CHECKOUT_ERRORS, CheckoutPage } from './pages/CheckoutPage';
import { CUSTOMER, PRODUCTS } from './support/data';

test.describe('Checkout – form validation (negative)', () => {
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const inventory = new InventoryPage(page);
    checkout = new CheckoutPage(page);
    await inventory.goto();
    await inventory.addToCart(PRODUCTS.backpack);
    await inventory.openCart();
    await new CartPage(page).checkout();
  });

  // Plan 5.1–5.4
  const invalidForms = [
    { when: 'all fields are empty', info: { firstName: '', lastName: '', postalCode: '' }, error: CHECKOUT_ERRORS.firstNameRequired },
    { when: 'last name is missing', info: { ...CUSTOMER, lastName: '' }, error: CHECKOUT_ERRORS.lastNameRequired },
    { when: 'postal code is missing', info: { ...CUSTOMER, postalCode: '' }, error: CHECKOUT_ERRORS.postalCodeRequired },
    { when: 'first name is missing', info: { ...CUSTOMER, firstName: '' }, error: CHECKOUT_ERRORS.firstNameRequired },
  ];

  for (const { when, info, error } of invalidForms) {
    test(`shows "${error}" when ${when}`, async ({ page }) => {
      await checkout.fillInformation(info);
      await checkout.continue();
      await expect(checkout.error).toHaveText(error);
      await expect(page).toHaveURL(CheckoutPage.urls.information);
    });
  }

  test('Dismiss checkout error', async () => {
    await test.step('Trigger a validation error', async () => {
      await checkout.continue();
      await expect(checkout.error).toBeVisible();
    });

    await test.step('Close the error', async () => {
      await checkout.errorCloseButton.click();
      await expect(checkout.error).toBeHidden();
    });
  });

  test('Whitespace-only postal code is rejected', async ({ page }) => {
    // BUG: input is not trimmed, so a postal code of only spaces passes validation
    // and the user reaches the Overview.
    test.fail();

    await checkout.fillInformation({ ...CUSTOMER, postalCode: '   ' });
    await checkout.continue();
    await expect(checkout.error).toHaveText(CHECKOUT_ERRORS.postalCodeRequired);
    await expect(page).toHaveURL(CheckoutPage.urls.information);
  });
});
