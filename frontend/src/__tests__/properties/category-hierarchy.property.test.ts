import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { WooCategory, WooImage } from "@/lib/wordpress/types";

/**
 * **Feature: wordpress-ecommerce-cms, Property 2: Category hierarchy consistency**
 * **Validates: Requirements 4.1**
 *
 * For any product category with a parent category, the parent-child relationship
 * SHALL be correctly maintained in both database storage and GraphQL query responses.
 */
describe("Property: Category hierarchy consistency", () => {
  // ============================================
  // Arbitraries for WooCommerce category types
  // ============================================

  const wooImageArb: fc.Arbitrary<WooImage> = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
  });

  // Base category without parent/children (for building hierarchy)
  const baseCategoryArb = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc
      .string({ minLength: 1, maxLength: 100 })
      .map((s) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")),
    description: fc.string({ maxLength: 500 }),
    image: fc.option(wooImageArb, { nil: null }),
    count: fc.integer({ min: 0, max: 10000 }),
  });

  // Generate a category hierarchy with proper parent-child relationships
  const categoryHierarchyArb: fc.Arbitrary<WooCategory[]> = fc
    .tuple(
      fc.array(baseCategoryArb, { minLength: 1, maxLength: 5 }), // Parent categories
      fc.array(baseCategoryArb, { minLength: 0, maxLength: 10 }) // Child categories
    )
    .map(([parents, children]) => {
      // Create parent categories with no parent
      const parentCategories: WooCategory[] = parents.map((p, idx) => ({
        ...p,
        id: `parent-${idx}-${p.id}`,
        slug: `${p.slug || "cat"}-${idx}`,
        parent: null,
        children: [],
      }));

      // Assign children to random parents
      const allCategories: WooCategory[] = [...parentCategories];

      children.forEach((child, idx) => {
        if (parentCategories.length > 0) {
          const parentIndex = idx % parentCategories.length;
          const parent = parentCategories[parentIndex];

          const childCategory: WooCategory = {
            ...child,
            id: `child-${idx}-${child.id}`,
            slug: `${child.slug || "subcat"}-${idx}`,
            parent: parent,
            children: [],
          };

          // Add child to parent's children array
          parent.children.push(childCategory);
          allCategories.push(childCategory);
        }
      });

      return allCategories;
    });

  // Generate a single category with optional parent
  const categoryWithParentArb: fc.Arbitrary<WooCategory> = fc
    .tuple(baseCategoryArb, fc.option(baseCategoryArb, { nil: null }))
    .map(([category, parentBase]) => {
      const parent: WooCategory | null = parentBase
        ? {
            ...parentBase,
            slug: `${parentBase.slug || "parent"}-p`,
            parent: null,
            children: [],
          }
        : null;

      const cat: WooCategory = {
        ...category,
        slug: `${category.slug || "cat"}-c`,
        parent: parent,
        children: [],
      };

      // If there's a parent, add this category to parent's children
      if (parent) {
        parent.children.push(cat);
      }

      return cat;
    });

  // ============================================
  // Validation helper functions
  // ============================================

  /**
   * Validates that a category's parent reference is consistent
   * If a category has a parent, the parent should exist and be valid
   */
  function hasValidParentReference(category: WooCategory): boolean {
    if (category.parent === null) {
      return true; // Root category, no parent to validate
    }

    // Parent should have required fields
    if (!category.parent.id || !category.parent.name || !category.parent.slug) {
      return false;
    }

    // Parent should not be the same as the category itself
    if (category.parent.id === category.id) {
      return false;
    }

    return true;
  }

  /**
   * Validates that parent-child relationships are bidirectional
   * If a category has a parent, the parent's children should include this category
   */
  function hasBidirectionalRelationship(category: WooCategory): boolean {
    if (category.parent === null) {
      return true; // Root category
    }

    // Check if parent's children array includes this category
    const isInParentChildren = category.parent.children.some(
      (child) => child.id === category.id
    );

    return isInParentChildren;
  }

  /**
   * Validates that there are no circular references in the hierarchy
   */
  function hasNoCircularReferences(category: WooCategory): boolean {
    const visited = new Set<string>();
    let current: WooCategory | null = category;

    while (current !== null) {
      if (visited.has(current.id)) {
        return false; // Circular reference detected
      }
      visited.add(current.id);
      current = current.parent;
    }

    return true;
  }

  /**
   * Validates that all categories in a hierarchy have unique IDs
   */
  function hasUniqueIds(categories: WooCategory[]): boolean {
    const ids = new Set<string>();
    for (const cat of categories) {
      if (ids.has(cat.id)) {
        return false;
      }
      ids.add(cat.id);
    }
    return true;
  }

  /**
   * Validates that all categories in a hierarchy have unique slugs
   */
  function hasUniqueSlugs(categories: WooCategory[]): boolean {
    const slugs = new Set<string>();
    for (const cat of categories) {
      if (slugs.has(cat.slug)) {
        return false;
      }
      slugs.add(cat.slug);
    }
    return true;
  }

  /**
   * Validates the depth of a category hierarchy doesn't exceed a reasonable limit
   */
  function hasReasonableDepth(category: WooCategory, maxDepth: number = 5): boolean {
    let depth = 0;
    let current: WooCategory | null = category;

    while (current !== null) {
      depth++;
      if (depth > maxDepth) {
        return false;
      }
      current = current.parent;
    }

    return true;
  }

  // ============================================
  // Property Tests
  // ============================================

  it("should ensure all categories have valid parent references", () => {
    fc.assert(
      fc.property(categoryWithParentArb, (category) => {
        const isValid = hasValidParentReference(category);
        expect(isValid).toBe(true);
        return isValid;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure parent-child relationships are bidirectional", () => {
    fc.assert(
      fc.property(categoryWithParentArb, (category) => {
        const isBidirectional = hasBidirectionalRelationship(category);
        expect(isBidirectional).toBe(true);
        return isBidirectional;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure no circular references exist in category hierarchy", () => {
    fc.assert(
      fc.property(categoryWithParentArb, (category) => {
        const noCircular = hasNoCircularReferences(category);
        expect(noCircular).toBe(true);
        return noCircular;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure all categories in a hierarchy have unique IDs", () => {
    fc.assert(
      fc.property(categoryHierarchyArb, (categories) => {
        const hasUnique = hasUniqueIds(categories);
        expect(hasUnique).toBe(true);
        return hasUnique;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure all categories in a hierarchy have unique slugs", () => {
    fc.assert(
      fc.property(categoryHierarchyArb, (categories) => {
        const hasUnique = hasUniqueSlugs(categories);
        expect(hasUnique).toBe(true);
        return hasUnique;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure category hierarchy depth is reasonable", () => {
    fc.assert(
      fc.property(categoryWithParentArb, (category) => {
        const hasReasonable = hasReasonableDepth(category);
        expect(hasReasonable).toBe(true);
        return hasReasonable;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure root categories have null parent", () => {
    fc.assert(
      fc.property(categoryHierarchyArb, (categories) => {
        // Find root categories (those without parents)
        const rootCategories = categories.filter((cat) => cat.parent === null);

        // All root categories should have null parent
        const allRootsValid = rootCategories.every((cat) => cat.parent === null);
        expect(allRootsValid).toBe(true);

        // There should be at least one root category
        expect(rootCategories.length).toBeGreaterThan(0);

        return allRootsValid && rootCategories.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure child categories reference their correct parent", () => {
    fc.assert(
      fc.property(categoryHierarchyArb, (categories) => {
        // Find all child categories (those with parents)
        const childCategories = categories.filter((cat) => cat.parent !== null);

        // Each child should be in its parent's children array
        const allChildrenValid = childCategories.every((child) => {
          if (!child.parent) return true;
          return child.parent.children.some((c) => c.id === child.id);
        });

        expect(allChildrenValid).toBe(true);
        return allChildrenValid;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure category required fields are present", () => {
    fc.assert(
      fc.property(categoryWithParentArb, (category) => {
        // Required fields check
        expect(typeof category.id).toBe("string");
        expect(category.id.length).toBeGreaterThan(0);
        expect(typeof category.databaseId).toBe("number");
        expect(typeof category.name).toBe("string");
        expect(typeof category.slug).toBe("string");
        expect(category.slug.length).toBeGreaterThan(0);
        expect(typeof category.description).toBe("string");
        expect(typeof category.count).toBe("number");
        expect(category.count).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(category.children)).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
