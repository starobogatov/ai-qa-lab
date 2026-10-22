// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CUSTOMER, PRODUCTS } from './support/data';

const TAX_RATE = 0.08;

let inventory: InventoryPage;
let cart: CartPage;
let checkout: CheckoutPage;

test.beforeEach(async ({ page }) => {
  inventory = new InventoryPage(page);
  cart = new CartPage(page);
  checkout = new CheckoutPage(page);
  await inventory.goto();
});

/** Adds the items, goes through Your Information and lands on the Overview. */
async function goToOverview(...items: string[]) {
  await inventory.addToCart(...items);
  await inventory.openCart();
  await cart.checkout();
  await checkout.fillInformation(CUSTOMER);
  await checkout.continue();
}

/** Checks Overview totals against the item prices shown on the page. */
async function expectTotalsMatchPrices() {
  const prices = await checkout.readItemPrices();
  const subtotal = prices.reduce((sum, p) => sum + p, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  await expect(checkout.subtotal).toHaveText(`Item total: $${subtotal.toFixed(2)}`);
  await expect(checkout.tax).toHaveText(`Tax: $${tax.toFixed(2)}`);
  await expect(checkout.total).toHaveText(`Total: $${(subtotal + tax).toFixed(2)}`);
}

test.describe('Checkout – happy path', () => {
  test('Complete purchase of two items', async ({ page }) => {
    await test.step('Add two items, open the cart, start checkout', async () => {
      await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
      await inventory.openCart();
      await cart.checkout();
      await expect(page).toHaveURL(CheckoutPage.urls.information);
      await expect(checkout.title).toHaveText('Checkout: Your Information');
    });

    await test.step('Fill information and continue', async () => {
      await checkout.fillInformation(CUSTOMER);
      await checkout.continue();
      await expect(page).toHaveURL(CheckoutPage.urls.overview);
      await expect(checkout.title).toHaveText('Checkout: Overview');
      await expect(checkout.items).toHaveCount(2);
    });

    await test.step('Verify the summary', async () => {
      await expect(checkout.paymentInfo).toHaveText('SauceCard #31337');
      await expect(checkout.shippingInfo).toHaveText('Free Pony Express Delivery!');
      await expect(checkout.subtotal).toHaveText('Item total: $39.98');
      await expect(checkout.tax).toHaveText('Tax: $3.20');
      await expect(checkout.total).toHaveText('Total: $43.18');
    });

    await test.step('Finish', async () => {
      await checkout.finish();
      await expect(page).toHaveURL(CheckoutPage.urls.complete);
      await expect(checkout.title).toHaveText('Checkout: Complete!');
      await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
      await expect(checkout.completeText).toHaveText(
        'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
      );
      await expect(inventory.cartBadge).toBeHidden();
    });

    await test.step('Back Home resets the inventory', async () => {
      await checkout.backHomeButton.click();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.cartBadge).toBeHidden();
      await expect(inventory.items.getByRole('button', { name: 'Remove' })).toHaveCount(0);
    });
  });

  test('Totals are computed correctly (single item)', async () => {
    await test.step('Check out the backpack only', async () => {
      await goToOverview(PRODUCTS.backpack);
      await expect(checkout.subtotal).toHaveText('Item total: $29.99');
      await expect(checkout.tax).toHaveText('Tax: $2.40');
      await expect(checkout.total).toHaveText('Total: $32.39');
    });

    await test.step('Totals match the prices on the page', async () => {
      await expectTotalsMatchPrices();
    });
  });

  test('Totals update after removing an item', async () => {
    await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
    await inventory.openCart();
    await cart.remove(PRODUCTS.bikeLight);
    await cart.checkout();
    await checkout.fillInformation(CUSTOMER);
    await checkout.continue();

    await expect(checkout.items).toHaveCount(1);
    await expect(checkout.items).toContainText(PRODUCTS.backpack);
    await expect(checkout.subtotal).toHaveText('Item total: $29.99');
    await expect(checkout.tax).toHaveText('Tax: $2.40');
    await expect(checkout.total).toHaveText('Total: $32.39');
    await expectTotalsMatchPrices();
  });
});

test.describe('Checkout – navigation & cancel', () => {
  test('Cancel on Your Information returns to cart', async ({ page }) => {
    await inventory.addToCart(PRODUCTS.backpack);
    await inventory.openCart();
    await cart.checkout();
    await checkout.cancelButton.click();
    await expect(page).toHaveURL(CartPage.url);
    await expect(cart.item(PRODUCTS.backpack)).toBeVisible();
  });

  test('Cancel on Overview returns to inventory and keeps cart', async ({ page }) => {
    await goToOverview(PRODUCTS.backpack, PRODUCTS.bikeLight);
    await checkout.cancelButton.click();
    await expect(page).toHaveURL(InventoryPage.url);
    await expect(inventory.cartBadge).toHaveText('2');
  });
});

test.describe('Checkout – edge cases', () => {
  test('Checkout with empty cart is blocked', async ({ page }) => {
    // BUG: the Checkout button works with an empty cart. The user can go through
    // both steps and "complete" a $0.00 order that shows "Thank you for your order!".
    test.fail();

    await inventory.openCart();
    await expect(cart.items).toHaveCount(0);
    await cart.checkout();
    await expect(page).toHaveURL(CartPage.url);
  });

  test('Completed order cannot be resubmitted via Back', async ({ page }) => {
    // BUG: after finishing, Back returns to the Overview and clicking Finish again
    // shows "Thank you for your order!" a second time (resubmits an empty order).
    test.fail();

    await test.step('Complete a purchase', async () => {
      await goToOverview(PRODUCTS.backpack);
      await checkout.finish();
      await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
      await expect(inventory.cartBadge).toBeHidden();
    });

    await test.step('Go Back to the Overview and try to finish again', async () => {
      await page.goBack();
      await expect(page).toHaveURL(CheckoutPage.urls.overview);
      await checkout.finish();
    });

    await test.step('The second submission is rejected', async () => {
      await expect(page).not.toHaveURL(CheckoutPage.urls.complete);
      await expect(checkout.completeHeader).toBeHidden();
    });
  });
});
