export const PRODUCTS = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
} as const;

export const SORT_OPTIONS = {
  nameAscending: 'Name (A to Z)',
  nameDescending: 'Name (Z to A)',
  priceAscending: 'Price (low to high)',
  priceDescending: 'Price (high to low)',
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
