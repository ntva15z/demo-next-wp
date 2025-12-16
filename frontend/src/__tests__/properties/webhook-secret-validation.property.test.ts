import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateWebhookSecret } from "@/app/api/revalidate/route";

/**
 * **Feature: nextjs-wordpress-app, Property 13: Webhook secret validation**
 * **Validates: Requirements 8.3**
 *
 * For any revalidation webhook request, if the `x-revalidate-secret` header does not match
 * the configured secret, the endpoint should return 401 Unauthorized without processing the request.
 */
describe("Property: Webhook secret validation", () => {
  // Arbitrary for valid secrets (32+ characters as per env validation)
  const validSecretArb = fc.string({ minLength: 32, maxLength: 100 });

  // Arbitrary for any string that could be a header value
  const headerValueArb = fc.string({ minLength: 0, maxLength: 200 });

  it("should accept requests when secret header matches expected secret", () => {
    fc.assert(
      fc.property(validSecretArb, (secret) => {
        const result = validateWebhookSecret(secret, secret);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should reject requests when secret header is null", () => {
    fc.assert(
      fc.property(validSecretArb, (expectedSecret) => {
        const result = validateWebhookSecret(null, expectedSecret);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("should reject requests when secret header does not match expected secret", () => {
    fc.assert(
      fc.property(
        validSecretArb,
        headerValueArb.filter((h) => h.length > 0),
        (expectedSecret, headerValue) => {
          // Only test when they are different
          fc.pre(headerValue !== expectedSecret);
          const result = validateWebhookSecret(headerValue, expectedSecret);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject requests with empty string header", () => {
    fc.assert(
      fc.property(validSecretArb, (expectedSecret) => {
        const result = validateWebhookSecret("", expectedSecret);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("should be case-sensitive when comparing secrets", () => {
    fc.assert(
      fc.property(
        validSecretArb.filter((s) => s.toLowerCase() !== s.toUpperCase()),
        (secret) => {
          // Test that changing case causes rejection
          const modifiedSecret = secret.toLowerCase() === secret 
            ? secret.toUpperCase() 
            : secret.toLowerCase();
          
          // Only test if the modification actually changed the string
          fc.pre(modifiedSecret !== secret);
          
          const result = validateWebhookSecret(modifiedSecret, secret);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject secrets with extra whitespace", () => {
    fc.assert(
      fc.property(validSecretArb, (secret) => {
        // Add leading/trailing whitespace
        const withLeadingSpace = ` ${secret}`;
        const withTrailingSpace = `${secret} `;
        
        expect(validateWebhookSecret(withLeadingSpace, secret)).toBe(false);
        expect(validateWebhookSecret(withTrailingSpace, secret)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
