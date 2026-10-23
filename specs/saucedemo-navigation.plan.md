# SauceDemo – Navigation & App State Test Plan

## Application Overview

Swag Labs (https://www.saucedemo.com) is a demo e-commerce app. This plan covers navigation and app-state features that the login/checkout plan (specs/saucedemo-login-checkout.plan.md) does not: the burger menu (open/close, item texts, All Items, About, Reset App State) and the page footer (social links, copyright). Logout (1.13 there) and cart/checkout basics are not repeated here. Behaviour was verified by live exploration on 2026-10-23 as standard_user / secret_sauce. Observed facts used as expectations: the burger menu contains five top-level items in this order: "All Items", "Dynamic Catalog", "About", "Logout", "Reset App State"; the menu panel (`.bm-menu-wrap`) has aria-hidden="true" and the `hidden` attribute while closed, and aria-hidden="false" while open; "About" is a plain link to "https://saucelabs.com/" with no target attribute; the footer has three social links ("X", "Facebook", "LinkedIn"), each with target="_blank" and rel="noreferrer"; the cart link's accessible name is "Cart, empty" or "Cart, N items"; cart state lives in localStorage key "cart-contents" (e.g. "[4,0]" for Backpack + Bike Light) and Reset App State removes that key. The former Twitter footer link is now "X" pointing to https://x.com/saucelabs. Known bugs found during exploration are marked [KNOWN ISSUE]: the test asserts the correct behaviour, is marked test.fail(), and carries a `// BUG:` comment describing what actually happens. Every scenario starts logged in as standard_user (storageState from auth.setup.ts) with an empty cart.

## Test Scenarios

### 1. Burger menu

**Seed:** `tests/seed.spec.ts`

#### 1.1. Menu opens and closes with the X button

**File:** `tests/navigation/menu-open-close.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com/inventory.html
    - expect: "Open Menu" button is visible
    - expect: Menu items are not visible (menu panel is hidden)
  2. Click the "Open Menu" button
    - expect: Menu panel is visible
    - expect: "Close Menu" (X) button is visible
    - expect: "All Items" menu item is visible
  3. Click the "Close Menu" (X) button
    - expect: Menu panel is hidden again
    - expect: "All Items" menu item is not visible
  4. Click the "Open Menu" button again
    - expect: Menu panel is visible again (menu can be reopened)

#### 1.2. Menu lists the expected items in order

**File:** `tests/navigation/menu-items.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and click "Open Menu"
    - expect: Exactly 5 top-level menu items are shown, in order: "All Items", "Dynamic Catalog", "About", "Logout", "Reset App State"
    - expect: "All Items", "Dynamic Catalog", "Logout" and "Reset App State" have role button
    - expect: "About" has role link

#### 1.3. "All Items" from the cart page returns to inventory

**File:** `tests/navigation/all-items-from-cart.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and click the cart link
    - expect: URL is /cart.html
    - expect: Title "Your Cart"
  2. Open the menu and click "All Items"
    - expect: URL is /inventory.html
    - expect: Title "Products"
    - expect: 6 products are listed
    - expect: Menu panel is closed

#### 1.4. "All Items" from a product detail page returns to inventory

**File:** `tests/navigation/all-items-from-product.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and click the "Sauce Labs Backpack" title
    - expect: URL is /inventory-item.html?id=4
    - expect: Product name "Sauce Labs Backpack" is shown
    - expect: "Back to products" button is visible
  2. Open the menu and click "All Items"
    - expect: URL is /inventory.html
    - expect: Title "Products"
    - expect: Menu panel is closed

#### 1.5. "About" links to the Sauce Labs website

**File:** `tests/navigation/about-link.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and click "Open Menu"
    - expect: "About" link has href "https://saucelabs.com/"
    - expect: "About" link has no target attribute (opens in the same tab)
  2. Do not follow the link (external site is out of scope)

#### 1.6. Menu is available on cart and checkout pages

**File:** `tests/navigation/menu-on-all-pages.spec.ts`

**Steps:**
  1. Navigate to /cart.html, click "Open Menu"
    - expect: Menu panel is visible with the 5 items
  2. Add Sauce Labs Backpack, open cart, click Checkout (/checkout-step-one.html, "Checkout: Your Information"), click "Open Menu"
    - expect: Menu panel is visible with the 5 items
  3. Close the menu, fill First Name "John", Last Name "Doe", Postal Code "12345", click Continue (/checkout-step-two.html, "Checkout: Overview"), click "Open Menu"
    - expect: Menu panel is visible
  4. Click "All Items"
    - expect: URL is /inventory.html
    - expect: Cart badge still shows 1 (leaving checkout via the menu keeps the cart)

### 2. Reset App State

**Seed:** `tests/seed.spec.ts`

#### 2.1. Reset clears the cart badge and storage

**File:** `tests/app-state/reset-clears-cart.spec.ts`

**Steps:**
  1. Navigate to /inventory.html, add "Sauce Labs Backpack" and "Sauce Labs Bike Light"
    - expect: Cart badge shows 2
    - expect: Cart link accessible name is "Cart, 2 items"
  2. Open the menu and click "Reset App State"
    - expect: Cart badge is not shown
    - expect: Cart link accessible name is "Cart, empty"
    - expect: localStorage "cart-contents" is removed (null)
    - expect: URL stays /inventory.html and the user stays logged in
    - expect: Observed: the menu stays open after the reset (it does not close automatically)

#### 2.2. [KNOWN ISSUE] Inventory buttons stay "Remove" after reset until reload

**File:** `tests/app-state/reset-inventory-buttons.spec.ts`

**Steps:**
  1. Navigate to /inventory.html, add "Sauce Labs Backpack" and "Sauce Labs Bike Light"
    - expect: Both buttons show "Remove"
  2. Open the menu and click "Reset App State" (no reload)
    - expect: Backpack and Bike Light buttons show "Add to cart" (correct expectation, assert this with test.fail())
    - expect: Observed: both buttons still show "Remove" (data-test remove-sauce-labs-backpack / remove-sauce-labs-bike-light) while the badge is gone and the cart is empty
  3. Reload the page
    - expect: All 6 buttons show "Add to cart"
    - expect: No cart badge

#### 2.3. [KNOWN ISSUE] Cart page still lists items after reset until reload

**File:** `tests/app-state/reset-cart-page.spec.ts`

**Steps:**
  1. Navigate to /inventory.html, add "Sauce Labs Backpack" and "Sauce Labs Bike Light", open the cart
    - expect: Both items are listed, cart badge shows 2
  2. Open the menu and click "Reset App State" (no reload)
    - expect: Cart badge is not shown
    - expect: Cart list is empty (correct expectation, assert this with test.fail())
    - expect: Observed: both "Sauce Labs Backpack" and "Sauce Labs Bike Light" are still listed while the badge is gone and localStorage "cart-contents" is null
  3. Reload /cart.html
    - expect: Cart list is empty
    - expect: No cart badge

#### 2.4. Cart page is empty after reset when navigating to it

**File:** `tests/app-state/reset-then-open-cart.spec.ts`

**Steps:**
  1. Navigate to /inventory.html, add "Sauce Labs Backpack" and "Sauce Labs Bike Light"
  2. Open the menu, click "Reset App State", then click the cart link
    - expect: URL is /cart.html
    - expect: Cart list is empty
    - expect: No cart badge
  3. Click Continue Shopping
    - expect: URL is /inventory.html
    - expect: All buttons show "Add to cart" (state is correct once the inventory page re-renders)

### 3. Footer

**Seed:** `tests/seed.spec.ts`

#### 3.1. Social links point to Sauce Labs profiles and open in a new tab

**File:** `tests/navigation/footer-social-links.spec.ts`

**Steps:**
  1. Navigate to /inventory.html
    - expect: Footer is visible
    - expect: Link "X" has href "https://x.com/saucelabs", target "_blank", rel "noreferrer"
    - expect: Link "Facebook" has href "https://www.facebook.com/saucelabs", target "_blank", rel "noreferrer"
    - expect: Link "LinkedIn" has href "https://www.linkedin.com/company/sauce-labs/", target "_blank", rel "noreferrer"
  2. Do not follow the links (external sites are out of scope)

#### 3.2. Copyright text

**File:** `tests/navigation/footer-copyright.spec.ts`

**Steps:**
  1. Navigate to /inventory.html
    - expect: Footer copyright text is exactly "© 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy"
    - expect: "Terms of Service" and "Privacy Policy" are plain text, not links

#### 3.3. Footer is shown on cart and checkout pages

**File:** `tests/navigation/footer-on-all-pages.spec.ts`

**Steps:**
  1. Navigate to /cart.html, then /checkout-step-one.html
    - expect: On each page the footer with the "X", "Facebook" and "LinkedIn" links and the copyright text is visible
