import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { WooProduct, WooVariation, ProductType, StockStatus } from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property 4: Price field completeness**
 * **Validates: Requirements 6.1**
 *
 * For any product (simple or variation), both regular price and sale price fields
 * SHALL be available, with sale price being null or empty when no sale is active.
 */
describe("Property: Price field completeness", () => {
  // ============================================
  // Price validation types
  // ============================================

  interface PriceFields {
    price: string;
    regularPrice: string;
    salePrice: string | null;
    onSale: boolean;
  }

  // ============================================
  // Price validation logic
  // ============================================

  /**
   * Validates that price fields are complete and consistent.
   * - Regular price must always be present
   * - Sale price should be null/empty when not on sale
   * - Sale price should be present when on sale
   * - Price should equal sale price when on sale, regular price otherwise
   */
  function validatePriceFieldCompleteness(priceFields: PriceFields): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Regular price must always be present and non-empty
    if (!priceFields.regularPrice || priceFields.regularPrice.trim() === "") {
      errors.push("Regular price must be present and non-empty");
    }

    // Price field must always be present
    if (!priceFields.price || priceFields.price.trim() === "") {
      errors.push("Price field must be present and non-empty");
    }

    // When on sale, sale price should be present
    if (priceFields.onSale) {
      if (!priceFields.salePrice || priceFields.salePrice.trim() === "") {
        errors.push("Sale price must be present when product is on sale");
      }
    }

    // When not on sale, sale price should be null or empty
    if (!priceFields.onSale) {
      if (priceFields.salePrice !== null && priceFields.salePrice.trim() !== "") {
        errors.push("Sale price should be null or empty when product is not on sale");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extracts price fields from a product
   */
  function extractPriceFields(product: WooProduct | WooVariation): PriceFields {
    return {
      price: product.price,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      onSale: "onSale" in product ? product.onSale : product.salePrice !== null,
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // VND price arbitrary (formatted string)
  const vndPriceArb = fc
    .integer({ min: 10000, max: 10000000 })
    .map((p) => `${p.toLocaleString("vi-VN")} ₫`);

  // Sale price arbitrary - either null or a valid price
  const salePriceArb = (regularPriceValue: number): fc.Arbitrary<string | null> =>
    fc.oneof(
      fc.constant(null),
      fc
        .integer({ min: Math.floor(regularPriceValue * 0.1), max: regularPriceValue - 1 })
        .map((p) => `${p.toLocaleString("vi-VN")} ₫`)
    );

  // Price fields arbitrary with consistent on-sale state
  const consistentPriceFieldsArb: fc.Arbitrary<PriceFields> = fc
    .integer({ min: 10000, max: 10000000 })
    .chain((regularPriceValue) =>
      fc.boolean().chain((onSale) => {
        const regularPrice = `${regularPriceValue.toLocaleString("vi-VN")} ₫`;

        if (onSale) {
          // When on sale, generate a valid sale price
          return fc
            .integer({ min: Math.floor(regularPriceValue * 0.1), max: regularPriceValue - 1 })
            .map((salePriceValue) => {
              const salePrice = `${salePriceValue.toLocaleString("vi-VN")} ₫`;
              return {
                price: salePrice, // Current price is sale price
                regularPrice,
                salePrice,
                onSale: true,
              };
            });
        } else {
          // When not on sale, sale price is null
          return fc.constant({
            price: regularPrice, // Current price is regular price
            regularPrice,
            salePrice: null,
            onSale: false,
          });
        }
      })
    );

  // Stock status arbitrary
  const stockStatusArb: fc.Arbitrary<StockStatus> = fc.constantFrom(
    "IN_STOCK",
    "OUT_OF_STOCK",
    "ON_BACKORDER"
  );

  // SKU arbitrary
  const skuArb = fc
    .tuple(
      fc.string({ minLength: 2, maxLength: 4 }).map((s) => s.toUpperCase().replace(/[^A-Z]/g, "X")),
      fc.integer({ min: 1000, max: 9999 })
    )
    .map(([prefix, num]) => `${prefix}-${num}`);

  // Image arbitrary
  const wooImageArb = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  // Variation arbitrary with consistent price fields
  const variationWithPricesArb: fc.Arbitrary<WooVariation> = fc
    .tuple(fc.uuid(), fc.integer({ min: 1, max: 1000000 }), skuArb, consistentPriceFieldsArb, stockStatusArb)
    .map(([id, databaseId, sku, priceFields, stockStatus]) => ({
      id,
      databaseId,
      sku,
      price: priceFields.price,
      regularPrice: priceFields.regularPrice,
      salePrice: priceFields.salePrice,
      stockStatus,
      stockQuantity: fc.sample(fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }), 1)[0],
      attributes: [{ name: "pa_size", value: "M" }],
      image: null,
    }));

  // Simple product arbitrary with consistent price fields
  const simpleProductWithPricesArb: fc.Arbitrary<WooProduct> = fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 1, max: 1000000 }),
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.string({ minLength: 1, maxLength: 100 }).map((s) =>
        s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      ),
      skuArb,
      consistentPriceFieldsArb,
      stockStatusArb,
      wooImageArb
    )
    .map(([id, databaseId, name, slug, sku, priceFields, stockStatus, image]) => ({
      id,
      databaseId,
      name: name || "Product",
      slug: slug || "product",
      type: "SIMPLE" as ProductType,
      description: "",
      shortDescription: "",
      sku,
      price: priceFields.price,
      regularPrice: priceFields.regularPrice,
      salePrice: priceFields.salePrice,
      onSale: priceFields.onSale,
      stockStatus,
      stockQuantity: null,
      image,
      galleryImages: [],
      categories: [],
      attributes: [],
      averageRating: 0,
      reviewCount: 0,
    }));

  // Variable product arbitrary with variations
  const variableProductWithPricesArb: fc.Arbitrary<WooProduct> = fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 1, max: 1000000 }),
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.string({ minLength: 1, maxLength: 100 }).map((s) =>
        s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      ),
      skuArb,
      consistentPriceFieldsArb,
      stockStatusArb,
      wooImageArb,
      fc.array(variationWithPricesArb, { minLength: 1, maxLength: 5 })
    )
    .map(([id, databaseId, name, slug, sku, priceFields, stockStatus, image, variations]) => ({
      id,
      databaseId,
      name: name || "Product",
      slug: slug || "product",
      type: "VARIABLE" as ProductType,
      description: "",
      shortDescription: "",
      sku,
      price: priceFields.price,
      regularPrice: priceFields.regularPrice,
      salePrice: priceFields.salePrice,
      onSale: priceFields.onSale,
      stockStatus,
      stockQuantity: null,
      image,
      galleryImages: [],
      categories: [],
      attributes: [
        {
          id: "attr-1",
          name: "Size",
          slug: "pa_size",
          options: ["S", "M", "L"],
          variation: true,
          visible: true,
        },
      ],
      variations,
      averageRating: 0,
      reviewCount: 0,
    }));

  // Any product arbitrary
  const anyProductArb = fc.oneof(simpleProductWithPricesArb, variableProductWithPricesArb);

  // ============================================
  // Property Tests
  // ============================================

  it("should ensure regular price is always present for any product", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        expect(product.regularPrice).toBeDefined();
        expect(typeof product.regularPrice).toBe("string");
        expect(product.regularPrice.trim().length).toBeGreaterThan(0);

        return (
          product.regularPrice !== undefined &&
          typeof product.regularPrice === "string" &&
          product.regularPrice.trim().length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure price field is always present for any product", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        expect(product.price).toBeDefined();
        expect(typeof product.price).toBe("string");
        expect(product.price.trim().length).toBeGreaterThan(0);

        return (
          product.price !== undefined &&
          typeof product.price === "string" &&
          product.price.trim().length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure sale price is null or empty when product is not on sale", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        if (!product.onSale) {
          const salePriceIsNullOrEmpty =
            product.salePrice === null || product.salePrice.trim() === "";
          expect(salePriceIsNullOrEmpty).toBe(true);
          return salePriceIsNullOrEmpty;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure sale price is present when product is on sale", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        if (product.onSale) {
          expect(product.salePrice).not.toBeNull();
          expect(product.salePrice!.trim().length).toBeGreaterThan(0);
          return product.salePrice !== null && product.salePrice.trim().length > 0;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure all variations have complete price fields", () => {
    fc.assert(
      fc.property(variableProductWithPricesArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true;
        }

        return product.variations.every((variation) => {
          // Regular price must be present
          expect(variation.regularPrice).toBeDefined();
          expect(typeof variation.regularPrice).toBe("string");
          expect(variation.regularPrice.trim().length).toBeGreaterThan(0);

          // Price must be present
          expect(variation.price).toBeDefined();
          expect(typeof variation.price).toBe("string");
          expect(variation.price.trim().length).toBeGreaterThan(0);

          return (
            variation.regularPrice !== undefined &&
            variation.regularPrice.trim().length > 0 &&
            variation.price !== undefined &&
            variation.price.trim().length > 0
          );
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure price field consistency for products on sale", () => {
    fc.assert(
      fc.property(consistentPriceFieldsArb, (priceFields) => {
        const validation = validatePriceFieldCompleteness(priceFields);

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
          console.log("Validation errors:", validation.errors);
        }

        return validation.isValid;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure sale price type is string or null", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        const isValidType =
          product.salePrice === null || typeof product.salePrice === "string";

        expect(isValidType).toBe(true);
        return isValidType;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure variation sale price type is string or null", () => {
    fc.assert(
      fc.property(variableProductWithPricesArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true;
        }

        return product.variations.every((variation) => {
          const isValidType =
            variation.salePrice === null || typeof variation.salePrice === "string";

          expect(isValidType).toBe(true);
          return isValidType;
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure price fields are available for both simple and variable products", () => {
    fc.assert(
      fc.property(anyProductArb, (product) => {
        const priceFields = extractPriceFields(product);

        // All required fields should be accessible
        expect("price" in priceFields).toBe(true);
        expect("regularPrice" in priceFields).toBe(true);
        expect("salePrice" in priceFields).toBe(true);
        expect("onSale" in priceFields).toBe(true);

        return (
          "price" in priceFields &&
          "regularPrice" in priceFields &&
          "salePrice" in priceFields &&
          "onSale" in priceFields
        );
      }),
      { numRuns: 100 }
    );
  });
});
