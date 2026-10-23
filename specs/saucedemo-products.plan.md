# SauceDemo – Products Test Plan

## Application Overview

Swag Labs (https://www.saucedemo.com) is a demo e-commerce app. This plan covers only the PRODUCTS area: the inventory sort dropdown, the product detail page (/inventory-item.html?id=N) and the product-related defects of problem_user. Login, cart, checkout and logout are covered in specs/saucedemo-login-checkout.plan.md and are not repeated here. Behaviour was verified by live exploration on 2026-10-23 with standard_user / secret_sauce and problem_user / secret_sauce. Observed facts used as expectations: the sort select is data-test "product-sort-container" (role combobox) with options "Name (A to Z)" (az, default), "Name (Z to A)" (za), "Price (low to high)" (lohi), "Price (high to low)" (hilo); the selected label is mirrored in data-test "active-option"; products 0-5 map to Bike Light, Bolt T-Shirt, Onesie, Test.allTheThings() T-Shirt (Red), Backpack, Fleece Jacket; on the detail page the elements are data-test "inventory-item-name", "inventory-item-desc", "inventory-item-price", the image "item-<slug>-img", the action button "add-to-cart" / "remove" and the back button "back-to-products" (role button, name "Back to products"); the cart badge is data-test "shopping-cart-badge". Known quirks/bugs found during exploration are marked [KNOWN ISSUE] — tests for them should keep the correct (desired) assertion and be marked test.fail() with a // BUG: comment. Every scenario assumes a fresh browser context (no cookies/localStorage) and starts from the seed file navigating to https://www.saucedemo.com.

Reference product data (standard_user, default A to Z order):
1. Sauce Labs Backpack, $29.99, id=4, "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection."
2. Sauce Labs Bike Light, $9.99, id=0, "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included."
3. Sauce Labs Bolt T-Shirt, $15.99, id=1, "Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt."
4. Sauce Labs Fleece Jacket, $49.99, id=5, "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office."
5. Sauce Labs Onesie, $7.99, id=2, "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel."
6. Test.allTheThings() T-Shirt (Red), $15.99, id=3, "This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton."

## Test Scenarios

### 1. 1. Product sorting

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1. Sort dropdown default state and option labels

**File:** `tests/products/sort-options.spec.ts`

**Steps:**
  1. Log in as standard_user / secret_sauce
    - expect: URL is /inventory.html
    - expect: Sort select (data-test product-sort-container, role combobox) is visible
  2. Read the sort select options
    - expect: Exactly 4 options in this order: "Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)"
    - expect: Option values are az, za, lohi, hilo
    - expect: Selected option is "Name (A to Z)" (value az)
    - expect: active-option element shows "Name (A to Z)"

#### 1.2. 1.2. Default order is Name A to Z

**File:** `tests/products/sort-default-order.spec.ts`

**Steps:**
  1. Log in as standard_user and read product names and prices without touching the dropdown
    - expect: 6 products
    - expect: Order: Sauce Labs Backpack $29.99, Sauce Labs Bike Light $9.99, Sauce Labs Bolt T-Shirt $15.99, Sauce Labs Fleece Jacket $49.99, Sauce Labs Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99

#### 1.3. 1.3. Sort by Name (Z to A)

**File:** `tests/products/sort-name-za.spec.ts`

**Steps:**
  1. Log in as standard_user and select "Name (Z to A)"
    - expect: active-option shows "Name (Z to A)"
    - expect: Order: Test.allTheThings() T-Shirt (Red) $15.99, Sauce Labs Onesie $7.99, Sauce Labs Fleece Jacket $49.99, Sauce Labs Bolt T-Shirt $15.99, Sauce Labs Bike Light $9.99, Sauce Labs Backpack $29.99
    - expect: URL remains /inventory.html

#### 1.4. 1.4. Sort by Price (low to high)

**File:** `tests/products/sort-price-lohi.spec.ts`

**Steps:**
  1. Log in as standard_user and select "Price (low to high)"
    - expect: active-option shows "Price (low to high)"
    - expect: Order: Sauce Labs Onesie $7.99, Sauce Labs Bike Light $9.99, Sauce Labs Bolt T-Shirt $15.99, Test.allTheThings() T-Shirt (Red) $15.99, Sauce Labs Backpack $29.99, Sauce Labs Fleece Jacket $49.99
    - expect: Prices are non-decreasing; the two $15.99 items keep their original relative order (Bolt before Test.allTheThings)

#### 1.5. 1.5. Sort by Price (high to low)

**File:** `tests/products/sort-price-hilo.spec.ts`

**Steps:**
  1. Log in as standard_user and select "Price (high to low)"
    - expect: active-option shows "Price (high to low)"
    - expect: Order: Sauce Labs Fleece Jacket $49.99, Sauce Labs Backpack $29.99, Sauce Labs Bolt T-Shirt $15.99, Test.allTheThings() T-Shirt (Red) $15.99, Sauce Labs Bike Light $9.99, Sauce Labs Onesie $7.99
    - expect: Prices are non-increasing; the two $15.99 items keep Bolt before Test.allTheThings

#### 1.6. 1.6. Switching sort options repeatedly and returning to A to Z

**File:** `tests/products/sort-switch-back.spec.ts`

**Steps:**
  1. Log in, select "Name (Z to A)", then "Price (low to high)", then "Price (high to low)", then "Name (A to Z)"
    - expect: After each selection the order matches scenarios 1.3, 1.4, 1.5
    - expect: After returning to "Name (A to Z)" the order equals the default order from 1.2
    - expect: Always exactly 6 products, no duplicates

#### 1.7. 1.7. Sorting keeps cart state of products

**File:** `tests/products/sort-keeps-cart-state.spec.ts`

**Steps:**
  1. Log in, click Add to cart on Sauce Labs Backpack, then select "Price (high to low)"
    - expect: Cart badge still shows 1
    - expect: Backpack (second in the list) shows the "Remove" button; the other five products show "Add to cart"

### 2. 2. Product detail page

**Seed:** `tests/seed.spec.ts`

#### 2.1. 2.1. Open detail page via product name

**File:** `tests/products/detail-open-via-name.spec.ts`

**Steps:**
  1. Log in as standard_user and click the name "Sauce Labs Backpack" (data-test item-4-title-link)
    - expect: URL is /inventory-item.html?id=4
    - expect: Name (inventory-item-name) is "Sauce Labs Backpack"
    - expect: Description (inventory-item-desc) is "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection."
    - expect: Price (inventory-item-price) is "$29.99"
    - expect: Image data-test is item-sauce-labs-backpack-img with alt "Sauce Labs Backpack"
    - expect: Button text is "Add to cart" (data-test add-to-cart)
    - expect: Button "Back to products" (data-test back-to-products) is visible

#### 2.2. 2.2. Open detail page via product image

**File:** `tests/products/detail-open-via-image.spec.ts`

**Steps:**
  1. Log in as standard_user and click the image of "Sauce Labs Bike Light" (data-test inventory-item-sauce-labs-bike-light-img)
    - expect: URL is /inventory-item.html?id=0
    - expect: Name is "Sauce Labs Bike Light"
    - expect: Price is "$9.99"
    - expect: Description is "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included."

#### 2.3. 2.3. Every product detail page shows its own name, description and price

**File:** `tests/products/detail-content-all-products.spec.ts`

**Steps:**
  1. Log in as standard_user and, for each product on the inventory page, click its name and read the detail page
    - expect: Backpack id=4 / $29.99, Bike Light id=0 / $9.99, Bolt T-Shirt id=1 / $15.99, Fleece Jacket id=5 / $49.99, Onesie id=2 / $7.99, Test.allTheThings() T-Shirt (Red) id=3 / $15.99
    - expect: Name, description and price exactly match the Reference product data in the overview
    - expect: Detail image src matches the inventory image src for the same product (e.g. /assets/sauce-backpack-1200x1500-CjRW-Djj.jpg for the Backpack)

#### 2.4. 2.4. Add to cart on detail page updates badge and button

**File:** `tests/products/detail-add-to-cart.spec.ts`

**Steps:**
  1. Log in as standard_user, open Sauce Labs Bike Light (id=0) and click "Add to cart"
    - expect: Cart badge (shopping-cart-badge) shows 1
    - expect: Button text changes to "Remove" and data-test changes to remove
  2. Reload the page
    - expect: Badge still 1 and button still "Remove"

#### 2.5. 2.5. Remove on detail page updates badge and button

**File:** `tests/products/detail-remove-from-cart.spec.ts`

**Steps:**
  1. Log in, open Sauce Labs Bike Light detail, click "Add to cart" then click "Remove"
    - expect: Cart badge is no longer shown
    - expect: Button text is "Add to cart" again (data-test add-to-cart)

#### 2.6. 2.6. Detail page and inventory page stay in sync (add on inventory, remove on detail)

**File:** `tests/products/detail-sync-inventory-to-detail.spec.ts`

**Steps:**
  1. Log in, click Add to cart on Sauce Labs Backpack and Sauce Labs Bike Light on the inventory page
    - expect: Cart badge shows 2
  2. Open the Bike Light detail page
    - expect: Cart badge shows 2
    - expect: Button shows "Remove" (data-test remove)
  3. Click Remove, then click "Back to products"
    - expect: URL is /inventory.html
    - expect: Cart badge shows 1
    - expect: Bike Light button is "Add to cart", Backpack button is "Remove"
    - expect: Other four products show "Add to cart"

#### 2.7. 2.7. Detail page and inventory page stay in sync (add on detail, seen on inventory)

**File:** `tests/products/detail-sync-detail-to-inventory.spec.ts`

**Steps:**
  1. Log in, open Sauce Labs Bike Light detail page via image, click "Add to cart", click "Back to products"
    - expect: URL is /inventory.html
    - expect: Cart badge shows 1
    - expect: Bike Light button is "Remove"; other products show "Add to cart"
  2. Click Add to cart on Sauce Labs Backpack on the inventory page
    - expect: Cart badge shows 2

#### 2.8. 2.8. Back to products returns to inventory

**File:** `tests/products/detail-back-to-products.spec.ts`

**Steps:**
  1. Log in, open any product detail page and click "Back to products"
    - expect: URL is /inventory.html
    - expect: Title "Products" and 6 products are shown

#### 2.9. 2.9. Back to products resets the sort order to Name (A to Z)

**File:** `tests/products/detail-back-resets-sort.spec.ts`

**Steps:**
  1. Log in, select "Price (high to low)", open Sauce Labs Fleece Jacket (item-5-title-link) and click "Back to products"
    - expect: URL is /inventory.html
    - expect: Sort select value is az ("Name (A to Z)")
    - expect: First product is Sauce Labs Backpack (sort is not preserved)

#### 2.10. 2.10. Detail page for an unknown id shows Item Not Found

**File:** `tests/products/detail-unknown-id.spec.ts`

**Steps:**
  1. Log in as standard_user and navigate to /inventory-item.html?id=99
    - expect: Heading "ITEM NOT FOUND" is shown
    - expect: Message "We're sorry, but your call could not be completed as dialled. Please check your number, and try your call again. If you are in need of assistance, please dial 0 to be connected with an operator. This is a recording. 4 T 1."
    - expect: "Back to products" button is visible
  2. Navigate to /inventory-item.html?id=abc
    - expect: Same "ITEM NOT FOUND" content is shown

#### 2.11. 2.11. [KNOWN ISSUE] Item Not Found page shows a bogus price and an Add to cart button

**File:** `tests/products/detail-unknown-id-bogus-content.spec.ts`

**Steps:**
  1. Log in as standard_user and navigate to /inventory-item.html?id=99
    - expect: Desired: only the error message and the Back to products button; no price and no purchasable item
    - expect: Observed: price text "$√-1" and an "Add to cart" button are displayed under the error message

#### 2.12. 2.12. Detail page is protected without login

**File:** `tests/products/detail-protected.spec.ts`

**Steps:**
  1. In a fresh context navigate directly to https://www.saucedemo.com/inventory-item.html?id=4
    - expect: User is redirected to /
    - expect: Error "Epic sadface: You can only access '/inventory-item.html' when you are logged in." is shown
    - expect: Login form is visible

### 3. 3. problem_user product defects

**Seed:** `tests/seed.spec.ts`

#### 3.1. 3.1. [KNOWN ISSUE] problem_user: all product images are the same placeholder

**File:** `tests/products/problem-user-images.spec.ts`

**Steps:**
  1. Log in as problem_user / secret_sauce
    - expect: Inventory page shown with 6 products, names and prices correct, no cart badge
  2. Read the src of each product image
    - expect: Desired: each product shows its own image (e.g. Backpack /assets/sauce-backpack-1200x1500-CjRW-Djj.jpg, Bike Light /assets/bike-light-1200x1500-DxcZRFOA.jpg, Bolt /assets/bolt-shirt-1200x1500-mR0ldpVS.jpg, Fleece /assets/sauce-pullover-1200x1500-BfbI-PSd.jpg, Onesie /assets/red-onesie-1200x1500-BrSuq0ic.jpg, Test.allTheThings /assets/red-tatt-1200x1500-E-qp6aYf.jpg)
    - expect: Observed: all 6 images use /assets/sl-404-Cq1a9k9X.jpg (a 404 dog placeholder)

#### 3.2. 3.2. [KNOWN ISSUE] problem_user: sort dropdown does nothing

**File:** `tests/products/problem-user-sorting.spec.ts`

**Steps:**
  1. Log in as problem_user and select "Name (Z to A)"
    - expect: Desired: order is Test.allTheThings() T-Shirt (Red), Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack and the select shows "Name (Z to A)"
    - expect: Observed: select snaps back to "Name (A to Z)" (active-option stays "Name (A to Z)") and the order stays A to Z
  2. Select "Price (low to high)" and then "Price (high to low)"
    - expect: Desired: orders match scenarios 1.4 and 1.5
    - expect: Observed: select stays on "Name (A to Z)" and the order is unchanged: Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red)

#### 3.3. 3.3. [KNOWN ISSUE] problem_user: product links open the wrong product (off by one)

**File:** `tests/products/problem-user-detail-wrong-product.spec.ts`

**Steps:**
  1. Log in as problem_user and click the name "Sauce Labs Backpack" (item-4-title-link)
    - expect: Desired: URL /inventory-item.html?id=4 and the Backpack detail page ($29.99)
    - expect: Observed: URL is /inventory-item.html?id=5 and the page shows Sauce Labs Fleece Jacket, $49.99
  2. From the inventory page click the image of each other product (item-N-img-link) and compare
    - expect: Desired: each link opens its own product
    - expect: Observed: Bike Light (id 0) opens id=1 Sauce Labs Bolt T-Shirt $15.99; Bolt T-Shirt (id 1) opens id=2 Sauce Labs Onesie $7.99; Onesie (id 2) opens id=3 Test.allTheThings() T-Shirt (Red) $15.99; Test.allTheThings() (id 3) opens id=4 Sauce Labs Backpack $29.99; Fleece Jacket (id 5) opens id=6

#### 3.4. 3.4. [KNOWN ISSUE] problem_user: Fleece Jacket link opens a broken detail page

**File:** `tests/products/problem-user-fleece-jacket-404.spec.ts`

**Steps:**
  1. Log in as problem_user and click the name or image of Sauce Labs Fleece Jacket
    - expect: Desired: Fleece Jacket detail page, $49.99, id=5
    - expect: Observed: URL /inventory-item.html?id=6, name "ITEM NOT FOUND", price "$√-1", image /assets/sl-404-Cq1a9k9X.jpg, and an "Add to cart" button is still shown

#### 3.5. 3.5. [KNOWN ISSUE] problem_user: Add to cart works only for Backpack, Bike Light and Onesie on inventory page

**File:** `tests/products/problem-user-add-to-cart.spec.ts`

**Steps:**
  1. Log in as problem_user and click Add to cart on each of the six products one at a time, checking badge and button after each click
    - expect: Desired: every click turns that button to "Remove" and increases the badge by 1 (final badge 6)
    - expect: Observed: Backpack (badge 1), Bike Light (badge 2) and Onesie (badge 3) change to "Remove"
    - expect: Observed: Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt (Red) stay "Add to cart" and the badge does not change; localStorage cart-contents is [4,0,2]

#### 3.6. 3.6. [KNOWN ISSUE] problem_user: Remove does nothing on inventory page

**File:** `tests/products/problem-user-remove-inventory.spec.ts`

**Steps:**
  1. Log in as problem_user, add Backpack, Bike Light and Onesie, then click Remove on each
    - expect: Desired: each button returns to "Add to cart" and the badge goes 3 -> 2 -> 1 -> none
    - expect: Observed: buttons stay "Remove" and the badge stays 3

#### 3.7. 3.7. [KNOWN ISSUE] problem_user: detail page Add to cart / Remove broken

**File:** `tests/products/problem-user-detail-add-remove.spec.ts`

**Steps:**
  1. Log in as problem_user and open /inventory-item.html?id=1 (Bolt T-Shirt), id=3 (Test.allTheThings()) and id=5 (Fleece Jacket) in turn, clicking Add to cart on each
    - expect: Desired: button becomes "Remove" and badge increments
    - expect: Observed: button stays "Add to cart" and badge is unchanged on all three
  2. Open /inventory-item.html?id=0 (Bike Light, correct product by direct URL), click Add to cart, then click Remove
    - expect: Add works: button becomes "Remove", badge 1
    - expect: Desired: Remove returns the button to "Add to cart" and clears the badge
    - expect: Observed: Remove does nothing, button stays "Remove" and badge is unchanged

#### 3.8. 3.8. problem_user: items that can be added appear in the cart and can be removed there

**File:** `tests/products/problem-user-cart-remove.spec.ts`

**Steps:**
  1. Log in as problem_user, add Backpack, Bike Light and Onesie from the inventory page and open the cart
    - expect: Cart lists Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Onesie
  2. Click Remove on Sauce Labs Bike Light in the cart
    - expect: Bike Light disappears from the list; badge shows 2; Onesie ($7.99) and Backpack ($29.99) remain

#### 3.9. 3.9. problem_user: names, prices and Back to products behave correctly

**File:** `tests/products/problem-user-names-prices-back.spec.ts`

**Steps:**
  1. Log in as problem_user and read names and prices on the inventory page
    - expect: Same names and prices as standard_user in A to Z order (Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99)
  2. Open /inventory-item.html?id=4 directly and click "Back to products"
    - expect: Detail shows Sauce Labs Backpack $29.99 with its own image
    - expect: URL becomes /inventory.html
