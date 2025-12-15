import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateArticleSchema,
  generateWebPageSchema,
  generateBreadcrumbSchema,
  type ArticleSchema,
  type WebPageSchema,
} from '@/components/seo/JsonLd';
import { WPPost, WPPage } from '@/lib/wordpress/types';

/**
 * **Feature: nextjs-wordpress-app, Property 11: JSON-LD structured data validity**
 * **Validates: Requirements 6.4**
 *
 * For any rendered article or page, the JSON-LD structured data should be valid
 * according to Schema.org specifications and include required fields
 * (headline, datePublished, author for articles).
 */
describe('Property: JSON-LD structured data validity', () => {
  // Arbitrary for valid URLs
  const urlArb = fc.webUrl();

  // Arbitrary for non-empty strings
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 200 });

  // Arbitrary for valid ISO date strings
  const validDateArb = fc.integer({
    min: 946684800000, // 2000-01-01
    max: 1924905600000, // 2030-12-31
  }).map(ts => new Date(ts).toISOString());

  // Arbitrary for WPPost
  const wpPostArb: fc.Arbitrary<WPPost> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 100000 }),
    title: nonEmptyStringArb,
    slug: fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
    excerpt: fc.option(nonEmptyStringArb, { nil: undefined }),
    content: fc.option(nonEmptyStringArb, { nil: undefined }),
    date: validDateArb,
    modified: fc.option(validDateArb, { nil: undefined }),
    featuredImage: fc.option(
      fc.record({
        node: fc.record({
          sourceUrl: urlArb,
          altText: fc.string({ maxLength: 100 }),
        }),
      }),
      { nil: undefined }
    ),
    categories: fc.option(
      fc.record({
        nodes: fc.array(
          fc.record({
            id: fc.uuid(),
            name: nonEmptyStringArb,
            slug: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
      }),
      { nil: undefined }
    ),
    tags: fc.option(
      fc.record({
        nodes: fc.array(
          fc.record({
            id: fc.uuid(),
            name: nonEmptyStringArb,
            slug: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
      }),
      { nil: undefined }
    ),
    seo: fc.option(
      fc.record({
        title: nonEmptyStringArb,
        metaDesc: nonEmptyStringArb,
        opengraphTitle: nonEmptyStringArb,
        opengraphDescription: nonEmptyStringArb,
      }),
      { nil: undefined }
    ),
    author: fc.option(
      fc.record({
        node: fc.record({
          id: fc.uuid(),
          name: nonEmptyStringArb,
          slug: fc.string({ minLength: 1, maxLength: 50 }),
        }),
      }),
      { nil: undefined }
    ),
  });

  // Arbitrary for WPPage
  const wpPageArb: fc.Arbitrary<WPPage> = fc.record({
    id: fc.uuid(),
    databaseId: fc.integer({ min: 1, max: 100000 }),
    title: nonEmptyStringArb,
    slug: fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
    uri: fc.string({ minLength: 1, maxLength: 200 }),
    content: nonEmptyStringArb,
    featuredImage: fc.option(
      fc.record({
        node: fc.record({
          sourceUrl: urlArb,
          altText: fc.string({ maxLength: 100 }),
        }),
      }),
      { nil: undefined }
    ),
    seo: fc.option(
      fc.record({
        title: nonEmptyStringArb,
        metaDesc: nonEmptyStringArb,
        opengraphTitle: nonEmptyStringArb,
        opengraphDescription: nonEmptyStringArb,
      }),
      { nil: undefined }
    ),
  });

  // Arbitrary for site configuration
  const siteConfigArb = fc.record({
    siteUrl: urlArb,
    siteName: fc.option(nonEmptyStringArb, { nil: undefined }),
    publisherLogo: fc.option(urlArb, { nil: undefined }),
  });

  describe('Article Schema', () => {
    it('should always include @context as https://schema.org', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
            publisherLogo: config.publisherLogo,
          });
          expect(schema['@context']).toBe('https://schema.org');
        }),
        { numRuns: 100 }
      );
    });

    it('should always include @type as Article', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
          });
          expect(schema['@type']).toBe('Article');
        }),
        { numRuns: 100 }
      );
    });

    it('should always include headline (required field)', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
          });
          expect(schema.headline).toBeDefined();
          expect(schema.headline.length).toBeGreaterThan(0);
          expect(schema.headline).toBe(post.title);
        }),
        { numRuns: 100 }
      );
    });

    it('should always include datePublished (required field)', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
          });
          expect(schema.datePublished).toBeDefined();
          expect(schema.datePublished).toBe(post.date);
          // Should be a valid ISO date string
          expect(() => new Date(schema.datePublished)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should include author when available', () => {
      fc.assert(
        fc.property(
          wpPostArb.filter(p => p.author?.node !== undefined),
          siteConfigArb,
          (post, config) => {
            const schema = generateArticleSchema({
              post,
              siteUrl: config.siteUrl,
            });
            expect(schema.author).toBeDefined();
            if (schema.author && !Array.isArray(schema.author)) {
              expect(schema.author['@type']).toBe('Person');
              expect(schema.author.name).toBe(post.author!.node.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include publisher', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
          });
          expect(schema.publisher).toBeDefined();
          expect(schema.publisher!['@type']).toBe('Organization');
          expect(schema.publisher!.name).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should include image when featured image is available', () => {
      fc.assert(
        fc.property(
          wpPostArb.filter(p => p.featuredImage?.node?.sourceUrl !== undefined),
          siteConfigArb,
          (post, config) => {
            const schema = generateArticleSchema({
              post,
              siteUrl: config.siteUrl,
            });
            expect(schema.image).toBeDefined();
            expect(schema.image).toBe(post.featuredImage!.node.sourceUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include mainEntityOfPage with correct URL', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
          });
          expect(schema.mainEntityOfPage).toBeDefined();
          expect(schema.mainEntityOfPage!['@type']).toBe('WebPage');
          expect(schema.mainEntityOfPage!['@id']).toContain(post.slug);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid JSON', () => {
      fc.assert(
        fc.property(wpPostArb, siteConfigArb, (post, config) => {
          const schema = generateArticleSchema({
            post,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
            publisherLogo: config.publisherLogo,
          });
          // Should be serializable to JSON
          const json = JSON.stringify(schema);
          expect(json).toBeDefined();
          // Should be parseable back
          const parsed = JSON.parse(json);
          expect(parsed['@context']).toBe('https://schema.org');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('WebPage Schema', () => {
    it('should always include @context as https://schema.org', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
          });
          expect(schema['@context']).toBe('https://schema.org');
        }),
        { numRuns: 100 }
      );
    });

    it('should always include @type as WebPage', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
          });
          expect(schema['@type']).toBe('WebPage');
        }),
        { numRuns: 100 }
      );
    });

    it('should always include name (required field)', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
          });
          expect(schema.name).toBeDefined();
          expect(schema.name.length).toBeGreaterThan(0);
          expect(schema.name).toBe(page.title);
        }),
        { numRuns: 100 }
      );
    });

    it('should include URL with correct format', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
          });
          expect(schema.url).toBeDefined();
          expect(schema.url).toContain(page.slug);
        }),
        { numRuns: 100 }
      );
    });

    it('should include isPartOf with site information', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
          });
          expect(schema.isPartOf).toBeDefined();
          expect(schema.isPartOf!['@type']).toBe('WebSite');
          expect(schema.isPartOf!.url).toBe(config.siteUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid JSON', () => {
      fc.assert(
        fc.property(wpPageArb, siteConfigArb, (page, config) => {
          const schema = generateWebPageSchema({
            page,
            siteUrl: config.siteUrl,
            siteName: config.siteName,
          });
          // Should be serializable to JSON
          const json = JSON.stringify(schema);
          expect(json).toBeDefined();
          // Should be parseable back
          const parsed = JSON.parse(json);
          expect(parsed['@context']).toBe('https://schema.org');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Breadcrumb Schema', () => {
    const breadcrumbItemArb = fc.record({
      name: nonEmptyStringArb,
      url: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    });

    it('should always include @context as https://schema.org', () => {
      fc.assert(
        fc.property(
          fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 5 }),
          urlArb,
          (items, siteUrl) => {
            const schema = generateBreadcrumbSchema(items, siteUrl);
            expect(schema['@context']).toBe('https://schema.org');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include @type as BreadcrumbList', () => {
      fc.assert(
        fc.property(
          fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 5 }),
          urlArb,
          (items, siteUrl) => {
            const schema = generateBreadcrumbSchema(items, siteUrl);
            expect(schema['@type']).toBe('BreadcrumbList');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct number of items in itemListElement', () => {
      fc.assert(
        fc.property(
          fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 5 }),
          urlArb,
          (items, siteUrl) => {
            const schema = generateBreadcrumbSchema(items, siteUrl);
            expect(schema.itemListElement.length).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have sequential positions starting from 1', () => {
      fc.assert(
        fc.property(
          fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 5 }),
          urlArb,
          (items, siteUrl) => {
            const schema = generateBreadcrumbSchema(items, siteUrl);
            schema.itemListElement.forEach((item, index) => {
              expect(item.position).toBe(index + 1);
              expect(item['@type']).toBe('ListItem');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
