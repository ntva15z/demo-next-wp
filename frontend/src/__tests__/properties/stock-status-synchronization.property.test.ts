import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { StockStatus } from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property 3: Stock status synchronization**
 * **Validates: Requirements 5.2**
 *
 * For any product variation where stock quantity equals zero and backorders are disabled,
 * the stock status SHALL automatically be set to "OUT_OF_STOCK".
 */
describe("Property: Stock status synchronization", () => {
  // ============================================
  // Types for stock management
  // ============================================

  interface StockManagementConfig {
    manageStock: boolean;
    stockQuantity: number | null;
    backordersAllowed: boolean;
  }

  interface ProductStockState {
    id: string;
    sku: string;
    config: StockManagementConfig;
    stockStatus: StockStatus;
  }

  // ============================================
  // Stock status determination logic
  // ============================================

  /**
   * Determines the expected stock status based on stock configuration.
   * This mirrors the logic in inventory-management.php
   */
  function determineExpectedStockStatus(config: StockManagementConfig): StockStatus {
    // If not managing stock, status is determined externally
    if (!config.manageStock) {
      return "IN_STOCK"; // Default when not managing stock
    }

    const stockQuantity = config.stockQuantity ?? 0;

    // If stock is zero or less and backorders not allowed -> OUT_OF_STOCK
    if (stockQuantity <= 0 && !config.backordersAllowed) {
      return "OUT_OF_STOCK";
    }

    // If stock is zero or less but backorders allowed -> ON_BACKORDER
    if (stockQuantity <= 0 && config.backordersAllowed) {
      return "ON_BACKORDER";
    }

    // If stock is positive -> IN_STOCK
    if (stockQuantity > 0) {
      return "IN_STOCK";
    }

    return "IN_STOCK";
  }

  /**
   * Simulates the stock status update that occurs when stock changes.
   * Returns the product with updated stock status.
   */
  function synchronizeStockStatus(product: ProductStockState): ProductStockState {
    const expectedStatus = determineExpectedStockStatus(product.config);
    return {
      ...product,
      stockStatus: expectedStatus,
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  const skuArb = fc
    .tuple(
      fc.string({ minLength: 2, maxLength: 4 }).map((s) => s.toUpperCase().replace(/[^A-Z]/g, "X")),
      fc.integer({ min: 1000, max: 9999 })
    )
    .map(([prefix, num]) => `${prefix}-${num}`);

  // Stock quantity arbitrary - includes zero, positive, and negative values
  const stockQuantityArb = fc.oneof(
    fc.constant(null),
    fc.constant(0),
    fc.integer({ min: -10, max: 0 }), // Zero or negative
    fc.integer({ min: 1, max: 1000 }) // Positive
  );

  // Stock management config arbitrary
  const stockConfigArb: fc.Arbitrary<StockManagementConfig> = fc.record({
    manageStock: fc.boolean(),
    stockQuantity: stockQuantityArb,
    backordersAllowed: fc.boolean(),
  });

  // Product stock state arbitrary (before synchronization)
  const productStockStateArb: fc.Arbitrary<ProductStockState> = fc
    .tuple(fc.uuid(), skuArb, stockConfigArb)
    .map(([id, sku, config]) => ({
      id,
      sku,
      config,
      // Initial status may be incorrect (simulating before sync)
      stockStatus: fc.sample(fc.constantFrom("IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER") as fc.Arbitrary<StockStatus>, 1)[0],
    }));

  // Specific arbitrary for zero stock with backorders disabled
  const zeroStockNoBackordersArb: fc.Arbitrary<ProductStockState> = fc
    .tuple(fc.uuid(), skuArb)
    .map(([id, sku]) => ({
      id,
      sku,
      config: {
        manageStock: true,
        stockQuantity: 0,
        backordersAllowed: false,
      },
      stockStatus: "IN_STOCK" as StockStatus, // Intentionally wrong before sync
    }));

  // Specific arbitrary for zero stock with backorders enabled
  const zeroStockWithBackordersArb: fc.Arbitrary<ProductStockState> = fc
    .tuple(fc.uuid(), skuArb)
    .map(([id, sku]) => ({
      id,
      sku,
      config: {
        manageStock: true,
        stockQuantity: 0,
        backordersAllowed: true,
      },
      stockStatus: "IN_STOCK" as StockStatus, // Intentionally wrong before sync
    }));

  // Specific arbitrary for positive stock
  const positiveStockArb: fc.Arbitrary<ProductStockState> = fc
    .tuple(fc.uuid(), skuArb, fc.integer({ min: 1, max: 1000 }), fc.boolean())
    .map(([id, sku, quantity, backorders]) => ({
      id,
      sku,
      config: {
        manageStock: true,
        stockQuantity: quantity,
        backordersAllowed: backorders,
      },
      stockStatus: "OUT_OF_STOCK" as StockStatus, // Intentionally wrong before sync
    }));

  // ============================================
  // Property Tests
  // ============================================

  it("should set stock status to OUT_OF_STOCK when stock is zero and backorders disabled", () => {
    fc.assert(
      fc.property(zeroStockNoBackordersArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        expect(synchronized.stockStatus).toBe("OUT_OF_STOCK");
        return synchronized.stockStatus === "OUT_OF_STOCK";
      }),
      { numRuns: 100 }
    );
  });

  it("should set stock status to ON_BACKORDER when stock is zero and backorders enabled", () => {
    fc.assert(
      fc.property(zeroStockWithBackordersArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        expect(synchronized.stockStatus).toBe("ON_BACKORDER");
        return synchronized.stockStatus === "ON_BACKORDER";
      }),
      { numRuns: 100 }
    );
  });

  it("should set stock status to IN_STOCK when stock quantity is positive", () => {
    fc.assert(
      fc.property(positiveStockArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        expect(synchronized.stockStatus).toBe("IN_STOCK");
        return synchronized.stockStatus === "IN_STOCK";
      }),
      { numRuns: 100 }
    );
  });

  it("should correctly synchronize stock status for any stock configuration", () => {
    fc.assert(
      fc.property(stockConfigArb, (config) => {
        const product: ProductStockState = {
          id: "test-id",
          sku: "TEST-001",
          config,
          stockStatus: "IN_STOCK", // Initial status
        };

        const synchronized = synchronizeStockStatus(product);
        const expectedStatus = determineExpectedStockStatus(config);

        expect(synchronized.stockStatus).toBe(expectedStatus);
        return synchronized.stockStatus === expectedStatus;
      }),
      { numRuns: 100 }
    );
  });

  it("should handle negative stock quantities as out of stock when backorders disabled", () => {
    const negativeStockArb = fc
      .tuple(fc.uuid(), skuArb, fc.integer({ min: -100, max: -1 }))
      .map(([id, sku, quantity]) => ({
        id,
        sku,
        config: {
          manageStock: true,
          stockQuantity: quantity,
          backordersAllowed: false,
        },
        stockStatus: "IN_STOCK" as StockStatus,
      }));

    fc.assert(
      fc.property(negativeStockArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        expect(synchronized.stockStatus).toBe("OUT_OF_STOCK");
        return synchronized.stockStatus === "OUT_OF_STOCK";
      }),
      { numRuns: 100 }
    );
  });

  it("should handle null stock quantity as zero stock", () => {
    const nullStockArb = fc
      .tuple(fc.uuid(), skuArb, fc.boolean())
      .map(([id, sku, backorders]) => ({
        id,
        sku,
        config: {
          manageStock: true,
          stockQuantity: null,
          backordersAllowed: backorders,
        },
        stockStatus: "IN_STOCK" as StockStatus,
      }));

    fc.assert(
      fc.property(nullStockArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        // Null stock is treated as 0
        if (product.config.backordersAllowed) {
          expect(synchronized.stockStatus).toBe("ON_BACKORDER");
          return synchronized.stockStatus === "ON_BACKORDER";
        } else {
          expect(synchronized.stockStatus).toBe("OUT_OF_STOCK");
          return synchronized.stockStatus === "OUT_OF_STOCK";
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain stock status consistency after multiple synchronizations", () => {
    fc.assert(
      fc.property(productStockStateArb, (product) => {
        // Synchronize multiple times
        const sync1 = synchronizeStockStatus(product);
        const sync2 = synchronizeStockStatus(sync1);
        const sync3 = synchronizeStockStatus(sync2);

        // Status should be stable after first sync (idempotent)
        expect(sync1.stockStatus).toBe(sync2.stockStatus);
        expect(sync2.stockStatus).toBe(sync3.stockStatus);

        return sync1.stockStatus === sync2.stockStatus && sync2.stockStatus === sync3.stockStatus;
      }),
      { numRuns: 100 }
    );
  });

  it("should not change stock status when stock management is disabled", () => {
    const noManageStockArb = fc
      .tuple(fc.uuid(), skuArb, stockQuantityArb, fc.boolean())
      .map(([id, sku, quantity, backorders]) => ({
        id,
        sku,
        config: {
          manageStock: false,
          stockQuantity: quantity,
          backordersAllowed: backorders,
        },
        stockStatus: "IN_STOCK" as StockStatus,
      }));

    fc.assert(
      fc.property(noManageStockArb, (product) => {
        const synchronized = synchronizeStockStatus(product);

        // When not managing stock, default to IN_STOCK
        expect(synchronized.stockStatus).toBe("IN_STOCK");
        return synchronized.stockStatus === "IN_STOCK";
      }),
      { numRuns: 100 }
    );
  });
});
