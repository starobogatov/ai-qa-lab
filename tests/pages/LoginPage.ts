import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly errorCloseButton: Locator;

  constructor(readonly page: Page) {
    this.username = healable(page.getByPlaceholder('Username'), 'LoginPage.username');
    this.password = healable(page.getByPlaceholder('Password'), 'LoginPage.password');
    this.loginButton = healable(page.getByRole('button', { name: 'Login' }), 'LoginPage.loginButton');
    this.error = healable(page.getByTestId('error'), 'LoginPage.error');
    this.errorCloseButton = healable(page.getByTestId('error-button'), 'LoginPage.errorCloseButton');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
