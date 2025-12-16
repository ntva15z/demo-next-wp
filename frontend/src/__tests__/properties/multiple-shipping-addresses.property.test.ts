import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 13: Multiple shipping addresses storage**
 * **Validates: Requirements 10.4**
 *
 * For any customer account, the system SHALL support storing and retrieving
 * multiple shipping addresses without data loss or corruption.
 */
describe("Property: Multiple shipping addresses storage", () => {
  // ============================================
  // Types for shipping addresses
  // ============================================

  interface ShippingAddress {
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface AddressValidationResult {
    valid: boolean;
    errors: string[];
  }

  interface AddressOperationResult {
    success: boolean;
    error?: string;
    addressId?: string;
    address?: ShippingAddress;
  }

  interface AddressBook {
    customerId: number;
    addresses: ShippingAddress[];
  }

  // ============================================
  // Address validation and storage logic
  // ============================================

  /**
   * Validates shipping address data.
   * This mirrors the logic in customer-account.php headless_validate_shipping_address()
   */
  function validateShippingAddress(
    address: Partial<ShippingAddress>
  ): AddressValidationResult {
    const errors: string[] = [];

    // Required fields - name
    if (!address.firstName && !address.lastName) {
      errors.push("missing_name");
    }

    // Required fields - address
    if (!address.address1) {
      errors.push("missing_address");
    }

    // Required fields - city
    if (!address.city) {
      errors.push("missing_city");
    }

    // Required fields - country
    if (!address.country) {
      errors.push("missing_country");
    }

    // Validate phone format if provided
    if (address.phone) {
      const phoneRegex = /^(0|\+84)?[0-9]{9,10}$/;
      if (!phoneRegex.test(address.phone)) {
        errors.push("invalid_phone_format");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Simulates adding a shipping address to the address book.
   * This mirrors the logic in customer-account.php headless_add_shipping_address()
   */
  function addShippingAddress(
    addressBook: AddressBook,
    address: Partial<ShippingAddress>,
    maxAddresses: number = 10
  ): AddressOperationResult {
    // Validate address
    const validation = validateShippingAddress(address);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    // Check maximum addresses limit
    if (addressBook.addresses.length >= maxAddresses) {
      return { success: false, error: "max_addresses_reached" };
    }

    // Generate unique address ID
    const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new address
    const newAddress: ShippingAddress = {
      id: addressId,
      label: address.label || "",
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      company: address.company || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      state: address.state || "",
      postcode: address.postcode || "",
      country: address.country || "VN",
      phone: address.phone || "",
      isDefault: address.isDefault || addressBook.addresses.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If this is set as default, unset other defaults
    if (newAddress.isDefault) {
      addressBook.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    addressBook.addresses.push(newAddress);

    return { success: true, addressId, address: newAddress };
  }

  /**
   * Simulates updating a shipping address.
   * This mirrors the logic in customer-account.php headless_update_shipping_address()
   */
  function updateShippingAddress(
    addressBook: AddressBook,
    addressId: string,
    updates: Partial<ShippingAddress>
  ): AddressOperationResult {
    const index = addressBook.addresses.findIndex((addr) => addr.id === addressId);

    if (index === -1) {
      return { success: false, error: "address_not_found" };
    }

    // Validate updated address
    const updatedAddress = { ...addressBook.addresses[index], ...updates };
    const validation = validateShippingAddress(updatedAddress);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    // Handle default flag
    if (updates.isDefault) {
      addressBook.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Update address
    addressBook.addresses[index] = {
      ...addressBook.addresses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, address: addressBook.addresses[index] };
  }

  /**
   * Simulates deleting a shipping address.
   * This mirrors the logic in customer-account.php headless_delete_shipping_address()
   */
  function deleteShippingAddress(
    addressBook: AddressBook,
    addressId: string
  ): AddressOperationResult {
    const index = addressBook.addresses.findIndex((addr) => addr.id === addressId);

    if (index === -1) {
      return { success: false, error: "address_not_found" };
    }

    const wasDefault = addressBook.addresses[index].isDefault;

    // Remove address
    addressBook.addresses.splice(index, 1);

    // If deleted address was default and there are other addresses, set first as default
    if (wasDefault && addressBook.addresses.length > 0) {
      addressBook.addresses[0].isDefault = true;
    }

    return { success: true };
  }

  /**
   * Gets the default shipping address.
   */
  function getDefaultAddress(addressBook: AddressBook): ShippingAddress | null {
    const defaultAddr = addressBook.addresses.find((addr) => addr.isDefault);
    return defaultAddr || (addressBook.addresses.length > 0 ? addressBook.addresses[0] : null);
  }

  /**
   * Sets an address as default.
   */
  function setDefaultAddress(
    addressBook: AddressBook,
    addressId: string
  ): AddressOperationResult {
    const index = addressBook.addresses.findIndex((addr) => addr.id === addressId);

    if (index === -1) {
      return { success: false, error: "address_not_found" };
    }

    // Unset all defaults
    addressBook.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set new default
    addressBook.addresses[index].isDefault = true;

    return { success: true };
  }

  /**
   * Check if address data is preserved after storage (no data loss).
   */
  function isAddressDataPreserved(
    original: Partial<ShippingAddress>,
    stored: ShippingAddress
  ): boolean {
    return (
      (original.firstName || "") === stored.firstName &&
      (original.lastName || "") === stored.lastName &&
      (original.company || "") === stored.company &&
      (original.address1 || "") === stored.address1 &&
      (original.address2 || "") === stored.address2 &&
      (original.city || "") === stored.city &&
      (original.state || "") === stored.state &&
      (original.postcode || "") === stored.postcode &&
      (original.country || "VN") === stored.country &&
      (original.phone || "") === stored.phone
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

  // Vietnamese phone arbitrary (valid format)
  const validPhoneArb = fc
    .tuple(
      fc.constantFrom("09", "03", "07", "08", "05"),
      fc.stringMatching(/^[0-9]{8}$/)
    )
    .map(([prefix, suffix]) => `${prefix}${suffix}`);

  // Invalid phone arbitrary
  const invalidPhoneArb = fc.constantFrom(
    "123",
    "abc",
    "12345678901234567890",
    "invalid-phone"
  );

  // Vietnamese city arbitrary
  const cityArb = fc.constantFrom(
    "Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng"
  );

  // Address label arbitrary
  const labelArb = fc.constantFrom(
    "Nhà",
    "Văn phòng",
    "Công ty",
    "Nhà bố mẹ",
    ""
  );

  // Valid shipping address arbitrary
  const validAddressArb: fc.Arbitrary<Partial<ShippingAddress>> = fc.record({
    label: labelArb,
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
    phone: validPhoneArb,
    isDefault: fc.boolean(),
  });

  // Invalid shipping address arbitrary (missing required fields)
  const invalidAddressArb: fc.Arbitrary<Partial<ShippingAddress>> = fc
    .tuple(
      validAddressArb,
      fc.constantFrom(
        "missing_name",
        "missing_address",
        "missing_city",
        "missing_country",
        "invalid_phone"
      )
    )
    .map(([address, missingField]) => {
      const invalid = { ...address };

      switch (missingField) {
        case "missing_name":
          invalid.firstName = "";
          invalid.lastName = "";
          break;
        case "missing_address":
          invalid.address1 = "";
          break;
        case "missing_city":
          invalid.city = "";
          break;
        case "missing_country":
          invalid.country = "";
          break;
        case "invalid_phone":
          invalid.phone = "invalid-phone";
          break;
      }

      return invalid;
    });

  // Customer ID arbitrary
  const customerIdArb = fc.integer({ min: 1, max: 100000 });

  // Empty address book arbitrary
  const emptyAddressBookArb: fc.Arbitrary<AddressBook> = customerIdArb.map(
    (customerId) => ({
      customerId,
      addresses: [],
    })
  );

  // Address book with addresses arbitrary
  const addressBookWithAddressesArb: fc.Arbitrary<AddressBook> = fc
    .tuple(customerIdArb, fc.array(validAddressArb, { minLength: 1, maxLength: 5 }))
    .map(([customerId, addressInputs]) => {
      const addressBook: AddressBook = { customerId, addresses: [] };

      // Add addresses one by one
      addressInputs.forEach((input, index) => {
        const result = addShippingAddress(addressBook, {
          ...input,
          isDefault: index === 0, // First address is default
        });
        if (!result.success) {
          // If add fails, skip this address
        }
      });

      return addressBook;
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should validate valid shipping addresses as valid", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const result = validateShippingAddress(address);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        return result.valid === true && result.errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject invalid shipping addresses", () => {
    fc.assert(
      fc.property(invalidAddressArb, (address) => {
        const result = validateShippingAddress(address);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        return result.valid === false && result.errors.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should successfully add valid addresses to address book", () => {
    fc.assert(
      fc.property(emptyAddressBookArb, validAddressArb, (addressBook, address) => {
        const result = addShippingAddress(addressBook, address);

        expect(result.success).toBe(true);
        expect(result.addressId).toBeTruthy();
        expect(result.address).toBeDefined();

        return result.success && !!result.addressId && !!result.address;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve address data after storage (no data loss)", () => {
    fc.assert(
      fc.property(emptyAddressBookArb, validAddressArb, (addressBook, address) => {
        const result = addShippingAddress(addressBook, address);

        expect(result.success).toBe(true);
        expect(result.address).toBeDefined();

        if (result.address) {
          const preserved = isAddressDataPreserved(address, result.address);
          expect(preserved).toBe(true);
          return preserved;
        }

        return false;
      }),
      { numRuns: 100 }
    );
  });

  it("should generate unique IDs for each address", () => {
    fc.assert(
      fc.property(
        emptyAddressBookArb,
        fc.array(validAddressArb, { minLength: 2, maxLength: 5 }),
        (addressBook, addresses) => {
          const ids: string[] = [];

          for (const address of addresses) {
            const result = addShippingAddress(addressBook, address);
            if (result.success && result.addressId) {
              ids.push(result.addressId);
            }
          }

          // All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          return uniqueIds.size === ids.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should enforce maximum addresses limit", () => {
    fc.assert(
      fc.property(
        emptyAddressBookArb,
        fc.array(validAddressArb, { minLength: 11, maxLength: 15 }),
        (addressBook, addresses) => {
          const maxAddresses = 10;
          let addedCount = 0;

          for (const address of addresses) {
            const result = addShippingAddress(addressBook, address, maxAddresses);
            if (result.success) {
              addedCount++;
            }
          }

          expect(addedCount).toBeLessThanOrEqual(maxAddresses);
          expect(addressBook.addresses.length).toBeLessThanOrEqual(maxAddresses);

          return (
            addedCount <= maxAddresses &&
            addressBook.addresses.length <= maxAddresses
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should set first address as default automatically", () => {
    fc.assert(
      fc.property(emptyAddressBookArb, validAddressArb, (addressBook, address) => {
        // Add first address without specifying isDefault
        const addressWithoutDefault = { ...address, isDefault: undefined };
        const result = addShippingAddress(addressBook, addressWithoutDefault);

        expect(result.success).toBe(true);
        expect(result.address?.isDefault).toBe(true);

        return result.success && result.address?.isDefault === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should have exactly one default address when addresses exist", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        if (addressBook.addresses.length === 0) {
          return true;
        }

        const defaultCount = addressBook.addresses.filter(
          (addr) => addr.isDefault
        ).length;

        expect(defaultCount).toBe(1);

        return defaultCount === 1;
      }),
      { numRuns: 100 }
    );
  });

  it("should successfully update existing addresses", () => {
    fc.assert(
      fc.property(
        addressBookWithAddressesArb,
        vietnameseNameArb,
        (addressBook, newFirstName) => {
          if (addressBook.addresses.length === 0) {
            return true;
          }

          const addressId = addressBook.addresses[0].id;
          const result = updateShippingAddress(addressBook, addressId, {
            firstName: newFirstName,
          });

          expect(result.success).toBe(true);
          expect(addressBook.addresses[0].firstName).toBe(newFirstName);

          return (
            result.success && addressBook.addresses[0].firstName === newFirstName
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should fail to update non-existent address", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        const result = updateShippingAddress(addressBook, "non_existent_id", {
          firstName: "Test",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("address_not_found");

        return result.success === false && result.error === "address_not_found";
      }),
      { numRuns: 100 }
    );
  });

  it("should successfully delete existing addresses", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        if (addressBook.addresses.length === 0) {
          return true;
        }

        const initialCount = addressBook.addresses.length;
        const addressId = addressBook.addresses[0].id;
        const result = deleteShippingAddress(addressBook, addressId);

        expect(result.success).toBe(true);
        expect(addressBook.addresses.length).toBe(initialCount - 1);

        return (
          result.success && addressBook.addresses.length === initialCount - 1
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should fail to delete non-existent address", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        const result = deleteShippingAddress(addressBook, "non_existent_id");

        expect(result.success).toBe(false);
        expect(result.error).toBe("address_not_found");

        return result.success === false && result.error === "address_not_found";
      }),
      { numRuns: 100 }
    );
  });

  it("should reassign default when default address is deleted", () => {
    fc.assert(
      fc.property(
        emptyAddressBookArb,
        fc.array(validAddressArb, { minLength: 2, maxLength: 5 }),
        (addressBook, addresses) => {
          // Add multiple addresses
          for (const address of addresses) {
            addShippingAddress(addressBook, address);
          }

          if (addressBook.addresses.length < 2) {
            return true;
          }

          // Find and delete the default address
          const defaultAddr = addressBook.addresses.find((addr) => addr.isDefault);
          if (!defaultAddr) {
            return true;
          }

          deleteShippingAddress(addressBook, defaultAddr.id);

          // Check that a new default is assigned
          const newDefault = addressBook.addresses.find((addr) => addr.isDefault);
          expect(newDefault).toBeDefined();

          return newDefault !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should successfully set a different address as default", () => {
    fc.assert(
      fc.property(
        emptyAddressBookArb,
        fc.array(validAddressArb, { minLength: 2, maxLength: 5 }),
        (addressBook, addresses) => {
          // Add multiple addresses
          for (const address of addresses) {
            addShippingAddress(addressBook, address);
          }

          if (addressBook.addresses.length < 2) {
            return true;
          }

          // Set second address as default
          const secondAddressId = addressBook.addresses[1].id;
          const result = setDefaultAddress(addressBook, secondAddressId);

          expect(result.success).toBe(true);
          expect(addressBook.addresses[1].isDefault).toBe(true);

          // Verify only one default exists
          const defaultCount = addressBook.addresses.filter(
            (addr) => addr.isDefault
          ).length;
          expect(defaultCount).toBe(1);

          return (
            result.success &&
            addressBook.addresses[1].isDefault &&
            defaultCount === 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should retrieve addresses without data corruption", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        // Verify all addresses have required fields
        for (const address of addressBook.addresses) {
          expect(address.id).toBeTruthy();
          expect(address.firstName || address.lastName).toBeTruthy();
          expect(address.address1).toBeTruthy();
          expect(address.city).toBeTruthy();
          expect(address.country).toBeTruthy();
          expect(address.createdAt).toBeTruthy();
          expect(address.updatedAt).toBeTruthy();

          if (
            !address.id ||
            (!address.firstName && !address.lastName) ||
            !address.address1 ||
            !address.city ||
            !address.country
          ) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should return correct default address", () => {
    fc.assert(
      fc.property(addressBookWithAddressesArb, (addressBook) => {
        const defaultAddr = getDefaultAddress(addressBook);

        if (addressBook.addresses.length === 0) {
          expect(defaultAddr).toBeNull();
          return defaultAddr === null;
        }

        expect(defaultAddr).toBeDefined();
        expect(defaultAddr?.isDefault).toBe(true);

        return defaultAddr !== null && defaultAddr.isDefault === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject addresses with invalid phone format", () => {
    fc.assert(
      fc.property(validAddressArb, invalidPhoneArb, (address, invalidPhone) => {
        const addressWithInvalidPhone = { ...address, phone: invalidPhone };
        const result = validateShippingAddress(addressWithInvalidPhone);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("invalid_phone_format");

        return (
          result.valid === false && result.errors.includes("invalid_phone_format")
        );
      }),
      { numRuns: 100 }
    );
  });
});
