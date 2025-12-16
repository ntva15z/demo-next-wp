import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { performRevalidation, RevalidateContentType } from "@/app/api/revalidate/route";

// Mock next/cache functions
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

import { revalidateTag, revalidatePath } from "next/cache";

const mockedRevalidateTag = vi.mocked(revalidateTag);
const mockedRevalidatePath = vi.mocked(revalidatePath);

/**
 * **Feature: nextjs-wordpress-app, Property 14: Content revalidation on update**
 * **Validates: Requirements 3.5, 4.4, 8.1, 8.2**
 *
 * For any content update webhook (post or page), the NextJS application should invalidate
 * the appropriate cache tags and trigger revalidation of affected paths.
 */
describe("Property: Content revalidation on update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Arbitrary for valid slugs (URL-safe strings)
  const slugArb = fc
    .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .filter((s) => s.length >= 1 && s.length <= 100);

  // Arbitrary for content types
  const contentTypeArb = fc.constantFrom<RevalidateContentType>(
    "post",
    "page",
    "menu",
    "all"
  );

  it("should revalidate 'posts' tag when type is 'post'", () => {
    fc.assert(
      fc.property(fc.option(slugArb, { nil: undefined }), (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("post", slug);

        // Should always revalidate 'posts' tag
        expect(mockedRevalidateTag).toHaveBeenCalledWith("posts", "max");
        expect(result.tags).toContain("posts");

        // Should always revalidate /blog path
        expect(mockedRevalidatePath).toHaveBeenCalledWith("/blog");
        expect(result.paths).toContain("/blog");
      }),
      { numRuns: 100 }
    );
  });

  it("should revalidate specific post tag and path when slug is provided", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("post", slug);

        // Should revalidate specific post tag
        expect(mockedRevalidateTag).toHaveBeenCalledWith(`post-${slug}`, "max");
        expect(result.tags).toContain(`post-${slug}`);

        // Should revalidate specific post path
        expect(mockedRevalidatePath).toHaveBeenCalledWith(`/blog/${slug}`);
        expect(result.paths).toContain(`/blog/${slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it("should revalidate 'pages' tag when type is 'page'", () => {
    fc.assert(
      fc.property(fc.option(slugArb, { nil: undefined }), (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("page", slug);

        // Should always revalidate 'pages' tag
        expect(mockedRevalidateTag).toHaveBeenCalledWith("pages", "max");
        expect(result.tags).toContain("pages");
      }),
      { numRuns: 100 }
    );
  });

  it("should revalidate specific page tag and path when slug is provided", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("page", slug);

        // Should revalidate specific page tag
        expect(mockedRevalidateTag).toHaveBeenCalledWith(`page-${slug}`, "max");
        expect(result.tags).toContain(`page-${slug}`);

        // Should revalidate specific page path
        expect(mockedRevalidatePath).toHaveBeenCalledWith(`/${slug}`);
        expect(result.paths).toContain(`/${slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it("should revalidate 'menu' tag when type is 'menu'", () => {
    fc.assert(
      fc.property(fc.option(slugArb, { nil: undefined }), (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("menu", slug);

        // Should revalidate 'menu' tag
        expect(mockedRevalidateTag).toHaveBeenCalledWith("menu", "max");
        expect(result.tags).toContain("menu");

        // Menu revalidation should not trigger path revalidation
        expect(result.paths).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should revalidate all tags when type is 'all'", () => {
    fc.assert(
      fc.property(fc.option(slugArb, { nil: undefined }), (slug) => {
        vi.clearAllMocks();
        const result = performRevalidation("all", slug);

        // Should revalidate all main tags
        expect(mockedRevalidateTag).toHaveBeenCalledWith("posts", "max");
        expect(mockedRevalidateTag).toHaveBeenCalledWith("pages", "max");
        expect(mockedRevalidateTag).toHaveBeenCalledWith("menu", "max");

        expect(result.tags).toContain("posts");
        expect(result.tags).toContain("pages");
        expect(result.tags).toContain("menu");
      }),
      { numRuns: 100 }
    );
  });

  it("should return correct tags and paths for any content type", () => {
    fc.assert(
      fc.property(contentTypeArb, fc.option(slugArb, { nil: undefined }), (type, slug) => {
        vi.clearAllMocks();
        const result = performRevalidation(type, slug);

        // Result should always have tags array
        expect(Array.isArray(result.tags)).toBe(true);
        expect(result.tags.length).toBeGreaterThan(0);

        // Result should always have paths array
        expect(Array.isArray(result.paths)).toBe(true);

        // All returned tags should have been revalidated
        result.tags.forEach((tag) => {
          expect(mockedRevalidateTag).toHaveBeenCalledWith(tag, "max");
        });

        // All returned paths should have been revalidated
        result.paths.forEach((path) => {
          expect(mockedRevalidatePath).toHaveBeenCalledWith(path);
        });
      }),
      { numRuns: 100 }
    );
  });
});
