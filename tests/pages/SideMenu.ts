import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export const MENU_ITEMS = ['All Items', 'Dynamic Catalog', 'About', 'Logout', 'Reset App State'];

export class SideMenu {
  readonly openButton: Locator;
  readonly closeButton: Locator;
  readonly panel: Locator;
  readonly items: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(readonly page: Page) {
    this.openButton = healable(page.getByRole('button', { name: 'Open Menu' }), 'SideMenu.openButton');
    this.closeButton = healable(page.getByRole('button', { name: 'Close Menu' }), 'SideMenu.closeButton');
    // The panel has no data-test attribute or accessible name, so CSS is the only handle.
    this.panel = page.locator('.bm-menu-wrap');
    this.items = this.panel.locator('nav > a');
    this.allItemsLink = healable(page.getByTestId('inventory-sidebar-link'), 'SideMenu.allItemsLink');
    this.aboutLink = healable(page.getByTestId('about-sidebar-link'), 'SideMenu.aboutLink');
    this.logoutLink = healable(page.getByTestId('logout-sidebar-link'), 'SideMenu.logoutLink');
    this.resetAppStateLink = healable(page.getByTestId('reset-sidebar-link'), 'SideMenu.resetAppStateLink');
  }

  async open() {
    await this.openButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async goToAllItems() {
    await this.open();
    await this.allItemsLink.click();
  }

  async logout() {
    await this.open();
    await this.logoutLink.click();
  }

  async resetAppState() {
    await this.open();
    await this.resetAppStateLink.click();
  }
}
