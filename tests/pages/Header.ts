import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';
import { SideMenu } from './SideMenu';

/** The bar shown on every logged-in page: burger menu and cart. */
export class Header {
  readonly menu: SideMenu;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(readonly page: Page) {
    this.menu = new SideMenu(page);
    this.cartLink = healable(page.getByTestId('shopping-cart-link'), 'Header.cartLink');
    this.cartBadge = healable(page.getByTestId('shopping-cart-badge'), 'Header.cartBadge');
  }

  async openCart() {
    await this.cartLink.click();
  }
}
