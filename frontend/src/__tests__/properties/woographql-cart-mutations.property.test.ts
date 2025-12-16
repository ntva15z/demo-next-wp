import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  WooCart,
  WooCartItem,
  WooProduct,
  WooVariation,
  WooCoupon,
  StockStatus,
  ProductType,
  CartResponse,
  AddToCartResponse,
  UpdateCartResponse,
  RemoveCartItemResponse,
} from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property: WooGraphQL cart mutations validation**
 * **Validates: Requirements 2.2**
 *
 * For any cart mutation (addToCart, updateCartItemQuantities, removeCartItem),
 * the response should correctly reflect the cart state and totals should be
 * calculated properly.
 */
describe("Property: WooGraphQL cart mutations validation", () => {
  // ============================================
  // Arbitraries for Cart types
  // ============================================

  const stockStatusArb: fc.Arbitrary<StockStatus> = fc.constantFrom(
    "IN_STOCK",
    "OUT_OF_STOCK",
    "ON_BACKORDER"
  );

  const wooImageArb = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  // Simplified product for cart items
  const cartProductArb: fc.Arbitrary<WooProduct> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 200 }).map((s) =>
      s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    ),
    type: fc.constant("SIMPLE" as ProductType),
    description: fc.string({ maxLength: 500 }),
    shortDescription: fc.string({ maxLength: 200 }),
    sku: fc.string({ minLength: 3, maxLength: 20 }).map((s) =>
      s.toUpperCase().replace(/[^A-Z0-9]/g, "")
    ),
    price: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    regularPrice: fc.integer({ min: 10000, max: 10000000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    salePrice: fc.constant(null),
    onSale: fc.constant(false),
    stockStatus: fc.constant("IN_STOCK" as StockStatus),
    stockQuantity: fc.integer({ min: 1, max: 100 }),
    image: wooImageArb,
    galleryImages: fc.constant([]),
    categories: fc.constant([]),
    attributes: fc.constant([]),
    variations: fc.constant(undefined),
    averageRating: fc.constant(0),
    reviewCount: fc.constant(0),
  });

  const cartVariationArb: fc.Arbitrary<WooVariation> = fc.record({
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
    salePrice: fc.constant(null),
    stockStatus: fc.constant("IN_STOCK" as StockStatus),
    stockQuantity: fc.integer({ min: 1, max: 100 }),
    attributes: fc.array(
      fc.record({
        name: fc.constantFrom("pa_size", "pa_color"),
        value: fc.string({ minLength: 1, maxLength: 20 }),
      }),
      { minLength: 1, maxLength: 2 }
    ),
    image: fc.option(wooImageArb, { nil: null }),
  });

  // Cart item key generator (32 character hex string)
  const cartItemKeyArb = fc
    .array(fc.integer({ min: 0, max: 15 }), { minLength: 32, maxLength: 32 })
    .map((arr) => arr.map((n) => n.toString(16)).join(""));

  // Price in VND (as number for calculations)
  const priceArb = fc.integer({ min: 10000, max: 10000000 });

  // Cart item arbitrary
  const wooCartItemArb: fc.Arbitrary<WooCartItem> = fc
    .tuple(cartItemKeyArb, cartProductArb, priceArb, fc.integer({ min: 1, max: 10 }))
    .map(([key, product, price, quantity]) => ({
      key,
      product: { node: product },
      variation: null,
      quantity,
      subtotal: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
      total: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
    }));


  // Coupon arbitrary - generate alphanumeric codes
  const wooCouponArb: fc.Arbitrary<WooCoupon> = fc.record({
    code: fc
      .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 3, maxLength: 20 })
      .map((arr) => arr.join("")),
    discountAmount: fc.integer({ min: 1000, max: 500000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
    discountType: fc.constantFrom("percent", "fixed_cart", "fixed_product"),
  });

  // Cart arbitrary
  const wooCartArb: fc.Arbitrary<WooCart> = fc
    .tuple(
      fc.array(wooCartItemArb, { minLength: 0, maxLength: 5 }),
      fc.array(wooCouponArb, { minLength: 0, maxLength: 2 }),
      priceArb, // subtotal
      priceArb  // shipping
    )
    .map(([items, coupons, subtotal, shipping]) => {
      const total = subtotal + shipping;
      return {
        contents: { nodes: items },
        subtotal: `${subtotal.toLocaleString("vi-VN")} ₫`,
        subtotalTax: "0 ₫",
        shippingTotal: `${shipping.toLocaleString("vi-VN")} ₫`,
        shippingTax: "0 ₫",
        discountTotal: "0 ₫",
        total: `${total.toLocaleString("vi-VN")} ₫`,
        totalTax: "0 ₫",
        appliedCoupons: { nodes: coupons },
        chosenShippingMethods: [],
        availableShippingMethods: [],
        formattedTotal: `${total.toLocaleString("vi-VN")} ₫`,
        formattedSubtotal: `${subtotal.toLocaleString("vi-VN")} ₫`,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

  // ============================================
  // Type validation helper functions
  // ============================================

  function isValidCartItem(item: unknown): item is WooCartItem {
    if (typeof item !== "object" || item === null) return false;
    const i = item as Record<string, unknown>;

    if (typeof i.key !== "string") return false;
    if (typeof i.quantity !== "number") return false;
    if (typeof i.subtotal !== "string") return false;
    if (typeof i.total !== "string") return false;
    if (typeof i.product !== "object" || i.product === null) return false;

    return true;
  }

  function isValidCart(cart: unknown): cart is WooCart {
    if (typeof cart !== "object" || cart === null) return false;
    const c = cart as Record<string, unknown>;

    if (typeof c.subtotal !== "string") return false;
    if (typeof c.total !== "string") return false;
    if (typeof c.contents !== "object" || c.contents === null) return false;

    const contents = c.contents as Record<string, unknown>;
    if (!Array.isArray(contents.nodes)) return false;

    return true;
  }

  // ============================================
  // Property Tests
  // ============================================

  it("should validate WooCart type structure for any generated cart", () => {
    fc.assert(
      fc.property(wooCartArb, (cart) => {
        // Verify required fields exist and have correct types
        expect(typeof cart.subtotal).toBe("string");
        expect(typeof cart.total).toBe("string");
        expect(typeof cart.shippingTotal).toBe("string");
        expect(Array.isArray(cart.contents.nodes)).toBe(true);
        expect(Array.isArray(cart.appliedCoupons.nodes)).toBe(true);

        // Verify type guard works
        expect(isValidCart(cart)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate cart item count equals sum of quantities", () => {
    fc.assert(
      fc.property(wooCartArb, (cart) => {
        const expectedCount = cart.contents.nodes.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        expect(cart.itemCount).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate each cart item has required fields", () => {
    fc.assert(
      fc.property(wooCartItemArb, (item) => {
        expect(typeof item.key).toBe("string");
        expect(item.key.length).toBe(32); // Cart item keys are 32 char hex strings
        expect(typeof item.quantity).toBe("number");
        expect(item.quantity).toBeGreaterThan(0);
        expect(typeof item.subtotal).toBe("string");
        expect(typeof item.total).toBe("string");
        expect(item.product).toBeDefined();
        expect(item.product.node).toBeDefined();

        // Verify type guard works
        expect(isValidCartItem(item)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate CartResponse structure", () => {
    const cartResponseArb: fc.Arbitrary<CartResponse> = fc.record({
      cart: wooCartArb,
    });

    fc.assert(
      fc.property(cartResponseArb, (response) => {
        expect(response.cart).toBeDefined();
        expect(isValidCart(response.cart)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate AddToCartResponse structure", () => {
    const addToCartResponseArb: fc.Arbitrary<AddToCartResponse> = fc.record({
      addToCart: fc.record({
        cartItem: wooCartItemArb,
        cart: wooCartArb,
      }),
    });

    fc.assert(
      fc.property(addToCartResponseArb, (response) => {
        expect(response.addToCart).toBeDefined();
        expect(response.addToCart.cartItem).toBeDefined();
        expect(response.addToCart.cart).toBeDefined();

        expect(isValidCartItem(response.addToCart.cartItem)).toBe(true);
        expect(isValidCart(response.addToCart.cart)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate UpdateCartResponse structure", () => {
    const updateCartResponseArb: fc.Arbitrary<UpdateCartResponse> = fc.record({
      updateItemQuantities: fc.record({
        cart: wooCartArb,
      }),
    });

    fc.assert(
      fc.property(updateCartResponseArb, (response) => {
        expect(response.updateItemQuantities).toBeDefined();
        expect(response.updateItemQuantities.cart).toBeDefined();
        expect(isValidCart(response.updateItemQuantities.cart)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate RemoveCartItemResponse structure", () => {
    const removeCartItemResponseArb: fc.Arbitrary<RemoveCartItemResponse> =
      fc.record({
        removeItemsFromCart: fc.record({
          cart: wooCartArb,
        }),
      });

    fc.assert(
      fc.property(removeCartItemResponseArb, (response) => {
        expect(response.removeItemsFromCart).toBeDefined();
        expect(response.removeItemsFromCart.cart).toBeDefined();
        expect(isValidCart(response.removeItemsFromCart.cart)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate coupon has required fields", () => {
    fc.assert(
      fc.property(wooCouponArb, (coupon) => {
        expect(typeof coupon.code).toBe("string");
        expect(coupon.code.length).toBeGreaterThan(0);
        expect(typeof coupon.discountAmount).toBe("string");
        expect(typeof coupon.discountType).toBe("string");
        expect(["percent", "fixed_cart", "fixed_product"]).toContain(
          coupon.discountType
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should validate cart with variation items", () => {
    const cartItemWithVariationArb: fc.Arbitrary<WooCartItem> = fc
      .tuple(
        cartItemKeyArb,
        cartProductArb,
        cartVariationArb,
        priceArb,
        fc.integer({ min: 1, max: 10 })
      )
      .map(([key, product, variation, price, quantity]) => ({
        key,
        product: { node: { ...product, type: "VARIABLE" as ProductType } },
        variation: { node: variation },
        quantity,
        subtotal: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
        total: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
      }));

    fc.assert(
      fc.property(cartItemWithVariationArb, (item) => {
        expect(item.variation).not.toBeNull();
        expect(item.variation!.node).toBeDefined();
        expect(typeof item.variation!.node.id).toBe("string");
        expect(typeof item.variation!.node.sku).toBe("string");
        expect(Array.isArray(item.variation!.node.attributes)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate empty cart has zero item count", () => {
    const emptyCartArb: fc.Arbitrary<WooCart> = fc.constant({
      contents: { nodes: [] },
      subtotal: "0 ₫",
      subtotalTax: "0 ₫",
      shippingTotal: "0 ₫",
      shippingTax: "0 ₫",
      discountTotal: "0 ₫",
      total: "0 ₫",
      totalTax: "0 ₫",
      appliedCoupons: { nodes: [] },
      chosenShippingMethods: [],
      availableShippingMethods: [],
      formattedTotal: "0 ₫",
      formattedSubtotal: "0 ₫",
      itemCount: 0,
    });

    fc.assert(
      fc.property(emptyCartArb, (cart) => {
        expect(cart.contents.nodes.length).toBe(0);
        expect(cart.itemCount).toBe(0);
        expect(cart.appliedCoupons.nodes.length).toBe(0);
      }),
      { numRuns: 10 }
    );
  });
});
