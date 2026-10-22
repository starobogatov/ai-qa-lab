// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { PRODUCTS } from './support/data';

test.describe('Cart', () => {
  let inventory: InventoryPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    await inventory.goto();
  });

  test('Add items updates badge and button state', async () => {
    await test.step('Inventory starts with an empty cart', async () => {
      await expect(inventory.cartBadge).toBeHidden();
    });

    await test.step('Add the backpack', async () => {
      await inventory.addToCart(PRODUCTS.backpack);
      await expect(inventory.cartBadge).toHaveText('1');
      await expect(inventory.removeButton(PRODUCTS.backpack)).toBeVisible();
    });

    await test.step('Add the bike light', async () => {
      await inventory.addToCart(PRODUCTS.bikeLight);
      await expect(inventory.cartBadge).toHaveText('2');
    });
  });

  test('Cart lists added items with quantity and price', async ({ page }) => {
    await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
    await inventory.openCart();
    await expect(page).toHaveURL(CartPage.url);
    await expect(cart.items).toHaveCount(2);
    await expect(cart.quantity(PRODUCTS.backpack)).toHaveText('1');
    await expect(cart.price(PRODUCTS.backpack)).toHaveText('$29.99');
    await expect(cart.quantity(PRODUCTS.bikeLight)).toHaveText('1');
    await expect(cart.price(PRODUCTS.bikeLight)).toHaveText('$9.99');
  });

  test('Remove item from cart', async () => {
    await test.step('Add two items and open the cart', async () => {
      await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
      await inventory.openCart();
      await expect(cart.items).toHaveCount(2);
    });

    await test.step('Remove the bike light', async () => {
      await cart.remove(PRODUCTS.bikeLight);
      await expect(cart.item(PRODUCTS.bikeLight)).toHaveCount(0);
      await expect(inventory.cartBadge).toHaveText('1');
    });
  });

  test('Continue Shopping returns to inventory and keeps cart', async ({ page }) => {
    await inventory.addToCart(PRODUCTS.backpack);
    await inventory.openCart();
    await cart.continueShoppingButton.click();
    await expect(page).toHaveURL(InventoryPage.url);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('Cart persists across reload', async ({ page }) => {
    await inventory.addToCart(PRODUCTS.backpack);
    await page.reload();
    await expect(inventory.cartBadge).toHaveText('1');
    await expect(inventory.removeButton(PRODUCTS.backpack)).toBeVisible();
  });
});
