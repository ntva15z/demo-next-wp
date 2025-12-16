import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 15: Verified purchase badge accuracy**
 * **Validates: Requirements 11.2**
 *
 * For any product review where the reviewer has a completed order containing
 * that product, the review SHALL be marked as "verified purchase".
 */
describe("Property: Verified purchase badge accuracy", () => {
  // ============================================
  // Types for verified purchase badge
  // ============================================

  interface Customer {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  }

  interface OrderItem {
    productId: number;
    variationId: number | null;
    name: string;
    quantity: number;
  }

  interface Order {
    id: number;
    customerId: number;
    customerEmail: string;
    status: "completed" | "processing" | "pending" | "cancelled" | "refunded";
    items: OrderItem[];
  }

  interface Review {
    id: number;
    productId: number;
    authorEmail: string;
    rating: number;
    content: string;
    verified: boolean;
  }

  interface PurchaseHistory {
    orders: Order[];
  }

  // ============================================
  // Verified purchase logic
  // ============================================

  /**
   * Check if a customer has purchased a product.
   * This mirrors the logic in product-reviews.php headless_is_verified_purchase()
   */
  function hasCustomerPurchasedProduct(
    customerEmail: string,
    productId: number,
    purchaseHistory: PurchaseHistory
  ): boolean {
    // Find orders by customer email with completed status
    const customerOrders = purchaseHistory.orders.filter(
      (order) =>
        order.customerEmail === customerEmail && order.status === "completed"
    );

    // Check if any order contains the product
    for (const order of customerOrders) {
      for (const item of order.items) {
        if (item.productId === productId || item.variationId === productId) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Determine if a review should be marked as verified purchase.
   */
  function shouldBeVerifiedPurchase(
    review: Review,
    purchaseHistory: PurchaseHistory
  ): boolean {
    return hasCustomerPurchasedProduct(
      review.authorEmail,
      review.productId,
      purchaseHistory
    );
  }

  /**
   * Validate that verified badge is correctly assigned.
   */
  function validateVerifiedBadge(
    review: Review,
    purchaseHistory: PurchaseHistory
  ): { valid: boolean; error: string | null } {
    const shouldBeVerified = shouldBeVerifiedPurchase(review, purchaseHistory);

    if (shouldBeVerified && !review.verified) {
      return {
        valid: false,
        error: "review_should_be_verified",
      };
    }

    if (!shouldBeVerified && review.verified) {
      return {
        valid: false,
        error: "review_should_not_be_verified",
      };
    }

    return {
      valid: true,
      error: null,
    };
  }

  /**
   * Create a review with correct verified status based on purchase history.
   */
  function createReviewWithVerifiedStatus(
    productId: number,
    authorEmail: string,
    rating: number,
    content: string,
    purchaseHistory: PurchaseHistory
  ): Review {
    const verified = hasCustomerPurchasedProduct(
      authorEmail,
      productId,
      purchaseHistory
    );

    return {
      id: Math.floor(Math.random() * 100000) + 1,
      productId,
      authorEmail,
      rating,
      content,
      verified,
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Email arbitrary
  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z]{3,10}$/),
      fc.constantFrom("gmail.com", "yahoo.com", "outlook.com", "email.vn")
    )
    .map(([name, domain]) => `${name}@${domain}`);

  // Product ID arbitrary
  const productIdArb = fc.integer({ min: 1, max: 1000 });

  // Order status arbitrary
  const orderStatusArb = fc.constantFrom(
    "completed",
    "processing",
    "pending",
    "cancelled",
    "refunded"
  ) as fc.Arbitrary<Order["status"]>;

  // Order item arbitrary
  const orderItemArb: fc.Arbitrary<OrderItem> = fc.record({
    productId: productIdArb,
    variationId: fc.oneof(fc.constant(null), productIdArb),
    name: fc.stringMatching(/^[A-Za-z0-9 ]{5,30}$/),
    quantity: fc.integer({ min: 1, max: 10 }),
  });

  // Order arbitrary
  const orderArb: fc.Arbitrary<Order> = fc
    .tuple(
      fc.integer({ min: 1, max: 100000 }),
      fc.integer({ min: 1, max: 10000 }),
      emailArb,
      orderStatusArb,
      fc.array(orderItemArb, { minLength: 1, maxLength: 5 })
    )
    .map(([id, customerId, customerEmail, status, items]) => ({
      id,
      customerId,
      customerEmail,
      status,
      items,
    }));

  // Purchase history arbitrary
  const purchaseHistoryArb: fc.Arbitrary<PurchaseHistory> = fc
    .array(orderArb, { minLength: 0, maxLength: 10 })
    .map((orders) => ({ orders }));

  // Review arbitrary (without verified status - to be calculated)
  const reviewInputArb = fc.record({
    productId: productIdArb,
    authorEmail: emailArb,
    rating: fc.integer({ min: 1, max: 5 }),
    content: fc.stringMatching(/^[A-Za-z0-9 .,!?]{10,100}$/),
  });

  // ============================================
  // Property Tests
  // ============================================

  it("should mark review as verified when reviewer has completed order with product", () => {
    fc.assert(
      fc.property(
        reviewInputArb,
        purchaseHistoryArb,
        (reviewInput, purchaseHistory) => {
          // Create a completed order with the reviewed product for this customer
          const completedOrder: Order = {
            id: Math.floor(Math.random() * 100000) + 1,
            customerId: Math.floor(Math.random() * 10000) + 1,
            customerEmail: reviewInput.authorEmail,
            status: "completed",
            items: [
              {
                productId: reviewInput.productId,
                variationId: null,
                name: "Test Product",
                quantity: 1,
              },
            ],
          };

          // Add the completed order to purchase history
          const historyWithPurchase: PurchaseHistory = {
            orders: [...purchaseHistory.orders, completedOrder],
          };

          // Create review with verified status
          const review = createReviewWithVerifiedStatus(
            reviewInput.productId,
            reviewInput.authorEmail,
            reviewInput.rating,
            reviewInput.content,
            historyWithPurchase
          );

          expect(review.verified).toBe(true);

          const validation = validateVerifiedBadge(review, historyWithPurchase);
          expect(validation.valid).toBe(true);

          return review.verified === true && validation.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT mark review as verified when reviewer has no orders", () => {
    fc.assert(
      fc.property(reviewInputArb, (reviewInput) => {
        // Empty purchase history
        const emptyHistory: PurchaseHistory = { orders: [] };

        // Create review with verified status
        const review = createReviewWithVerifiedStatus(
          reviewInput.productId,
          reviewInput.authorEmail,
          reviewInput.rating,
          reviewInput.content,
          emptyHistory
        );

        expect(review.verified).toBe(false);

        const validation = validateVerifiedBadge(review, emptyHistory);
        expect(validation.valid).toBe(true);

        return review.verified === false && validation.valid === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should NOT mark review as verified when order is not completed", () => {
    fc.assert(
      fc.property(
        reviewInputArb,
        fc.constantFrom("processing", "pending", "cancelled", "refunded"),
        (reviewInput, status) => {
          // Create order with non-completed status
          const nonCompletedOrder: Order = {
            id: Math.floor(Math.random() * 100000) + 1,
            customerId: Math.floor(Math.random() * 10000) + 1,
            customerEmail: reviewInput.authorEmail,
            status: status as Order["status"],
            items: [
              {
                productId: reviewInput.productId,
                variationId: null,
                name: "Test Product",
                quantity: 1,
              },
            ],
          };

          const historyWithNonCompletedOrder: PurchaseHistory = {
            orders: [nonCompletedOrder],
          };

          // Create review with verified status
          const review = createReviewWithVerifiedStatus(
            reviewInput.productId,
            reviewInput.authorEmail,
            reviewInput.rating,
            reviewInput.content,
            historyWithNonCompletedOrder
          );

          expect(review.verified).toBe(false);

          return review.verified === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT mark review as verified when order does not contain the product", () => {
    fc.assert(
      fc.property(
        reviewInputArb,
        productIdArb,
        (reviewInput, differentProductId) => {
          // Ensure different product ID
          const otherProductId =
            differentProductId === reviewInput.productId
              ? differentProductId + 1
              : differentProductId;

          // Create completed order with different product
          const orderWithDifferentProduct: Order = {
            id: Math.floor(Math.random() * 100000) + 1,
            customerId: Math.floor(Math.random() * 10000) + 1,
            customerEmail: reviewInput.authorEmail,
            status: "completed",
            items: [
              {
                productId: otherProductId,
                variationId: null,
                name: "Different Product",
                quantity: 1,
              },
            ],
          };

          const historyWithDifferentProduct: PurchaseHistory = {
            orders: [orderWithDifferentProduct],
          };

          // Create review with verified status
          const review = createReviewWithVerifiedStatus(
            reviewInput.productId,
            reviewInput.authorEmail,
            reviewInput.rating,
            reviewInput.content,
            historyWithDifferentProduct
          );

          expect(review.verified).toBe(false);

          return review.verified === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT mark review as verified when order belongs to different customer", () => {
    fc.assert(
      fc.property(reviewInputArb, emailArb, (reviewInput, differentEmail) => {
        // Ensure different email
        const otherEmail =
          differentEmail === reviewInput.authorEmail
            ? `other_${differentEmail}`
            : differentEmail;

        // Create completed order for different customer
        const orderForDifferentCustomer: Order = {
          id: Math.floor(Math.random() * 100000) + 1,
          customerId: Math.floor(Math.random() * 10000) + 1,
          customerEmail: otherEmail,
          status: "completed",
          items: [
            {
              productId: reviewInput.productId,
              variationId: null,
              name: "Test Product",
              quantity: 1,
            },
          ],
        };

        const historyWithDifferentCustomer: PurchaseHistory = {
          orders: [orderForDifferentCustomer],
        };

        // Create review with verified status
        const review = createReviewWithVerifiedStatus(
          reviewInput.productId,
          reviewInput.authorEmail,
          reviewInput.rating,
          reviewInput.content,
          historyWithDifferentCustomer
        );

        expect(review.verified).toBe(false);

        return review.verified === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should mark review as verified when product was purchased as variation", () => {
    fc.assert(
      fc.property(reviewInputArb, (reviewInput) => {
        // Create completed order with product as variation
        const orderWithVariation: Order = {
          id: Math.floor(Math.random() * 100000) + 1,
          customerId: Math.floor(Math.random() * 10000) + 1,
          customerEmail: reviewInput.authorEmail,
          status: "completed",
          items: [
            {
              productId: reviewInput.productId + 1000, // Parent product
              variationId: reviewInput.productId, // Variation matches reviewed product
              name: "Test Product Variation",
              quantity: 1,
            },
          ],
        };

        const historyWithVariation: PurchaseHistory = {
          orders: [orderWithVariation],
        };

        // Create review with verified status
        const review = createReviewWithVerifiedStatus(
          reviewInput.productId,
          reviewInput.authorEmail,
          reviewInput.rating,
          reviewInput.content,
          historyWithVariation
        );

        expect(review.verified).toBe(true);

        return review.verified === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should correctly validate verified badge assignment", () => {
    fc.assert(
      fc.property(
        reviewInputArb,
        purchaseHistoryArb,
        (reviewInput, purchaseHistory) => {
          // Create review with correct verified status
          const review = createReviewWithVerifiedStatus(
            reviewInput.productId,
            reviewInput.authorEmail,
            reviewInput.rating,
            reviewInput.content,
            purchaseHistory
          );

          // Validate the badge assignment
          const validation = validateVerifiedBadge(review, purchaseHistory);

          expect(validation.valid).toBe(true);
          expect(validation.error).toBeNull();

          return validation.valid === true && validation.error === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should detect incorrectly assigned verified badge (false positive)", () => {
    fc.assert(
      fc.property(reviewInputArb, (reviewInput) => {
        // Empty purchase history
        const emptyHistory: PurchaseHistory = { orders: [] };

        // Create review with incorrectly set verified = true
        const incorrectReview: Review = {
          id: Math.floor(Math.random() * 100000) + 1,
          productId: reviewInput.productId,
          authorEmail: reviewInput.authorEmail,
          rating: reviewInput.rating,
          content: reviewInput.content,
          verified: true, // Incorrectly set to true
        };

        // Validate should detect the error
        const validation = validateVerifiedBadge(incorrectReview, emptyHistory);

        expect(validation.valid).toBe(false);
        expect(validation.error).toBe("review_should_not_be_verified");

        return (
          validation.valid === false &&
          validation.error === "review_should_not_be_verified"
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should detect incorrectly assigned verified badge (false negative)", () => {
    fc.assert(
      fc.property(reviewInputArb, (reviewInput) => {
        // Create completed order with the product
        const completedOrder: Order = {
          id: Math.floor(Math.random() * 100000) + 1,
          customerId: Math.floor(Math.random() * 10000) + 1,
          customerEmail: reviewInput.authorEmail,
          status: "completed",
          items: [
            {
              productId: reviewInput.productId,
              variationId: null,
              name: "Test Product",
              quantity: 1,
            },
          ],
        };

        const historyWithPurchase: PurchaseHistory = {
          orders: [completedOrder],
        };

        // Create review with incorrectly set verified = false
        const incorrectReview: Review = {
          id: Math.floor(Math.random() * 100000) + 1,
          productId: reviewInput.productId,
          authorEmail: reviewInput.authorEmail,
          rating: reviewInput.rating,
          content: reviewInput.content,
          verified: false, // Incorrectly set to false
        };

        // Validate should detect the error
        const validation = validateVerifiedBadge(
          incorrectReview,
          historyWithPurchase
        );

        expect(validation.valid).toBe(false);
        expect(validation.error).toBe("review_should_be_verified");

        return (
          validation.valid === false &&
          validation.error === "review_should_be_verified"
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should handle multiple orders from same customer", () => {
    fc.assert(
      fc.property(
        reviewInputArb,
        fc.array(productIdArb, { minLength: 1, maxLength: 5 }),
        (reviewInput, otherProductIds) => {
          // Create multiple orders, one with the reviewed product
          const orders: Order[] = otherProductIds.map((pid, index) => ({
            id: index + 1,
            customerId: 1,
            customerEmail: reviewInput.authorEmail,
            status: "completed" as const,
            items: [
              {
                productId: pid,
                variationId: null,
                name: `Product ${pid}`,
                quantity: 1,
              },
            ],
          }));

          // Add order with the reviewed product
          orders.push({
            id: orders.length + 1,
            customerId: 1,
            customerEmail: reviewInput.authorEmail,
            status: "completed",
            items: [
              {
                productId: reviewInput.productId,
                variationId: null,
                name: "Reviewed Product",
                quantity: 1,
              },
            ],
          });

          const historyWithMultipleOrders: PurchaseHistory = { orders };

          // Create review with verified status
          const review = createReviewWithVerifiedStatus(
            reviewInput.productId,
            reviewInput.authorEmail,
            reviewInput.rating,
            reviewInput.content,
            historyWithMultipleOrders
          );

          expect(review.verified).toBe(true);

          return review.verified === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
