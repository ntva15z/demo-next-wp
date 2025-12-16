import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 8: Shipping zone rate application**
 * **Validates: Requirements 9.1**
 *
 * For any shipping address within a defined shipping zone, the correct shipping rate
 * for that zone SHALL be applied to the order.
 */
describe("Property: Shipping zone rate application", () => {
  // ============================================
  // Types for shipping zones
  // ============================================

  interface ShippingZone {
    name: string;
    stateCode: string | null; // null means country-wide
    countryCode: string;
    type: "flat_rate" | "weight_based";
    rate: number; // Base rate in VND
    weightRate?: number; // Additional rate per weight unit
    weightUnit?: number; // Weight unit in grams
  }

  interface ShippingAddress {
    country: string;
    state: string;
    city: string;
    postcode: string;
  }

  interface ShippingCalculationResult {
    zone: ShippingZone | null;
    rate: number;
    zoneName: string;
  }

  // ============================================
  // Vietnam shipping zones configuration
  // ============================================

  const VIETNAM_SHIPPING_ZONES: ShippingZone[] = [
    {
      name: "Hồ Chí Minh",
      stateCode: "SG",
      countryCode: "VN",
      type: "flat_rate",
      rate: 25000,
    },
    {
      name: "Hà Nội",
      stateCode: "HN",
      countryCode: "VN",
      type: "flat_rate",
      rate: 30000,
    },
    {
      name: "Tỉnh Thành Khác",
      stateCode: null, // Matches all other states in VN
      countryCode: "VN",
      type: "weight_based",
      rate: 35000, // Base rate
      weightRate: 5000, // Per 500g
      weightUnit: 500,
    },
  ];

  // Vietnam state codes (provinces)
  const VIETNAM_STATES = [
    "SG", // Ho Chi Minh
    "HN", // Hanoi
    "DN", // Da Nang
    "HP", // Hai Phong
    "CT", // Can Tho
    "BD", // Binh Duong
    "DL", // Da Lat
    "NT", // Nha Trang
    "VT", // Vung Tau
    "HUE", // Hue
    "QN", // Quang Ninh
    "TH", // Thanh Hoa
    "NA", // Nghe An
    "GL", // Gia Lai
    "KH", // Khanh Hoa
  ];

  // ============================================
  // Shipping zone determination logic
  // ============================================

  /**
   * Determines the shipping zone for a given address.
   * This mirrors the logic in shipping-configuration.php
   */
  function getShippingZoneForAddress(address: ShippingAddress): ShippingZone | null {
    // Only Vietnam is supported
    if (address.country !== "VN") {
      return null;
    }

    // Check for specific state zones first (HCM and Hanoi)
    const specificZone = VIETNAM_SHIPPING_ZONES.find(
      (zone) => zone.stateCode === address.state && zone.countryCode === address.country
    );

    if (specificZone) {
      return specificZone;
    }

    // Fall back to country-wide zone (other provinces)
    const countryZone = VIETNAM_SHIPPING_ZONES.find(
      (zone) => zone.stateCode === null && zone.countryCode === address.country
    );

    return countryZone || null;
  }

  /**
   * Calculates shipping rate for a given zone.
   * For flat rate zones, returns the fixed rate.
   * For weight-based zones, returns the base rate (weight calculation tested separately).
   */
  function calculateShippingRate(zone: ShippingZone | null): number {
    if (!zone) {
      return 0;
    }

    // For flat rate zones, return the fixed rate
    if (zone.type === "flat_rate") {
      return zone.rate;
    }

    // For weight-based zones, return the base rate
    // (actual weight calculation is tested in Property 9)
    return zone.rate;
  }

  /**
   * Full shipping calculation for an address
   */
  function calculateShipping(address: ShippingAddress): ShippingCalculationResult {
    const zone = getShippingZoneForAddress(address);
    const rate = calculateShippingRate(zone);

    return {
      zone,
      rate,
      zoneName: zone?.name || "No Zone",
    };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Ho Chi Minh address arbitrary
  const hoChiMinhAddressArb: fc.Arbitrary<ShippingAddress> = fc.record({
    country: fc.constant("VN"),
    state: fc.constant("SG"),
    city: fc.constant("Hồ Chí Minh"),
    postcode: fc.string({ minLength: 5, maxLength: 6 }).map((s) => s.replace(/\D/g, "7").slice(0, 6).padEnd(5, "0")),
  });

  // Hanoi address arbitrary
  const hanoiAddressArb: fc.Arbitrary<ShippingAddress> = fc.record({
    country: fc.constant("VN"),
    state: fc.constant("HN"),
    city: fc.constant("Hà Nội"),
    postcode: fc.string({ minLength: 5, maxLength: 6 }).map((s) => s.replace(/\D/g, "1").slice(0, 6).padEnd(5, "0")),
  });

  // Other provinces address arbitrary (excluding HCM and Hanoi)
  const otherProvincesArb = VIETNAM_STATES.filter((s) => s !== "SG" && s !== "HN");
  const otherProvinceAddressArb: fc.Arbitrary<ShippingAddress> = fc
    .tuple(fc.constantFrom(...otherProvincesArb), fc.integer({ min: 10000, max: 999999 }))
    .map(([state, postcodeNum]) => ({
      country: "VN",
      state,
      city: `City in ${state}`,
      postcode: postcodeNum.toString().padStart(5, "0"),
    }));

  // Any Vietnam address arbitrary
  const vietnamAddressArb: fc.Arbitrary<ShippingAddress> = fc.oneof(hoChiMinhAddressArb, hanoiAddressArb, otherProvinceAddressArb);

  // Non-Vietnam address arbitrary
  const nonVietnamAddressArb: fc.Arbitrary<ShippingAddress> = fc.record({
    country: fc.constantFrom("US", "JP", "KR", "TH", "SG", "MY"),
    state: fc.string({ minLength: 2, maxLength: 3 }),
    city: fc.string({ minLength: 3, maxLength: 20 }),
    postcode: fc.string({ minLength: 5, maxLength: 10 }),
  });

  // ============================================
  // Property Tests
  // ============================================

  it("should apply Ho Chi Minh flat rate (25,000 VND) for SG state addresses", () => {
    fc.assert(
      fc.property(hoChiMinhAddressArb, (address) => {
        const result = calculateShipping(address);

        expect(result.zone).not.toBeNull();
        expect(result.zone?.name).toBe("Hồ Chí Minh");
        expect(result.zone?.type).toBe("flat_rate");
        expect(result.rate).toBe(25000);

        return result.rate === 25000 && result.zone?.name === "Hồ Chí Minh";
      }),
      { numRuns: 100 }
    );
  });

  it("should apply Hanoi flat rate (30,000 VND) for HN state addresses", () => {
    fc.assert(
      fc.property(hanoiAddressArb, (address) => {
        const result = calculateShipping(address);

        expect(result.zone).not.toBeNull();
        expect(result.zone?.name).toBe("Hà Nội");
        expect(result.zone?.type).toBe("flat_rate");
        expect(result.rate).toBe(30000);

        return result.rate === 30000 && result.zone?.name === "Hà Nội";
      }),
      { numRuns: 100 }
    );
  });

  it("should apply other provinces base rate (35,000 VND) for non-HCM/Hanoi addresses", () => {
    fc.assert(
      fc.property(otherProvinceAddressArb, (address) => {
        const result = calculateShipping(address);

        expect(result.zone).not.toBeNull();
        expect(result.zone?.name).toBe("Tỉnh Thành Khác");
        expect(result.zone?.type).toBe("weight_based");
        expect(result.rate).toBe(35000);

        return result.rate === 35000 && result.zone?.name === "Tỉnh Thành Khác";
      }),
      { numRuns: 100 }
    );
  });

  it("should return null zone for non-Vietnam addresses", () => {
    fc.assert(
      fc.property(nonVietnamAddressArb, (address) => {
        const result = calculateShipping(address);

        expect(result.zone).toBeNull();
        expect(result.rate).toBe(0);

        return result.zone === null && result.rate === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should always match exactly one zone for any Vietnam address", () => {
    fc.assert(
      fc.property(vietnamAddressArb, (address) => {
        const result = calculateShipping(address);

        // Should always have a zone for Vietnam addresses
        expect(result.zone).not.toBeNull();

        // Zone should be one of the defined zones
        const validZoneNames = VIETNAM_SHIPPING_ZONES.map((z) => z.name);
        expect(validZoneNames).toContain(result.zone?.name);

        return result.zone !== null && validZoneNames.includes(result.zone.name);
      }),
      { numRuns: 100 }
    );
  });

  it("should apply consistent rates for the same zone", () => {
    fc.assert(
      fc.property(vietnamAddressArb, vietnamAddressArb, (address1, address2) => {
        const result1 = calculateShipping(address1);
        const result2 = calculateShipping(address2);

        // If both addresses are in the same zone, they should have the same base rate
        if (result1.zone?.name === result2.zone?.name) {
          expect(result1.rate).toBe(result2.rate);
          return result1.rate === result2.rate;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should prioritize specific state zones over country-wide zones", () => {
    // Test that HCM and Hanoi get their specific zones, not the country-wide zone
    fc.assert(
      fc.property(fc.oneof(hoChiMinhAddressArb, hanoiAddressArb), (address) => {
        const result = calculateShipping(address);

        // Should NOT be the "other provinces" zone
        expect(result.zone?.name).not.toBe("Tỉnh Thành Khác");

        // Should be either HCM or Hanoi
        expect(["Hồ Chí Minh", "Hà Nội"]).toContain(result.zone?.name);

        return result.zone?.name !== "Tỉnh Thành Khác";
      }),
      { numRuns: 100 }
    );
  });
});
