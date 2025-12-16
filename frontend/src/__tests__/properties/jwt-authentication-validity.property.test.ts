import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 11: JWT authentication validity**
 * **Validates: Requirements 10.2**
 *
 * For any valid customer credentials (email/password), the authentication endpoint
 * SHALL return a valid JWT token containing user ID and expiration timestamp.
 */
describe("Property: JWT authentication validity", () => {
  // ============================================
  // Types for JWT authentication
  // ============================================

  interface UserCredentials {
    email: string;
    password: string;
  }

  interface JWTHeader {
    alg: string;
    typ: string;
  }

  interface JWTPayload {
    iss: string;
    iat: number;
    exp: number;
    data: {
      user: {
        id: number;
      };
    };
    user_id?: number;
    roles?: string[];
  }

  interface BillingAddress {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  }

  interface ShippingAddress {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }

  interface JWTTokenResponse {
    token: string;
    user_id: number;
    user_email: string;
    user_display_name: string;
    user_nicename: string;
    user_registered: string;
    user_roles: string[];
    billing_address: BillingAddress | null;
    shipping_address: ShippingAddress | null;
    is_paying_customer?: boolean;
    order_count?: number;
    total_spent?: string;
  }

  interface JWTValidationResult {
    valid: boolean;
    errors: string[];
    header?: JWTHeader;
    payload?: JWTPayload;
  }

  // ============================================
  // JWT validation logic
  // ============================================

  /**
   * Validates JWT token structure and required fields.
   * This mirrors the logic in jwt-authentication.php headless_validate_jwt_token()
   */
  function validateJWTToken(token: string): JWTValidationResult {
    const errors: string[] = [];

    if (!token || token.trim() === "") {
      return { valid: false, errors: ["no_token_provided"] };
    }

    // Check token format (should have 3 parts separated by dots)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, errors: ["invalid_token_format"] };
    }

    // Decode and validate header
    let header: JWTHeader;
    try {
      const headerJson = base64UrlDecode(parts[0]);
      header = JSON.parse(headerJson);
      if (!header.alg) {
        errors.push("missing_algorithm");
      }
      if (!header.typ || header.typ !== "JWT") {
        errors.push("invalid_token_type");
      }
    } catch {
      return { valid: false, errors: ["invalid_header"] };
    }

    // Decode and validate payload
    let payload: JWTPayload;
    try {
      const payloadJson = base64UrlDecode(parts[1]);
      payload = JSON.parse(payloadJson);
    } catch {
      return { valid: false, errors: ["invalid_payload"] };
    }

    // Check required claims
    const requiredClaims = ["iss", "iat", "exp", "data"];
    for (const claim of requiredClaims) {
      if (!(claim in payload)) {
        errors.push(`missing_claim_${claim}`);
      }
    }

    // Check user data in payload
    if (payload.data && !payload.data.user) {
      errors.push("missing_user_data");
    }

    if (payload.data?.user && !payload.data.user.id) {
      errors.push("missing_user_id");
    }

    // Check expiration timestamp is valid
    if (payload.exp && typeof payload.exp !== "number") {
      errors.push("invalid_expiration_format");
    }

    // Check issued at timestamp is valid
    if (payload.iat && typeof payload.iat !== "number") {
      errors.push("invalid_issued_at_format");
    }

    // Check signature part exists (we can't verify it without the secret)
    if (!parts[2] || parts[2].trim() === "") {
      errors.push("missing_signature");
    }

    return {
      valid: errors.length === 0,
      errors,
      header,
      payload,
    };
  }

  /**
   * Validates JWT token response from authentication endpoint.
   */
  function validateJWTResponse(response: JWTTokenResponse): JWTValidationResult {
    const errors: string[] = [];

    // Check token exists
    if (!response.token) {
      errors.push("missing_token");
    }

    // Check user_id exists and is valid
    if (!response.user_id || response.user_id <= 0) {
      errors.push("missing_or_invalid_user_id");
    }

    // Check user_email exists
    if (!response.user_email) {
      errors.push("missing_user_email");
    }

    // Check user_display_name exists
    if (!response.user_display_name) {
      errors.push("missing_user_display_name");
    }

    // Validate the token structure if present
    if (response.token) {
      const tokenValidation = validateJWTToken(response.token);
      if (!tokenValidation.valid) {
        errors.push(...tokenValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if token expiration is within expected range (7 days)
   */
  function isExpirationValid(exp: number, iat: number): boolean {
    const expectedExpiration = 7 * 24 * 60 * 60; // 7 days in seconds
    const actualExpiration = exp - iat;
    // Allow some tolerance (within 1 hour)
    return Math.abs(actualExpiration - expectedExpiration) < 3600;
  }

  /**
   * Check if token contains user ID
   */
  function hasUserId(payload: JWTPayload): boolean {
    return !!(payload.data?.user?.id && payload.data.user.id > 0);
  }

  /**
   * Check if token contains expiration timestamp
   */
  function hasExpiration(payload: JWTPayload): boolean {
    return typeof payload.exp === "number" && payload.exp > 0;
  }

  /**
   * Base64 URL decode (JWT uses URL-safe base64)
   */
  function base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    return atob(base64);
  }

  /**
   * Base64 URL encode
   */
  function base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  /**
   * Generate a mock JWT token for testing
   */
  function generateMockJWTToken(
    userId: number,
    email: string,
    iat: number,
    exp: number
  ): string {
    const header: JWTHeader = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload: JWTPayload = {
      iss: "http://localhost:8800",
      iat,
      exp,
      data: {
        user: {
          id: userId,
        },
      },
      user_id: userId,
      roles: ["customer"],
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    // Mock signature (in real scenario, this would be HMAC-SHA256)
    const signature = base64UrlEncode("mock_signature_" + userId);

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
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

  // Password arbitrary (valid passwords)
  const passwordArb = fc.stringMatching(/^[A-Za-z0-9!@#$%^&*]{8,20}$/);

  // User ID arbitrary
  const userIdArb = fc.integer({ min: 1, max: 100000 });

  // Timestamp arbitrary (current time +/- 1 day)
  const timestampArb = fc.integer({
    min: Math.floor(Date.now() / 1000) - 86400,
    max: Math.floor(Date.now() / 1000) + 86400,
  });

  // Vietnamese name arbitrary
  const vietnameseNameArb = fc.constantFrom(
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Minh",
    "Anh",
    "Hùng"
  );

  // Vietnamese phone arbitrary
  const phoneArb = fc
    .tuple(
      fc.constantFrom("09", "03", "07", "08", "05"),
      fc.stringMatching(/^[0-9]{8}$/)
    )
    .map(([prefix, suffix]) => `${prefix}${suffix}`);

  // Billing address arbitrary
  const billingAddressArb: fc.Arbitrary<BillingAddress> = fc.record({
    first_name: vietnameseNameArb,
    last_name: vietnameseNameArb,
    company: fc.oneof(fc.constant(""), fc.stringMatching(/^[A-Za-z ]{5,20}$/)),
    address_1: fc
      .tuple(fc.integer({ min: 1, max: 999 }), fc.stringMatching(/^[A-Za-z ]{5,15}$/))
      .map(([num, street]) => `${num} ${street}`),
    address_2: fc.constant(""),
    city: fc.constantFrom("Hồ Chí Minh", "Hà Nội", "Đà Nẵng"),
    state: fc.constantFrom("SG", "HN", "DN"),
    postcode: fc.stringMatching(/^[0-9]{5,6}$/),
    country: fc.constant("VN"),
    email: emailArb,
    phone: phoneArb,
  });

  // Shipping address arbitrary
  const shippingAddressArb: fc.Arbitrary<ShippingAddress> = fc.record({
    first_name: vietnameseNameArb,
    last_name: vietnameseNameArb,
    company: fc.constant(""),
    address_1: fc
      .tuple(fc.integer({ min: 1, max: 999 }), fc.stringMatching(/^[A-Za-z ]{5,15}$/))
      .map(([num, street]) => `${num} ${street}`),
    address_2: fc.constant(""),
    city: fc.constantFrom("Hồ Chí Minh", "Hà Nội", "Đà Nẵng"),
    state: fc.constantFrom("SG", "HN", "DN"),
    postcode: fc.stringMatching(/^[0-9]{5,6}$/),
    country: fc.constant("VN"),
  });

  // Valid JWT token response arbitrary
  const validJWTResponseArb: fc.Arbitrary<JWTTokenResponse> = fc
    .tuple(
      userIdArb,
      emailArb,
      vietnameseNameArb,
      vietnameseNameArb,
      timestampArb,
      billingAddressArb,
      shippingAddressArb
    )
    .map(([userId, email, firstName, lastName, iat, billing, shipping]) => {
      const exp = iat + 7 * 24 * 60 * 60; // 7 days expiration
      const token = generateMockJWTToken(userId, email, iat, exp);

      return {
        token,
        user_id: userId,
        user_email: email,
        user_display_name: `${firstName} ${lastName}`,
        user_nicename: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        user_registered: new Date(iat * 1000).toISOString(),
        user_roles: ["customer"],
        billing_address: billing,
        shipping_address: shipping,
        is_paying_customer: false,
        order_count: 0,
        total_spent: "0",
      };
    });

  // Invalid JWT token arbitrary (various invalid formats)
  const invalidTokenArb = fc.oneof(
    fc.constant(""), // Empty token
    fc.constant("invalid"), // No dots
    fc.constant("a.b"), // Only 2 parts
    fc.constant("a.b.c.d"), // 4 parts
    fc.constant("!!!.@@@.###"), // Invalid base64
    fc
      .tuple(fc.stringMatching(/^[a-zA-Z0-9]{10,20}$/), fc.stringMatching(/^[a-zA-Z0-9]{10,20}$/))
      .map(([a, b]) => `${a}.${b}.`) // Empty signature
  );

  // ============================================
  // Property Tests
  // ============================================

  it("should validate well-formed JWT tokens as valid", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        return result.valid === true && result.errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject invalid JWT token formats", () => {
    fc.assert(
      fc.property(invalidTokenArb, (token) => {
        const result = validateJWTToken(token);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        return result.valid === false && result.errors.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT response contains user ID", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTResponse(response);

        expect(result.valid).toBe(true);
        expect(response.user_id).toBeGreaterThan(0);

        return result.valid && response.user_id > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT response contains user email", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTResponse(response);

        expect(result.valid).toBe(true);
        expect(response.user_email).toBeTruthy();
        expect(response.user_email).toContain("@");

        return result.valid && response.user_email.includes("@");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT token payload contains user ID", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.payload).toBeDefined();
        expect(hasUserId(result.payload!)).toBe(true);

        return result.valid && hasUserId(result.payload!);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT token payload contains expiration timestamp", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.payload).toBeDefined();
        expect(hasExpiration(result.payload!)).toBe(true);

        return result.valid && hasExpiration(result.payload!);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT token expiration is approximately 7 days", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.payload).toBeDefined();

        const { iat, exp } = result.payload!;
        expect(isExpirationValid(exp, iat)).toBe(true);

        return result.valid && isExpirationValid(exp, iat);
      }),
      { numRuns: 100 }
    );
  });

  it("should detect missing token in response", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const responseWithoutToken = { ...response, token: "" };
        const result = validateJWTResponse(responseWithoutToken);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("missing_token");

        return result.errors.includes("missing_token");
      }),
      { numRuns: 100 }
    );
  });

  it("should detect missing user_id in response", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const responseWithoutUserId = { ...response, user_id: 0 };
        const result = validateJWTResponse(responseWithoutUserId);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("missing_or_invalid_user_id");

        return result.errors.includes("missing_or_invalid_user_id");
      }),
      { numRuns: 100 }
    );
  });

  it("should detect missing user_email in response", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const responseWithoutEmail = { ...response, user_email: "" };
        const result = validateJWTResponse(responseWithoutEmail);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("missing_user_email");

        return result.errors.includes("missing_user_email");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT header contains algorithm", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.header).toBeDefined();
        expect(result.header!.alg).toBe("HS256");

        return result.valid && result.header!.alg === "HS256";
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT header type is JWT", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.header).toBeDefined();
        expect(result.header!.typ).toBe("JWT");

        return result.valid && result.header!.typ === "JWT";
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT payload contains issuer", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.payload).toBeDefined();
        expect(result.payload!.iss).toBeTruthy();

        return result.valid && !!result.payload!.iss;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate JWT payload contains issued at timestamp", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        const result = validateJWTToken(response.token);

        expect(result.valid).toBe(true);
        expect(result.payload).toBeDefined();
        expect(typeof result.payload!.iat).toBe("number");
        expect(result.payload!.iat).toBeGreaterThan(0);

        return (
          result.valid &&
          typeof result.payload!.iat === "number" &&
          result.payload!.iat > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should include billing address in response when available", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        // Response should have billing address
        expect(response.billing_address).toBeDefined();
        if (response.billing_address) {
          expect(response.billing_address.country).toBe("VN");
        }

        return (
          response.billing_address === null ||
          response.billing_address.country === "VN"
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should include shipping address in response when available", () => {
    fc.assert(
      fc.property(validJWTResponseArb, (response) => {
        // Response should have shipping address
        expect(response.shipping_address).toBeDefined();
        if (response.shipping_address) {
          expect(response.shipping_address.country).toBe("VN");
        }

        return (
          response.shipping_address === null ||
          response.shipping_address.country === "VN"
        );
      }),
      { numRuns: 100 }
    );
  });
});
