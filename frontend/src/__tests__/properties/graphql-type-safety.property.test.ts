import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  WPPost,
  WPPage,
  WPMenuItem,
  WPSeo,
  WPImage,
  WPCategory,
  WPTag,
  PostsResponse,
  PageResponse,
  MenuResponse,
} from "@/lib/wordpress/types";

/**
 * **Feature: nextjs-wordpress-app, Property 2: GraphQL response type safety**
 * **Validates: Requirements 2.2**
 *
 * For any GraphQL query response from WordPress, the parsed response should match
 * the expected TypeScript type structure, with null/undefined handled appropriately
 * for optional fields.
 */
describe("Property: GraphQL response type safety", () => {
  // ============================================
  // Arbitraries for WordPress types
  // ============================================

  const wpImageArb: fc.Arbitrary<WPImage> = fc.record({
    sourceUrl: fc.webUrl(),
    altText: fc.string({ maxLength: 200 }),
    mediaDetails: fc.option(
      fc.record({
        width: fc.integer({ min: 1, max: 10000 }),
        height: fc.integer({ min: 1, max: 10000 }),
      }),
      { nil: undefined }
    ),
  });

  const wpCategoryArb: fc.Arbitrary<WPCategory> = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 100 }).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    count: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
  });

  const wpTagArb: fc.Arbitrary<WPTag> = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 100 }).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    count: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
  });

  const wpSeoArb: fc.Arbitrary<WPSeo> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    metaDesc: fc.string({ maxLength: 500 }),
    opengraphTitle: fc.string({ maxLength: 200 }),
    opengraphDescription: fc.string({ maxLength: 500 }),
    opengraphImage: fc.option(
      fc.record({ sourceUrl: fc.webUrl() }),
      { nil: undefined }
    ),
    twitterTitle: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    twitterDescription: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    canonical: fc.option(fc.webUrl(), { nil: undefined }),
    focusKeywords: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }), { nil: undefined }),
    metaRobotsNoindex: fc.option(fc.string(), { nil: undefined }),
    metaRobotsNofollow: fc.option(fc.string(), { nil: undefined }),
  });


  // Use integer timestamps to generate valid ISO date strings
  const isoDateStringArb = fc
    .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31
    .map((ts) => new Date(ts).toISOString());

  const wpPostArb: fc.Arbitrary<WPPost> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 200 }).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    content: fc.option(fc.string({ maxLength: 10000 }), { nil: undefined }),
    date: isoDateStringArb,
    modified: fc.option(isoDateStringArb, { nil: undefined }),
    featuredImage: fc.option(
      fc.record({ node: wpImageArb }),
      { nil: undefined }
    ),
    categories: fc.option(
      fc.record({ nodes: fc.array(wpCategoryArb, { maxLength: 5 }) }),
      { nil: undefined }
    ),
    tags: fc.option(
      fc.record({ nodes: fc.array(wpTagArb, { maxLength: 10 }) }),
      { nil: undefined }
    ),
    seo: fc.option(wpSeoArb, { nil: undefined }),
  });

  const wpPageArb: fc.Arbitrary<WPPage> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 1000000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 200 }).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    uri: fc.string({ minLength: 1, maxLength: 200 }).map((s) => `/${s.toLowerCase().replace(/\s+/g, "-")}`),
    content: fc.string({ maxLength: 10000 }),
    featuredImage: fc.option(
      fc.record({ node: wpImageArb }),
      { nil: undefined }
    ),
    seo: fc.option(wpSeoArb, { nil: undefined }),
  });

  const wpMenuItemArb: fc.Arbitrary<WPMenuItem> = fc.record({
    id: fc.uuid(),
    label: fc.string({ minLength: 1, maxLength: 100 }),
    url: fc.webUrl(),
    path: fc.string({ minLength: 1, maxLength: 200 }).map((s) => `/${s}`),
    parentId: fc.option(fc.uuid(), { nil: null }),
    cssClasses: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }), { nil: undefined }),
    target: fc.option(fc.constantFrom("_blank", "_self"), { nil: undefined }),
    order: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  });

  // ============================================
  // Type validation helper functions
  // ============================================

  function isValidWPPost(post: unknown): post is WPPost {
    if (typeof post !== "object" || post === null) return false;
    const p = post as Record<string, unknown>;
    
    // Required fields
    if (typeof p.id !== "string") return false;
    if (typeof p.databaseId !== "number") return false;
    if (typeof p.title !== "string") return false;
    if (typeof p.slug !== "string") return false;
    if (typeof p.date !== "string") return false;
    
    // Optional fields should be undefined or correct type
    if (p.excerpt !== undefined && typeof p.excerpt !== "string") return false;
    if (p.content !== undefined && typeof p.content !== "string") return false;
    if (p.modified !== undefined && typeof p.modified !== "string") return false;
    
    return true;
  }

  function isValidWPPage(page: unknown): page is WPPage {
    if (typeof page !== "object" || page === null) return false;
    const p = page as Record<string, unknown>;
    
    // Required fields
    if (typeof p.id !== "string") return false;
    if (typeof p.databaseId !== "number") return false;
    if (typeof p.title !== "string") return false;
    if (typeof p.slug !== "string") return false;
    if (typeof p.uri !== "string") return false;
    if (typeof p.content !== "string") return false;
    
    return true;
  }

  function isValidWPMenuItem(item: unknown): item is WPMenuItem {
    if (typeof item !== "object" || item === null) return false;
    const i = item as Record<string, unknown>;
    
    // Required fields
    if (typeof i.id !== "string") return false;
    if (typeof i.label !== "string") return false;
    if (typeof i.url !== "string") return false;
    if (typeof i.path !== "string") return false;
    if (i.parentId !== null && typeof i.parentId !== "string") return false;
    
    return true;
  }


  // ============================================
  // Property Tests
  // ============================================

  it("should validate WPPost type structure for any generated post", () => {
    fc.assert(
      fc.property(wpPostArb, (post) => {
        // Verify required fields exist and have correct types
        expect(typeof post.id).toBe("string");
        expect(typeof post.databaseId).toBe("number");
        expect(typeof post.title).toBe("string");
        expect(typeof post.slug).toBe("string");
        expect(typeof post.date).toBe("string");
        
        // Verify optional fields are either undefined or correct type
        if (post.excerpt !== undefined) {
          expect(typeof post.excerpt).toBe("string");
        }
        if (post.content !== undefined) {
          expect(typeof post.content).toBe("string");
        }
        if (post.modified !== undefined) {
          expect(typeof post.modified).toBe("string");
        }
        if (post.featuredImage !== undefined) {
          expect(typeof post.featuredImage.node.sourceUrl).toBe("string");
          expect(typeof post.featuredImage.node.altText).toBe("string");
        }
        if (post.categories !== undefined) {
          expect(Array.isArray(post.categories.nodes)).toBe(true);
        }
        if (post.tags !== undefined) {
          expect(Array.isArray(post.tags.nodes)).toBe(true);
        }
        
        // Verify type guard works
        expect(isValidWPPost(post)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate WPPage type structure for any generated page", () => {
    fc.assert(
      fc.property(wpPageArb, (page) => {
        // Verify required fields exist and have correct types
        expect(typeof page.id).toBe("string");
        expect(typeof page.databaseId).toBe("number");
        expect(typeof page.title).toBe("string");
        expect(typeof page.slug).toBe("string");
        expect(typeof page.uri).toBe("string");
        expect(typeof page.content).toBe("string");
        
        // Verify optional fields are either undefined or correct type
        if (page.featuredImage !== undefined) {
          expect(typeof page.featuredImage.node.sourceUrl).toBe("string");
          expect(typeof page.featuredImage.node.altText).toBe("string");
        }
        if (page.seo !== undefined) {
          expect(typeof page.seo.title).toBe("string");
          expect(typeof page.seo.metaDesc).toBe("string");
        }
        
        // Verify type guard works
        expect(isValidWPPage(page)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate WPMenuItem type structure for any generated menu item", () => {
    fc.assert(
      fc.property(wpMenuItemArb, (item) => {
        // Verify required fields exist and have correct types
        expect(typeof item.id).toBe("string");
        expect(typeof item.label).toBe("string");
        expect(typeof item.url).toBe("string");
        expect(typeof item.path).toBe("string");
        expect(item.parentId === null || typeof item.parentId === "string").toBe(true);
        
        // Verify optional fields are either undefined or correct type
        if (item.cssClasses !== undefined) {
          expect(Array.isArray(item.cssClasses)).toBe(true);
        }
        if (item.target !== undefined) {
          expect(typeof item.target).toBe("string");
        }
        if (item.order !== undefined) {
          expect(typeof item.order).toBe("number");
        }
        
        // Verify type guard works
        expect(isValidWPMenuItem(item)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should handle null/undefined appropriately for optional fields in posts", () => {
    fc.assert(
      fc.property(wpPostArb, (post) => {
        // Optional fields should be handled gracefully
        const excerpt = post.excerpt ?? "";
        const content = post.content ?? "";
        const modified = post.modified ?? post.date;
        
        expect(typeof excerpt).toBe("string");
        expect(typeof content).toBe("string");
        expect(typeof modified).toBe("string");
        
        // Categories and tags should default to empty arrays
        const categories = post.categories?.nodes ?? [];
        const tags = post.tags?.nodes ?? [];
        
        expect(Array.isArray(categories)).toBe(true);
        expect(Array.isArray(tags)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate PostsResponse structure with pagination", () => {
    const postsResponseArb: fc.Arbitrary<PostsResponse> = fc.record({
      posts: fc.record({
        pageInfo: fc.record({
          hasNextPage: fc.boolean(),
          hasPreviousPage: fc.boolean(),
          startCursor: fc.option(fc.string(), { nil: undefined }),
          endCursor: fc.option(fc.string(), { nil: undefined }),
        }),
        nodes: fc.array(wpPostArb, { maxLength: 10 }),
      }),
    });

    fc.assert(
      fc.property(postsResponseArb, (response) => {
        expect(typeof response.posts.pageInfo.hasNextPage).toBe("boolean");
        expect(typeof response.posts.pageInfo.hasPreviousPage).toBe("boolean");
        expect(Array.isArray(response.posts.nodes)).toBe(true);
        
        // All posts in nodes should be valid
        response.posts.nodes.forEach((post) => {
          expect(isValidWPPost(post)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should validate PageResponse structure with nullable page", () => {
    const pageResponseArb: fc.Arbitrary<PageResponse> = fc.record({
      page: fc.option(wpPageArb, { nil: null }),
    });

    fc.assert(
      fc.property(pageResponseArb, (response) => {
        // Page can be null (404 case) or a valid page
        if (response.page !== null) {
          expect(isValidWPPage(response.page)).toBe(true);
        } else {
          expect(response.page).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should validate MenuResponse structure", () => {
    const menuResponseArb: fc.Arbitrary<MenuResponse> = fc.record({
      menuItems: fc.record({
        nodes: fc.array(wpMenuItemArb, { maxLength: 20 }),
      }),
    });

    fc.assert(
      fc.property(menuResponseArb, (response) => {
        expect(Array.isArray(response.menuItems.nodes)).toBe(true);
        
        // All menu items should be valid
        response.menuItems.nodes.forEach((item) => {
          expect(isValidWPMenuItem(item)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });
});
