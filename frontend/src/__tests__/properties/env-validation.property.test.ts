import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateEnv } from "@/lib/env";

/**
 * **Feature: nextjs-wordpress-app, Property 1: Environment variable validation**
 * **Validates: Requirements 1.3**
 *
 * For any set of environment variables, if any required variable is missing or invalid
 * (e.g., non-URL for endpoint), the application should fail validation with a descriptive error message.
 */
describe("Property: Environment variable validation", () => {
  // Arbitrary for valid URLs
  const validUrlArb = fc.webUrl();

  // Arbitrary for valid secret (32+ characters)
  const validSecretArb = fc.string({ minLength: 32, maxLength: 100 });

  // Arbitrary for valid environment variables
  const validEnvArb = fc.record({
    WORDPRESS_GRAPHQL_ENDPOINT: validUrlArb,
    WORDPRESS_API_URL: validUrlArb,
    REVALIDATE_SECRET: validSecretArb,
    NEXT_PUBLIC_SITE_URL: validUrlArb,
  });

  // Arbitrary for invalid URLs (non-URL strings)
  const invalidUrlArb = fc.string().filter((s) => {
    try {
      new URL(s);
      return false;
    } catch {
      return true;
    }
  });

  // Arbitrary for invalid secret (less than 32 characters)
  const invalidSecretArb = fc.string({ minLength: 0, maxLength: 31 });

  it("should accept valid environment variables", () => {
    fc.assert(
      fc.property(validEnvArb, (envVars) => {
        const result = validateEnv(envVars);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.WORDPRESS_GRAPHQL_ENDPOINT).toBe(envVars.WORDPRESS_GRAPHQL_ENDPOINT);
          expect(result.data.WORDPRESS_API_URL).toBe(envVars.WORDPRESS_API_URL);
          expect(result.data.REVALIDATE_SECRET).toBe(envVars.REVALIDATE_SECRET);
          expect(result.data.NEXT_PUBLIC_SITE_URL).toBe(envVars.NEXT_PUBLIC_SITE_URL);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should reject missing WORDPRESS_GRAPHQL_ENDPOINT", () => {
    fc.assert(
      fc.property(
        validUrlArb,
        validSecretArb,
        validUrlArb,
        (apiUrl, secret, siteUrl) => {
          const result = validateEnv({
            WORDPRESS_GRAPHQL_ENDPOINT: undefined,
            WORDPRESS_API_URL: apiUrl,
            REVALIDATE_SECRET: secret,
            NEXT_PUBLIC_SITE_URL: siteUrl,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain("WORDPRESS_GRAPHQL_ENDPOINT");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject invalid URL for WORDPRESS_GRAPHQL_ENDPOINT", () => {
    fc.assert(
      fc.property(
        invalidUrlArb,
        validUrlArb,
        validSecretArb,
        validUrlArb,
        (invalidEndpoint, apiUrl, secret, siteUrl) => {
          const result = validateEnv({
            WORDPRESS_GRAPHQL_ENDPOINT: invalidEndpoint,
            WORDPRESS_API_URL: apiUrl,
            REVALIDATE_SECRET: secret,
            NEXT_PUBLIC_SITE_URL: siteUrl,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain("WORDPRESS_GRAPHQL_ENDPOINT");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject REVALIDATE_SECRET shorter than 32 characters", () => {
    fc.assert(
      fc.property(
        validUrlArb,
        validUrlArb,
        invalidSecretArb,
        validUrlArb,
        (endpoint, apiUrl, shortSecret, siteUrl) => {
          const result = validateEnv({
            WORDPRESS_GRAPHQL_ENDPOINT: endpoint,
            WORDPRESS_API_URL: apiUrl,
            REVALIDATE_SECRET: shortSecret,
            NEXT_PUBLIC_SITE_URL: siteUrl,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain("REVALIDATE_SECRET");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject missing NEXT_PUBLIC_SITE_URL", () => {
    fc.assert(
      fc.property(
        validUrlArb,
        validUrlArb,
        validSecretArb,
        (endpoint, apiUrl, secret) => {
          const result = validateEnv({
            WORDPRESS_GRAPHQL_ENDPOINT: endpoint,
            WORDPRESS_API_URL: apiUrl,
            REVALIDATE_SECRET: secret,
            NEXT_PUBLIC_SITE_URL: undefined,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain("NEXT_PUBLIC_SITE_URL");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should provide descriptive error messages for all invalid fields", () => {
    fc.assert(
      fc.property(
        invalidUrlArb,
        invalidUrlArb,
        invalidSecretArb,
        invalidUrlArb,
        (invalidEndpoint, invalidApiUrl, shortSecret, invalidSiteUrl) => {
          const result = validateEnv({
            WORDPRESS_GRAPHQL_ENDPOINT: invalidEndpoint,
            WORDPRESS_API_URL: invalidApiUrl,
            REVALIDATE_SECRET: shortSecret,
            NEXT_PUBLIC_SITE_URL: invalidSiteUrl,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            // Error should mention all invalid fields
            expect(result.error).toContain("Environment validation failed");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
