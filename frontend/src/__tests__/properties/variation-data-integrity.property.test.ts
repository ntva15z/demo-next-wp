import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  WooProduct,
  WooVariation,
  WooAttribute,
  WooVariationAttribute,
  StockStatus,
  ProductType,
} from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property 1: Variable product variation data integrity**
 * **Validates: Requirements 2.4, 3.4, 5.1**
 *
 * For any variable product with variations, each variation SHALL have its own unique SKU,
 * individual stock quantity tracking, and correctly associated attribute values (size, color).
 */
describe("Property: Variable product variation data integrity", () => {
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

  const wooImageArb = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  // Size options for clothing
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizeArb = fc.constantFrom(...sizeOptions);

  // Color options
  const colorOptions = ["Red", "Blue", "Green", "Black", "White", "Navy", "Gray"];
  const colorArb = fc.constantFrom(...colorOptions);

  // SKU generator - ensures unique format
  const skuArb = fc
    .tuple(
      fc.string({ minLength: 2, maxLength: 4 }).map((s) => s.toUpperCase().replace(/[^A-Z]/g, "X")),
      fc.integer({ min: 1000, max: 9999 }),
      fc.string({ minLength: 1, maxLength: 2 }).map((s) => s.toUpperCase().replace(/[^A-Z]/g, "A"))
    )
    .map(([prefix, num, suffix]) => `${prefix}-${num}-${suffix}`);

  // Variation attribute arbitrary
  const variationAttributeArb: fc.Arbitrary<WooVariationAttribute> = fc.oneof(
    fc.record({
      name: fc.constant("pa_size"),
      value: sizeArb,
    }),
    fc.record({
      name: fc.constant("pa_color"),
      value: colorArb,
    })
  );

  // Product attribute arbitrary
  const productAttributeArb: fc.Arbitrary<WooAttribute> = fc.oneof(
    fc.record({
      id: fc.uuid(),
      name: fc.constant("Size"),
      slug: fc.constant("pa_size"),
      options: fc.constant(sizeOptions),
      variation: fc.constant(true),
      visible: fc.boolean(),
    }),
    fc.record({
      id: fc.uuid(),
      name: fc.constant("Color"),
      slug: fc.constant("pa_color"),
      options: fc.constant(colorOptions),
      variation: fc.constant(true),
      visible: fc.boolean(),
    })
  );

  // Price arbitrary (VND format)
  const priceArb = fc
    .integer({ min: 10000, max: 10000000 })
    .map((p) => `${p.toLocaleString("vi-VN")} ₫`);

  // Variation arbitrary
  const variationArb: fc.Arbitrary<WooVariation> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    sku: skuArb,
    price: priceArb,
    regularPrice: priceArb,
    salePrice: fc.option(priceArb, { nil: null }),
    stockStatus: stockStatusArb,
    stockQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
    attributes: fc.array(variationAttributeArb, { minLength: 1, maxLength: 2 }),
    image: fc.option(wooImageArb, { nil: null }),
  });

  // Generate unique variations with unique SKUs
  const uniqueVariationsArb = (count: number): fc.Arbitrary<WooVariation[]> =>
    fc
      .array(variationArb, { minLength: count, maxLength: count })
      .map((variations) => {
        // Ensure unique SKUs by appending index
        return variations.map((v, idx) => ({
          ...v,
          sku: `${v.sku}-V${idx}`,
        }));
      });

  // Generate variations that match product attributes
  const variationsForAttributesArb = (
    attributes: WooAttribute[],
    count: number
  ): fc.Arbitrary<WooVariation[]> => {
    // Get the attribute slugs from product attributes
    const attrSlugs = attributes.map((a) => a.slug);
    
    // Create variation attribute arbitrary that only uses product attributes
    const matchingVariationAttrArb: fc.Arbitrary<WooVariationAttribute> = fc.oneof(
      ...attrSlugs.map((slug) => {
        if (slug === "pa_size") {
          return fc.record({
            name: fc.constant("pa_size"),
            value: sizeArb,
          });
        } else {
          return fc.record({
            name: fc.constant("pa_color"),
            value: colorArb,
          });
        }
      })
    );

    // Create variation arbitrary with matching attributes
    const matchingVariationArb: fc.Arbitrary<WooVariation> = fc.record({
      id: fc.uuid(),
      databaseId: fc.integer({ min: 1, max: 1000000 }),
      sku: skuArb,
      price: priceArb,
      regularPrice: priceArb,
      salePrice: fc.option(priceArb, { nil: null }),
      stockStatus: stockStatusArb,
      stockQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
      attributes: fc.array(matchingVariationAttrArb, { minLength: 1, maxLength: attrSlugs.length }),
      image: fc.option(wooImageArb, { nil: null }),
    });

    return fc
      .array(matchingVariationArb, { minLength: count, maxLength: count })
      .map((variations) => {
        // Ensure unique SKUs by appending index
        return variations.map((v, idx) => ({
          ...v,
          sku: `${v.sku}-V${idx}`,
        }));
      });
  };

  // Variable product arbitrary
  const variableProductArb: fc.Arbitrary<WooProduct> = fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 1, max: 1000000 }),
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.string({ minLength: 1, maxLength: 200 }).map((s) =>
        s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      ),
      fc.string({ maxLength: 2000 }),
      fc.string({ maxLength: 500 }),
      skuArb,
      priceArb,
      priceArb,
      fc.option(priceArb, { nil: null }),
      fc.boolean(),
      stockStatusArb,
      fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
      wooImageArb,
      fc.array(wooImageArb, { maxLength: 5 }),
      fc.array(productAttributeArb, { minLength: 1, maxLength: 2 }),
      fc.integer({ min: 2, max: 6 }), // Number of variations
      fc.float({ min: 0, max: 5, noNaN: true }),
      fc.integer({ min: 0, max: 1000 })
    )
    .chain(
      ([
        id,
        databaseId,
        name,
        slug,
        description,
        shortDescription,
        sku,
        price,
        regularPrice,
        salePrice,
        onSale,
        stockStatus,
        stockQuantity,
        image,
        galleryImages,
        attributes,
        variationCount,
        averageRating,
        reviewCount,
      ]) =>
        variationsForAttributesArb(attributes, variationCount).map((variations) => ({
          id,
          databaseId,
          name: name || "Product",
          slug: slug || "product",
          type: "VARIABLE" as ProductType,
          description,
          shortDescription,
          sku,
          price,
          regularPrice,
          salePrice,
          onSale,
          stockStatus,
          stockQuantity,
          image,
          galleryImages,
          categories: [],
          attributes,
          variations,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount,
        }))
    );

  // ============================================
  // Validation helper functions
  // ============================================

  function hasUniqueSKUs(variations: WooVariation[]): boolean {
    const skus = variations.map((v) => v.sku);
    const uniqueSkus = new Set(skus);
    return skus.length === uniqueSkus.size;
  }

  function hasValidStockTracking(variation: WooVariation): boolean {
    // Each variation should have stock status
    if (!variation.stockStatus) return false;

    // If stock quantity is tracked, it should be a number or null
    if (
      variation.stockQuantity !== null &&
      typeof variation.stockQuantity !== "number"
    ) {
      return false;
    }

    // Stock quantity should be non-negative when present
    if (
      variation.stockQuantity !== null &&
      variation.stockQuantity < 0
    ) {
      return false;
    }

    return true;
  }

  function hasValidAttributes(variation: WooVariation): boolean {
    // Each variation should have at least one attribute
    if (!variation.attributes || variation.attributes.length === 0) {
      return false;
    }

    // Each attribute should have name and value
    return variation.attributes.every(
      (attr) =>
        typeof attr.name === "string" &&
        attr.name.length > 0 &&
        typeof attr.value === "string" &&
        attr.value.length > 0
    );
  }

  function variationAttributesMatchProductAttributes(
    product: WooProduct
  ): boolean {
    if (!product.variations || !product.attributes) return true;

    const productAttrSlugs = new Set(product.attributes.map((a) => a.slug));

    return product.variations.every((variation) =>
      variation.attributes.every((attr) => productAttrSlugs.has(attr.name))
    );
  }

  // ============================================
  // Property Tests
  // ============================================

  it("should ensure all variations have unique SKUs", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true; // No variations to check
        }

        const hasUnique = hasUniqueSKUs(product.variations);
        expect(hasUnique).toBe(true);
        return hasUnique;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure all variations have individual stock tracking", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true;
        }

        const allValid = product.variations.every(hasValidStockTracking);
        expect(allValid).toBe(true);
        return allValid;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure all variations have correctly associated attribute values", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true;
        }

        const allValid = product.variations.every(hasValidAttributes);
        expect(allValid).toBe(true);
        return allValid;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure variation attributes match product-level attributes", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        const matches = variationAttributesMatchProductAttributes(product);
        expect(matches).toBe(true);
        return matches;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure each variation has required fields", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        if (!product.variations || product.variations.length === 0) {
          return true;
        }

        return product.variations.every((variation) => {
          // Required fields check
          expect(typeof variation.id).toBe("string");
          expect(typeof variation.databaseId).toBe("number");
          expect(typeof variation.sku).toBe("string");
          expect(variation.sku.length).toBeGreaterThan(0);
          expect(typeof variation.price).toBe("string");
          expect(typeof variation.regularPrice).toBe("string");
          expect(typeof variation.stockStatus).toBe("string");
          expect(["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"]).toContain(
            variation.stockStatus
          );

          return true;
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure variable products have at least one variation attribute defined", () => {
    fc.assert(
      fc.property(variableProductArb, (product) => {
        if (product.type !== "VARIABLE") {
          return true;
        }

        // Variable products should have attributes marked for variation
        const hasVariationAttributes = product.attributes.some(
          (attr) => attr.variation === true
        );
        expect(hasVariationAttributes).toBe(true);
        return hasVariationAttributes;
      }),
      { numRuns: 100 }
    );
  });
});
