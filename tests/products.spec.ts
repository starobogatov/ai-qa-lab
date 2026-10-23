// spec: specs/saucedemo-products.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from './pages/InventoryPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { LOGIN_ERRORS, LoginPage } from './pages/LoginPage';
import { authFile, LOGGED_OUT } from './support/auth';
import { PRODUCTS, SORT_OPTIONS } from './support/data';

type ProductDetails = {
  name: string;
  id: number;
  price: string;
  description: string;
  imageSrc: string;
};

const CATALOG: ProductDetails[] = [
  {
    name: PRODUCTS.backpack,
    id: 4,
    price: '$29.99',
    description:
      'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    imageSrc: '/assets/sauce-backpack-1200x1500-CjRW-Djj.jpg',
  },
  {
    name: PRODUCTS.bikeLight,
    id: 0,
    price: '$9.99',
    description:
      "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
    imageSrc: '/assets/bike-light-1200x1500-DxcZRFOA.jpg',
  },
  {
    name: PRODUCTS.boltTShirt,
    id: 1,
    price: '$15.99',
    description:
      'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
    imageSrc: '/assets/bolt-shirt-1200x1500-mR0ldpVS.jpg',
  },
  {
    name: PRODUCTS.fleeceJacket,
    id: 5,
    price: '$49.99',
    description:
      "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
    imageSrc: '/assets/sauce-pullover-1200x1500-BfbI-PSd.jpg',
  },
  {
    name: PRODUCTS.onesie,
    id: 2,
    price: '$7.99',
    description:
      "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
    imageSrc: '/assets/red-onesie-1200x1500-BrSuq0ic.jpg',
  },
  {
    name: PRODUCTS.redTShirt,
    id: 3,
    price: '$15.99',
    description:
      'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
    imageSrc: '/assets/red-tatt-1200x1500-E-qp6aYf.jpg',
  },
];

const ALL_NAMES = CATALOG.map((product) => product.name);

const SORTED_NAMES: Record<string, string[]> = {
  [SORT_OPTIONS.nameAscending]: ALL_NAMES,
  [SORT_OPTIONS.nameDescending]: [
    PRODUCTS.redTShirt,
    PRODUCTS.onesie,
    PRODUCTS.fleeceJacket,
    PRODUCTS.boltTShirt,
    PRODUCTS.bikeLight,
    PRODUCTS.backpack,
  ],
  // The two $15.99 shirts keep their A to Z order (Bolt first) in both price sorts.
  [SORT_OPTIONS.priceAscending]: [
    PRODUCTS.onesie,
    PRODUCTS.bikeLight,
    PRODUCTS.boltTShirt,
    PRODUCTS.redTShirt,
    PRODUCTS.backpack,
    PRODUCTS.fleeceJacket,
  ],
  [SORT_OPTIONS.priceDescending]: [
    PRODUCTS.fleeceJacket,
    PRODUCTS.backpack,
    PRODUCTS.boltTShirt,
    PRODUCTS.redTShirt,
    PRODUCTS.bikeLight,
    PRODUCTS.onesie,
  ],
};

const NON_DEFAULT_SORT_OPTIONS = [
  SORT_OPTIONS.nameDescending,
  SORT_OPTIONS.priceAscending,
  SORT_OPTIONS.priceDescending,
];

const NOT_FOUND = {
  name: 'ITEM NOT FOUND',
  description:
    "We're sorry, but your call could not be completed as dialled. Please check your number, and try your call again. If you are in need of assistance, please dial 0 to be connected with an operator. This is a recording. 4 T 1.",
};

function productNamed(name: string): ProductDetails {
  return CATALOG.find((product) => product.name === name)!;
}

function pricesOf(names: string[]): string[] {
  return names.map((name) => productNamed(name).price);
}

function detailUrl(id: number | string): RegExp {
  return new RegExp(`/inventory-item\\.html\\?id=${id}$`);
}

async function expectSortedBy(inventory: InventoryPage, label: string) {
  await expect(inventory.activeSortOption).toHaveText(label);
  await expect(inventory.itemNames).toHaveText(SORTED_NAMES[label]);
  await expect(inventory.itemPrices).toHaveText(pricesOf(SORTED_NAMES[label]));
}

async function expectProductDetails(product: ProductPage, expected: ProductDetails) {
  await expect(product.page).toHaveURL(detailUrl(expected.id));
  await expect(product.container).toBeVisible();
  await expect(product.name).toHaveText(expected.name);
  await expect(product.description).toHaveText(expected.description);
  await expect(product.price).toHaveText(expected.price);
  await expect(product.image).toHaveAttribute('src', expected.imageSrc);
}

test.describe('Product sorting', () => {
  let inventory: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    await inventory.goto();
  });

  test('Sort dropdown defaults to Name (A to Z)', async () => {
    await expect(inventory.sortSelect).toBeVisible();
    await expect(inventory.sortOptions).toHaveText(Object.values(SORT_OPTIONS));
    await expect(inventory.sortSelect).toHaveValue('az');
    await expect(inventory.activeSortOption).toHaveText(SORT_OPTIONS.nameAscending);
  });

  test('Default order is Name (A to Z)', async () => {
    await expect(inventory.items).toHaveCount(CATALOG.length);
    await expectSortedBy(inventory, SORT_OPTIONS.nameAscending);
  });

  for (const label of NON_DEFAULT_SORT_OPTIONS) {
    test(`Sort by ${label}`, async ({ page }) => {
      await inventory.sortBy(label);
      await expectSortedBy(inventory, label);
      await expect(page).toHaveURL(InventoryPage.url);
    });
  }

  test('Switching sort options repeatedly and returning to A to Z', async () => {
    for (const label of [...NON_DEFAULT_SORT_OPTIONS, SORT_OPTIONS.nameAscending]) {
      await test.step(`Select ${label}`, async () => {
        await inventory.sortBy(label);
        await expectSortedBy(inventory, label);
      });
    }
  });

  test('Sorting keeps cart state of products', async () => {
    await test.step('Add the backpack', async () => {
      await inventory.addToCart(PRODUCTS.backpack);
      await expect(inventory.cartBadge).toHaveText('1');
    });

    await test.step('Sort by price, high to low', async () => {
      await inventory.sortBy(SORT_OPTIONS.priceDescending);
      await expectSortedBy(inventory, SORT_OPTIONS.priceDescending);
    });

    await test.step('Cart badge and buttons are unchanged', async () => {
      await expect(inventory.cartBadge).toHaveText('1');
      await expect(inventory.removeButton(PRODUCTS.backpack)).toBeVisible();
      for (const name of ALL_NAMES.filter((name) => name !== PRODUCTS.backpack)) {
        await expect(inventory.addToCartButton(name)).toBeVisible();
      }
    });
  });
});

test.describe('Product detail page', () => {
  let inventory: InventoryPage;
  let product: ProductPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    product = new ProductPage(page);
  });

  for (const expected of CATALOG) {
    test(`Product name opens the detail page of ${expected.name}`, async () => {
      await inventory.goto();
      await inventory.titleLink(expected.name).click();
      await expectProductDetails(product, expected);
      await expect(product.image).toHaveAttribute('alt', expected.name);
      await expect(product.addToCartButton).toBeVisible();
      await expect(product.backButton).toBeVisible();
    });
  }

  test('Product image opens the detail page', async () => {
    await inventory.goto();
    await inventory.image(PRODUCTS.bikeLight).click();
    await expectProductDetails(product, productNamed(PRODUCTS.bikeLight));
  });

  test('Add to cart on detail page updates badge and button', async ({ page }) => {
    await product.goto(productNamed(PRODUCTS.bikeLight).id);

    await test.step('Add the bike light', async () => {
      await product.addToCart();
      await expect(product.header.cartBadge).toHaveText('1');
      await expect(product.removeButton).toBeVisible();
    });

    await test.step('Reload keeps the cart state', async () => {
      await page.reload();
      await expect(product.header.cartBadge).toHaveText('1');
      await expect(product.removeButton).toBeVisible();
    });
  });

  test('Remove on detail page updates badge and button', async () => {
    await product.goto(productNamed(PRODUCTS.bikeLight).id);
    await product.addToCart();
    await expect(product.header.cartBadge).toHaveText('1');

    await product.remove();
    await expect(product.header.cartBadge).toBeHidden();
    await expect(product.addToCartButton).toBeVisible();
  });

  test('Remove on detail page is reflected on the inventory page', async ({ page }) => {
    await test.step('Add two items on the inventory page', async () => {
      await inventory.goto();
      await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
      await expect(inventory.cartBadge).toHaveText('2');
    });

    await test.step('Open the bike light', async () => {
      await inventory.titleLink(PRODUCTS.bikeLight).click();
      await expect(product.name).toHaveText(PRODUCTS.bikeLight);
      await expect(product.header.cartBadge).toHaveText('2');
      await expect(product.removeButton).toBeVisible();
    });

    await test.step('Remove it and go back to products', async () => {
      await product.remove();
      await product.backToProducts();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.cartBadge).toHaveText('1');
      await expect(inventory.removeButton(PRODUCTS.backpack)).toBeVisible();
      for (const name of ALL_NAMES.filter((name) => name !== PRODUCTS.backpack)) {
        await expect(inventory.addToCartButton(name)).toBeVisible();
      }
    });
  });

  test('Add on detail page is reflected on the inventory page', async ({ page }) => {
    await test.step('Add the bike light from its detail page', async () => {
      await inventory.goto();
      await inventory.image(PRODUCTS.bikeLight).click();
      await expect(product.name).toHaveText(PRODUCTS.bikeLight);
      await product.addToCart();
      await product.backToProducts();
    });

    await test.step('Inventory shows the bike light in the cart', async () => {
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.cartBadge).toHaveText('1');
      await expect(inventory.removeButton(PRODUCTS.bikeLight)).toBeVisible();
      for (const name of ALL_NAMES.filter((name) => name !== PRODUCTS.bikeLight)) {
        await expect(inventory.addToCartButton(name)).toBeVisible();
      }
    });

    await test.step('Add the backpack on the inventory page', async () => {
      await inventory.addToCart(PRODUCTS.backpack);
      await expect(inventory.cartBadge).toHaveText('2');
    });
  });

  test('Back to products returns to inventory and resets the sort order', async ({ page }) => {
    await test.step('Sort by price, high to low and open the fleece jacket', async () => {
      await inventory.goto();
      await inventory.sortBy(SORT_OPTIONS.priceDescending);
      await inventory.titleLink(PRODUCTS.fleeceJacket).click();
      await expect(product.name).toHaveText(PRODUCTS.fleeceJacket);
    });

    await test.step('Go back to products', async () => {
      await product.backToProducts();
      await expect(page).toHaveURL(InventoryPage.url);
      await expect(inventory.title).toHaveText('Products');
      await expect(inventory.items).toHaveCount(CATALOG.length);
      await expect(inventory.sortSelect).toHaveValue('az');
      await expectSortedBy(inventory, SORT_OPTIONS.nameAscending);
    });
  });

  for (const unknownId of ['99', 'abc']) {
    test(`Unknown id ${unknownId} shows Item Not Found`, async () => {
      await product.goto(unknownId);
      await expect(product.name).toHaveText(NOT_FOUND.name);
      await expect(product.description).toHaveText(NOT_FOUND.description);
      await expect(product.backButton).toBeVisible();
    });
  }

  test('Item Not Found page offers nothing to buy', async () => {
    // BUG: the Item Not Found page shows the price "$√-1" and an "Add to cart" button.
    test.fail();

    await product.goto(99);
    await expect(product.name).toHaveText(NOT_FOUND.name);
    await expect(product.price).toBeHidden();
    await expect(product.addToCartButton).toBeHidden();
  });

  test.describe('without login', () => {
    test.use({ storageState: LOGGED_OUT });

    test('Detail page is protected', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await product.goto(productNamed(PRODUCTS.backpack).id);
      await expect(page).toHaveURL(LoginPage.url);
      await expect(loginPage.error).toHaveText(LOGIN_ERRORS.loginRequired('/inventory-item.html'));
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});

test.describe('problem_user product defects', () => {
  test.use({ storageState: authFile('problem_user') });

  let inventory: InventoryPage;
  let product: ProductPage;

  test.beforeEach(async ({ page }) => {
    inventory = new InventoryPage(page);
    product = new ProductPage(page);
  });

  test('Every product shows its own image', async () => {
    // BUG: all six product images use the 404 dog placeholder /assets/sl-404-Cq1a9k9X.jpg.
    test.fail();

    await inventory.goto();
    await expect(inventory.itemNames).toHaveText(ALL_NAMES);
    await expect(inventory.cartBadge).toBeHidden();
    for (const expected of CATALOG) {
      await expect(inventory.image(expected.name)).toHaveAttribute('src', expected.imageSrc);
    }
  });

  for (const label of NON_DEFAULT_SORT_OPTIONS) {
    test(`Sort by ${label} works`, async () => {
      // BUG: the select snaps back to "Name (A to Z)" and the order stays A to Z.
      test.fail();

      await inventory.goto();
      await inventory.sortBy(label);
      await expectSortedBy(inventory, label);
    });
  }

  for (const expected of CATALOG) {
    test(`Product link opens the detail page of ${expected.name}`, async () => {
      // BUG: every link opens the product with the next id (Backpack id 4 opens
      // Fleece Jacket id 5); Fleece Jacket opens id=6, an ITEM NOT FOUND page.
      test.fail();

      await inventory.goto();
      await inventory.titleLink(expected.name).click();
      await expectProductDetails(product, expected);
    });
  }

  test('Add to cart works for every product on the inventory page', async () => {
    // BUG: only Backpack, Bike Light and Onesie can be added; the buttons of Bolt
    // T-Shirt, Fleece Jacket and Test.allTheThings() stay "Add to cart" and the badge stays 3.
    test.fail();

    await inventory.goto();
    for (const [index, name] of ALL_NAMES.entries()) {
      await test.step(`Add ${name}`, async () => {
        await inventory.addToCart(name);
        await expect(inventory.removeButton(name)).toBeVisible();
        await expect(inventory.cartBadge).toHaveText(String(index + 1));
      });
    }
  });

  test('Remove works on the inventory page', async () => {
    // BUG: Remove does nothing; the buttons stay "Remove" and the badge stays 3.
    test.fail();

    const addableProducts = [PRODUCTS.backpack, PRODUCTS.bikeLight, PRODUCTS.onesie];

    await test.step('Add the three products that can be added', async () => {
      await inventory.goto();
      await inventory.addToCart(...addableProducts);
      await expect(inventory.cartBadge).toHaveText('3');
    });

    for (const [index, name] of addableProducts.entries()) {
      await test.step(`Remove ${name}`, async () => {
        await inventory.removeButton(name).click();
        await expect(inventory.addToCartButton(name)).toBeVisible();
        const remaining = addableProducts.length - index - 1;
        if (remaining > 0) {
          await expect(inventory.cartBadge).toHaveText(String(remaining));
        } else {
          await expect(inventory.cartBadge).toBeHidden();
        }
      });
    }
  });

  test('Add to cart works on the detail page', async () => {
    // BUG: on the Bolt T-Shirt, Test.allTheThings() and Fleece Jacket detail pages
    // the button stays "Add to cart" and no badge appears.
    test.fail();

    const brokenProducts = [PRODUCTS.boltTShirt, PRODUCTS.redTShirt, PRODUCTS.fleeceJacket];
    for (const [index, name] of brokenProducts.entries()) {
      await test.step(`Add ${name}`, async () => {
        await product.goto(productNamed(name).id);
        await expect(product.name).toHaveText(name);
        await product.addToCart();
        await expect(product.removeButton).toBeVisible();
        await expect(product.header.cartBadge).toHaveText(String(index + 1));
      });
    }
  });

  test('Remove works on the detail page', async () => {
    // BUG: Remove does nothing; the button stays "Remove" and the badge stays 1.
    test.fail();

    await test.step('Add the bike light', async () => {
      await product.goto(productNamed(PRODUCTS.bikeLight).id);
      await expect(product.name).toHaveText(PRODUCTS.bikeLight);
      await product.addToCart();
      await expect(product.removeButton).toBeVisible();
      await expect(product.header.cartBadge).toHaveText('1');
    });

    await test.step('Remove the bike light', async () => {
      await product.remove();
      await expect(product.addToCartButton).toBeVisible();
      await expect(product.header.cartBadge).toBeHidden();
    });
  });

  test('Items added to the cart can be removed in the cart', async ({ page }) => {
    const cart = new CartPage(page);

    await test.step('Add three products and open the cart', async () => {
      await inventory.goto();
      await inventory.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight, PRODUCTS.onesie);
      await inventory.openCart();
      await expect(cart.items).toHaveCount(3);
      await expect(cart.item(PRODUCTS.backpack)).toBeVisible();
      await expect(cart.item(PRODUCTS.bikeLight)).toBeVisible();
      await expect(cart.item(PRODUCTS.onesie)).toBeVisible();
    });

    await test.step('Remove the bike light', async () => {
      await cart.remove(PRODUCTS.bikeLight);
      await expect(cart.item(PRODUCTS.bikeLight)).toHaveCount(0);
      await expect(cart.header.cartBadge).toHaveText('2');
      await expect(cart.price(PRODUCTS.onesie)).toHaveText(productNamed(PRODUCTS.onesie).price);
      await expect(cart.price(PRODUCTS.backpack)).toHaveText(productNamed(PRODUCTS.backpack).price);
    });
  });

  test('Names, prices and Back to products behave correctly', async ({ page }) => {
    await test.step('Inventory shows the same names and prices as standard_user', async () => {
      await inventory.goto();
      await expect(inventory.itemNames).toHaveText(ALL_NAMES);
      await expect(inventory.itemPrices).toHaveText(pricesOf(ALL_NAMES));
    });

    await test.step('Backpack detail page opened by URL is correct', async () => {
      await product.goto(productNamed(PRODUCTS.backpack).id);
      await expectProductDetails(product, productNamed(PRODUCTS.backpack));
    });

    await test.step('Back to products returns to inventory', async () => {
      await product.backToProducts();
      await expect(page).toHaveURL(InventoryPage.url);
    });
  });
});
