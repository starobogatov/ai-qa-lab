import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

export const LOGIN_ERRORS = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  noMatch: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  loginRequired: (path: string) => `Epic sadface: You can only access '${path}' when you are logged in.`,
};

export class LoginPage {
  static readonly url = /\/$/;

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
