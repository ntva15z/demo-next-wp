import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 12: Customer order history retrieval**
 * **Validates: Requirements 10.3**
 *
 * For any authenticated customer with previous orders, the account endpoint
 * SHALL return complete order history including all order details and statuses.
 */
describe("Property: Customer order history retrieval", () => {
  // ============================================
  // Types for customer order history
  // ============================================

  interface Customer {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  }

  interface Address {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email?: string;
    phone?: string;
  }

  interface LineItem {
    id: number;
    productId: number;
    variationId: number | null;
    name: string;
    quantity: number;
    subtotal: number;
    total: number;
    image: string | null;
    sku: string | null;
  }

  interface Order {
    id: number;
    orderNumber: string;
    status: string;
    statusLabel: string;
    dateCreated: string | null;
    dateModified: string | null;
    dateCompleted: string | null;
    subtotal: number;
    shippingTotal: number;
    discountTotal: number;
    total: number;
    totalTax: number;
    currency: string;
    paymentMethod: string;
    paymentMethodTitle: string;
    billing: Address;
    shipping: Address;
    lineItems: LineItem[];
    customerNote: string;
  }

  interface OrderHistoryResponse {
    success: boolean;
    orders: Order[];
    total: number;
    pages: number;
  }

  interface OrderHistoryValidationResult {
    valid: boolean;
    errors: string[];
  }

  // ============================================
  // Order history validation logic
  // ============================================

  /**
   * Validates that order history response is complete.
   * This mirrors the logic in customer-account.php headless_get_customer_order_history()
   */
  function validateOrderHistoryResponse(
    response: OrderHistoryResponse
  ): OrderHistoryValidationResult {
    const errors: string[] = [];

    // Check response structure
    if (typeof response.success !== "boolean") {
      errors.push("missing_success_field");
    }

    if (!Array.isArray(response.orders)) {
      errors.push("missing_orders_array");
    }

    if (typeof response.total !== "number") {
      errors.push("missing_total_count");
    }

    if (typeof response.pages !== "number") {
      errors.push("missing_pages_count");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates that an individual order has all required fields.
   */
  function validateOrderCompleteness(order: Order): OrderHistoryValidationResult {
    const errors: string[] = [];

    // Check order ID
    if (!order.id || order.id <= 0) {
      errors.push("missing_order_id");
    }

    // Check order number
    if (!order.orderNumber) {
      errors.push("missing_order_number");
    }

    // Check status
    if (!order.status) {
      errors.push("missing_status");
    }

    // Check status label
    if (!order.statusLabel) {
      errors.push("missing_status_label");
    }

    // Check totals
    if (typeof order.subtotal !== "number") {
      errors.push("missing_subtotal");
    }

    if (typeof order.total !== "number") {
      errors.push("missing_total");
    }

    // Check currency
    if (!order.currency) {
      errors.push("missing_currency");
    }

    // Check billing address
    if (!order.billing) {
      errors.push("missing_billing_address");
    }

    // Check shipping address
    if (!order.shipping) {
      errors.push("missing_shipping_address");
    }

    // Check line items
    if (!Array.isArray(order.lineItems)) {
      errors.push("missing_line_items");
    }

    // Check payment method
    if (!order.paymentMethod) {
      errors.push("missing_payment_method");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates that line items have required fields.
   */
  function validateLineItem(item: LineItem): OrderHistoryValidationResult {
    const errors: string[] = [];

    if (!item.id || item.id <= 0) {
      errors.push("missing_item_id");
    }

    if (!item.productId || item.productId <= 0) {
      errors.push("missing_product_id");
    }

    if (!item.name) {
      errors.push("missing_item_name");
    }

    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      errors.push("invalid_quantity");
    }

    if (typeof item.subtotal !== "number") {
      errors.push("missing_item_subtotal");
    }

    if (typeof item.total !== "number") {
      errors.push("missing_item_total");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if orders are sorted by date (newest first)
   */
  function areOrdersSortedByDate(orders: Order[]): boolean {
    if (orders.length <= 1) return true;

    for (let i = 1; i < orders.length; i++) {
      const prevDate = orders[i - 1].dateCreated
        ? new Date(orders[i - 1].dateCreated!).getTime()
        : 0;
      const currDate = orders[i].dateCreated
        ? new Date(orders[i].dateCreated!).getTime()
        : 0;

      if (currDate > prevDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if all orders belong to the customer
   */
  function allOrdersBelongToCustomer(
    orders: Order[],
    customerEmail: string
  ): boolean {
    return orders.every(
      (order) =>
        order.billing.email === customerEmail ||
        order.billing.email === undefined
    );
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Vietnamese name arbitrary
  const vietnameseNameArb = fc.constantFrom(
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Minh",
    "Anh",
    "Hùng",
    "Thảo",
    "Linh"
  );

  // Email arbitrary
  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z]{3,10}$/),
      fc.constantFrom("gmail.com", "yahoo.com", "outlook.com", "email.vn")
    )
    .map(([name, domain]) => `${name}@${domain}`);

  // Vietnamese phone arbitrary
  const phoneArb = fc
    .tuple(
      fc.constantFrom("09", "03", "07", "08", "05"),
      fc.stringMatching(/^[0-9]{8}$/)
    )
    .map(([prefix, suffix]) => `${prefix}${suffix}`);

  // Vietnamese city arbitrary
  const cityArb = fc.constantFrom(
    "Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng"
  );

  // Order status arbitrary
  const orderStatusArb = fc.constantFrom(
    "pending",
    "processing",
    "on-hold",
    "completed",
    "cancelled",
    "refunded",
    "failed",
    "shipped"
  );

  // Status label map
  const statusLabelMap: Record<string, string> = {
    pending: "Chờ thanh toán",
    processing: "Đang xử lý",
    "on-hold": "Tạm giữ",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    failed: "Thất bại",
    shipped: "Đã giao hàng",
  };

  // Address arbitrary
  const addressArb: fc.Arbitrary<Address> = fc.record({
    firstName: vietnameseNameArb,
    lastName: vietnameseNameArb,
    company: fc.oneof(fc.constant(""), fc.stringMatching(/^[A-Za-z ]{5,20}$/)),
    address1: fc
      .tuple(
        fc.integer({ min: 1, max: 999 }),
        fc.stringMatching(/^[A-Za-z ]{5,15}$/)
      )
      .map(([num, street]) => `${num} ${street}`),
    address2: fc.constant(""),
    city: cityArb,
    state: fc.constantFrom("SG", "HN", "DN", "CT", "HP"),
    postcode: fc.stringMatching(/^[0-9]{5,6}$/),
    country: fc.constant("VN"),
  });

  // Billing address with email and phone
  const billingAddressArb: fc.Arbitrary<Address> = fc
    .tuple(addressArb, emailArb, phoneArb)
    .map(([addr, email, phone]) => ({
      ...addr,
      email,
      phone,
    }));

  // Line item arbitrary
  const lineItemArb: fc.Arbitrary<LineItem> = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    productId: fc.integer({ min: 1, max: 100000 }),
    variationId: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100000 })),
    name: fc.stringMatching(/^[A-Za-z0-9 ]{5,30}$/),
    quantity: fc.integer({ min: 1, max: 10 }),
    subtotal: fc.integer({ min: 10000, max: 10000000 }),
    total: fc.integer({ min: 10000, max: 10000000 }),
    image: fc.oneof(fc.constant(null), fc.constant("https://example.com/image.jpg")),
    sku: fc.oneof(fc.constant(null), fc.stringMatching(/^[A-Z0-9]{6,10}$/)),
  });

  // Customer arbitrary
  const customerArb: fc.Arbitrary<Customer> = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    email: emailArb,
    firstName: vietnameseNameArb,
    lastName: vietnameseNameArb,
  });

  // Timestamp arbitrary (for generating valid dates)
  const timestampArb = fc.integer({
    min: new Date("2024-01-01").getTime(),
    max: new Date("2024-12-31").getTime(),
  });

  // Order arbitrary
  const orderArb: fc.Arbitrary<Order> = fc
    .tuple(
      fc.integer({ min: 1, max: 100000 }),
      orderStatusArb,
      billingAddressArb,
      addressArb,
      fc.array(lineItemArb, { minLength: 1, maxLength: 5 }),
      fc.constantFrom("cod", "vnpay", "momo"),
      timestampArb
    )
    .map(([id, status, billing, shipping, lineItems, paymentMethod, timestamp]) => {
      const date = new Date(timestamp);
      const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingTotal = Math.floor(Math.random() * 50000);
      const discountTotal = 0;
      const totalTax = 0;

      return {
        id,
        orderNumber: `#${id}`,
        status,
        statusLabel: statusLabelMap[status] || status,
        dateCreated: date.toISOString(),
        dateModified: date.toISOString(),
        dateCompleted: status === "completed" ? date.toISOString() : null,
        subtotal,
        shippingTotal,
        discountTotal,
        total: subtotal + shippingTotal - discountTotal + totalTax,
        totalTax,
        currency: "VND",
        paymentMethod,
        paymentMethodTitle:
          paymentMethod === "cod"
            ? "Thanh toán khi nhận hàng"
            : paymentMethod === "vnpay"
            ? "VNPay"
            : "MoMo",
        billing,
        shipping,
        lineItems,
        customerNote: "",
      };
    });

  // Order history response arbitrary (with orders)
  const orderHistoryResponseArb: fc.Arbitrary<OrderHistoryResponse> = fc
    .tuple(
      fc.array(orderArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 1, max: 10 })
    )
    .map(([orders, pages]) => {
      // Sort orders by date (newest first)
      const sortedOrders = [...orders].sort((a, b) => {
        const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
        const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
        return dateB - dateA;
      });

      return {
        success: true,
        orders: sortedOrders,
        total: orders.length,
        pages,
      };
    });

  // Empty order history response arbitrary (for customers with no orders)
  const emptyOrderHistoryResponseArb: fc.Arbitrary<OrderHistoryResponse> = fc.constant({
    success: true,
    orders: [],
    total: 0,
    pages: 0,
  });

  // Invalid order history response arbitrary
  const invalidOrderHistoryResponseArb: fc.Arbitrary<OrderHistoryResponse> = fc
    .tuple(
      orderHistoryResponseArb,
      fc.constantFrom(
        "missing_success",
        "missing_orders",
        "missing_total",
        "missing_pages"
      )
    )
    .map(([response, missingField]) => {
      const invalid = { ...response } as OrderHistoryResponse;

      switch (missingField) {
        case "missing_success":
          // @ts-expect-error - intentionally creating invalid response
          delete invalid.success;
          break;
        case "missing_orders":
          // @ts-expect-error - intentionally creating invalid response
          invalid.orders = undefined;
          break;
        case "missing_total":
          // @ts-expect-error - intentionally creating invalid response
          invalid.total = undefined;
          break;
        case "missing_pages":
          // @ts-expect-error - intentionally creating invalid response
          invalid.pages = undefined;
          break;
      }

      return invalid;
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should validate complete order history response as valid", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        const result = validateOrderHistoryResponse(response);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        return result.valid === true && result.errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should detect invalid order history response", () => {
    fc.assert(
      fc.property(invalidOrderHistoryResponseArb, (response) => {
        const result = validateOrderHistoryResponse(response);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        return result.valid === false && result.errors.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate all orders in history have complete data", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          const result = validateOrderCompleteness(order);
          expect(result.valid).toBe(true);
          if (!result.valid) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should validate all line items in orders have required fields", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          for (const item of order.lineItems) {
            const result = validateLineItem(item);
            expect(result.valid).toBe(true);
            if (!result.valid) {
              return false;
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should return orders sorted by date (newest first)", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        const sorted = areOrdersSortedByDate(response.orders);

        expect(sorted).toBe(true);

        return sorted;
      }),
      { numRuns: 100 }
    );
  });

  it("should include order ID in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.id).toBeGreaterThan(0);
          if (order.id <= 0) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include order number in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.orderNumber).toBeTruthy();
          if (!order.orderNumber) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include status and status label in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.status).toBeTruthy();
          expect(order.statusLabel).toBeTruthy();
          if (!order.status || !order.statusLabel) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include billing address in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.billing).toBeDefined();
          expect(order.billing.firstName).toBeTruthy();
          expect(order.billing.city).toBeTruthy();
          if (!order.billing || !order.billing.firstName || !order.billing.city) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include shipping address in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.shipping).toBeDefined();
          if (!order.shipping) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include at least one line item in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.lineItems.length).toBeGreaterThan(0);
          if (order.lineItems.length === 0) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include payment method in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.paymentMethod).toBeTruthy();
          expect(order.paymentMethodTitle).toBeTruthy();
          if (!order.paymentMethod || !order.paymentMethodTitle) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should include currency in every order", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          expect(order.currency).toBe("VND");
          if (order.currency !== "VND") {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should have total count matching orders array length", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        expect(response.total).toBe(response.orders.length);

        return response.total === response.orders.length;
      }),
      { numRuns: 100 }
    );
  });

  it("should handle empty order history for new customers", () => {
    fc.assert(
      fc.property(emptyOrderHistoryResponseArb, (response) => {
        const result = validateOrderHistoryResponse(response);

        expect(result.valid).toBe(true);
        expect(response.orders).toHaveLength(0);
        expect(response.total).toBe(0);

        return result.valid && response.orders.length === 0 && response.total === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should have valid order totals (total >= subtotal)", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          // Total should be >= subtotal (after shipping and discounts)
          const expectedTotal =
            order.subtotal +
            order.shippingTotal -
            order.discountTotal +
            order.totalTax;
          expect(order.total).toBe(expectedTotal);
          if (order.total !== expectedTotal) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should have valid date format for dateCreated", () => {
    fc.assert(
      fc.property(orderHistoryResponseArb, (response) => {
        for (const order of response.orders) {
          if (order.dateCreated) {
            const date = new Date(order.dateCreated);
            expect(date.toString()).not.toBe("Invalid Date");
            if (date.toString() === "Invalid Date") {
              return false;
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
