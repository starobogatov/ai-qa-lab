export const PRODUCTS = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
} as const;

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export const CUSTOMER: CustomerInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};
