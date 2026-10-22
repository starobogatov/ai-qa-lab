import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export class CartPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(readonly page: Page) {
    this.title = healable(page.getByTestId('title'), 'CartPage.title');
    this.items = page.getByTestId('inventory-item');
    this.continueShoppingButton = healable(page.getByTestId('continue-shopping'), 'CartPage.continueShoppingButton');
    this.checkoutButton = healable(page.getByTestId('checkout'), 'CartPage.checkoutButton');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  quantity(name: string): Locator {
    return this.item(name).getByTestId('item-quantity');
  }

  price(name: string): Locator {
    return this.item(name).getByTestId('inventory-item-price');
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
