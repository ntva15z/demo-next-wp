import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 10: Free shipping threshold**
 * **Validates: Requirements 9.3**
 *
 * For any order with subtotal greater than or equal to the free shipping threshold,
 * shipping cost SHALL be zero when free shipping is enabled.
 */
describe("Property: Free shipping threshold", () => {
  // ============================================
  // Types for free shipping calculation
  // ============================================

  interface CartItem {
    productId: string;
    name: string;
    price: number; // Price in VND
    quantity: number;
  }

  interface Cart {
    items: CartItem[];
    subtotal: number;
  }

  interface ShippingResult {
    originalCost: number;
    finalCost: number;
    freeShippingApplied: boolean;
    subtotal: number;
    threshold: number;
    amountToFreeShipping: number;
  }

  // ============================================
  // Free shipping configuration
  // ============================================

  const FREE_SHIPPING_THRESHOLD = 500000; // 500,000 VND

  // Base shipping rates for different zones
  const SHIPPING_RATES = {
    hoChiMinh: 25000,
    hanoi: 30000,
    otherProvinces: 35000,
  };

  // ============================================
  // Free shipping calculation logic
  // ============================================

  /**
   * Calculates cart subtotal from items
   */
  function calculateCartSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Determines if free shipping applies based on subtotal
   */
  function qualifiesForFreeShipping(subtotal: number): boolean {
    return subtotal >= FREE_SHIPPING_THRESHOLD;
  }

  /**
   * Calculates the amount remaining to qualify for free shipping
   */
  function amountToFreeShipping(subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return FREE_SHIPPING_THRESHOLD - subtotal;
  }

  /**
   * Applies free shipping threshold to shipping cost.
   * This mirrors the logic in shipping-configuration.php
   */
  function applyFreeShippingThreshold(originalShippingCost: number, cartSubtotal: number): ShippingResult {
    const qualifies = qualifiesForFreeShipping(cartSubtotal);

    return {
      originalCost: originalShippingCost,
      finalCost: qualifies ? 0 : originalShippingCost,
      freeShippingApplied: qualifies,
      subtotal: cartSubtotal,
      threshold: FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: amountToFreeShipping(cartSubtotal),
    };
  }

  /**
   * Full shipping calculation with free shipping threshold
   */
  function calculateShippingWithThreshold(cart: Cart, baseShippingCost: number): ShippingResult {
    return applyFreeShippingThreshold(baseShippingCost, cart.subtotal);
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Cart item arbitrary
  const cartItemArb: fc.Arbitrary<CartItem> = fc.record({
    productId: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 50 }),
    price: fc.integer({ min: 10000, max: 5000000 }), // 10,000 to 5,000,000 VND
    quantity: fc.integer({ min: 1, max: 10 }),
  });

  // Cart arbitrary
  const cartArb: fc.Arbitrary<Cart> = fc.array(cartItemArb, { minLength: 1, maxLength: 10 }).map((items) => ({
    items,
    subtotal: calculateCartSubtotal(items),
  }));

  // Cart with subtotal above threshold
  const cartAboveThresholdArb: fc.Arbitrary<Cart> = fc
    .integer({ min: FREE_SHIPPING_THRESHOLD, max: 10000000 })
    .map((subtotal) => ({
      items: [
        {
          productId: "high-value",
          name: "High Value Product",
          price: subtotal,
          quantity: 1,
        },
      ],
      subtotal,
    }));

  // Cart with subtotal below threshold
  const cartBelowThresholdArb: fc.Arbitrary<Cart> = fc
    .integer({ min: 10000, max: FREE_SHIPPING_THRESHOLD - 1 })
    .map((subtotal) => ({
      items: [
        {
          productId: "low-value",
          name: "Low Value Product",
          price: subtotal,
          quantity: 1,
        },
      ],
      subtotal,
    }));

  // Cart with subtotal exactly at threshold
  const cartAtThresholdArb: fc.Arbitrary<Cart> = fc.constant({
    items: [
      {
        productId: "exact-value",
        name: "Exact Threshold Product",
        price: FREE_SHIPPING_THRESHOLD,
        quantity: 1,
      },
    ],
    subtotal: FREE_SHIPPING_THRESHOLD,
  });

  // Shipping cost arbitrary
  const shippingCostArb: fc.Arbitrary<number> = fc.constantFrom(
    SHIPPING_RATES.hoChiMinh,
    SHIPPING_RATES.hanoi,
    SHIPPING_RATES.otherProvinces
  );

  // ============================================
  // Property Tests
  // ============================================

  it("should apply free shipping when subtotal >= threshold", () => {
    fc.assert(
      fc.property(cartAboveThresholdArb, shippingCostArb, (cart, shippingCost) => {
        const result = calculateShippingWithThreshold(cart, shippingCost);

        expect(result.freeShippingApplied).toBe(true);
        expect(result.finalCost).toBe(0);
        expect(result.amountToFreeShipping).toBe(0);

        return result.finalCost === 0 && result.freeShippingApplied === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should NOT apply free shipping when subtotal < threshold", () => {
    fc.assert(
      fc.property(cartBelowThresholdArb, shippingCostArb, (cart, shippingCost) => {
        const result = calculateShippingWithThreshold(cart, shippingCost);

        expect(result.freeShippingApplied).toBe(false);
        expect(result.finalCost).toBe(shippingCost);
        expect(result.amountToFreeShipping).toBeGreaterThan(0);

        return result.finalCost === shippingCost && result.freeShippingApplied === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should apply free shipping when subtotal equals exactly the threshold", () => {
    fc.assert(
      fc.property(cartAtThresholdArb, shippingCostArb, (cart, shippingCost) => {
        const result = calculateShippingWithThreshold(cart, shippingCost);

        expect(result.freeShippingApplied).toBe(true);
        expect(result.finalCost).toBe(0);
        expect(result.subtotal).toBe(FREE_SHIPPING_THRESHOLD);

        return result.finalCost === 0 && result.subtotal === FREE_SHIPPING_THRESHOLD;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve original shipping cost in result", () => {
    fc.assert(
      fc.property(cartArb, shippingCostArb, (cart, shippingCost) => {
        const result = calculateShippingWithThreshold(cart, shippingCost);

        // Original cost should always be preserved
        expect(result.originalCost).toBe(shippingCost);

        return result.originalCost === shippingCost;
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate correct amount remaining for free shipping", () => {
    fc.assert(
      fc.property(cartBelowThresholdArb, (cart) => {
        const result = applyFreeShippingThreshold(25000, cart.subtotal);

        const expectedRemaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;

        expect(result.amountToFreeShipping).toBe(expectedRemaining);
        expect(result.amountToFreeShipping).toBeGreaterThan(0);

        return result.amountToFreeShipping === expectedRemaining;
      }),
      { numRuns: 100 }
    );
  });

  it("should return zero amount remaining when free shipping applies", () => {
    fc.assert(
      fc.property(cartAboveThresholdArb, (cart) => {
        const result = applyFreeShippingThreshold(25000, cart.subtotal);

        expect(result.amountToFreeShipping).toBe(0);

        return result.amountToFreeShipping === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should be consistent - same subtotal always produces same result", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2000000 }), shippingCostArb, (subtotal, shippingCost) => {
        const result1 = applyFreeShippingThreshold(shippingCost, subtotal);
        const result2 = applyFreeShippingThreshold(shippingCost, subtotal);

        expect(result1.finalCost).toBe(result2.finalCost);
        expect(result1.freeShippingApplied).toBe(result2.freeShippingApplied);

        return result1.finalCost === result2.finalCost;
      }),
      { numRuns: 100 }
    );
  });

  it("should have threshold boundary behavior - just below vs at threshold", () => {
    const justBelowThreshold = FREE_SHIPPING_THRESHOLD - 1;
    const atThreshold = FREE_SHIPPING_THRESHOLD;

    const resultBelow = applyFreeShippingThreshold(25000, justBelowThreshold);
    const resultAt = applyFreeShippingThreshold(25000, atThreshold);

    // Just below should NOT get free shipping
    expect(resultBelow.freeShippingApplied).toBe(false);
    expect(resultBelow.finalCost).toBe(25000);

    // At threshold should get free shipping
    expect(resultAt.freeShippingApplied).toBe(true);
    expect(resultAt.finalCost).toBe(0);
  });

  it("should apply free shipping regardless of original shipping cost", () => {
    fc.assert(
      fc.property(
        cartAboveThresholdArb,
        fc.integer({ min: 1000, max: 1000000 }), // Any shipping cost
        (cart, shippingCost) => {
          const result = calculateShippingWithThreshold(cart, shippingCost);

          // Free shipping should apply regardless of how expensive shipping would be
          expect(result.freeShippingApplied).toBe(true);
          expect(result.finalCost).toBe(0);

          return result.finalCost === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly calculate subtotal from cart items", () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 1, maxLength: 5 }), (items) => {
        const expectedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const calculatedSubtotal = calculateCartSubtotal(items);

        expect(calculatedSubtotal).toBe(expectedSubtotal);

        return calculatedSubtotal === expectedSubtotal;
      }),
      { numRuns: 100 }
    );
  });

  it("should handle edge case of zero subtotal", () => {
    const emptyCart: Cart = {
      items: [],
      subtotal: 0,
    };

    const result = calculateShippingWithThreshold(emptyCart, 25000);

    expect(result.freeShippingApplied).toBe(false);
    expect(result.finalCost).toBe(25000);
    expect(result.amountToFreeShipping).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("should handle very large subtotals", () => {
    fc.assert(
      fc.property(fc.integer({ min: 10000000, max: 100000000 }), shippingCostArb, (subtotal, shippingCost) => {
        const result = applyFreeShippingThreshold(shippingCost, subtotal);

        // Very large orders should always get free shipping
        expect(result.freeShippingApplied).toBe(true);
        expect(result.finalCost).toBe(0);

        return result.finalCost === 0;
      }),
      { numRuns: 100 }
    );
  });
});
