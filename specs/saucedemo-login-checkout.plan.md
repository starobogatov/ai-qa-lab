# SauceDemo – Login & Checkout Test Plan

## Application Overview

Swag Labs (https://www.saucedemo.com) is a demo e-commerce app. Users log in with one of the listed usernames (standard_user, locked_out_user, problem_user, performance_glitch_user, error_user, visual_user) and the shared password secret_sauce. This plan covers authentication (positive, negative, session/route guards) and the purchase flow: cart → Checkout: Your Information (step one) → Checkout: Overview (step two) → Checkout: Complete!. Behaviour was verified by live exploration on 2026-10-18. Observed facts used as expectations: tax is 8% of item total; payment shows "SauceCard #31337"; shipping shows "Free Pony Express Delivery!"; cart state lives in localStorage key "cart-contents". Known quirks/bugs found during exploration are marked [KNOWN ISSUE] — tests for them should assert the observed behaviour or be marked test.fail() depending on team policy. Every scenario assumes a fresh browser context (no cookies/localStorage) and starts from the seed file navigating to https://www.saucedemo.com.

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Valid login with standard_user

**File:** `tests/login/valid-login.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com
    - expect: Login form with Username, Password fields and Login button is visible
  2. Fill Username with "standard_user" and Password with "secret_sauce"
  3. Click Login
    - expect: URL is /inventory.html
    - expect: Page title header shows "Products"
    - expect: 6 products are listed
    - expect: Cart badge is not shown

#### 1.2. Login by pressing Enter in password field

**File:** `tests/login/login-enter-key.spec.ts`

**Steps:**
  1. Fill Username "standard_user", Password "secret_sauce" and press Enter
    - expect: URL is /inventory.html

#### 1.3. Both fields empty

**File:** `tests/login/empty-credentials.spec.ts`

**Steps:**
  1. Click Login without filling any field
    - expect: Error "Epic sadface: Username is required" is shown
    - expect: Username and Password inputs have error styling (class 'error')
    - expect: URL remains /

#### 1.4. Empty username, valid password

**File:** `tests/login/empty-username.spec.ts`

**Steps:**
  1. Fill only Password "secret_sauce" and click Login
    - expect: Error "Epic sadface: Username is required" is shown

#### 1.5. Valid username, empty password

**File:** `tests/login/empty-password.spec.ts`

**Steps:**
  1. Fill only Username "standard_user" and click Login
    - expect: Error "Epic sadface: Password is required" is shown

#### 1.6. Wrong password

**File:** `tests/login/wrong-password.spec.ts`

**Steps:**
  1. Fill Username "standard_user", Password "wrong_pass", click Login
    - expect: Error "Epic sadface: Username and password do not match any user in this service" is shown
    - expect: URL remains /

#### 1.7. Unknown username

**File:** `tests/login/unknown-username.spec.ts`

**Steps:**
  1. Fill Username "no_such_user", Password "secret_sauce", click Login
    - expect: Error "Epic sadface: Username and password do not match any user in this service" is shown

#### 1.8. Username is case-sensitive

**File:** `tests/login/username-case-sensitive.spec.ts`

**Steps:**
  1. Fill Username "Standard_User", Password "secret_sauce", click Login
    - expect: Error "Epic sadface: Username and password do not match any user in this service" is shown
    - expect: User stays on login page

#### 1.9. Locked out user cannot log in

**File:** `tests/login/locked-out-user.spec.ts`

**Steps:**
  1. Fill Username "locked_out_user", Password "secret_sauce", click Login
    - expect: Error "Epic sadface: Sorry, this user has been locked out." is shown
    - expect: URL remains /

#### 1.10. Dismiss error message

**File:** `tests/login/dismiss-error.spec.ts`

**Steps:**
  1. Click Login with empty fields
    - expect: Error message and close (X) button are visible
  2. Click the error close (X) button
    - expect: Error message is no longer present
    - expect: Inputs no longer have error styling

#### 1.11. Inventory is protected without login

**File:** `tests/login/protected-inventory.spec.ts`

**Steps:**
  1. Navigate directly to https://www.saucedemo.com/inventory.html in a fresh context
    - expect: User is redirected to /
    - expect: Error "Epic sadface: You can only access '/inventory.html' when you are logged in." is shown

#### 1.12. Checkout pages are protected without login

**File:** `tests/login/protected-checkout.spec.ts`

**Steps:**
  1. Navigate directly to https://www.saucedemo.com/checkout-step-one.html in a fresh context
    - expect: User is redirected to /
    - expect: Error "Epic sadface: You can only access '/checkout-step-one.html' when you are logged in." is shown
  2. Repeat for /cart.html, /checkout-step-two.html and /checkout-complete.html
    - expect: Each redirects to / with the matching "You can only access '<path>' when you are logged in." error

#### 1.13. Logout ends the session

**File:** `tests/login/logout.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page shown
  2. Open the burger menu and click Logout
    - expect: URL is /
    - expect: Login form is visible
  3. Press browser Back
    - expect: User remains on / and an "Epic sadface: You can only access '/inventory.html' when you are logged in." error is shown

### 2. Cart

**Seed:** `tests/seed.spec.ts`

#### 2.1. Add items updates badge and button state

**File:** `tests/cart/add-items.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page shown, no cart badge
  2. Click Add to cart on "Sauce Labs Backpack"
    - expect: Cart badge shows 1
    - expect: Backpack button changes to "Remove"
  3. Click Add to cart on "Sauce Labs Bike Light"
    - expect: Cart badge shows 2

#### 2.2. Cart lists added items with quantity and price

**File:** `tests/cart/cart-contents.spec.ts`

**Steps:**
  1. Log in, add Sauce Labs Backpack and Sauce Labs Bike Light, click the cart icon
    - expect: URL is /cart.html
    - expect: Backpack listed with qty 1 and $29.99
    - expect: Bike Light listed with qty 1 and $9.99

#### 2.3. Remove item from cart

**File:** `tests/cart/remove-item.spec.ts`

**Steps:**
  1. Log in, add Backpack and Bike Light, open cart
    - expect: 2 items in cart
  2. Click Remove on Bike Light
    - expect: Bike Light disappears from the list
    - expect: Cart badge shows 1

#### 2.4. Continue Shopping returns to inventory and keeps cart

**File:** `tests/cart/continue-shopping.spec.ts`

**Steps:**
  1. Log in, add Backpack, open cart, click Continue Shopping
    - expect: URL is /inventory.html
    - expect: Cart badge still shows 1

#### 2.5. Cart persists across reload

**File:** `tests/cart/cart-persists.spec.ts`

**Steps:**
  1. Log in, add Backpack, reload the page
    - expect: Cart badge still shows 1
    - expect: Backpack button still shows "Remove"

### 3. Checkout – happy path

**Seed:** `tests/seed.spec.ts`

#### 3.1. Complete purchase of two items

**File:** `tests/checkout/complete-purchase.spec.ts`

**Steps:**
  1. Log in as standard_user, add Sauce Labs Backpack and Sauce Labs Bike Light, open cart, click Checkout
    - expect: URL is /checkout-step-one.html
    - expect: Title "Checkout: Your Information"
  2. Fill First Name "John", Last Name "Doe", Postal Code "12345" and click Continue
    - expect: URL is /checkout-step-two.html
    - expect: Title "Checkout: Overview"
    - expect: Both items are listed
  3. Verify the summary
    - expect: Payment Information: "SauceCard #31337"
    - expect: Shipping Information: "Free Pony Express Delivery!"
    - expect: "Item total: $39.98"
    - expect: "Tax: $3.20"
    - expect: "Total: $43.18"
  4. Click Finish
    - expect: URL is /checkout-complete.html
    - expect: Title "Checkout: Complete!"
    - expect: Header "Thank you for your order!"
    - expect: Text "Your order has been dispatched, and will arrive just as fast as the pony can get there!"
    - expect: Cart badge is gone
  5. Click Back Home
    - expect: URL is /inventory.html
    - expect: No cart badge; all buttons show "Add to cart"

#### 3.2. Totals are computed correctly (single item)

**File:** `tests/checkout/totals-single-item.spec.ts`

**Steps:**
  1. Log in, add only Sauce Labs Backpack, go through step one with valid data
    - expect: "Item total: $29.99"
    - expect: "Tax: $2.40"
    - expect: "Total: $32.39"
  2. Compute expected values from item prices on the page
    - expect: Item total equals sum of item prices
    - expect: Tax equals item total × 0.08 rounded to 2 decimals
    - expect: Total equals item total + tax

#### 3.3. Totals update after removing an item

**File:** `tests/checkout/totals-after-removal.spec.ts`

**Steps:**
  1. Log in, add Backpack and Bike Light, remove Bike Light in cart, check out with valid data
    - expect: Overview lists only the Backpack
    - expect: "Item total: $29.99", "Tax: $2.40", "Total: $32.39"

### 4. Checkout – navigation & cancel

**Seed:** `tests/seed.spec.ts`

#### 4.1. Cancel on Your Information returns to cart

**File:** `tests/checkout/cancel-step-one.spec.ts`

**Steps:**
  1. Log in, add Backpack, open cart, click Checkout, then click Cancel
    - expect: URL is /cart.html
    - expect: Backpack still in cart

#### 4.2. Cancel on Overview returns to inventory and keeps cart

**File:** `tests/checkout/cancel-step-two.spec.ts`

**Steps:**
  1. Log in, add Backpack and Bike Light, complete step one, then click Cancel on Overview
    - expect: URL is /inventory.html (not the cart)
    - expect: Cart badge still shows 2

### 5. Checkout – form validation (negative)

**Seed:** `tests/seed.spec.ts`

#### 5.1. All fields empty

**File:** `tests/checkout/validation-all-empty.spec.ts`

**Steps:**
  1. Log in, add Backpack, go to step one, click Continue with no data
    - expect: Error "Error: First Name is required"
    - expect: URL remains /checkout-step-one.html

#### 5.2. Missing last name

**File:** `tests/checkout/validation-missing-last-name.spec.ts`

**Steps:**
  1. Fill First Name "John", Postal Code "12345", leave Last Name empty, click Continue
    - expect: Error "Error: Last Name is required"

#### 5.3. Missing postal code

**File:** `tests/checkout/validation-missing-postal-code.spec.ts`

**Steps:**
  1. Fill First Name "John", Last Name "Doe", leave Postal Code empty, click Continue
    - expect: Error "Error: Postal Code is required"

#### 5.4. Missing first name only

**File:** `tests/checkout/validation-missing-first-name.spec.ts`

**Steps:**
  1. Fill Last Name "Doe", Postal Code "12345", click Continue
    - expect: Error "Error: First Name is required"

#### 5.5. Dismiss checkout error

**File:** `tests/checkout/validation-dismiss-error.spec.ts`

**Steps:**
  1. Trigger any validation error, then click the error close (X) button
    - expect: Error message disappears

#### 5.6. [KNOWN ISSUE] Whitespace-only postal code is accepted

**File:** `tests/checkout/validation-whitespace.spec.ts`

**Steps:**
  1. Fill First Name "John", Last Name "Doe", Postal Code "   " (spaces only), click Continue
    - expect: Observed: user proceeds to /checkout-step-two.html (no trimming)
    - expect: Desired: "Error: Postal Code is required" — mark as test.fail() if asserting desired behaviour

### 6. Checkout – edge cases & user-specific defects

**Seed:** `tests/seed.spec.ts`

#### 6.1. [KNOWN ISSUE] Checkout with empty cart is allowed

**File:** `tests/checkout/empty-cart.spec.ts`

**Steps:**
  1. Log in as standard_user, open the empty cart, click Checkout
    - expect: Observed: Checkout button is enabled and navigates to /checkout-step-one.html
  2. Fill valid info and Continue
    - expect: Overview shows "Item total: $0", "Tax: $0.00", "Total: $0.00"
  3. Click Finish
    - expect: Observed: "Thank you for your order!" is shown for an empty order
    - expect: Desired: checkout should be blocked when cart is empty

#### 6.2. Completed order cannot be resubmitted via Back

**File:** `tests/checkout/back-after-complete.spec.ts`

**Steps:**
  1. Complete a purchase, then press browser Back
    - expect: Cart badge is absent (cart was cleared on Finish)
    - expect: localStorage 'cart-contents' is empty

#### 6.3. [KNOWN ISSUE] problem_user: Last Name input overwrites First Name

**File:** `tests/checkout/problem-user-form.spec.ts`

**Steps:**
  1. Log in as problem_user, add Backpack, go to step one
    - expect: Your Information form shown
  2. Fill First Name "John", Last Name "Doe", Postal Code "12345"
    - expect: Observed: First Name field contains "Doe" and Last Name is empty
  3. Click Continue
    - expect: Error "Error: Last Name is required"; user cannot proceed

#### 6.4. [KNOWN ISSUE] error_user: Last Name ignored and Finish does nothing

**File:** `tests/checkout/error-user-checkout.spec.ts`

**Steps:**
  1. Log in as error_user, add Backpack, open cart, Checkout
    - expect: Step one shown
  2. Fill First Name "John", Last Name "Doe", Postal Code "12345"
    - expect: Observed: Last Name field stays empty; a console error is logged
  3. Click Continue
    - expect: Observed: user proceeds to Overview despite empty Last Name (validation bypassed)
  4. Click Finish
    - expect: Observed: user stays on /checkout-step-two.html, console errors logged, no completion page

#### 6.5. performance_glitch_user can complete checkout despite delay

**File:** `tests/checkout/performance-glitch-user.spec.ts`

**Steps:**
  1. Log in as performance_glitch_user (allow extended timeout for login)
    - expect: Inventory page eventually loads
  2. Add Backpack and complete checkout with valid data
    - expect: "Thank you for your order!" is shown
