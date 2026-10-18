// spec: specs/saucedemo-login-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';

test.describe('Cart', () => {
  let inventory: InventoryPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    await inventory.goto();
  });

  test('Add items updates badge and button state', async () => {
    // 1. Inventory starts with an empty cart
    await expect(inventory.cartBadge).toBeHidden();

    // 2. Add the backpack
    await inventory.addToCart('Sauce Labs Backpack');
    await expect(inventory.cartBadge).toHaveText('1');
    await expect(inventory.removeButton('Sauce Labs Backpack')).toBeVisible();

    // 3. Add the bike light
    await inventory.addToCart('Sauce Labs Bike Light');
    await expect(inventory.cartBadge).toHaveText('2');
  });

  test('Cart lists added items with quantity and price', async ({ page }) => {
    // 1. Add two items and open the cart
    await inventory.addToCart('Sauce Labs Backpack', 'Sauce Labs Bike Light');
    await inventory.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cart.items).toHaveCount(2);
    await expect(cart.quantity('Sauce Labs Backpack')).toHaveText('1');
    await expect(cart.price('Sauce Labs Backpack')).toHaveText('$29.99');
    await expect(cart.quantity('Sauce Labs Bike Light')).toHaveText('1');
    await expect(cart.price('Sauce Labs Bike Light')).toHaveText('$9.99');
  });

  test('Remove item from cart', async () => {
    // 1. Add two items and open the cart
    await inventory.addToCart('Sauce Labs Backpack', 'Sauce Labs Bike Light');
    await inventory.openCart();
    await expect(cart.items).toHaveCount(2);

    // 2. Remove the bike light
    await cart.remove('Sauce Labs Bike Light');
    await expect(cart.item('Sauce Labs Bike Light')).toHaveCount(0);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('Continue Shopping returns to inventory and keeps cart', async ({ page }) => {
    // 1. Add an item, open the cart, continue shopping
    await inventory.addToCart('Sauce Labs Backpack');
    await inventory.openCart();
    await cart.continueShoppingButton.click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('Cart persists across reload', async ({ page }) => {
    // 1. Add an item and reload
    await inventory.addToCart('Sauce Labs Backpack');
    await page.reload();
    await expect(inventory.cartBadge).toHaveText('1');
    await expect(inventory.removeButton('Sauce Labs Backpack')).toBeVisible();
  });
});
