import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';
import { Header } from './Header';

export class InventoryPage {
  static readonly url = /\/inventory\.html$/;

  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;
  readonly sortOptions: Locator;
  readonly activeSortOption: Locator;
  readonly header: Header;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(readonly page: Page) {
    this.title = healable(page.getByTestId('title'), 'InventoryPage.title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = this.items.getByTestId('inventory-item-name');
    this.itemPrices = this.items.getByTestId('inventory-item-price');
    this.sortSelect = healable(page.getByTestId('product-sort-container'), 'InventoryPage.sortSelect');
    this.sortOptions = this.sortSelect.getByRole('option');
    this.activeSortOption = healable(page.getByTestId('active-option'), 'InventoryPage.activeSortOption');
    this.header = new Header(page);
    this.cartLink = this.header.cartLink;
    this.cartBadge = this.header.cartBadge;
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  titleLink(name: string): Locator {
    return this.item(name).getByTestId('inventory-item-name');
  }

  image(name: string): Locator {
    return this.item(name).getByRole('img');
  }

  async sortBy(label: string) {
    await this.sortSelect.selectOption({ label });
  }

  async readItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  /** Item prices as numbers, e.g. [29.99, 9.99]. */
  async readItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
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
    await this.header.openCart();
  }

  async logout() {
    await this.header.menu.logout();
  }
}
