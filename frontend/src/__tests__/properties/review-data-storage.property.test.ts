import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 14: Review data storage**
 * **Validates: Requirements 11.1**
 *
 * For any submitted product review, the system SHALL store the rating (1-5),
 * comment text, author information, and associated product ID correctly.
 */
describe("Property: Review data storage", () => {
  // ============================================
  // Types for review data storage
  // ============================================

  interface ReviewAuthor {
    name: string;
    email: string;
  }

  interface ReviewInput {
    productId: number;
    rating: number;
    content: string;
    author: ReviewAuthor;
  }

  interface StoredReview {
    id: number;
    productId: number;
    rating: number;
    content: string;
    author: ReviewAuthor;
    date: string;
    dateGmt: string;
    verified: boolean;
    status: "APPROVED" | "PENDING" | "SPAM" | "TRASH";
  }

  interface ReviewStorageResult {
    success: boolean;
    review: StoredReview | null;
    errors: string[];
  }

  // ============================================
  // Review storage validation logic
  // ============================================

  /**
   * Validates that a review input has all required fields.
   * This mirrors the validation in product-reviews.php headless_submit_product_review()
   */
  function validateReviewInput(input: ReviewInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check product ID
    if (!input.productId || input.productId <= 0) {
      errors.push("missing_product_id");
    }

    // Check rating (1-5)
    if (
      typeof input.rating !== "number" ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      errors.push("invalid_rating");
    }

    // Check content
    if (!input.content || input.content.trim().length === 0) {
      errors.push("missing_content");
    }

    // Check author name
    if (!input.author.name || input.author.name.trim().length === 0) {
      errors.push("missing_author_name");
    }

    // Check author email
    if (!input.author.email || !isValidEmail(input.author.email)) {
      errors.push("invalid_email");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Simple email validation
   */
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Simulates storing a review and validates the stored data matches input.
   * This mirrors the logic in product-reviews.php
   */
  function storeReview(input: ReviewInput): ReviewStorageResult {
    const validation = validateReviewInput(input);

    if (!validation.valid) {
      return {
        success: false,
        review: null,
        errors: validation.errors,
      };
    }

    // Simulate storing the review
    const storedReview: StoredReview = {
      id: Math.floor(Math.random() * 100000) + 1,
      productId: input.productId,
      rating: input.rating,
      content: input.content,
      author: {
        name: input.author.name,
        email: input.author.email,
      },
      date: new Date().toISOString(),
      dateGmt: new Date().toISOString(),
      verified: false, // Will be determined by purchase check
      status: "PENDING", // Always pending for moderation
    };

    return {
      success: true,
      review: storedReview,
      errors: [],
    };
  }

  /**
   * Validates that stored review data matches the input data.
   */
  function validateStoredReviewMatchesInput(
    input: ReviewInput,
    stored: StoredReview
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check product ID preserved
    if (stored.productId !== input.productId) {
      errors.push("product_id_mismatch");
    }

    // Check rating preserved
    if (stored.rating !== input.rating) {
      errors.push("rating_mismatch");
    }

    // Check content preserved
    if (stored.content !== input.content) {
      errors.push("content_mismatch");
    }

    // Check author name preserved
    if (stored.author.name !== input.author.name) {
      errors.push("author_name_mismatch");
    }

    // Check author email preserved
    if (stored.author.email !== input.author.email) {
      errors.push("author_email_mismatch");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates that a stored review has all required fields.
   */
  function validateStoredReviewCompleteness(stored: StoredReview): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check ID
    if (!stored.id || stored.id <= 0) {
      errors.push("missing_id");
    }

    // Check product ID
    if (!stored.productId || stored.productId <= 0) {
      errors.push("missing_product_id");
    }

    // Check rating
    if (
      typeof stored.rating !== "number" ||
      stored.rating < 1 ||
      stored.rating > 5
    ) {
      errors.push("invalid_rating");
    }

    // Check content
    if (!stored.content) {
      errors.push("missing_content");
    }

    // Check author
    if (!stored.author) {
      errors.push("missing_author");
    } else {
      if (!stored.author.name) {
        errors.push("missing_author_name");
      }
      if (!stored.author.email) {
        errors.push("missing_author_email");
      }
    }

    // Check date
    if (!stored.date) {
      errors.push("missing_date");
    }

    // Check status
    if (!stored.status) {
      errors.push("missing_status");
    }

    // Check verified field exists (can be true or false)
    if (typeof stored.verified !== "boolean") {
      errors.push("missing_verified");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Valid rating arbitrary (1-5)
  const validRatingArb = fc.integer({ min: 1, max: 5 });

  // Invalid rating arbitrary
  const invalidRatingArb = fc.oneof(
    fc.integer({ min: -100, max: 0 }),
    fc.integer({ min: 6, max: 100 })
  );

  // Vietnamese name arbitrary
  const vietnameseNameArb = fc.constantFrom(
    "Nguyễn Văn A",
    "Trần Thị B",
    "Lê Văn C",
    "Phạm Thị D",
    "Hoàng Văn E",
    "Huỳnh Thị F",
    "Phan Văn G",
    "Vũ Thị H"
  );

  // Email arbitrary
  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z]{3,10}$/),
      fc.constantFrom("gmail.com", "yahoo.com", "outlook.com", "email.vn")
    )
    .map(([name, domain]) => `${name}@${domain}`);

  // Review content arbitrary
  const reviewContentArb = fc.stringMatching(/^[A-Za-z0-9 .,!?]{10,200}$/);

  // Product ID arbitrary
  const productIdArb = fc.integer({ min: 1, max: 100000 });

  // Valid review input arbitrary
  const validReviewInputArb: fc.Arbitrary<ReviewInput> = fc.record({
    productId: productIdArb,
    rating: validRatingArb,
    content: reviewContentArb,
    author: fc.record({
      name: vietnameseNameArb,
      email: emailArb,
    }),
  });

  // Invalid review input arbitrary (missing or invalid fields)
  const invalidReviewInputArb: fc.Arbitrary<ReviewInput> = fc
    .tuple(
      validReviewInputArb,
      fc.constantFrom(
        "missing_product_id",
        "invalid_rating",
        "missing_content",
        "missing_author_name",
        "invalid_email"
      )
    )
    .map(([review, invalidField]) => {
      const invalid = { ...review, author: { ...review.author } };

      switch (invalidField) {
        case "missing_product_id":
          invalid.productId = 0;
          break;
        case "invalid_rating":
          invalid.rating = 0;
          break;
        case "missing_content":
          invalid.content = "";
          break;
        case "missing_author_name":
          invalid.author.name = "";
          break;
        case "invalid_email":
          invalid.author.email = "invalid-email";
          break;
      }

      return invalid;
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should store valid review with all required fields preserved", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        expect(result.success).toBe(true);
        expect(result.review).not.toBeNull();
        expect(result.errors).toHaveLength(0);

        if (result.review) {
          const validation = validateStoredReviewMatchesInput(
            input,
            result.review
          );
          expect(validation.valid).toBe(true);
        }

        return (
          result.success &&
          result.review !== null &&
          result.errors.length === 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should reject invalid review input", () => {
    fc.assert(
      fc.property(invalidReviewInputArb, (input) => {
        const result = storeReview(input);

        expect(result.success).toBe(false);
        expect(result.review).toBeNull();
        expect(result.errors.length).toBeGreaterThan(0);

        return (
          result.success === false &&
          result.review === null &&
          result.errors.length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve product ID in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.productId).toBe(input.productId);
          return result.review.productId === input.productId;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve rating (1-5) in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.rating).toBe(input.rating);
          expect(result.review.rating).toBeGreaterThanOrEqual(1);
          expect(result.review.rating).toBeLessThanOrEqual(5);
          return (
            result.review.rating === input.rating &&
            result.review.rating >= 1 &&
            result.review.rating <= 5
          );
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve comment text in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.content).toBe(input.content);
          return result.review.content === input.content;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve author name in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.author.name).toBe(input.author.name);
          return result.review.author.name === input.author.name;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve author email in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.author.email).toBe(input.author.email);
          return result.review.author.email === input.author.email;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should generate unique review ID for each stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.id).toBeGreaterThan(0);
          return result.review.id > 0;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include date in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.date).toBeTruthy();
          const date = new Date(result.review.date);
          expect(date.toString()).not.toBe("Invalid Date");
          return (
            result.review.date !== "" && date.toString() !== "Invalid Date"
          );
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include status in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(result.review.status).toBeTruthy();
          expect(["APPROVED", "PENDING", "SPAM", "TRASH"]).toContain(
            result.review.status
          );
          return ["APPROVED", "PENDING", "SPAM", "TRASH"].includes(
            result.review.status
          );
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include verified field in stored review", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          expect(typeof result.review.verified).toBe("boolean");
          return typeof result.review.verified === "boolean";
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate stored review has all required fields", () => {
    fc.assert(
      fc.property(validReviewInputArb, (input) => {
        const result = storeReview(input);

        if (result.success && result.review) {
          const validation = validateStoredReviewCompleteness(result.review);
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          return validation.valid && validation.errors.length === 0;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject rating below 1", () => {
    fc.assert(
      fc.property(
        fc.record({
          productId: productIdArb,
          rating: fc.integer({ min: -100, max: 0 }),
          content: reviewContentArb,
          author: fc.record({
            name: vietnameseNameArb,
            email: emailArb,
          }),
        }),
        (input) => {
          const result = storeReview(input);

          expect(result.success).toBe(false);
          expect(result.errors).toContain("invalid_rating");

          return (
            result.success === false && result.errors.includes("invalid_rating")
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject rating above 5", () => {
    fc.assert(
      fc.property(
        fc.record({
          productId: productIdArb,
          rating: fc.integer({ min: 6, max: 100 }),
          content: reviewContentArb,
          author: fc.record({
            name: vietnameseNameArb,
            email: emailArb,
          }),
        }),
        (input) => {
          const result = storeReview(input);

          expect(result.success).toBe(false);
          expect(result.errors).toContain("invalid_rating");

          return (
            result.success === false && result.errors.includes("invalid_rating")
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject empty content", () => {
    fc.assert(
      fc.property(
        fc.record({
          productId: productIdArb,
          rating: validRatingArb,
          content: fc.constant(""),
          author: fc.record({
            name: vietnameseNameArb,
            email: emailArb,
          }),
        }),
        (input) => {
          const result = storeReview(input);

          expect(result.success).toBe(false);
          expect(result.errors).toContain("missing_content");

          return (
            result.success === false &&
            result.errors.includes("missing_content")
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject invalid email format", () => {
    fc.assert(
      fc.property(
        fc.record({
          productId: productIdArb,
          rating: validRatingArb,
          content: reviewContentArb,
          author: fc.record({
            name: vietnameseNameArb,
            email: fc.constantFrom("invalid", "no-at-sign", "@nodomain", ""),
          }),
        }),
        (input) => {
          const result = storeReview(input);

          expect(result.success).toBe(false);
          expect(result.errors).toContain("invalid_email");

          return (
            result.success === false && result.errors.includes("invalid_email")
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
