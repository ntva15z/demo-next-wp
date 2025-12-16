import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 17: Average rating calculation**
 * **Validates: Requirements 11.4**
 *
 * For any product with approved reviews, the average rating SHALL equal
 * the arithmetic mean of all approved review ratings, rounded to one decimal place.
 */
describe("Property: Average rating calculation", () => {
  // ============================================
  // Types for average rating calculation
  // ============================================

  type ReviewStatus = "APPROVED" | "PENDING" | "SPAM" | "TRASH";

  interface Review {
    id: number;
    productId: number;
    rating: number;
    status: ReviewStatus;
  }

  interface Product {
    id: number;
    name: string;
    reviews: Review[];
    averageRating: number;
    reviewCount: number;
  }

  // ============================================
  // Average rating calculation logic
  // ============================================

  /**
   * Calculate average rating from approved reviews.
   * This mirrors the logic in product-reviews.php headless_calculate_average_rating()
   */
  function calculateAverageRating(reviews: Review[]): number {
    // Filter only approved reviews with valid ratings
    const approvedReviews = reviews.filter(
      (review) =>
        review.status === "APPROVED" && review.rating >= 1 && review.rating <= 5
    );

    if (approvedReviews.length === 0) {
      return 0.0;
    }

    // Calculate arithmetic mean
    const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / approvedReviews.length;

    // Round to 1 decimal place
    return Math.round(average * 10) / 10;
  }

  /**
   * Get count of approved reviews
   */
  function getApprovedReviewCount(reviews: Review[]): number {
    return reviews.filter(
      (review) =>
        review.status === "APPROVED" && review.rating >= 1 && review.rating <= 5
    ).length;
  }

  /**
   * Validate that average rating is correctly calculated
   */
  function validateAverageRating(
    reviews: Review[],
    calculatedAverage: number
  ): { valid: boolean; error: string | null } {
    const expectedAverage = calculateAverageRating(reviews);

    if (calculatedAverage !== expectedAverage) {
      return {
        valid: false,
        error: `Expected ${expectedAverage}, got ${calculatedAverage}`,
      };
    }

    return {
      valid: true,
      error: null,
    };
  }

  /**
   * Create a product with calculated average rating
   */
  function createProductWithRating(
    productId: number,
    name: string,
    reviews: Review[]
  ): Product {
    return {
      id: productId,
      name,
      reviews,
      averageRating: calculateAverageRating(reviews),
      reviewCount: getApprovedReviewCount(reviews),
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Valid rating arbitrary (1-5)
  const ratingArb = fc.integer({ min: 1, max: 5 });

  // Review status arbitrary
  const reviewStatusArb = fc.constantFrom(
    "APPROVED",
    "PENDING",
    "SPAM",
    "TRASH"
  ) as fc.Arbitrary<ReviewStatus>;

  // Product ID arbitrary
  const productIdArb = fc.integer({ min: 1, max: 100000 });

  // Review arbitrary
  const reviewArb: fc.Arbitrary<Review> = fc
    .tuple(
      fc.integer({ min: 1, max: 100000 }),
      productIdArb,
      ratingArb,
      reviewStatusArb
    )
    .map(([id, productId, rating, status]) => ({
      id,
      productId,
      rating,
      status,
    }));

  // Approved review arbitrary (always APPROVED status)
  const approvedReviewArb: fc.Arbitrary<Review> = fc
    .tuple(fc.integer({ min: 1, max: 100000 }), productIdArb, ratingArb)
    .map(([id, productId, rating]) => ({
      id,
      productId,
      rating,
      status: "APPROVED" as const,
    }));

  // Non-approved review arbitrary
  const nonApprovedReviewArb: fc.Arbitrary<Review> = fc
    .tuple(
      fc.integer({ min: 1, max: 100000 }),
      productIdArb,
      ratingArb,
      fc.constantFrom("PENDING", "SPAM", "TRASH") as fc.Arbitrary<
        Exclude<ReviewStatus, "APPROVED">
      >
    )
    .map(([id, productId, rating, status]) => ({
      id,
      productId,
      rating,
      status,
    }));

  // Array of reviews with at least one approved
  const reviewsWithApprovedArb = fc
    .tuple(
      fc.array(approvedReviewArb, { minLength: 1, maxLength: 10 }),
      fc.array(reviewArb, { minLength: 0, maxLength: 5 })
    )
    .map(([approved, mixed]) => [...approved, ...mixed]);

  // Array of only non-approved reviews
  const onlyNonApprovedReviewsArb = fc.array(nonApprovedReviewArb, {
    minLength: 1,
    maxLength: 10,
  });

  // ============================================
  // Property Tests
  // ============================================

  it("should calculate average as arithmetic mean of approved ratings", () => {
    fc.assert(
      fc.property(reviewsWithApprovedArb, (reviews) => {
        const average = calculateAverageRating(reviews);

        // Manually calculate expected average
        const approvedReviews = reviews.filter(
          (r) => r.status === "APPROVED" && r.rating >= 1 && r.rating <= 5
        );
        const expectedSum = approvedReviews.reduce(
          (acc, r) => acc + r.rating,
          0
        );
        const expectedAverage =
          Math.round((expectedSum / approvedReviews.length) * 10) / 10;

        expect(average).toBe(expectedAverage);

        return average === expectedAverage;
      }),
      { numRuns: 100 }
    );
  });

  it("should round average to one decimal place", () => {
    fc.assert(
      fc.property(reviewsWithApprovedArb, (reviews) => {
        const average = calculateAverageRating(reviews);

        // Check that average has at most 1 decimal place
        const decimalPlaces = (average.toString().split(".")[1] || "").length;

        expect(decimalPlaces).toBeLessThanOrEqual(1);

        return decimalPlaces <= 1;
      }),
      { numRuns: 100 }
    );
  });

  it("should return 0 when no approved reviews exist", () => {
    fc.assert(
      fc.property(onlyNonApprovedReviewsArb, (reviews) => {
        const average = calculateAverageRating(reviews);

        expect(average).toBe(0.0);

        return average === 0.0;
      }),
      { numRuns: 100 }
    );
  });

  it("should return 0 for empty reviews array", () => {
    const average = calculateAverageRating([]);

    expect(average).toBe(0.0);
  });

  it("should only include approved reviews in calculation", () => {
    fc.assert(
      fc.property(
        fc.array(approvedReviewArb, { minLength: 1, maxLength: 5 }),
        fc.array(nonApprovedReviewArb, { minLength: 1, maxLength: 5 }),
        (approvedReviews, nonApprovedReviews) => {
          const allReviews = [...approvedReviews, ...nonApprovedReviews];

          // Calculate average with all reviews
          const averageWithAll = calculateAverageRating(allReviews);

          // Calculate average with only approved reviews
          const averageApprovedOnly = calculateAverageRating(approvedReviews);

          // Should be the same since non-approved are excluded
          expect(averageWithAll).toBe(averageApprovedOnly);

          return averageWithAll === averageApprovedOnly;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return exact rating when only one approved review exists", () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const singleReview: Review = {
          id: 1,
          productId: 1,
          rating,
          status: "APPROVED",
        };

        const average = calculateAverageRating([singleReview]);

        expect(average).toBe(rating);

        return average === rating;
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate correct average for all 5-star reviews", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          const reviews: Review[] = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            productId: 1,
            rating: 5,
            status: "APPROVED" as const,
          }));

          const average = calculateAverageRating(reviews);

          expect(average).toBe(5.0);

          return average === 5.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should calculate correct average for all 1-star reviews", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          const reviews: Review[] = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            productId: 1,
            rating: 1,
            status: "APPROVED" as const,
          }));

          const average = calculateAverageRating(reviews);

          expect(average).toBe(1.0);

          return average === 1.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should calculate 3.0 for equal distribution of 1 and 5 star reviews", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (count) => {
          const reviews: Review[] = [];

          // Add equal number of 1-star and 5-star reviews
          for (let i = 0; i < count; i++) {
            reviews.push({
              id: i * 2 + 1,
              productId: 1,
              rating: 1,
              status: "APPROVED",
            });
            reviews.push({
              id: i * 2 + 2,
              productId: 1,
              rating: 5,
              status: "APPROVED",
            });
          }

          const average = calculateAverageRating(reviews);

          expect(average).toBe(3.0);

          return average === 3.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be between 1 and 5 for any non-empty approved reviews", () => {
    fc.assert(
      fc.property(
        fc.array(approvedReviewArb, { minLength: 1, maxLength: 20 }),
        (reviews) => {
          const average = calculateAverageRating(reviews);

          expect(average).toBeGreaterThanOrEqual(1);
          expect(average).toBeLessThanOrEqual(5);

          return average >= 1 && average <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should update correctly when new approved review is added", () => {
    fc.assert(
      fc.property(
        fc.array(approvedReviewArb, { minLength: 1, maxLength: 10 }),
        ratingArb,
        (existingReviews, newRating) => {
          // Calculate average before adding new review
          const averageBefore = calculateAverageRating(existingReviews);

          // Add new review
          const newReview: Review = {
            id: existingReviews.length + 1,
            productId: 1,
            rating: newRating,
            status: "APPROVED",
          };
          const updatedReviews = [...existingReviews, newReview];

          // Calculate average after adding new review
          const averageAfter = calculateAverageRating(updatedReviews);

          // Verify the new average is correct
          const validation = validateAverageRating(updatedReviews, averageAfter);

          expect(validation.valid).toBe(true);

          // Average should move towards the new rating
          if (newRating > averageBefore) {
            expect(averageAfter).toBeGreaterThanOrEqual(averageBefore);
          } else if (newRating < averageBefore) {
            expect(averageAfter).toBeLessThanOrEqual(averageBefore);
          }

          return validation.valid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not change when pending review is added", () => {
    fc.assert(
      fc.property(
        fc.array(approvedReviewArb, { minLength: 1, maxLength: 10 }),
        ratingArb,
        (existingReviews, newRating) => {
          // Calculate average before adding pending review
          const averageBefore = calculateAverageRating(existingReviews);

          // Add pending review
          const pendingReview: Review = {
            id: existingReviews.length + 1,
            productId: 1,
            rating: newRating,
            status: "PENDING",
          };
          const updatedReviews = [...existingReviews, pendingReview];

          // Calculate average after adding pending review
          const averageAfter = calculateAverageRating(updatedReviews);

          // Average should not change
          expect(averageAfter).toBe(averageBefore);

          return averageAfter === averageBefore;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly count approved reviews", () => {
    fc.assert(
      fc.property(reviewsWithApprovedArb, (reviews) => {
        const count = getApprovedReviewCount(reviews);

        // Manually count approved reviews
        const expectedCount = reviews.filter(
          (r) => r.status === "APPROVED" && r.rating >= 1 && r.rating <= 5
        ).length;

        expect(count).toBe(expectedCount);

        return count === expectedCount;
      }),
      { numRuns: 100 }
    );
  });

  it("should create product with correct average rating", () => {
    fc.assert(
      fc.property(
        productIdArb,
        fc.stringMatching(/^[A-Za-z0-9 ]{5,30}$/),
        reviewsWithApprovedArb,
        (productId, name, reviews) => {
          const product = createProductWithRating(productId, name, reviews);

          const expectedAverage = calculateAverageRating(reviews);
          const expectedCount = getApprovedReviewCount(reviews);

          expect(product.averageRating).toBe(expectedAverage);
          expect(product.reviewCount).toBe(expectedCount);

          return (
            product.averageRating === expectedAverage &&
            product.reviewCount === expectedCount
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle specific rounding cases correctly", () => {
    // Test case: 4 + 4 + 5 = 13 / 3 = 4.333... should round to 4.3
    const reviews1: Review[] = [
      { id: 1, productId: 1, rating: 4, status: "APPROVED" },
      { id: 2, productId: 1, rating: 4, status: "APPROVED" },
      { id: 3, productId: 1, rating: 5, status: "APPROVED" },
    ];
    expect(calculateAverageRating(reviews1)).toBe(4.3);

    // Test case: 3 + 3 + 4 = 10 / 3 = 3.333... should round to 3.3
    const reviews2: Review[] = [
      { id: 1, productId: 1, rating: 3, status: "APPROVED" },
      { id: 2, productId: 1, rating: 3, status: "APPROVED" },
      { id: 3, productId: 1, rating: 4, status: "APPROVED" },
    ];
    expect(calculateAverageRating(reviews2)).toBe(3.3);

    // Test case: 4 + 5 = 9 / 2 = 4.5 should stay 4.5
    const reviews3: Review[] = [
      { id: 1, productId: 1, rating: 4, status: "APPROVED" },
      { id: 2, productId: 1, rating: 5, status: "APPROVED" },
    ];
    expect(calculateAverageRating(reviews3)).toBe(4.5);
  });
});
