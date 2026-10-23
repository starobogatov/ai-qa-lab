import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';
import { Header } from './Header';

export class ProductPage {
  static readonly url = /\/inventory-item\.html\?id=/;

  readonly header: Header;
  readonly container: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly image: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.header = new Header(page);
    // The inventory page uses the same container and field ids, and WebKit updates the URL
    // before the detail page renders. Excluding the inventory list keeps these locators
    // from matching the old page mid-navigation.
    this.container = healable(
      page.getByTestId('inventory-container').filter({ hasNot: page.getByTestId('inventory-list') }),
      'ProductPage.container',
    );
    this.name = healable(this.container.getByTestId('inventory-item-name'), 'ProductPage.name');
    this.description = healable(this.container.getByTestId('inventory-item-desc'), 'ProductPage.description');
    this.price = healable(this.container.getByTestId('inventory-item-price'), 'ProductPage.price');
    this.image = healable(this.container.getByRole('img'), 'ProductPage.image');
    this.addToCartButton = healable(this.container.getByRole('button', { name: 'Add to cart' }), 'ProductPage.addToCartButton');
    this.removeButton = healable(this.container.getByRole('button', { name: 'Remove' }), 'ProductPage.removeButton');
    this.backButton = healable(page.getByRole('button', { name: 'Back to products' }), 'ProductPage.backButton');
  }

  async goto(id: number | string) {
    await this.page.goto(`/inventory-item.html?id=${id}`);
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async remove() {
    await this.removeButton.click();
  }

  async backToProducts() {
    await this.backButton.click();
  }
}
