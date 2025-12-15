import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateSEOMetadata,
  stripHtmlTags,
  truncateText,
  type SEOInput,
  type GeneratedMetadata,
} from '@/lib/seo/metadata';

/**
 * **Feature: nextjs-wordpress-app, Property 10: SEO metadata completeness**
 * **Validates: Requirements 6.1, 6.2**
 *
 * For any page or post with SEO data from Yoast, the rendered page should include:
 * meta title, meta description, Open Graph tags (og:title, og:description, og:image),
 * and Twitter Card tags.
 */
describe('Property: SEO metadata completeness', () => {
  // Arbitrary for valid URLs
  const urlArb = fc.webUrl();

  // Arbitrary for non-empty strings (for titles, descriptions)
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 200 });

  // Arbitrary for WPSeo object
  const wpSeoArb = fc.record({
    title: nonEmptyStringArb,
    metaDesc: nonEmptyStringArb,
    opengraphTitle: nonEmptyStringArb,
    opengraphDescription: nonEmptyStringArb,
    opengraphImage: fc.option(fc.record({ sourceUrl: urlArb }), { nil: undefined }),
    twitterTitle: fc.option(nonEmptyStringArb, { nil: undefined }),
    twitterDescription: fc.option(nonEmptyStringArb, { nil: undefined }),
    canonical: fc.option(urlArb, { nil: undefined }),
    metaRobotsNoindex: fc.option(fc.constantFrom('noindex', 'index'), { nil: undefined }),
    metaRobotsNofollow: fc.option(fc.constantFrom('nofollow', 'follow'), { nil: undefined }),
  });

  // Arbitrary for featured image
  const featuredImageArb = fc.option(
    fc.record({
      node: fc.record({
        sourceUrl: urlArb,
        altText: fc.string({ maxLength: 100 }),
      }),
    }),
    { nil: undefined }
  );

  // Arbitrary for valid ISO date strings (using integer timestamps for reliability)
  const validDateArb = fc.integer({
    min: 946684800000, // 2000-01-01
    max: 1924905600000, // 2030-12-31
  }).map(ts => new Date(ts).toISOString());

  // Arbitrary for SEOInput
  const seoInputArb = fc.record({
    seo: fc.option(wpSeoArb, { nil: undefined }),
    title: nonEmptyStringArb,
    excerpt: fc.option(nonEmptyStringArb, { nil: undefined }),
    featuredImage: featuredImageArb,
    slug: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom('article', 'website') as fc.Arbitrary<'article' | 'website'>,
    publishedTime: fc.option(validDateArb, { nil: undefined }),
    modifiedTime: fc.option(validDateArb, { nil: undefined }),
    author: fc.option(nonEmptyStringArb, { nil: undefined }),
  });

  it('should always include meta title in generated metadata', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        // Title should always be present and non-empty
        expect(result.title).toBeDefined();
        expect(result.title.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should always include meta description in generated metadata', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        // Description should always be defined (may be empty if no source)
        expect(result.description).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should always include Open Graph title and description', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        // OpenGraph should always have title and description
        expect(result.openGraph).toBeDefined();
        expect(result.openGraph.title).toBeDefined();
        expect(result.openGraph.title.length).toBeGreaterThan(0);
        expect(result.openGraph.description).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should always include Twitter Card tags', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        // Twitter should always have card type, title, and description
        expect(result.twitter).toBeDefined();
        expect(result.twitter.card).toBeDefined();
        expect(['summary', 'summary_large_image']).toContain(result.twitter.card);
        expect(result.twitter.title).toBeDefined();
        expect(result.twitter.title.length).toBeGreaterThan(0);
        expect(result.twitter.description).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should use SEO title when available, fallback to page title', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        if (input.seo?.title) {
          expect(result.title).toBe(input.seo.title);
        } else {
          expect(result.title).toBe(input.title);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include images in OpenGraph when available', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        // Images array should always be defined
        expect(result.openGraph.images).toBeDefined();
        expect(Array.isArray(result.openGraph.images)).toBe(true);

        // If SEO has opengraph image, it should be included
        if (input.seo?.opengraphImage?.sourceUrl) {
          expect(result.openGraph.images).toContain(input.seo.opengraphImage.sourceUrl);
        }
        // If no SEO image but featured image exists, it should be used
        else if (input.featuredImage?.node?.sourceUrl) {
          expect(result.openGraph.images).toContain(input.featuredImage.node.sourceUrl);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should use summary_large_image card when images are present', () => {
    fc.assert(
      fc.property(seoInputArb, (input) => {
        const result = generateSEOMetadata(input);
        const hasImages =
          input.seo?.opengraphImage?.sourceUrl || input.featuredImage?.node?.sourceUrl;

        if (hasImages) {
          expect(result.twitter.card).toBe('summary_large_image');
        } else {
          expect(result.twitter.card).toBe('summary');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include article-specific fields for article type', () => {
    fc.assert(
      fc.property(
        seoInputArb.filter((input) => input.type === 'article'),
        (input) => {
          const result = generateSEOMetadata(input);
          expect(result.openGraph.type).toBe('article');

          // Published time should be included if provided
          if (input.publishedTime) {
            expect(result.openGraph.publishedTime).toBe(input.publishedTime);
          }
          // Modified time should be included if provided
          if (input.modifiedTime) {
            expect(result.openGraph.modifiedTime).toBe(input.modifiedTime);
          }
          // Author should be included if provided
          if (input.author) {
            expect(result.openGraph.authors).toContain(input.author);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Helper functions', () => {
  // Arbitrary for text that doesn't contain HTML-like characters
  const plainTextArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => !s.includes('<') && !s.includes('>'));

  it('stripHtmlTags should remove all HTML tags', () => {
    fc.assert(
      fc.property(plainTextArb, (text) => {
        const html = `<p>${text}</p>`;
        const stripped = stripHtmlTags(html);
        // Should not contain any HTML tags
        expect(stripped).not.toMatch(/<[^>]*>/);
        // Should contain the original text (trimmed)
        expect(stripped).toBe(text.trim());
      }),
      { numRuns: 100 }
    );
  });

  it('truncateText should respect max length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.integer({ min: 10, max: 200 }),
        (text, maxLength) => {
          const truncated = truncateText(text, maxLength);
          // Result should never exceed max length
          expect(truncated.length).toBeLessThanOrEqual(maxLength);
          // If original was shorter, it should be unchanged
          if (text.length <= maxLength) {
            expect(truncated).toBe(text);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('truncateText should add ellipsis when truncating', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 50, maxLength: 500 }),
        (text) => {
          const maxLength = 20;
          if (text.length > maxLength) {
            const truncated = truncateText(text, maxLength);
            expect(truncated).toMatch(/\.\.\.$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
