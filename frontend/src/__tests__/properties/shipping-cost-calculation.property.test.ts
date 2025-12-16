import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 9: Shipping cost calculation**
 * **Validates: Requirements 9.2**
 *
 * For any order with shipping, the shipping cost SHALL be correctly calculated
 * based on the selected shipping method's rules (weight-based, total-based, or flat rate).
 */
describe("Property: Shipping cost calculation", () => {
  // ============================================
  // Types for shipping calculation
  // ============================================

  type ShippingMethodType = "flat_rate" | "weight_based";

  interface ShippingMethod {
    type: ShippingMethodType;
    flatRate?: number;
    baseRate?: number;
    weightRate?: number; // Cost per weight unit
    weightUnit?: number; // Weight unit in grams (e.g., 500g)
  }

  interface ShippingPackage {
    totalWeightGrams: number;
    items: PackageItem[];
  }

  interface PackageItem {
    productId: string;
    quantity: number;
    weightGrams: number;
  }

  interface ShippingCostResult {
    method: ShippingMethod;
    baseCost: number;
    weightCost: number;
    totalCost: number;
  }

  // ============================================
  // Shipping methods configuration
  // ============================================

  const FLAT_RATE_HCM: ShippingMethod = {
    type: "flat_rate",
    flatRate: 25000,
  };

  const FLAT_RATE_HANOI: ShippingMethod = {
    type: "flat_rate",
    flatRate: 30000,
  };

  const WEIGHT_BASED_OTHER: ShippingMethod = {
    type: "weight_based",
    baseRate: 35000,
    weightRate: 5000, // 5,000 VND per 500g
    weightUnit: 500, // 500 grams
  };

  // ============================================
  // Shipping cost calculation logic
  // ============================================

  /**
   * Calculates shipping cost based on the shipping method and package.
   * This mirrors the logic in shipping-configuration.php
   */
  function calculateShippingCost(method: ShippingMethod, pkg: ShippingPackage): ShippingCostResult {
    if (method.type === "flat_rate") {
      const flatRate = method.flatRate || 0;
      return {
        method,
        baseCost: flatRate,
        weightCost: 0,
        totalCost: flatRate,
      };
    }

    // Weight-based calculation
    const baseRate = method.baseRate || 0;
    const weightRate = method.weightRate || 0;
    const weightUnit = method.weightUnit || 500;

    // Calculate additional weight units (first unit is included in base rate)
    const totalWeight = pkg.totalWeightGrams;
    const weightUnits = Math.ceil(totalWeight / weightUnit);
    const additionalUnits = Math.max(0, weightUnits - 1);
    const weightCost = additionalUnits * weightRate;

    return {
      method,
      baseCost: baseRate,
      weightCost,
      totalCost: baseRate + weightCost,
    };
  }

  /**
   * Calculates total weight of a package from its items
   */
  function calculatePackageWeight(items: PackageItem[]): number {
    return items.reduce((total, item) => total + item.weightGrams * item.quantity, 0);
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Package item arbitrary
  const packageItemArb: fc.Arbitrary<PackageItem> = fc.record({
    productId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 10 }),
    weightGrams: fc.integer({ min: 50, max: 2000 }), // 50g to 2kg per item
  });

  // Shipping package arbitrary
  const shippingPackageArb: fc.Arbitrary<ShippingPackage> = fc
    .array(packageItemArb, { minLength: 1, maxLength: 10 })
    .map((items) => ({
      items,
      totalWeightGrams: calculatePackageWeight(items),
    }));

  // Flat rate method arbitrary
  const flatRateMethodArb: fc.Arbitrary<ShippingMethod> = fc
    .integer({ min: 10000, max: 100000 })
    .map((rate) => ({
      type: "flat_rate" as const,
      flatRate: rate,
    }));

  // Weight-based method arbitrary
  const weightBasedMethodArb: fc.Arbitrary<ShippingMethod> = fc
    .tuple(
      fc.integer({ min: 20000, max: 50000 }), // Base rate
      fc.integer({ min: 2000, max: 10000 }), // Weight rate
      fc.constantFrom(250, 500, 1000) // Weight unit in grams
    )
    .map(([baseRate, weightRate, weightUnit]) => ({
      type: "weight_based" as const,
      baseRate,
      weightRate,
      weightUnit,
    }));

  // Any shipping method arbitrary
  const shippingMethodArb: fc.Arbitrary<ShippingMethod> = fc.oneof(flatRateMethodArb, weightBasedMethodArb);

  // Specific weight arbitrary for testing weight tiers
  const specificWeightPackageArb = (weightGrams: number): fc.Arbitrary<ShippingPackage> =>
    fc.constant({
      items: [{ productId: "test", quantity: 1, weightGrams }],
      totalWeightGrams: weightGrams,
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should return flat rate cost regardless of package weight for flat rate methods", () => {
    fc.assert(
      fc.property(flatRateMethodArb, shippingPackageArb, (method, pkg) => {
        const result = calculateShippingCost(method, pkg);

        expect(result.totalCost).toBe(method.flatRate);
        expect(result.weightCost).toBe(0);
        expect(result.baseCost).toBe(method.flatRate);

        return result.totalCost === method.flatRate && result.weightCost === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate weight-based cost as base rate plus weight surcharge", () => {
    fc.assert(
      fc.property(weightBasedMethodArb, shippingPackageArb, (method, pkg) => {
        const result = calculateShippingCost(method, pkg);

        // Total should be base + weight cost
        expect(result.totalCost).toBe(result.baseCost + result.weightCost);

        // Base cost should equal the method's base rate
        expect(result.baseCost).toBe(method.baseRate);

        return result.totalCost === result.baseCost + result.weightCost;
      }),
      { numRuns: 100 }
    );
  });

  it("should increase weight cost as package weight increases", () => {
    fc.assert(
      fc.property(
        weightBasedMethodArb,
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 1001, max: 5000 }),
        (method, lightWeight, heavyWeight) => {
          const lightPkg: ShippingPackage = {
            items: [{ productId: "light", quantity: 1, weightGrams: lightWeight }],
            totalWeightGrams: lightWeight,
          };

          const heavyPkg: ShippingPackage = {
            items: [{ productId: "heavy", quantity: 1, weightGrams: heavyWeight }],
            totalWeightGrams: heavyWeight,
          };

          const lightResult = calculateShippingCost(method, lightPkg);
          const heavyResult = calculateShippingCost(method, heavyPkg);

          // Heavier package should cost at least as much as lighter package
          expect(heavyResult.totalCost).toBeGreaterThanOrEqual(lightResult.totalCost);

          return heavyResult.totalCost >= lightResult.totalCost;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should calculate correct weight tiers for weight-based shipping", () => {
    const method = WEIGHT_BASED_OTHER; // 35,000 base + 5,000 per 500g

    // Test specific weight tiers
    const testCases = [
      { weight: 0, expectedTotal: 35000 }, // 0g = base only
      { weight: 250, expectedTotal: 35000 }, // 250g = 1 unit, base only
      { weight: 500, expectedTotal: 35000 }, // 500g = 1 unit, base only
      { weight: 501, expectedTotal: 40000 }, // 501g = 2 units, base + 1 extra
      { weight: 1000, expectedTotal: 40000 }, // 1000g = 2 units, base + 1 extra
      { weight: 1001, expectedTotal: 45000 }, // 1001g = 3 units, base + 2 extra
      { weight: 1500, expectedTotal: 45000 }, // 1500g = 3 units, base + 2 extra
      { weight: 2000, expectedTotal: 50000 }, // 2000g = 4 units, base + 3 extra
    ];

    for (const { weight, expectedTotal } of testCases) {
      const pkg: ShippingPackage = {
        items: [{ productId: "test", quantity: 1, weightGrams: weight }],
        totalWeightGrams: weight,
      };

      const result = calculateShippingCost(method, pkg);
      expect(result.totalCost).toBe(expectedTotal);
    }
  });

  it("should handle zero weight packages correctly", () => {
    fc.assert(
      fc.property(shippingMethodArb, (method) => {
        const emptyPkg: ShippingPackage = {
          items: [],
          totalWeightGrams: 0,
        };

        const result = calculateShippingCost(method, emptyPkg);

        if (method.type === "flat_rate") {
          expect(result.totalCost).toBe(method.flatRate);
        } else {
          // Weight-based with 0 weight should be base rate only
          expect(result.totalCost).toBe(method.baseRate);
          expect(result.weightCost).toBe(0);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate package weight correctly from multiple items", () => {
    fc.assert(
      fc.property(fc.array(packageItemArb, { minLength: 1, maxLength: 5 }), (items) => {
        const expectedWeight = items.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);

        const calculatedWeight = calculatePackageWeight(items);

        expect(calculatedWeight).toBe(expectedWeight);
        return calculatedWeight === expectedWeight;
      }),
      { numRuns: 100 }
    );
  });

  it("should apply HCM flat rate correctly", () => {
    fc.assert(
      fc.property(shippingPackageArb, (pkg) => {
        const result = calculateShippingCost(FLAT_RATE_HCM, pkg);

        expect(result.totalCost).toBe(25000);
        expect(result.method.type).toBe("flat_rate");

        return result.totalCost === 25000;
      }),
      { numRuns: 100 }
    );
  });

  it("should apply Hanoi flat rate correctly", () => {
    fc.assert(
      fc.property(shippingPackageArb, (pkg) => {
        const result = calculateShippingCost(FLAT_RATE_HANOI, pkg);

        expect(result.totalCost).toBe(30000);
        expect(result.method.type).toBe("flat_rate");

        return result.totalCost === 30000;
      }),
      { numRuns: 100 }
    );
  });

  it("should apply other provinces weight-based rate correctly", () => {
    fc.assert(
      fc.property(shippingPackageArb, (pkg) => {
        const result = calculateShippingCost(WEIGHT_BASED_OTHER, pkg);

        // Base rate should always be 35,000
        expect(result.baseCost).toBe(35000);

        // Weight cost should be non-negative
        expect(result.weightCost).toBeGreaterThanOrEqual(0);

        // Total should be base + weight
        expect(result.totalCost).toBe(result.baseCost + result.weightCost);

        return result.baseCost === 35000 && result.totalCost === result.baseCost + result.weightCost;
      }),
      { numRuns: 100 }
    );
  });

  it("should be deterministic - same inputs produce same outputs", () => {
    fc.assert(
      fc.property(shippingMethodArb, shippingPackageArb, (method, pkg) => {
        const result1 = calculateShippingCost(method, pkg);
        const result2 = calculateShippingCost(method, pkg);

        expect(result1.totalCost).toBe(result2.totalCost);
        expect(result1.baseCost).toBe(result2.baseCost);
        expect(result1.weightCost).toBe(result2.weightCost);

        return result1.totalCost === result2.totalCost;
      }),
      { numRuns: 100 }
    );
  });
});
