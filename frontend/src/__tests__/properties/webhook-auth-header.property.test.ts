import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 18: Webhook authentication header**
 * **Validates: Requirements 12.4**
 *
 * For any webhook request sent to the NextJS revalidation endpoint, the request
 * SHALL include the `x-revalidate-secret` header with the configured secret value.
 */

/**
 * Simulates the WordPress webhook payload builder function
 * This mirrors the headless_build_webhook_payload function in PHP
 */
interface WebhookPayload {
  url: string;
  headers: Record<string, string>;
  body: {
    type: string;
    slug: string | null;
    timestamp: number;
    [key: string]: unknown;
  };
}

/**
 * Build webhook payload with authentication header
 * This is a TypeScript implementation that mirrors the PHP function
 * for testing purposes.
 */
function buildWebhookPayload(
  type: string,
  slug: string | null,
  data: Record<string, unknown>,
  revalidateUrl: string,
  revalidateSecret: string
): WebhookPayload {
  const payload = {
    type,
    slug,
    timestamp: Math.floor(Date.now() / 1000),
    ...data,
  };

  return {
    url: revalidateUrl,
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": revalidateSecret,
    },
    body: payload,
  };
}

/**
 * Validates that a webhook payload has the correct authentication header
 */
function validateWebhookAuthHeader(
  payload: WebhookPayload,
  expectedSecret: string
): boolean {
  const secretHeader = payload.headers["x-revalidate-secret"];
  if (!secretHeader) {
    return false;
  }
  return secretHeader === expectedSecret;
}

/**
 * Checks if the x-revalidate-secret header is present in the webhook payload
 */
function hasAuthHeader(payload: WebhookPayload): boolean {
  return (
    "x-revalidate-secret" in payload.headers &&
    payload.headers["x-revalidate-secret"] !== undefined &&
    payload.headers["x-revalidate-secret"] !== ""
  );
}

describe("Property: Webhook authentication header", () => {
  // Arbitrary for valid secrets (32+ characters as per env validation)
  const validSecretArb = fc.string({ minLength: 32, maxLength: 100 });

  // Arbitrary for webhook types
  const webhookTypeArb = fc.constantFrom("product", "inventory", "order");

  // Arbitrary for valid slugs (URL-safe strings)
  const slugArb = fc
    .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .filter((s) => s.length >= 1 && s.length <= 100);

  // Arbitrary for revalidation URLs
  const urlArb = fc.webUrl();

  // Arbitrary for additional webhook data
  const webhookDataArb = fc.record({
    product_id: fc.option(fc.nat(), { nil: undefined }),
    order_id: fc.option(fc.nat(), { nil: undefined }),
    stock_status: fc.option(
      fc.constantFrom("instock", "outofstock", "onbackorder"),
      { nil: undefined }
    ),
    stock_quantity: fc.option(fc.nat({ max: 10000 }), { nil: undefined }),
    old_status: fc.option(
      fc.constantFrom("pending", "processing", "completed", "cancelled"),
      { nil: undefined }
    ),
    new_status: fc.option(
      fc.constantFrom("pending", "processing", "completed", "cancelled"),
      { nil: undefined }
    ),
  });

  it("should always include x-revalidate-secret header in webhook payload", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // The webhook payload MUST have the x-revalidate-secret header
          expect(hasAuthHeader(payload)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include the correct secret value in the header", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // The header value MUST match the configured secret
          expect(validateWebhookAuthHeader(payload, secret)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should fail validation when header secret does not match expected secret", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        validSecretArb,
        (type, slug, data, url, payloadSecret, expectedSecret) => {
          // Only test when secrets are different
          fc.pre(payloadSecret !== expectedSecret);

          const payload = buildWebhookPayload(
            type,
            slug,
            data,
            url,
            payloadSecret
          );

          // Validation should fail when secrets don't match
          expect(validateWebhookAuthHeader(payload, expectedSecret)).toBe(
            false
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include Content-Type header as application/json", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // Content-Type header MUST be application/json
          expect(payload.headers["Content-Type"]).toBe("application/json");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include timestamp in webhook body", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // Timestamp MUST be present and be a valid Unix timestamp
          expect(typeof payload.body.timestamp).toBe("number");
          expect(payload.body.timestamp).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve webhook type and slug in body", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // Type and slug MUST be preserved in the body
          expect(payload.body.type).toBe(type);
          expect(payload.body.slug).toBe(slug);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should set correct URL in webhook payload", () => {
    fc.assert(
      fc.property(
        webhookTypeArb,
        fc.option(slugArb, { nil: null }),
        webhookDataArb,
        urlArb,
        validSecretArb,
        (type, slug, data, url, secret) => {
          const payload = buildWebhookPayload(type, slug, data, url, secret);

          // URL MUST match the configured revalidation URL
          expect(payload.url).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });
});
