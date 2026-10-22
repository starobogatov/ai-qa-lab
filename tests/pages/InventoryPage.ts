import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export class InventoryPage {
  static readonly url = /\/inventory\.html$/;

  readonly title: Locator;
  readonly items: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(readonly page: Page) {
    this.title = healable(page.getByTestId('title'), 'InventoryPage.title');
    this.items = page.getByTestId('inventory-item');
    this.cartLink = healable(page.getByTestId('shopping-cart-link'), 'InventoryPage.cartLink');
    this.cartBadge = healable(page.getByTestId('shopping-cart-badge'), 'InventoryPage.cartBadge');
    this.menuButton = healable(page.getByRole('button', { name: 'Open Menu' }), 'InventoryPage.menuButton');
    this.logoutLink = healable(page.getByTestId('logout-sidebar-link'), 'InventoryPage.logoutLink');
    this.resetAppStateLink = healable(page.getByTestId('reset-sidebar-link'), 'InventoryPage.resetAppStateLink');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  addToCartButton(name: string): Locator {
    return this.item(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.item(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...names: string[]) {
    for (const name of names) {
      await this.addToCartButton(name).click();
    }
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
