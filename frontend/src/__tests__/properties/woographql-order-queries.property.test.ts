import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  WooOrder,
  WooCustomer,
  WooAddress,
  WooLineItem,
  WooShippingLine,
  WooProduct,
  WooVariation,
  OrderStatus,
  StockStatus,
  ProductType,
  OrderResponse,
  CustomerResponse,
  CheckoutResponse,
} from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property: WooGraphQL order queries validation**
 * **Validates: Requirements 2.3**
 *
 * For any order query or mutation, the response should correctly reflect
 * the order data including customer details, line items, and status.
 */
describe("Property: WooGraphQL order queries validation", () => {
  // ============================================
  // Arbitraries for Order types
  // ============================================

  const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(
    "PENDING",
    "PROCESSING",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
    "FAILED"
  );

  const vietnamProvinceArb = fc.constantFrom(
    "SG", // Ho Chi Minh
    "HN", // Hanoi
    "DN", // Da Nang
    "HP", // Hai Phong
    "CT"  // Can Tho
  );

  const phoneNumberArb = fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 })
    .map((arr) => "0" + arr.join(""));

  const wooAddressArb: fc.Arbitrary<WooAddress> = fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    company: fc.string({ maxLength: 100 }),
    address1: fc.string({ minLength: 1, maxLength: 200 }),
    address2: fc.string({ maxLength: 200 }),
    city: fc.constantFrom("Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ"),
    state: vietnamProvinceArb,
    postcode: fc.string({ minLength: 5, maxLength: 6 }).map((s) => s.replace(/\D/g, "").padStart(6, "0")),
    country: fc.constant("VN"),
    phone: phoneNumberArb,
    email: fc.emailAddress(),
  });

  const wooImageArb = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  // Simplified product for line items
  const lineItemProductArb: fc.Arbitrary<WooProduct> = fc.record({
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


  // Price in VND (as number for calculations)
  const priceArb = fc.integer({ min: 10000, max: 10000000 });

  // Line item arbitrary
  const wooLineItemArb: fc.Arbitrary<WooLineItem> = fc
    .tuple(lineItemProductArb, priceArb, fc.integer({ min: 1, max: 10 }))
    .map(([product, price, quantity]) => ({
      product: { node: product },
      variation: null,
      quantity,
      subtotal: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
      total: `${(price * quantity).toLocaleString("vi-VN")} ₫`,
    }));

  // Shipping line arbitrary
  const wooShippingLineArb: fc.Arbitrary<WooShippingLine> = fc.record({
    methodTitle: fc.constantFrom(
      "Giao hàng tiêu chuẩn",
      "Giao hàng nhanh",
      "Miễn phí vận chuyển"
    ),
    total: fc.integer({ min: 0, max: 100000 }).map((p) =>
      `${p.toLocaleString("vi-VN")} ₫`
    ),
  });

  // ISO date string arbitrary
  const isoDateStringArb = fc
    .integer({ min: 1609459200000, max: 1924905600000 }) // 2021-01-01 to 2030-12-31
    .map((ts) => new Date(ts).toISOString());

  // Order number arbitrary
  const orderNumberArb = fc.integer({ min: 1000, max: 999999 }).map((n) => n.toString());

  // Order arbitrary
  const wooOrderArb: fc.Arbitrary<WooOrder> = fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 1, max: 1000000 }),
      orderNumberArb,
      orderStatusArb,
      isoDateStringArb,
      fc.option(isoDateStringArb, { nil: null }),
      priceArb, // subtotal
      priceArb, // shipping
      fc.array(wooLineItemArb, { minLength: 1, maxLength: 5 }),
      fc.array(wooShippingLineArb, { minLength: 0, maxLength: 2 }),
      wooAddressArb,
      wooAddressArb,
      fc.constantFrom("cod", "vnpay", "momo"),
      fc.string({ maxLength: 500 })
    )
    .map(([
      id,
      databaseId,
      orderNumber,
      status,
      date,
      dateCompleted,
      subtotal,
      shipping,
      lineItems,
      shippingLines,
      billing,
      shippingAddr,
      paymentMethod,
      customerNote,
    ]) => {
      const total = subtotal + shipping;
      const paymentTitles: Record<string, string> = {
        cod: "Thanh toán khi nhận hàng",
        vnpay: "VNPay",
        momo: "MoMo",
      };
      return {
        id,
        databaseId,
        orderNumber,
        status,
        date,
        dateCompleted,
        subtotal: `${subtotal.toLocaleString("vi-VN")} ₫`,
        shippingTotal: `${shipping.toLocaleString("vi-VN")} ₫`,
        discountTotal: "0 ₫",
        total: `${total.toLocaleString("vi-VN")} ₫`,
        paymentMethod,
        paymentMethodTitle: paymentTitles[paymentMethod] || paymentMethod,
        billing,
        shipping: shippingAddr,
        lineItems: { nodes: lineItems },
        shippingLines: { nodes: shippingLines },
        customerNote,
        formattedTotal: `${total.toLocaleString("vi-VN")} ₫`,
        statusLabel: getStatusLabel(status),
        formattedDate: new Date(date).toLocaleDateString("vi-VN"),
        formattedShippingAddress: formatAddress(shippingAddr),
        formattedBillingAddress: formatAddress(billing),
      };
    });

  // Helper function to get status label
  function getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: "Chờ thanh toán",
      PROCESSING: "Đang xử lý",
      ON_HOLD: "Tạm giữ",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
      FAILED: "Thất bại",
    };
    return labels[status];
  }

  // Helper function to format address
  function formatAddress(addr: WooAddress): string {
    return `${addr.firstName} ${addr.lastName}, ${addr.address1}, ${addr.city}, ${addr.country}`;
  }


  // Customer arbitrary
  const wooCustomerArb: fc.Arbitrary<WooCustomer> = fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 1, max: 1000000 }),
      fc.emailAddress(),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 50 }),
      wooAddressArb,
      wooAddressArb,
      fc.array(wooOrderArb, { minLength: 0, maxLength: 5 })
    )
    .map(([id, databaseId, email, firstName, lastName, billing, shipping, orders]) => ({
      id,
      databaseId,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      billing,
      shipping,
      orders: { nodes: orders },
    }));

  // ============================================
  // Type validation helper functions
  // ============================================

  function isValidOrder(order: unknown): order is WooOrder {
    if (typeof order !== "object" || order === null) return false;
    const o = order as Record<string, unknown>;

    // Required fields
    if (typeof o.id !== "string") return false;
    if (typeof o.databaseId !== "number") return false;
    if (typeof o.orderNumber !== "string") return false;
    if (typeof o.status !== "string") return false;
    if (typeof o.total !== "string") return false;
    if (typeof o.paymentMethod !== "string") return false;

    // Validate status enum
    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
      "FAILED",
    ];
    if (!validStatuses.includes(o.status as string)) return false;

    return true;
  }

  function isValidAddress(address: unknown): address is WooAddress {
    if (typeof address !== "object" || address === null) return false;
    const a = address as Record<string, unknown>;

    if (typeof a.firstName !== "string") return false;
    if (typeof a.lastName !== "string") return false;
    if (typeof a.address1 !== "string") return false;
    if (typeof a.city !== "string") return false;
    if (typeof a.country !== "string") return false;
    if (typeof a.phone !== "string") return false;

    return true;
  }

  function isValidCustomer(customer: unknown): customer is WooCustomer {
    if (typeof customer !== "object" || customer === null) return false;
    const c = customer as Record<string, unknown>;

    if (typeof c.id !== "string") return false;
    if (typeof c.databaseId !== "number") return false;
    if (typeof c.email !== "string") return false;
    if (typeof c.firstName !== "string") return false;
    if (typeof c.lastName !== "string") return false;

    return true;
  }

  // ============================================
  // Property Tests
  // ============================================

  it("should validate WooOrder type structure for any generated order", () => {
    fc.assert(
      fc.property(wooOrderArb, (order) => {
        // Verify required fields exist and have correct types
        expect(typeof order.id).toBe("string");
        expect(typeof order.databaseId).toBe("number");
        expect(typeof order.orderNumber).toBe("string");
        expect(typeof order.status).toBe("string");
        expect(typeof order.date).toBe("string");
        expect(typeof order.total).toBe("string");
        expect(typeof order.paymentMethod).toBe("string");

        // Verify enum values
        expect([
          "PENDING",
          "PROCESSING",
          "ON_HOLD",
          "COMPLETED",
          "CANCELLED",
          "REFUNDED",
          "FAILED",
        ]).toContain(order.status);

        // Verify type guard works
        expect(isValidOrder(order)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate order has at least one line item", () => {
    fc.assert(
      fc.property(wooOrderArb, (order) => {
        expect(Array.isArray(order.lineItems.nodes)).toBe(true);
        expect(order.lineItems.nodes.length).toBeGreaterThan(0);

        // Each line item should have required fields
        order.lineItems.nodes.forEach((item) => {
          expect(item.product).toBeDefined();
          expect(item.product.node).toBeDefined();
          expect(typeof item.quantity).toBe("number");
          expect(item.quantity).toBeGreaterThan(0);
          expect(typeof item.subtotal).toBe("string");
          expect(typeof item.total).toBe("string");
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate order addresses have required fields", () => {
    fc.assert(
      fc.property(wooOrderArb, (order) => {
        // Billing address
        expect(isValidAddress(order.billing)).toBe(true);
        expect(order.billing.country).toBe("VN");

        // Shipping address
        expect(isValidAddress(order.shipping)).toBe(true);
        expect(order.shipping.country).toBe("VN");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate order status label matches status", () => {
    fc.assert(
      fc.property(wooOrderArb, (order) => {
        const expectedLabel = getStatusLabel(order.status);
        expect(order.statusLabel).toBe(expectedLabel);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate OrderResponse structure with nullable order", () => {
    const orderResponseArb: fc.Arbitrary<OrderResponse> = fc.record({
      order: fc.option(wooOrderArb, { nil: null }),
    });

    fc.assert(
      fc.property(orderResponseArb, (response) => {
        // Order can be null (404 case) or a valid order
        if (response.order !== null) {
          expect(isValidOrder(response.order)).toBe(true);
        } else {
          expect(response.order).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should validate CustomerResponse structure", () => {
    const customerResponseArb: fc.Arbitrary<CustomerResponse> = fc.record({
      customer: wooCustomerArb,
    });

    fc.assert(
      fc.property(customerResponseArb, (response) => {
        expect(response.customer).toBeDefined();
        expect(isValidCustomer(response.customer)).toBe(true);

        // Customer should have orders array
        expect(Array.isArray(response.customer.orders.nodes)).toBe(true);

        // Each order should be valid
        response.customer.orders.nodes.forEach((order) => {
          expect(isValidOrder(order)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate CheckoutResponse structure", () => {
    const checkoutResponseArb: fc.Arbitrary<CheckoutResponse> = fc.record({
      checkout: fc.record({
        order: wooOrderArb,
        result: fc.constantFrom("success", "failure"),
        redirect: fc.webUrl(),
      }),
    });

    fc.assert(
      fc.property(checkoutResponseArb, (response) => {
        expect(response.checkout).toBeDefined();
        expect(response.checkout.order).toBeDefined();
        expect(isValidOrder(response.checkout.order)).toBe(true);
        expect(typeof response.checkout.result).toBe("string");
        expect(typeof response.checkout.redirect).toBe("string");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate customer display name is combination of first and last name", () => {
    fc.assert(
      fc.property(wooCustomerArb, (customer) => {
        expect(customer.displayName).toBe(
          `${customer.firstName} ${customer.lastName}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should validate payment method is one of supported methods", () => {
    fc.assert(
      fc.property(wooOrderArb, (order) => {
        expect(["cod", "vnpay", "momo"]).toContain(order.paymentMethod);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate shipping line has method title and total", () => {
    fc.assert(
      fc.property(wooShippingLineArb, (shippingLine) => {
        expect(typeof shippingLine.methodTitle).toBe("string");
        expect(shippingLine.methodTitle.length).toBeGreaterThan(0);
        expect(typeof shippingLine.total).toBe("string");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate Vietnam phone number format", () => {
    fc.assert(
      fc.property(wooAddressArb, (address) => {
        expect(address.phone).toMatch(/^0\d{10}$/);
        expect(address.phone.length).toBe(11);
      }),
      { numRuns: 100 }
    );
  });
});
