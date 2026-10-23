// spec: specs/saucedemo-navigation.plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MENU_ITEMS, type SideMenu } from './pages/SideMenu';
import { Footer } from './pages/Footer';
import { CUSTOMER, PRODUCTS } from './support/data';

// Before the menu is opened for the first time the panel is only translated
// off-screen (no `hidden` attribute), so toBeVisible/toBeHidden cannot tell open
// from closed. aria-hidden and the viewport position are reliable in both cases.
async function expectMenuOpen(menu: SideMenu) {
  await expect(menu.panel).toHaveAttribute('aria-hidden', 'false');
  await expect(menu.allItemsLink).toBeInViewport();
}

async function expectMenuClosed(menu: SideMenu) {
  await expect(menu.panel).toHaveAttribute('aria-hidden', 'true');
  await expect(menu.allItemsLink).not.toBeInViewport();
}

async function expectMenuListsAllItems(menu: SideMenu) {
  await expectMenuOpen(menu);
  await expect(menu.items).toHaveText(MENU_ITEMS);
}

function readStoredCart(page: Page) {
  return page.evaluate(() => localStorage.getItem('cart-contents'));
}

test.describe('Burger menu', () => {
  let inventory: InventoryPage;
  let menu: SideMenu;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    menu = inventory.header.menu;
    await inventory.goto();
  });

  test('Menu opens and closes with the X button', async () => {
    await test.step('Menu starts closed', async () => {
      await expect(menu.openButton).toBeVisible();
      await expectMenuClosed(menu);
    });

    await test.step('Open the menu', async () => {
      await menu.open();
      await expectMenuOpen(menu);
      await expect(menu.closeButton).toBeVisible();
      await expect(menu.allItemsLink).toBeVisible();
    });

    await test.step('Close the menu with the X button', async () => {
      await menu.close();
      await expectMenuClosed(menu);
      await expect(menu.allItemsLink).toBeHidden();
    });

    await test.step('Menu can be reopened', async () => {
      await menu.open();
      await expectMenuOpen(menu);
    });
  });

  test('Menu lists the expected items in order', async () => {
    await menu.open();
    await expectMenuListsAllItems(menu);

    for (const [index, name] of MENU_ITEMS.entries()) {
      const expectedRole = name === 'About' ? 'link' : 'button';
      await expect(menu.items.nth(index)).toHaveRole(expectedRole);
    }
  });

  test('"All Items" from the cart page returns to inventory', async ({ page }) => {
    const cart = new CartPage(page);

    await test.step('Open the cart', async () => {
      await inventory.openCart();
      await expect(page).toHaveURL(CartPage.url);
      await expect(cart.title).toHaveText('Your Cart');
    });

    await test.step('Go to All Items via the menu', async () => {
      await cart.header.menu.goToAllItems();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.title).toHaveText('Products');
      await expect(inventory.items).toHaveCount(6);
      await expectMenuClosed(menu);
    });
  });

  test('"All Items" from a product detail page returns to inventory', async ({ page }) => {
    const product = new ProductPage(page);

    await test.step('Open the backpack detail page', async () => {
      await inventory.titleLink(PRODUCTS.backpack).click();
      await expect(page).toHaveURL(/\/inventory-item\.html\?id=4$/);
      await expect(product.name).toHaveText(PRODUCTS.backpack);
      await expect(product.backButton).toBeVisible();
    });

    await test.step('Go to All Items via the menu', async () => {
      await product.header.menu.goToAllItems();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.title).toHaveText('Products');
      await expectMenuClosed(menu);
    });
  });

  test('"About" links to the Sauce Labs website in the same tab', async () => {
    await menu.open();
    await expect(menu.aboutLink).toHaveAttribute('href', 'https://saucelabs.com/');
    await expect(menu.aboutLink).not.toHaveAttribute('target');
  });

  test('Menu is available on cart and checkout pages', async ({ page }) => {
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Menu on the cart page', async () => {
      await inventory.addToCart(PRODUCTS.backpack);
      await inventory.openCart();
      await expect(page).toHaveURL(CartPage.url);
      await expect(cart.title).toHaveText('Your Cart');
      await cart.header.menu.open();
      await expectMenuListsAllItems(cart.header.menu);
      await cart.header.menu.close();
    });

    await test.step('Menu on Checkout: Your Information', async () => {
      await cart.checkout();
      await expect(page).toHaveURL(CheckoutPage.urls.information);
      await expect(checkout.title).toHaveText('Checkout: Your Information');
      await checkout.header.menu.open();
      await expectMenuListsAllItems(checkout.header.menu);
      await checkout.header.menu.close();
    });

    await test.step('Menu on Checkout: Overview', async () => {
      await checkout.fillInformation(CUSTOMER);
      await checkout.continue();
      await expect(page).toHaveURL(CheckoutPage.urls.overview);
      await expect(checkout.title).toHaveText('Checkout: Overview');
      await checkout.header.menu.open();
      await expectMenuOpen(checkout.header.menu);
    });

    await test.step('Leaving checkout via All Items keeps the cart', async () => {
      await checkout.header.menu.allItemsLink.click();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.cartBadge).toHaveText('1');
    });
  });
});

test.describe('Reset App State', () => {
  let inventory: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    await inventory.goto();
    await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
  });

  test('Reset clears the cart badge and storage', async ({ page }) => {
    await test.step('Cart holds two items', async () => {
      await expect(inventory.cartBadge).toHaveText('2');
      await expect(inventory.cartLink).toHaveAccessibleName('Cart, 2 items');
    });

    await test.step('Reset the app state', async () => {
      await inventory.header.menu.resetAppState();
      await expect(inventory.cartBadge).toBeHidden();
      await expect(inventory.cartLink).toHaveAccessibleName('Cart, empty');
      await expect.poll(() => readStoredCart(page)).toBeNull();
    });

    await test.step('User stays logged in on the inventory page', async () => {
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.title).toHaveText('Products');
      // Observed live: Reset App State does not close the menu.
      await expectMenuOpen(inventory.header.menu);
    });
  });

  test('Inventory buttons switch back to "Add to cart" after reset', async ({ page }) => {
    // BUG: after Reset App State the badge disappears and the cart is emptied,
    // but the Backpack and Bike Light buttons keep showing "Remove" until the
    // page is reloaded.
    test.fail();

    await test.step('Both added items show Remove', async () => {
      await expect(inventory.removeButton(PRODUCTS.backpack)).toBeVisible();
      await expect(inventory.removeButton(PRODUCTS.bikeLight)).toBeVisible();
    });

    await test.step('Reset without reloading', async () => {
      await inventory.header.menu.resetAppState();
      await expect(inventory.cartBadge).toBeHidden();
      await expect(inventory.addToCartButton(PRODUCTS.backpack)).toBeVisible();
      await expect(inventory.addToCartButton(PRODUCTS.bikeLight)).toBeVisible();
    });

    await test.step('After a reload every button shows Add to cart', async () => {
      await page.reload();
      for (const name of Object.values(PRODUCTS)) {
        await expect(inventory.addToCartButton(name)).toBeVisible();
      }
      await expect(inventory.cartBadge).toBeHidden();
    });
  });

  test('Cart page is emptied by reset', async ({ page }) => {
    // BUG: after Reset App State on the cart page the badge disappears and
    // localStorage "cart-contents" is removed, but the Backpack and Bike Light
    // stay listed in the cart until the page is reloaded.
    test.fail();

    const cart = new CartPage(page);

    await test.step('Open the cart with two items', async () => {
      await inventory.openCart();
      await expect(cart.items).toHaveCount(2);
      await expect(cart.header.cartBadge).toHaveText('2');
    });

    await test.step('Reset without reloading', async () => {
      await cart.header.menu.resetAppState();
      await expect(cart.header.cartBadge).toBeHidden();
      await expect(cart.items).toHaveCount(0);
    });

    await test.step('After a reload the cart is empty', async () => {
      await page.reload();
      await expect(cart.items).toHaveCount(0);
      await expect(cart.header.cartBadge).toBeHidden();
    });
  });

  test('Cart page is empty when opened after reset', async ({ page }) => {
    const cart = new CartPage(page);

    await test.step('Reset and open the cart', async () => {
      await inventory.header.menu.resetAppState();
      await inventory.openCart();
      await expect(page).toHaveURL(CartPage.url);
      await expect(cart.items).toHaveCount(0);
      await expect(cart.header.cartBadge).toBeHidden();
    });

    await test.step('Continue Shopping shows every product as Add to cart', async () => {
      await cart.continueShoppingButton.click();
      await expect(page).toHaveURL(InventoryPage.url);
      for (const name of Object.values(PRODUCTS)) {
        await expect(inventory.addToCartButton(name)).toBeVisible();
      }
    });
  });
});

test.describe('Footer', () => {
  let footer: Footer;

  test.beforeEach(async ({ page }) => {
    footer = new Footer(page);
  });

  async function expectFooterWithSocialLinks() {
    await expect(footer.container).toBeVisible();
    await expect(footer.xLink).toHaveText('X');
    await expect(footer.facebookLink).toHaveText('Facebook');
    await expect(footer.linkedInLink).toHaveText('LinkedIn');
    await expect(footer.copyright).toBeVisible();
  }

  test('Social links point to Sauce Labs profiles and open in a new tab', async ({ page }) => {
    await new InventoryPage(page).goto();
    await expectFooterWithSocialLinks();

    const expectedLinks = [
      { link: footer.xLink, href: 'https://x.com/saucelabs' },
      { link: footer.facebookLink, href: 'https://www.facebook.com/saucelabs' },
      { link: footer.linkedInLink, href: 'https://www.linkedin.com/company/sauce-labs/' },
    ];
    for (const { link, href } of expectedLinks) {
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  test('Copyright shows the current year', async ({ page }) => {
    await new InventoryPage(page).goto();
    // The app renders the year from the browser clock (new Date().getFullYear()).
    const year = new Date().getFullYear();
    await expect(footer.copyright).toHaveText(
      `© ${year} Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy`,
    );
    await expect(footer.copyright.getByRole('link')).toHaveCount(0);
  });

  test('Footer is shown on cart and checkout pages', async ({ page }) => {
    await test.step('Cart page', async () => {
      await new CartPage(page).goto();
      await expectFooterWithSocialLinks();
    });

    await test.step('Checkout: Your Information', async () => {
      await new CheckoutPage(page).gotoInformation();
      await expectFooterWithSocialLinks();
    });
  });
});
