import { type Locator, type Page } from '@playwright/test';
import { healable } from '../support/healing';

/** Covers all three checkout screens: Your Information, Overview and Complete. */
export class CheckoutPage {
  readonly title: Locator;

  // Step one: Your Information
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;
  readonly errorCloseButton: Locator;

  // Step two: Overview
  readonly items: Locator;
  readonly itemPrices: Locator;
  readonly paymentInfo: Locator;
  readonly shippingInfo: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  // Complete
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(readonly page: Page) {
    this.title = healable(page.getByTestId('title'), 'CheckoutPage.title');

    this.firstName = healable(page.getByPlaceholder('First Name'), 'CheckoutPage.firstName');
    this.lastName = healable(page.getByPlaceholder('Last Name'), 'CheckoutPage.lastName');
    this.postalCode = healable(page.getByPlaceholder('Zip/Postal Code'), 'CheckoutPage.postalCode');
    this.continueButton = healable(page.getByTestId('continue'), 'CheckoutPage.continueButton');
    this.cancelButton = healable(page.getByTestId('cancel'), 'CheckoutPage.cancelButton');
    this.error = healable(page.getByTestId('error'), 'CheckoutPage.error');
    this.errorCloseButton = healable(page.getByTestId('error-button'), 'CheckoutPage.errorCloseButton');

    this.items = page.getByTestId('inventory-item');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.paymentInfo = healable(page.getByTestId('payment-info-value'), 'CheckoutPage.paymentInfo');
    this.shippingInfo = healable(page.getByTestId('shipping-info-value'), 'CheckoutPage.shippingInfo');
    this.subtotal = healable(page.getByTestId('subtotal-label'), 'CheckoutPage.subtotal');
    this.tax = healable(page.getByTestId('tax-label'), 'CheckoutPage.tax');
    this.total = healable(page.getByTestId('total-label'), 'CheckoutPage.total');
    this.finishButton = healable(page.getByTestId('finish'), 'CheckoutPage.finishButton');

    this.completeHeader = healable(page.getByTestId('complete-header'), 'CheckoutPage.completeHeader');
    this.completeText = healable(page.getByTestId('complete-text'), 'CheckoutPage.completeText');
    this.backHomeButton = healable(page.getByTestId('back-to-products'), 'CheckoutPage.backHomeButton');
  }

  async gotoInformation() {
    await this.page.goto('/checkout-step-one.html');
  }

  async fillInformation(firstName: string, lastName: string, postalCode: string) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }

  /** Item prices on the Overview screen as numbers, e.g. [29.99, 9.99]. */
  async readItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }
}
