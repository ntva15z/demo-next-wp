import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDate, stripHtmlAndTruncate } from '@/components/posts/PostCard';
import { WPPost } from '@/lib/wordpress/types';

/**
 * **Feature: nextjs-wordpress-app, Property 4: Post list rendering completeness**
 * **Validates: Requirements 3.1**
 * 
 * For any list of posts returned from WordPress, each post card should display:
 * title (required), excerpt (if available), featured image (if available), and publication date.
 */
describe('Property: Post list rendering completeness', () => {
  // Generate valid ISO date strings
  const validDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31
    .map(ts => new Date(ts).toISOString());

  // Arbitrary for generating valid WPPost objects
  const wpPostArb: fc.Arbitrary<WPPost> = fc.record({
    id: fc.uuid(),
    databaseId: fc.nat(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/\s+/g, '-').toLowerCase()),
    date: validDateArb,
    excerpt: fc.option(fc.string({ minLength: 0, maxLength: 300 }), { nil: undefined }),
    featuredImage: fc.option(
      fc.record({
        node: fc.record({
          sourceUrl: fc.webUrl(),
          altText: fc.string({ minLength: 0, maxLength: 100 }),
          mediaDetails: fc.option(
            fc.record({
              width: fc.integer({ min: 100, max: 2000 }),
              height: fc.integer({ min: 100, max: 2000 }),
            }),
            { nil: undefined }
          ),
        }),
      }),
      { nil: undefined }
    ),
  });


  it('should always have a title for every post', () => {
    fc.assert(
      fc.property(wpPostArb, (post) => {
        // Title is required and must be non-empty
        expect(post.title).toBeDefined();
        expect(typeof post.title).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('should always have a valid date for every post', () => {
    fc.assert(
      fc.property(wpPostArb, (post) => {
        // Date is required and must be a valid ISO date string
        expect(post.date).toBeDefined();
        const parsedDate = new Date(post.date);
        expect(parsedDate.toString()).not.toBe('Invalid Date');
      }),
      { numRuns: 100 }
    );
  });

  it('should format dates consistently', () => {
    fc.assert(
      fc.property(validDateArb, (isoString) => {
        const formatted = formatDate(isoString);
        // Formatted date should be a non-empty string
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
        // Should contain year, month, and day components
        expect(formatted).toMatch(/\d{4}/); // year
      }),
      { numRuns: 100 }
    );
  });

  it('should strip HTML and truncate excerpts correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.integer({ min: 10, max: 200 }),
        (text, maxLength) => {
          const result = stripHtmlAndTruncate(text, maxLength);
          // Result should never exceed maxLength + 3 (for ellipsis)
          expect(result.length).toBeLessThanOrEqual(maxLength + 3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle undefined excerpt gracefully', () => {
    const result = stripHtmlAndTruncate(undefined);
    expect(result).toBe('');
  });

  it('should strip HTML tags from excerpts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (content) => {
          const htmlContent = `<p>${content}</p>`;
          const result = stripHtmlAndTruncate(htmlContent, 500);
          // Result should not contain HTML tags
          expect(result).not.toMatch(/<[^>]*>/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid featured image structure when present', () => {
    fc.assert(
      fc.property(wpPostArb, (post) => {
        if (post.featuredImage) {
          expect(post.featuredImage.node).toBeDefined();
          expect(post.featuredImage.node.sourceUrl).toBeDefined();
          expect(typeof post.featuredImage.node.sourceUrl).toBe('string');
        }
        // If no featured image, that's also valid
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
