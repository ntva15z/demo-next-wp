import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { WordPressAPIError, fetchGraphQL } from "@/lib/wordpress/client";

/**
 * **Feature: nextjs-wordpress-app, Property 3: GraphQL error handling**
 * **Validates: Requirements 2.3**
 *
 * For any GraphQL error response (network error, query error, server error),
 * the application should catch the error and return appropriate fallback content without crashing.
 */
describe("Property: GraphQL error handling", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock getEnv to return a valid endpoint
    vi.mock("@/lib/env", () => ({
      getEnv: () => ({
        WORDPRESS_GRAPHQL_ENDPOINT: "https://example.com/graphql",
        WORDPRESS_API_URL: "https://example.com",
        REVALIDATE_SECRET: "a".repeat(32),
        NEXT_PUBLIC_SITE_URL: "https://example.com",
      }),
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  // Arbitrary for HTTP error status codes (4xx and 5xx)
  const httpErrorStatusArb = fc.oneof(
    fc.integer({ min: 400, max: 499 }), // Client errors
    fc.integer({ min: 500, max: 599 })  // Server errors
  );

  // Arbitrary for GraphQL error messages
  const graphqlErrorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

  // Arbitrary for GraphQL error objects
  const graphqlErrorArb = fc.record({
    message: graphqlErrorMessageArb,
    locations: fc.option(
      fc.array(
        fc.record({
          line: fc.integer({ min: 1, max: 1000 }),
          column: fc.integer({ min: 1, max: 1000 }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      { nil: undefined }
    ),
    path: fc.option(
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
      { nil: undefined }
    ),
  });

  // Arbitrary for network error messages
  const networkErrorMessageArb = fc.constantFrom(
    "Failed to fetch",
    "Network request failed",
    "ERR_NETWORK",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "DNS lookup failed"
  );

  it("should throw WordPressAPIError for HTTP errors without crashing", async () => {
    await fc.assert(
      fc.asyncProperty(httpErrorStatusArb, fc.string(), async (statusCode, statusText) => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: statusCode,
          statusText: statusText,
        });

        await expect(fetchGraphQL("query { test }")).rejects.toThrow(WordPressAPIError);

        try {
          await fetchGraphQL("query { test }");
        } catch (error) {
          expect(error).toBeInstanceOf(WordPressAPIError);
          const wpError = error as WordPressAPIError;
          expect(wpError.statusCode).toBe(statusCode);
          expect(wpError.isHttpError()).toBe(true);
          expect(wpError.message).toContain(String(statusCode));
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should throw WordPressAPIError for GraphQL errors without crashing", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(graphqlErrorArb, { minLength: 1, maxLength: 5 }),
        async (errors) => {
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ errors }),
          });

          await expect(fetchGraphQL("query { test }")).rejects.toThrow(WordPressAPIError);

          try {
            await fetchGraphQL("query { test }");
          } catch (error) {
            expect(error).toBeInstanceOf(WordPressAPIError);
            const wpError = error as WordPressAPIError;
            expect(wpError.isGraphQLError()).toBe(true);
            expect(wpError.graphqlErrors).toHaveLength(errors.length);
            expect(wpError.message).toBe(errors[0].message);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should throw WordPressAPIError for network errors without crashing", async () => {
    await fc.assert(
      fc.asyncProperty(networkErrorMessageArb, async (errorMessage) => {
        global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

        await expect(fetchGraphQL("query { test }")).rejects.toThrow(WordPressAPIError);

        try {
          await fetchGraphQL("query { test }");
        } catch (error) {
          expect(error).toBeInstanceOf(WordPressAPIError);
          const wpError = error as WordPressAPIError;
          expect(wpError.isNetworkError()).toBe(true);
          expect(wpError.message).toBe(errorMessage);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should throw WordPressAPIError when response has no data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}), // No data field
    });

    await expect(fetchGraphQL("query { test }")).rejects.toThrow(WordPressAPIError);

    try {
      await fetchGraphQL("query { test }");
    } catch (error) {
      expect(error).toBeInstanceOf(WordPressAPIError);
      const wpError = error as WordPressAPIError;
      expect(wpError.message).toContain("No data");
    }
  });

  it("should preserve error information for debugging", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(graphqlErrorArb, { minLength: 1, maxLength: 3 }),
        async (errors) => {
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ errors }),
          });

          try {
            await fetchGraphQL("query { test }");
          } catch (error) {
            expect(error).toBeInstanceOf(WordPressAPIError);
            const wpError = error as WordPressAPIError;
            
            // Verify all error information is preserved
            expect(wpError.graphqlErrors).toBeDefined();
            wpError.graphqlErrors?.forEach((err, index) => {
              expect(err.message).toBe(errors[index].message);
              if (errors[index].locations) {
                expect(err.locations).toEqual(errors[index].locations);
              }
              if (errors[index].path) {
                expect(err.path).toEqual(errors[index].path);
              }
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("WordPressAPIError class", () => {
  it("should correctly identify error types", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
        fc.option(
          fc.array(fc.record({ message: fc.string() }), { minLength: 1 }),
          { nil: undefined }
        ),
        (message, statusCode, graphqlErrors) => {
          const error = new WordPressAPIError(message, statusCode, graphqlErrors);

          // Network error: no status code and no graphql errors
          if (statusCode === undefined && graphqlErrors === undefined) {
            expect(error.isNetworkError()).toBe(true);
            expect(error.isHttpError()).toBe(false);
            expect(error.isGraphQLError()).toBe(false);
          }

          // HTTP error: has status code >= 400
          if (statusCode !== undefined && statusCode >= 400) {
            expect(error.isHttpError()).toBe(true);
          }

          // GraphQL error: has graphql errors array
          if (graphqlErrors !== undefined && graphqlErrors.length > 0) {
            expect(error.isGraphQLError()).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
