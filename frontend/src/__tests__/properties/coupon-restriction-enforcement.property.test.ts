import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 5: Coupon restriction enforcement**
 * **Validates: Requirements 6.4**
 *
 * For any coupon with minimum order amount restriction, the coupon SHALL NOT
 * be applicable to orders below the specified minimum amount.
 */
describe("Property: Coupon restriction enforcement", () => {
  // ============================================
  // Types for coupon system
  // ============================================

  type CouponDiscountType = "percent" | "fixed_cart" | "fixed_product";

  interface CouponRestrictions {
    minimumAmount: number;
    maximumAmount: number | null;
    usageLimit: number | null;
    usageLimitPerUser: number | null;
    usageCount: number;
    excludeSaleItems: boolean;
    individualUse: boolean;
  }

  interface Coupon {
    id: string;
    code: string;
    discountType: CouponDiscountType;
    amount: number;
    freeShipping: boolean;
    restrictions: CouponRestrictions;
    expiryDate: Date | null;
  }

  interface CartItem {
    productId: string;
    quantity: number;
    price: number;
    onSale: boolean;
  }

  interface Cart {
    items: CartItem[];
    subtotal: number;
  }

  interface CouponValidationResult {
    isValid: boolean;
    errorCode: string | null;
    message: string;
  }

  // ============================================
  // Coupon validation logic
  // ============================================

  /**
   * Validates if a coupon can be applied to a cart.
   * This mirrors the logic in pricing-promotions.php
   */
  function validateCouponApplicability(
    coupon: Coupon,
    cart: Cart,
    currentUserId: string | null,
    userUsageCount: number
  ): CouponValidationResult {
    // Check if coupon is expired
    if (coupon.expiryDate && coupon.expiryDate.getTime() < Date.now()) {
      return {
        isValid: false,
        errorCode: "coupon_expired",
        message: "Mã giảm giá đã hết hạn.",
      };
    }

    // Check minimum order amount - THIS IS THE KEY PROPERTY BEING TESTED
    if (coupon.restrictions.minimumAmount > 0) {
      if (cart.subtotal < coupon.restrictions.minimumAmount) {
        return {
          isValid: false,
          errorCode: "coupon_min_amount_not_met",
          message: `Đơn hàng tối thiểu phải đạt ${coupon.restrictions.minimumAmount} để sử dụng mã giảm giá này.`,
        };
      }
    }

    // Check maximum order amount
    if (coupon.restrictions.maximumAmount !== null && coupon.restrictions.maximumAmount > 0) {
      if (cart.subtotal > coupon.restrictions.maximumAmount) {
        return {
          isValid: false,
          errorCode: "coupon_max_amount_exceeded",
          message: `Đơn hàng vượt quá giới hạn ${coupon.restrictions.maximumAmount} cho mã giảm giá này.`,
        };
      }
    }

    // Check total usage limit
    if (coupon.restrictions.usageLimit !== null && coupon.restrictions.usageLimit > 0) {
      if (coupon.restrictions.usageCount >= coupon.restrictions.usageLimit) {
        return {
          isValid: false,
          errorCode: "coupon_usage_limit_reached",
          message: "Mã giảm giá này đã hết lượt sử dụng.",
        };
      }
    }

    // Check per-user usage limit
    if (
      coupon.restrictions.usageLimitPerUser !== null &&
      coupon.restrictions.usageLimitPerUser > 0 &&
      currentUserId !== null
    ) {
      if (userUsageCount >= coupon.restrictions.usageLimitPerUser) {
        return {
          isValid: false,
          errorCode: "coupon_user_usage_limit_reached",
          message: "Bạn đã sử dụng hết lượt cho mã giảm giá này.",
        };
      }
    }

    // Check if coupon excludes sale items
    if (coupon.restrictions.excludeSaleItems) {
      const hasOnlySaleItems = cart.items.length > 0 && cart.items.every((item) => item.onSale);
      if (hasOnlySaleItems) {
        return {
          isValid: false,
          errorCode: "coupon_not_valid_for_sale_items",
          message: "Mã giảm giá này không áp dụng cho sản phẩm đang giảm giá.",
        };
      }
    }

    return {
      isValid: true,
      errorCode: null,
      message: "Mã giảm giá hợp lệ.",
    };
  }

  /**
   * Calculate cart subtotal from items
   */
  function calculateCartSubtotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Coupon code arbitrary
  const couponCodeArb = fc
    .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 4, maxLength: 10 })
    .map((chars) => chars.join(''));

  // Discount type arbitrary
  const discountTypeArb: fc.Arbitrary<CouponDiscountType> = fc.constantFrom(
    "percent",
    "fixed_cart",
    "fixed_product"
  );

  // VND amount arbitrary (in VND, typically 10,000 - 10,000,000)
  const vndAmountArb = fc.integer({ min: 10000, max: 10000000 });

  // Percentage arbitrary (1-100)
  const percentageArb = fc.integer({ min: 1, max: 100 });

  // Coupon restrictions arbitrary
  const couponRestrictionsArb: fc.Arbitrary<CouponRestrictions> = fc.record({
    minimumAmount: fc.oneof(fc.constant(0), vndAmountArb),
    maximumAmount: fc.option(vndAmountArb, { nil: null }),
    usageLimit: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }),
    usageLimitPerUser: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
    usageCount: fc.integer({ min: 0, max: 500 }),
    excludeSaleItems: fc.boolean(),
    individualUse: fc.boolean(),
  });

  // Coupon arbitrary
  const couponArb: fc.Arbitrary<Coupon> = fc
    .tuple(
      fc.uuid(),
      couponCodeArb,
      discountTypeArb,
      fc.oneof(percentageArb, vndAmountArb),
      fc.boolean(),
      couponRestrictionsArb,
      fc.option(fc.date({ min: new Date("2024-01-01"), max: new Date("2026-12-31") }), { nil: null })
    )
    .map(([id, code, discountType, amount, freeShipping, restrictions, expiryDate]) => ({
      id,
      code,
      discountType,
      amount: discountType === "percent" ? Math.min(amount, 100) : amount,
      freeShipping,
      restrictions,
      expiryDate,
    }));

  // Cart item arbitrary
  const cartItemArb: fc.Arbitrary<CartItem> = fc.record({
    productId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 10 }),
    price: vndAmountArb,
    onSale: fc.boolean(),
  });

  // Cart arbitrary
  const cartArb: fc.Arbitrary<Cart> = fc.array(cartItemArb, { minLength: 1, maxLength: 10 }).map((items) => ({
    items,
    subtotal: calculateCartSubtotal(items),
  }));

  // Coupon with minimum amount restriction (non-expired, valid configuration)
  const couponWithMinAmountArb: fc.Arbitrary<Coupon> = fc
    .tuple(
      fc.uuid(),
      couponCodeArb,
      discountTypeArb,
      fc.oneof(percentageArb, vndAmountArb),
      fc.boolean(),
      vndAmountArb, // minimum amount (always > 0)
      fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }),
      fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
      fc.integer({ min: 0, max: 500 }),
      fc.boolean(),
      fc.boolean()
    )
    .map(
      ([
        id,
        code,
        discountType,
        amount,
        freeShipping,
        minimumAmount,
        usageLimit,
        usageLimitPerUser,
        usageCount,
        excludeSaleItems,
        individualUse,
      ]) => ({
        id,
        code,
        discountType,
        amount: discountType === "percent" ? Math.min(amount, 100) : amount,
        freeShipping,
        restrictions: {
          minimumAmount,
          maximumAmount: null, // No maximum amount to avoid conflicts with minimum
          usageLimit,
          usageLimitPerUser,
          usageCount: usageLimit !== null ? Math.min(usageCount, usageLimit - 1) : usageCount, // Ensure not at limit
          excludeSaleItems: false, // Don't exclude sale items for these tests
          individualUse,
        },
        expiryDate: null, // No expiry to avoid expired coupon issues
      })
    );

  // ============================================
  // Property Tests
  // ============================================

  it("should reject coupon when cart subtotal is below minimum amount", () => {
    fc.assert(
      fc.property(
        couponWithMinAmountArb,
        fc.integer({ min: 10000, max: 10000000 }),
        (coupon, cartSubtotal) => {
          // Ensure cart subtotal is below minimum amount
          const belowMinimumSubtotal = Math.min(
            cartSubtotal,
            coupon.restrictions.minimumAmount - 1
          );

          // Skip if minimum amount is 0 or 1 (can't go below)
          if (coupon.restrictions.minimumAmount <= 1) {
            return true;
          }

          const cart: Cart = {
            items: [
              {
                productId: "test-product",
                quantity: 1,
                price: belowMinimumSubtotal,
                onSale: false,
              },
            ],
            subtotal: belowMinimumSubtotal,
          };

          const result = validateCouponApplicability(coupon, cart, null, 0);

          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe("coupon_min_amount_not_met");

          return result.isValid === false && result.errorCode === "coupon_min_amount_not_met";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should accept coupon when cart subtotal meets minimum amount", () => {
    fc.assert(
      fc.property(couponWithMinAmountArb, (coupon) => {
        // Create cart with subtotal exactly at minimum amount
        const cart: Cart = {
          items: [
            {
              productId: "test-product",
              quantity: 1,
              price: coupon.restrictions.minimumAmount,
              onSale: false,
            },
          ],
          subtotal: coupon.restrictions.minimumAmount,
        };

        const result = validateCouponApplicability(coupon, cart, null, 0);

        expect(result.isValid).toBe(true);
        expect(result.errorCode).toBeNull();

        return result.isValid === true && result.errorCode === null;
      }),
      { numRuns: 100 }
    );
  });

  it("should accept coupon when cart subtotal exceeds minimum amount", () => {
    fc.assert(
      fc.property(
        couponWithMinAmountArb,
        fc.integer({ min: 1, max: 5000000 }),
        (coupon, extraAmount) => {
          // Create cart with subtotal above minimum amount
          const cart: Cart = {
            items: [
              {
                productId: "test-product",
                quantity: 1,
                price: coupon.restrictions.minimumAmount + extraAmount,
                onSale: false,
              },
            ],
            subtotal: coupon.restrictions.minimumAmount + extraAmount,
          };

          const result = validateCouponApplicability(coupon, cart, null, 0);

          expect(result.isValid).toBe(true);
          expect(result.errorCode).toBeNull();

          return result.isValid === true && result.errorCode === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject coupon when usage limit is reached", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // usage limit
        cartArb,
        (usageLimit, cart) => {
          const coupon: Coupon = {
            id: "test-coupon",
            code: "TESTCODE",
            discountType: "percent",
            amount: 10,
            freeShipping: false,
            restrictions: {
              minimumAmount: 0, // No minimum
              maximumAmount: null,
              usageLimit,
              usageLimitPerUser: null,
              usageCount: usageLimit, // At limit
              excludeSaleItems: false,
              individualUse: false,
            },
            expiryDate: null,
          };

          const result = validateCouponApplicability(coupon, cart, null, 0);

          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe("coupon_usage_limit_reached");

          return result.isValid === false && result.errorCode === "coupon_usage_limit_reached";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject coupon when per-user usage limit is reached", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // per-user limit
        cartArb,
        (perUserLimit, cart) => {
          const coupon: Coupon = {
            id: "test-coupon",
            code: "TESTCODE",
            discountType: "percent",
            amount: 10,
            freeShipping: false,
            restrictions: {
              minimumAmount: 0,
              maximumAmount: null,
              usageLimit: null,
              usageLimitPerUser: perUserLimit,
              usageCount: 0,
              excludeSaleItems: false,
              individualUse: false,
            },
            expiryDate: null,
          };

          const result = validateCouponApplicability(coupon, cart, "user-123", perUserLimit);

          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe("coupon_user_usage_limit_reached");

          return result.isValid === false && result.errorCode === "coupon_user_usage_limit_reached";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should accept coupon when no restrictions are violated", () => {
    fc.assert(
      fc.property(couponArb, cartArb, (coupon, cart) => {
        // Adjust coupon to ensure it's valid
        const validCoupon: Coupon = {
          ...coupon,
          restrictions: {
            ...coupon.restrictions,
            minimumAmount: 0, // No minimum
            maximumAmount: null, // No maximum
            usageLimit: null, // No limit
            usageLimitPerUser: null, // No per-user limit
            excludeSaleItems: false, // Don't exclude sale items
          },
          expiryDate: null, // Not expired
        };

        const result = validateCouponApplicability(validCoupon, cart, null, 0);

        expect(result.isValid).toBe(true);
        expect(result.errorCode).toBeNull();

        return result.isValid === true && result.errorCode === null;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject expired coupons", () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        const expiredCoupon: Coupon = {
          id: "test-coupon",
          code: "EXPIRED",
          discountType: "percent",
          amount: 10,
          freeShipping: false,
          restrictions: {
            minimumAmount: 0,
            maximumAmount: null,
            usageLimit: null,
            usageLimitPerUser: null,
            usageCount: 0,
            excludeSaleItems: false,
            individualUse: false,
          },
          expiryDate: new Date("2020-01-01"), // Past date
        };

        const result = validateCouponApplicability(expiredCoupon, cart, null, 0);

        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe("coupon_expired");

        return result.isValid === false && result.errorCode === "coupon_expired";
      }),
      { numRuns: 100 }
    );
  });

  it("should enforce minimum amount restriction consistently across different discount types", () => {
    fc.assert(
      fc.property(
        discountTypeArb,
        vndAmountArb, // minimum amount
        fc.integer({ min: 10000, max: 10000000 }), // cart subtotal
        (discountType, minimumAmount, cartSubtotal) => {
          const coupon: Coupon = {
            id: "test-coupon",
            code: "TESTCODE",
            discountType,
            amount: discountType === "percent" ? 10 : 50000,
            freeShipping: false,
            restrictions: {
              minimumAmount,
              maximumAmount: null,
              usageLimit: null,
              usageLimitPerUser: null,
              usageCount: 0,
              excludeSaleItems: false,
              individualUse: false,
            },
            expiryDate: null,
          };

          const cart: Cart = {
            items: [
              {
                productId: "test-product",
                quantity: 1,
                price: cartSubtotal,
                onSale: false,
              },
            ],
            subtotal: cartSubtotal,
          };

          const result = validateCouponApplicability(coupon, cart, null, 0);

          // The key property: if cart subtotal < minimum amount, coupon should be rejected
          if (cartSubtotal < minimumAmount) {
            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe("coupon_min_amount_not_met");
            return result.isValid === false && result.errorCode === "coupon_min_amount_not_met";
          } else {
            expect(result.isValid).toBe(true);
            return result.isValid === true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should validate that minimum amount check is independent of other restrictions", () => {
    fc.assert(
      fc.property(
        vndAmountArb, // minimum amount
        fc.integer({ min: 10000, max: 10000000 }), // cart subtotal below minimum
        (minimumAmount, baseSubtotal) => {
          // Ensure cart subtotal is below minimum
          const cartSubtotal = Math.min(baseSubtotal, minimumAmount - 1);

          // Skip if we can't create a valid below-minimum scenario
          if (minimumAmount <= 1) {
            return true;
          }

          const coupon: Coupon = {
            id: "test-coupon",
            code: "TESTCODE",
            discountType: "percent",
            amount: 10,
            freeShipping: true, // Even with free shipping
            restrictions: {
              minimumAmount,
              maximumAmount: null,
              usageLimit: 1000, // High limit
              usageLimitPerUser: 100, // High per-user limit
              usageCount: 0, // Not used yet
              excludeSaleItems: false,
              individualUse: false,
            },
            expiryDate: new Date("2026-12-31"), // Not expired
          };

          const cart: Cart = {
            items: [
              {
                productId: "test-product",
                quantity: 1,
                price: cartSubtotal,
                onSale: false,
              },
            ],
            subtotal: cartSubtotal,
          };

          const result = validateCouponApplicability(coupon, cart, "user-123", 0);

          // Even though all other conditions are met, minimum amount should still be enforced
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe("coupon_min_amount_not_met");

          return result.isValid === false && result.errorCode === "coupon_min_amount_not_met";
        }
      ),
      { numRuns: 100 }
    );
  });
});
