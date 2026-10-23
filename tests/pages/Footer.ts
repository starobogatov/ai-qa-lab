import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export class Footer {
  readonly container: Locator;
  readonly xLink: Locator;
  readonly facebookLink: Locator;
  readonly linkedInLink: Locator;
  readonly copyright: Locator;

  constructor(readonly page: Page) {
    this.container = healable(page.getByTestId('footer'), 'Footer.container');
    this.xLink = healable(page.getByTestId('social-x'), 'Footer.xLink');
    this.facebookLink = healable(page.getByTestId('social-facebook'), 'Footer.facebookLink');
    this.linkedInLink = healable(page.getByTestId('social-linkedin'), 'Footer.linkedInLink');
    this.copyright = healable(page.getByTestId('footer-copy'), 'Footer.copyright');
  }
}
