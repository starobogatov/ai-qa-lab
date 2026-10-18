// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

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
  await checkout.fillInformation('John', 'Doe', '12345');
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
    // 1. Add two items, open the cart, start checkout
    await inventory.addToCart('Sauce Labs Backpack', 'Sauce Labs Bike Light');
    await inventory.openCart();
    await cart.checkout();
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkout.title).toHaveText('Checkout: Your Information');

    // 2. Fill information and continue
    await checkout.fillInformation('John', 'Doe', '12345');
    await checkout.continue();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.title).toHaveText('Checkout: Overview');
    await expect(checkout.items).toHaveCount(2);

    // 3. Verify the summary
    await expect(checkout.paymentInfo).toHaveText('SauceCard #31337');
    await expect(checkout.shippingInfo).toHaveText('Free Pony Express Delivery!');
    await expect(checkout.subtotal).toHaveText('Item total: $39.98');
    await expect(checkout.tax).toHaveText('Tax: $3.20');
    await expect(checkout.total).toHaveText('Total: $43.18');

    // 4. Finish
    await checkout.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkout.title).toHaveText('Checkout: Complete!');
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkout.completeText).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
    );
    await expect(inventory.cartBadge).toBeHidden();

    // 5. Back Home resets the inventory
    await checkout.backHomeButton.click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.cartBadge).toBeHidden();
    await expect(inventory.items.getByRole('button', { name: 'Remove' })).toHaveCount(0);
  });

  test('Totals are computed correctly (single item)', async () => {
    // 1. Check out the backpack only
    await goToOverview('Sauce Labs Backpack');
    await expect(checkout.subtotal).toHaveText('Item total: $29.99');
    await expect(checkout.tax).toHaveText('Tax: $2.40');
    await expect(checkout.total).toHaveText('Total: $32.39');

    // 2. Totals match the prices on the page
    await expectTotalsMatchPrices();
  });

  test('Totals update after removing an item', async () => {
    // 1. Add two items, remove one in the cart, check out
    await inventory.addToCart('Sauce Labs Backpack', 'Sauce Labs Bike Light');
    await inventory.openCart();
    await cart.remove('Sauce Labs Bike Light');
    await cart.checkout();
    await checkout.fillInformation('John', 'Doe', '12345');
    await checkout.continue();

    await expect(checkout.items).toHaveCount(1);
    await expect(checkout.items).toContainText('Sauce Labs Backpack');
    await expect(checkout.subtotal).toHaveText('Item total: $29.99');
    await expect(checkout.tax).toHaveText('Tax: $2.40');
    await expect(checkout.total).toHaveText('Total: $32.39');
    await expectTotalsMatchPrices();
  });
});

test.describe('Checkout – navigation & cancel', () => {
  test('Cancel on Your Information returns to cart', async ({ page }) => {
    // 1. Start checkout, then cancel
    await inventory.addToCart('Sauce Labs Backpack');
    await inventory.openCart();
    await cart.checkout();
    await checkout.cancelButton.click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cart.item('Sauce Labs Backpack')).toBeVisible();
  });

  test('Cancel on Overview returns to inventory and keeps cart', async ({ page }) => {
    // 1. Reach the Overview, then cancel
    await goToOverview('Sauce Labs Backpack', 'Sauce Labs Bike Light');
    await checkout.cancelButton.click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.cartBadge).toHaveText('2');
  });
});

test.describe('Checkout – edge cases', () => {
  test('Checkout with empty cart is blocked', async ({ page }) => {
    // BUG: the Checkout button works with an empty cart. The user can go through
    // both steps and "complete" a $0.00 order that shows "Thank you for your order!".
    test.fail();

    // 1. Open the empty cart and click Checkout
    await inventory.openCart();
    await expect(cart.items).toHaveCount(0);
    await cart.checkout();
    await expect(page).toHaveURL(/\/cart\.html$/);
  });

  test('Completed order cannot be resubmitted via Back', async ({ page }) => {
    // BUG: after finishing, Back returns to the Overview and clicking Finish again
    // shows "Thank you for your order!" a second time (resubmits an empty order).
    test.fail();

    // 1. Complete a purchase
    await goToOverview('Sauce Labs Backpack');
    await checkout.finish();
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
    await expect(inventory.cartBadge).toBeHidden();

    // 2. Go Back to the Overview and try to finish again
    await page.goBack();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await checkout.finish();

    // 3. The second submission is rejected
    await expect(page).not.toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkout.completeHeader).toBeHidden();
  });
});
