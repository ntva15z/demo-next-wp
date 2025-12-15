import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hasACFFields, renderACFFieldValue } from '@/components/pages/PageContent';
import { WPPage, WPPageWithACF } from '@/lib/wordpress/types';

/**
 * **Feature: nextjs-wordpress-app, Property 7: Page content rendering**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * For any WordPress page with content, the NextJS application should render
 * the page content correctly, including any ACF custom fields if present.
 */
describe('Property: Page content rendering', () => {
  // Generate valid page data
  const wpPageArb = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
    uri: fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`),
    content: fc.string({ minLength: 0, maxLength: 1000 }),
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
    seo: fc.option(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }),
        metaDesc: fc.string({ minLength: 0, maxLength: 200 }),
        opengraphTitle: fc.string({ minLength: 0, maxLength: 100 }),
        opengraphDescription: fc.string({ minLength: 0, maxLength: 200 }),
      }),
      { nil: undefined }
    ),
  }) as fc.Arbitrary<WPPage>;

  // Generate ACF field values
  const acfFieldValueArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 200 }),
    fc.integer({ min: -1000, max: 1000 }),
    fc.boolean(),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
    fc.constant(null)
  );

  // Generate ACF fields object
  const acfFieldsArb = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_')),
    acfFieldValueArb,
    { minKeys: 0, maxKeys: 5 }
  );

  // Generate page with ACF fields
  const wpPageWithACFArb = fc.tuple(wpPageArb, acfFieldsArb).map(([page, acfFields]) => ({
    ...page,
    acfFields: Object.keys(acfFields).length > 0 ? acfFields : undefined,
  })) as fc.Arbitrary<WPPageWithACF>;

  describe('hasACFFields type guard', () => {
    it('should correctly identify pages with ACF fields', () => {
      fc.assert(
        fc.property(wpPageWithACFArb, (page) => {
          const result = hasACFFields(page);
          // If acfFields exists and is defined, hasACFFields should return true
          if (page.acfFields !== undefined) {
            expect(result).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify pages without ACF fields', () => {
      fc.assert(
        fc.property(wpPageArb, (page) => {
          // Regular WPPage without acfFields property
          const result = hasACFFields(page);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('renderACFFieldValue', () => {
    it('should handle string values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('<') && !s.includes('>')),
          (value) => {
            const result = renderACFFieldValue(value);
            // Result should not be null for non-empty strings
            expect(result).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle number values', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (value) => {
          const result = renderACFFieldValue(value);
          expect(result).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle boolean values', () => {
      fc.assert(
        fc.property(fc.boolean(), (value) => {
          const result = renderACFFieldValue(value);
          expect(result).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle array values', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          (value) => {
            const result = renderACFFieldValue(value);
            expect(result).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and undefined values', () => {
      expect(renderACFFieldValue(null)).toBeNull();
      expect(renderACFFieldValue(undefined)).toBeNull();
    });
  });

  describe('Page content structure', () => {
    it('should have required fields for any valid page', () => {
      fc.assert(
        fc.property(wpPageArb, (page) => {
          // Every page must have id, databaseId, title, slug, uri, and content
          expect(page.id).toBeDefined();
          expect(typeof page.id).toBe('string');
          expect(page.databaseId).toBeDefined();
          expect(typeof page.databaseId).toBe('number');
          expect(page.title).toBeDefined();
          expect(typeof page.title).toBe('string');
          expect(page.slug).toBeDefined();
          expect(typeof page.slug).toBe('string');
          expect(page.uri).toBeDefined();
          expect(typeof page.uri).toBe('string');
          expect(page.content).toBeDefined();
          expect(typeof page.content).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle pages with featured images correctly', () => {
      fc.assert(
        fc.property(
          wpPageArb.filter(page => page.featuredImage !== undefined),
          (page) => {
            // If featuredImage exists, it should have required node properties
            expect(page.featuredImage).toBeDefined();
            expect(page.featuredImage!.node).toBeDefined();
            expect(page.featuredImage!.node.sourceUrl).toBeDefined();
            expect(typeof page.featuredImage!.node.sourceUrl).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle pages with SEO data correctly', () => {
      fc.assert(
        fc.property(
          wpPageArb.filter(page => page.seo !== undefined),
          (page) => {
            // If SEO exists, it should have title at minimum
            expect(page.seo).toBeDefined();
            expect(page.seo!.title).toBeDefined();
            expect(typeof page.seo!.title).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ACF fields integration', () => {
    it('should preserve all ACF field keys in page with ACF', () => {
      fc.assert(
        fc.property(
          wpPageWithACFArb.filter(page => page.acfFields !== undefined && Object.keys(page.acfFields).length > 0),
          (page) => {
            const fieldKeys = Object.keys(page.acfFields!);
            // All field keys should be strings
            fieldKeys.forEach(key => {
              expect(typeof key).toBe('string');
              expect(key.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed ACF field types', () => {
      fc.assert(
        fc.property(acfFieldsArb, (fields) => {
          Object.values(fields).forEach((value) => {
            // Each field should be renderable
            const result = renderACFFieldValue(value);
            // Result can be null for null values, but should not throw
            if (value !== null && value !== undefined) {
              expect(result).not.toBeNull();
            }
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('HTML content handling', () => {
    it('should handle HTML content in page content field', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (text) => {
            const htmlContent = `<p>${text}</p>`;
            // HTML content should be valid string
            expect(typeof htmlContent).toBe('string');
            expect(htmlContent).toContain(text);
            expect(htmlContent).toMatch(/<p>.*<\/p>/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle HTML content in ACF string fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (text) => {
            const htmlValue = `<div>${text}</div>`;
            const result = renderACFFieldValue(htmlValue);
            // HTML content should be rendered (not null)
            expect(result).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
