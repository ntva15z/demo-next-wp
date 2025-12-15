import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getCategoryUrl, getTagUrl } from '@/components/posts/PostContent';
import { WPCategory, WPTag } from '@/lib/wordpress/types';

/**
 * **Feature: nextjs-wordpress-app, Property 6: Category and tag linking**
 * **Validates: Requirements 3.3**
 * 
 * For any post with categories or tags, each category/tag should be rendered
 * as a clickable link pointing to the correct archive URL (/category/{slug} or /tag/{slug}).
 */
describe('Property: Category and tag linking', () => {
  // Generate valid slug strings (lowercase, hyphenated)
  const slugArb = fc.string({ minLength: 1, maxLength: 50 })
    .map(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default');

  // Arbitrary for generating valid WPCategory objects
  const wpCategoryArb: fc.Arbitrary<WPCategory> = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: slugArb,
    description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
    count: fc.option(fc.nat(), { nil: undefined }),
  });

  // Arbitrary for generating valid WPTag objects
  const wpTagArb: fc.Arbitrary<WPTag> = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: slugArb,
    description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
    count: fc.option(fc.nat(), { nil: undefined }),
  });

  it('should generate correct category URL format', () => {
    fc.assert(
      fc.property(wpCategoryArb, (category) => {
        const url = getCategoryUrl(category);
        // URL should start with /category/
        expect(url).toMatch(/^\/category\//);
        // URL should contain the category slug
        expect(url).toBe(`/category/${category.slug}`);
      }),
      { numRuns: 100 }
    );
  });


  it('should generate correct tag URL format', () => {
    fc.assert(
      fc.property(wpTagArb, (tag) => {
        const url = getTagUrl(tag);
        // URL should start with /tag/
        expect(url).toMatch(/^\/tag\//);
        // URL should contain the tag slug
        expect(url).toBe(`/tag/${tag.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate unique URLs for different category slugs', () => {
    fc.assert(
      fc.property(
        fc.tuple(wpCategoryArb, wpCategoryArb).filter(([a, b]) => a.slug !== b.slug),
        ([cat1, cat2]) => {
          const url1 = getCategoryUrl(cat1);
          const url2 = getCategoryUrl(cat2);
          // Different slugs should produce different URLs
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique URLs for different tag slugs', () => {
    fc.assert(
      fc.property(
        fc.tuple(wpTagArb, wpTagArb).filter(([a, b]) => a.slug !== b.slug),
        ([tag1, tag2]) => {
          const url1 = getTagUrl(tag1);
          const url2 = getTagUrl(tag2);
          // Different slugs should produce different URLs
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid URL paths (no special characters except hyphen)', () => {
    fc.assert(
      fc.property(wpCategoryArb, (category) => {
        const url = getCategoryUrl(category);
        // URL path should only contain valid characters
        expect(url).toMatch(/^\/category\/[a-z0-9-]+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid tag URL paths (no special characters except hyphen)', () => {
    fc.assert(
      fc.property(wpTagArb, (tag) => {
        const url = getTagUrl(tag);
        // URL path should only contain valid characters
        expect(url).toMatch(/^\/tag\/[a-z0-9-]+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle categories with same name but different slugs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.tuple(slugArb, slugArb).filter(([a, b]) => a !== b),
        (name, [slug1, slug2]) => {
          const cat1: WPCategory = { id: '1', name, slug: slug1 };
          const cat2: WPCategory = { id: '2', name, slug: slug2 };
          const url1 = getCategoryUrl(cat1);
          const url2 = getCategoryUrl(cat2);
          // Same name but different slugs should produce different URLs
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle tags with same name but different slugs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.tuple(slugArb, slugArb).filter(([a, b]) => a !== b),
        (name, [slug1, slug2]) => {
          const tag1: WPTag = { id: '1', name, slug: slug1 };
          const tag2: WPTag = { id: '2', name, slug: slug2 };
          const url1 = getTagUrl(tag1);
          const url2 = getTagUrl(tag2);
          // Same name but different slugs should produce different URLs
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
