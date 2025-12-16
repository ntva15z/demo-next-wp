import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 6: Order data completeness**
 * **Validates: Requirements 7.1**
 *
 * For any order created through checkout, the order record SHALL contain:
 * customer details (name, email, phone), billing address, shipping address,
 * and complete line items with product/variation references.
 */
describe("Property: Order data completeness", () => {
  // ============================================
  // Types for order management
  // ============================================

  interface CustomerDetails {
    id: number | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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
  }

  interface OrderTotals {
    subtotal: number;
    shippingTotal: number;
    discountTotal: number;
    total: number;
    totalTax: number;
  }

  interface Order {
    id: number;
    orderNumber: string;
    status: string;
    dateCreated: string | null;
    dateModified: string | null;
    customer: CustomerDetails;
    billing: Address;
    shipping: Address;
    lineItems: LineItem[];
    totals: OrderTotals;
    paymentMethod: string;
    paymentMethodTitle: string;
    customerNote: string;
    needsShipping: boolean;
  }

  interface OrderValidationResult {
    valid: boolean;
    errors: string[];
  }

  // ============================================
  // Order validation logic
  // ============================================

  /**
   * Validates order data completeness.
   * This mirrors the logic in order-management.php headless_validate_order_completeness()
   */
  function validateOrderCompleteness(order: Order): OrderValidationResult {
    const errors: string[] = [];

    // Check customer details - name
    if (!order.customer.firstName && !order.customer.lastName) {
      if (!order.billing.firstName && !order.billing.lastName) {
        errors.push("missing_customer_name");
      }
    }

    // Check customer email
    if (!order.customer.email && !order.billing.email) {
      errors.push("missing_customer_email");
    }

    // Check customer phone
    if (!order.customer.phone && !order.billing.phone) {
      errors.push("missing_customer_phone");
    }

    // Check billing address
    if (!order.billing.address1) {
      errors.push("missing_billing_address");
    }

    if (!order.billing.city) {
      errors.push("missing_billing_city");
    }

    // Check shipping address if order needs shipping
    if (order.needsShipping) {
      if (!order.shipping.address1) {
        errors.push("missing_shipping_address");
      }

      if (!order.shipping.city) {
        errors.push("missing_shipping_city");
      }
    }

    // Check line items
    if (order.lineItems.length === 0) {
      errors.push("missing_line_items");
    } else {
      for (const item of order.lineItems) {
        if (!item.productId || item.productId <= 0) {
          errors.push("invalid_line_item_product");
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if order has complete customer details
   */
  function hasCompleteCustomerDetails(order: Order): boolean {
    const hasName =
      (order.customer.firstName || order.customer.lastName) ||
      (order.billing.firstName || order.billing.lastName);
    const hasEmail = order.customer.email || order.billing.email;
    const hasPhone = order.customer.phone || order.billing.phone;

    return Boolean(hasName && hasEmail && hasPhone);
  }

  /**
   * Check if order has complete billing address
   */
  function hasCompleteBillingAddress(order: Order): boolean {
    return Boolean(order.billing.address1 && order.billing.city);
  }

  /**
   * Check if order has complete shipping address (when needed)
   */
  function hasCompleteShippingAddress(order: Order): boolean {
    if (!order.needsShipping) {
      return true;
    }
    return Boolean(order.shipping.address1 && order.shipping.city);
  }

  /**
   * Check if order has valid line items
   */
  function hasValidLineItems(order: Order): boolean {
    if (order.lineItems.length === 0) {
      return false;
    }
    return order.lineItems.every((item) => item.productId > 0);
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
    "Võ",
    "Đặng",
    "Minh",
    "Anh",
    "Hùng",
    "Dũng",
    "Thảo",
    "Linh",
    "Hương",
    "Mai",
    "Lan",
    "Hà"
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
    "Hải Phòng",
    "Biên Hòa",
    "Nha Trang",
    "Huế",
    "Vũng Tàu",
    "Quy Nhơn"
  );

  // Address arbitrary
  const addressArb: fc.Arbitrary<Address> = fc.record({
    firstName: vietnameseNameArb,
    lastName: vietnameseNameArb,
    company: fc.oneof(fc.constant(""), fc.stringMatching(/^[A-Za-z ]{5,20}$/)),
    address1: fc
      .tuple(fc.integer({ min: 1, max: 999 }), fc.stringMatching(/^[A-Za-z ]{5,15}$/))
      .map(([num, street]) => `${num} ${street}`),
    address2: fc.oneof(fc.constant(""), fc.stringMatching(/^[A-Za-z0-9 ]{0,20}$/)),
    city: cityArb,
    state: fc.constantFrom("SG", "HN", "DN", "CT", "HP"),
    postcode: fc.stringMatching(/^[0-9]{5,6}$/),
    country: fc.constant("VN"),
  });

  // Customer details arbitrary
  const customerDetailsArb: fc.Arbitrary<CustomerDetails> = fc.record({
    id: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 10000 })),
    firstName: vietnameseNameArb,
    lastName: vietnameseNameArb,
    email: emailArb,
    phone: phoneArb,
  });

  // Line item arbitrary
  const lineItemArb: fc.Arbitrary<LineItem> = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    productId: fc.integer({ min: 1, max: 100000 }),
    variationId: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100000 })),
    name: fc.stringMatching(/^[A-Za-z0-9 ]{5,30}$/),
    quantity: fc.integer({ min: 1, max: 10 }),
    subtotal: fc.integer({ min: 10000, max: 10000000 }),
    total: fc.integer({ min: 10000, max: 10000000 }),
  });

  // Order totals arbitrary
  const orderTotalsArb: fc.Arbitrary<OrderTotals> = fc
    .tuple(
      fc.integer({ min: 10000, max: 10000000 }),
      fc.integer({ min: 0, max: 100000 }),
      fc.integer({ min: 0, max: 500000 }),
      fc.integer({ min: 0, max: 1000000 })
    )
    .map(([subtotal, shippingTotal, discountTotal, totalTax]) => ({
      subtotal,
      shippingTotal,
      discountTotal,
      total: subtotal + shippingTotal - discountTotal + totalTax,
      totalTax,
    }));

  // Complete valid order arbitrary
  const completeOrderArb: fc.Arbitrary<Order> = fc
    .tuple(
      fc.integer({ min: 1, max: 100000 }),
      customerDetailsArb,
      addressArb,
      addressArb,
      fc.array(lineItemArb, { minLength: 1, maxLength: 5 }),
      orderTotalsArb,
      fc.constantFrom("cod", "vnpay", "momo"),
      fc.boolean()
    )
    .map(
      ([
        id,
        customer,
        billing,
        shipping,
        lineItems,
        totals,
        paymentMethod,
        needsShipping,
      ]) => ({
        id,
        orderNumber: `#${id}`,
        status: "pending",
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        customer,
        billing: {
          ...billing,
          email: customer.email,
          phone: customer.phone,
        },
        shipping,
        lineItems,
        totals,
        paymentMethod,
        paymentMethodTitle:
          paymentMethod === "cod"
            ? "Thanh toán khi nhận hàng"
            : paymentMethod === "vnpay"
            ? "VNPay"
            : "MoMo",
        customerNote: "",
        needsShipping,
      })
    );

  // Incomplete order arbitrary (missing various fields)
  const incompleteOrderArb: fc.Arbitrary<Order> = fc
    .tuple(
      completeOrderArb,
      fc.constantFrom(
        "missing_name",
        "missing_email",
        "missing_phone",
        "missing_billing_address",
        "missing_billing_city",
        "missing_shipping_address",
        "missing_shipping_city",
        "missing_line_items",
        "invalid_product_id"
      )
    )
    .map(([order, missingField]) => {
      const incomplete = { ...order };

      switch (missingField) {
        case "missing_name":
          incomplete.customer = { ...order.customer, firstName: "", lastName: "" };
          incomplete.billing = { ...order.billing, firstName: "", lastName: "" };
          break;
        case "missing_email":
          incomplete.customer = { ...order.customer, email: "" };
          incomplete.billing = { ...order.billing, email: "" };
          break;
        case "missing_phone":
          incomplete.customer = { ...order.customer, phone: "" };
          incomplete.billing = { ...order.billing, phone: "" };
          break;
        case "missing_billing_address":
          incomplete.billing = { ...order.billing, address1: "" };
          break;
        case "missing_billing_city":
          incomplete.billing = { ...order.billing, city: "" };
          break;
        case "missing_shipping_address":
          incomplete.needsShipping = true;
          incomplete.shipping = { ...order.shipping, address1: "" };
          break;
        case "missing_shipping_city":
          incomplete.needsShipping = true;
          incomplete.shipping = { ...order.shipping, city: "" };
          break;
        case "missing_line_items":
          incomplete.lineItems = [];
          break;
        case "invalid_product_id":
          incomplete.lineItems = [{ ...order.lineItems[0], productId: 0 }];
          break;
      }

      return incomplete;
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should validate complete orders as valid", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const result = validateOrderCompleteness(order);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        return result.valid === true && result.errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should detect incomplete orders as invalid", () => {
    fc.assert(
      fc.property(incompleteOrderArb, (order) => {
        const result = validateOrderCompleteness(order);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        return result.valid === false && result.errors.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should require customer name in either customer or billing", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        // Remove name from both customer and billing
        const orderWithoutName: Order = {
          ...order,
          customer: { ...order.customer, firstName: "", lastName: "" },
          billing: { ...order.billing, firstName: "", lastName: "" },
        };

        const result = validateOrderCompleteness(orderWithoutName);

        expect(result.errors).toContain("missing_customer_name");
        return result.errors.includes("missing_customer_name");
      }),
      { numRuns: 100 }
    );
  });

  it("should require customer email in either customer or billing", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        // Remove email from both customer and billing
        const orderWithoutEmail: Order = {
          ...order,
          customer: { ...order.customer, email: "" },
          billing: { ...order.billing, email: "" },
        };

        const result = validateOrderCompleteness(orderWithoutEmail);

        expect(result.errors).toContain("missing_customer_email");
        return result.errors.includes("missing_customer_email");
      }),
      { numRuns: 100 }
    );
  });

  it("should require customer phone in either customer or billing", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        // Remove phone from both customer and billing
        const orderWithoutPhone: Order = {
          ...order,
          customer: { ...order.customer, phone: "" },
          billing: { ...order.billing, phone: "" },
        };

        const result = validateOrderCompleteness(orderWithoutPhone);

        expect(result.errors).toContain("missing_customer_phone");
        return result.errors.includes("missing_customer_phone");
      }),
      { numRuns: 100 }
    );
  });

  it("should require billing address", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderWithoutBillingAddress: Order = {
          ...order,
          billing: { ...order.billing, address1: "" },
        };

        const result = validateOrderCompleteness(orderWithoutBillingAddress);

        expect(result.errors).toContain("missing_billing_address");
        return result.errors.includes("missing_billing_address");
      }),
      { numRuns: 100 }
    );
  });

  it("should require billing city", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderWithoutBillingCity: Order = {
          ...order,
          billing: { ...order.billing, city: "" },
        };

        const result = validateOrderCompleteness(orderWithoutBillingCity);

        expect(result.errors).toContain("missing_billing_city");
        return result.errors.includes("missing_billing_city");
      }),
      { numRuns: 100 }
    );
  });

  it("should require shipping address when order needs shipping", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderNeedsShipping: Order = {
          ...order,
          needsShipping: true,
          shipping: { ...order.shipping, address1: "" },
        };

        const result = validateOrderCompleteness(orderNeedsShipping);

        expect(result.errors).toContain("missing_shipping_address");
        return result.errors.includes("missing_shipping_address");
      }),
      { numRuns: 100 }
    );
  });

  it("should not require shipping address when order does not need shipping", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderNoShipping: Order = {
          ...order,
          needsShipping: false,
          shipping: { ...order.shipping, address1: "", city: "" },
        };

        const result = validateOrderCompleteness(orderNoShipping);

        expect(result.errors).not.toContain("missing_shipping_address");
        expect(result.errors).not.toContain("missing_shipping_city");
        return (
          !result.errors.includes("missing_shipping_address") &&
          !result.errors.includes("missing_shipping_city")
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should require at least one line item", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderWithoutItems: Order = {
          ...order,
          lineItems: [],
        };

        const result = validateOrderCompleteness(orderWithoutItems);

        expect(result.errors).toContain("missing_line_items");
        return result.errors.includes("missing_line_items");
      }),
      { numRuns: 100 }
    );
  });

  it("should require valid product ID in line items", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        const orderWithInvalidProduct: Order = {
          ...order,
          lineItems: [{ ...order.lineItems[0], productId: 0 }],
        };

        const result = validateOrderCompleteness(orderWithInvalidProduct);

        expect(result.errors).toContain("invalid_line_item_product");
        return result.errors.includes("invalid_line_item_product");
      }),
      { numRuns: 100 }
    );
  });

  it("should validate all required fields are present for complete order", () => {
    fc.assert(
      fc.property(completeOrderArb, (order) => {
        // Verify all helper functions return true for complete order
        expect(hasCompleteCustomerDetails(order)).toBe(true);
        expect(hasCompleteBillingAddress(order)).toBe(true);
        expect(hasCompleteShippingAddress(order)).toBe(true);
        expect(hasValidLineItems(order)).toBe(true);

        return (
          hasCompleteCustomerDetails(order) &&
          hasCompleteBillingAddress(order) &&
          hasCompleteShippingAddress(order) &&
          hasValidLineItems(order)
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should handle orders with variation products correctly", () => {
    fc.assert(
      fc.property(
        completeOrderArb,
        fc.integer({ min: 1, max: 100000 }),
        (order, variationId) => {
          // Add a variation to the first line item
          const orderWithVariation: Order = {
            ...order,
            lineItems: order.lineItems.map((item, index) =>
              index === 0 ? { ...item, variationId } : item
            ),
          };

          const result = validateOrderCompleteness(orderWithVariation);

          // Order with variation should still be valid
          expect(result.valid).toBe(true);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
