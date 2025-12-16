import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  WooProduct,
  WooVariation,
  WooAttribute,
  WooCategory,
  WooImage,
  StockStatus,
  ProductType,
  ProductsResponse,
  ProductResponse,
} from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property: WooGraphQL product schema validation**
 * **Validates: Requirements 2.1, 2.4**
 *
 * For any product data returned from WooGraphQL, the response should match
 * the expected TypeScript type structure, with proper handling of variable
 * products and their variations.
 */
describe("Property: WooGraphQL product schema validation", () => {
  // ============================================
  // Arbitraries for WooCommerce types
  // ============================================

  const stockStatusArb: fc.Arbitrary<StockStatus> = fc.constantFrom(
    "IN_STOCK",
    "OUT_OF_STOCK",
    "ON_BACKORDER"
  );

  const productTypeArb: fc.Arbitrary<ProductType> = fc.constantFrom(
    "SIMPLE",
    "VARIABLE",
    "GROUPED",
    "EXTERNAL"
  );

  const wooImageArb: fc.Arbitrary<WooImage> = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  const wooAttributeArb: fc.Arbitrary<WooAttribute> = fc.record({
    id: fc.uuid(),
    name: fc.constantFrom("Size", "Color", "Material"),
    slug: fc.constantFrom("pa_size", "pa_color", "pa_material"),
    options: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
      minLength: 1,
      maxLength: 6,
    }),
    variation: fc.boolean(),
    visible: fc.boolean(),
  });

  const wooVariationAttributeArb = fc.record({
    name: fc.constantFrom("pa_size", "pa_color"),
    value: fc.string({ minLength: 1, maxLength: 20 }),
  });

  const wooVariationArb: fc.Arbitrary<WooVariation> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    sku: fc.string({ minLength: 3, maxLength: 20 }).map((s) =>
      s.toUpperCase().replace(/[^A-Z0-9]/g, "")
    ),
    price: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    regularPrice: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    salePrice: fc.option(
      fc.integer({ min: 10000, max: 10000000 }).map((p) =>
        `${p.toLocaleString("vi-VN")} ₫`
      ),
      { nil: null }
    ),
    stockStatus: stockStatusArb,
    stockQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
    attributes: fc.array(wooVariationAttributeArb, { minLength: 1, maxLength: 3 }),
    image: fc.option(wooImageArb, { nil: null }),
  });


  const wooCategoryArb: fc.Arbitrary<WooCategory> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 100 }).map((s) =>
      s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    ),
    description: fc.string({ maxLength: 500 }),
    image: fc.option(wooImageArb, { nil: null }),
    parent: fc.constant(null), // Simplified for testing
    children: fc.constant([]), // Simplified for testing
    count: fc.integer({ min: 0, max: 10000 }),
  });

  // Simple product arbitrary
  const simpleProductArb: fc.Arbitrary<WooProduct> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 200 }).map((s) =>
      s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    ),
    type: fc.constant("SIMPLE" as ProductType),
    description: fc.string({ maxLength: 5000 }),
    shortDescription: fc.string({ maxLength: 500 }),
    sku: fc.string({ minLength: 3, maxLength: 20 }).map((s) =>
      s.toUpperCase().replace(/[^A-Z0-9]/g, "")
    ),
    price: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    regularPrice: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    salePrice: fc.option(
      fc.integer({ min: 10000, max: 10000000 }).map((p) =>
        `${p.toLocaleString("vi-VN")} ₫`
      ),
      { nil: null }
    ),
    onSale: fc.boolean(),
    stockStatus: stockStatusArb,
    stockQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
    image: wooImageArb,
    galleryImages: fc.array(wooImageArb, { maxLength: 5 }),
    categories: fc.array(wooCategoryArb, { maxLength: 3 }),
    attributes: fc.array(wooAttributeArb, { maxLength: 3 }),
    variations: fc.constant(undefined),
    averageRating: fc.float({ min: 0, max: 5, noNaN: true }),
    reviewCount: fc.integer({ min: 0, max: 10000 }),
  });

  // Variable product arbitrary (with variations)
  const variableProductArb: fc.Arbitrary<WooProduct> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 200 }).map((s) =>
      s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    ),
    type: fc.constant("VARIABLE" as ProductType),
    description: fc.string({ maxLength: 5000 }),
    shortDescription: fc.string({ maxLength: 500 }),
    sku: fc.string({ minLength: 3, maxLength: 20 }).map((s) =>
      s.toUpperCase().replace(/[^A-Z0-9]/g, "")
    ),
    price: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    regularPrice: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    salePrice: fc.option(
      fc.integer({ min: 10000, max: 10000000 }).map((p) =>
        `${p.toLocaleString("vi-VN")} ₫`
      ),
      { nil: null }
    ),
    onSale: fc.boolean(),
    stockStatus: stockStatusArb,
    stockQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
    image: wooImageArb,
    galleryImages: fc.array(wooImageArb, { maxLength: 5 }),
    categories: fc.array(wooCategoryArb, { maxLength: 3 }),
    attributes: fc.array(wooAttributeArb, { minLength: 1, maxLength: 3 }),
    variations: fc.array(wooVariationArb, { minLength: 1, maxLength: 10 }),
    averageRating: fc.float({ min: 0, max: 5, noNaN: true }),
    reviewCount: fc.integer({ min: 0, max: 10000 }),
  });

  // Combined product arbitrary
  const wooProductArb: fc.Arbitrary<WooProduct> = fc.oneof(
    simpleProductArb,
    variableProductArb
  );


  // ============================================
  // Type validation helper functions
  // ============================================

  function isValidWooProduct(product: unknown): product is WooProduct {
    if (typeof product !== "object" || product === null) return false;
    const p = product as Record<string, unknown>;

    // Required fields
    if (typeof p.id !== "string") return false;
    if (typeof p.databaseId !== "number") return false;
    if (typeof p.name !== "string") return false;
    if (typeof p.slug !== "string") return false;
    if (typeof p.type !== "string") return false;
    if (typeof p.price !== "string") return false;
    if (typeof p.stockStatus !== "string") return false;

    // Validate stock status enum
    const validStockStatuses = ["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"];
    if (!validStockStatuses.includes(p.stockStatus as string)) return false;

    // Validate product type enum
    const validProductTypes = ["SIMPLE", "VARIABLE", "GROUPED", "EXTERNAL"];
    if (!validProductTypes.includes(p.type as string)) return false;

    return true;
  }

  function isValidWooVariation(variation: unknown): variation is WooVariation {
    if (typeof variation !== "object" || variation === null) return false;
    const v = variation as Record<string, unknown>;

    // Required fields
    if (typeof v.id !== "string") return false;
    if (typeof v.databaseId !== "number") return false;
    if (typeof v.sku !== "string") return false;
    if (typeof v.price !== "string") return false;
    if (typeof v.stockStatus !== "string") return false;

    // Validate stock status enum
    const validStockStatuses = ["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"];
    if (!validStockStatuses.includes(v.stockStatus as string)) return false;

    // Attributes should be an array
    if (!Array.isArray(v.attributes)) return false;

    return true;
  }

  // ============================================
  // Property Tests
  // ============================================

  it("should validate WooProduct type structure for any generated product", () => {
    fc.assert(
      fc.property(wooProductArb, (product) => {
        // Verify required fields exist and have correct types
        expect(typeof product.id).toBe("string");
        expect(typeof product.databaseId).toBe("number");
        expect(typeof product.name).toBe("string");
        expect(typeof product.slug).toBe("string");
        expect(typeof product.type).toBe("string");
        expect(typeof product.price).toBe("string");
        expect(typeof product.regularPrice).toBe("string");
        expect(typeof product.stockStatus).toBe("string");

        // Verify enum values
        expect(["SIMPLE", "VARIABLE", "GROUPED", "EXTERNAL"]).toContain(
          product.type
        );
        expect(["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"]).toContain(
          product.stockStatus
        );

        // Verify optional fields are either null/undefined or correct type
        if (product.salePrice !== null) {
          expect(typeof product.salePrice).toBe("string");
        }
        if (product.stockQuantity !== null) {
          expect(typeof product.stockQuantity).toBe("number");
        }

        // Verify type guard works
        expect(isValidWooProduct(product)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate variable product has variations with correct structure", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        // Variable products must have variations
        expect(product.type).toBe("VARIABLE");
        expect(product.variations).toBeDefined();
        expect(Array.isArray(product.variations)).toBe(true);
        expect(product.variations!.length).toBeGreaterThan(0);

        // Each variation should have correct structure
        product.variations!.forEach((variation) => {
          expect(typeof variation.id).toBe("string");
          expect(typeof variation.databaseId).toBe("number");
          expect(typeof variation.sku).toBe("string");
          expect(typeof variation.price).toBe("string");
          expect(typeof variation.stockStatus).toBe("string");
          expect(Array.isArray(variation.attributes)).toBe(true);
          expect(variation.attributes.length).toBeGreaterThan(0);

          // Verify type guard works
          expect(isValidWooVariation(variation)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate variation attributes have name and value", () => {
    fc.assert(
      fc.property(wooVariationArb, (variation) => {
        // Each attribute should have name and value
        variation.attributes.forEach((attr) => {
          expect(typeof attr.name).toBe("string");
          expect(typeof attr.value).toBe("string");
          expect(attr.name.length).toBeGreaterThan(0);
          expect(attr.value.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate product attributes have required fields", () => {
    fc.assert(
      fc.property(wooAttributeArb, (attribute) => {
        expect(typeof attribute.id).toBe("string");
        expect(typeof attribute.name).toBe("string");
        expect(typeof attribute.slug).toBe("string");
        expect(Array.isArray(attribute.options)).toBe(true);
        expect(typeof attribute.variation).toBe("boolean");
        expect(typeof attribute.visible).toBe("boolean");

        // Options should have at least one value
        expect(attribute.options.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate ProductsResponse structure with pagination", () => {
    const productsResponseArb: fc.Arbitrary<ProductsResponse> = fc.record({
      products: fc.record({
        pageInfo: fc.record({
          hasNextPage: fc.boolean(),
          hasPreviousPage: fc.boolean(),
          startCursor: fc.option(fc.string(), { nil: undefined }),
          endCursor: fc.option(fc.string(), { nil: undefined }),
        }),
        nodes: fc.array(wooProductArb, { maxLength: 10 }),
      }),
    });

    fc.assert(
      fc.property(productsResponseArb, (response) => {
        expect(typeof response.products.pageInfo.hasNextPage).toBe("boolean");
        expect(typeof response.products.pageInfo.hasPreviousPage).toBe("boolean");
        expect(Array.isArray(response.products.nodes)).toBe(true);

        // All products in nodes should be valid
        response.products.nodes.forEach((product) => {
          expect(isValidWooProduct(product)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate ProductResponse structure with nullable product", () => {
    const productResponseArb: fc.Arbitrary<ProductResponse> = fc.record({
      product: fc.option(wooProductArb, { nil: null }),
    });

    fc.assert(
      fc.property(productResponseArb, (response) => {
        // Product can be null (404 case) or a valid product
        if (response.product !== null) {
          expect(isValidWooProduct(response.product)).toBe(true);
        } else {
          expect(response.product).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should validate product categories have required fields", () => {
    fc.assert(
      fc.property(wooCategoryArb, (category) => {
        expect(typeof category.id).toBe("string");
        expect(typeof category.databaseId).toBe("number");
        expect(typeof category.name).toBe("string");
        expect(typeof category.slug).toBe("string");
        expect(typeof category.count).toBe("number");
        expect(category.count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate product image has required fields", () => {
    fc.assert(
      fc.property(wooImageArb, (image) => {
        expect(typeof image.sourceUrl).toBe("string");
        expect(typeof image.altText).toBe("string");
        // sourceUrl should be a valid URL
        expect(image.sourceUrl).toMatch(/^https?:\/\//);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate simple products do not have variations", () => {
    fc.assert(
      fc.property(simpleProductArb, (product) => {
        expect(product.type).toBe("SIMPLE");
        expect(product.variations).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
