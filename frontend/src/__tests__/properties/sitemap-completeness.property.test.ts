import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSitemapEntries } from '@/app/sitemap';

/**
 * **Feature: nextjs-wordpress-app, Property 12: Sitemap content completeness**
 * **Validates: Requirements 6.3**
 *
 * For any set of published posts and pages in WordPress, the generated XML sitemap
 * should contain URLs for all published content items.
 */
describe('Property: Sitemap content completeness', () => {
  // Arbitrary for valid slugs (lowercase alphanumeric with hyphens)
  const slugArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => /^[a-z0-9-]+$/.test(s) && !s.startsWith('-') && !s.endsWith('-'));

  // Arbitrary for valid ISO date strings
  const validDateArb = fc.integer({
    min: 946684800000, // 2000-01-01
    max: 1924905600000, // 2030-12-31
  }).map(ts => new Date(ts).toISOString());

  // Arbitrary for sitemap post
  const sitemapPostArb = fc.record({
    slug: slugArb,
    modified: fc.option(validDateArb, { nil: undefined }),
  });

  // Arbitrary for sitemap page
  const sitemapPageArb = fc.record({
    slug: slugArb.filter(s => s !== 'home'), // Exclude 'home' as it's handled specially
    uri: fc.oneof(
      slugArb.map(s => `/${s}`),
      slugArb.map(s => `/${s}/`),
      fc.constant('') // Empty URI
    ).filter(uri => uri !== '/'), // Exclude root URI
    modified: fc.option(validDateArb, { nil: undefined }),
  });

  // Arbitrary for sitemap category
  const sitemapCategoryArb = fc.record({
    slug: slugArb,
  });

  // Arbitrary for sitemap tag
  const sitemapTagArb = fc.record({
    slug: slugArb,
  });

  // Arbitrary for site URL
  const siteUrlArb = fc.webUrl().filter(url => !url.endsWith('/'));

  it('should always include homepage in sitemap', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 10 }),
        fc.array(sitemapPageArb, { maxLength: 10 }),
        fc.array(sitemapCategoryArb, { maxLength: 5 }),
        fc.array(sitemapTagArb, { maxLength: 5 }),
        (siteUrl, posts, pages, categories, tags) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, categories, tags);
          const urls = entries.map(e => e.url);
          expect(urls).toContain(siteUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always include blog listing page in sitemap', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 10 }),
        fc.array(sitemapPageArb, { maxLength: 10 }),
        fc.array(sitemapCategoryArb, { maxLength: 5 }),
        fc.array(sitemapTagArb, { maxLength: 5 }),
        (siteUrl, posts, pages, categories, tags) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, categories, tags);
          const urls = entries.map(e => e.url);
          expect(urls).toContain(`${siteUrl}/blog`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all posts in sitemap', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { minLength: 1, maxLength: 10 }),
        (siteUrl, posts) => {
          const entries = generateSitemapEntries(siteUrl, posts, [], [], []);
          const urls = entries.map(e => e.url);

          // Every post should have a corresponding URL
          for (const post of posts) {
            const expectedUrl = `${siteUrl}/blog/${post.slug}`;
            expect(urls).toContain(expectedUrl);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all pages in sitemap (except homepage)', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPageArb, { minLength: 1, maxLength: 10 }),
        (siteUrl, pages) => {
          const entries = generateSitemapEntries(siteUrl, [], pages, [], []);
          const urls = entries.map(e => e.url);

          // Every page should have a corresponding URL
          for (const page of pages) {
            // Skip home page
            if (page.slug === 'home' || page.uri === '/') {
              continue;
            }

            // Check that page URL exists (either via URI or slug)
            const hasPageUrl = urls.some(url =>
              url.includes(page.slug) || (page.uri && url.includes(page.uri.replace(/\/$/, '')))
            );
            expect(hasPageUrl).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all categories in sitemap', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapCategoryArb, { minLength: 1, maxLength: 10 }),
        (siteUrl, categories) => {
          const entries = generateSitemapEntries(siteUrl, [], [], categories, []);
          const urls = entries.map(e => e.url);

          // Every category should have a corresponding URL
          for (const category of categories) {
            const expectedUrl = `${siteUrl}/category/${category.slug}`;
            expect(urls).toContain(expectedUrl);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all tags in sitemap', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapTagArb, { minLength: 1, maxLength: 10 }),
        (siteUrl, tags) => {
          const entries = generateSitemapEntries(siteUrl, [], [], [], tags);
          const urls = entries.map(e => e.url);

          // Every tag should have a corresponding URL
          for (const tag of tags) {
            const expectedUrl = `${siteUrl}/tag/${tag.slug}`;
            expect(urls).toContain(expectedUrl);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have correct number of entries for all content', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 10 }),
        fc.array(sitemapPageArb, { maxLength: 10 }),
        fc.array(sitemapCategoryArb, { maxLength: 5 }),
        fc.array(sitemapTagArb, { maxLength: 5 }),
        (siteUrl, posts, pages, categories, tags) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, categories, tags);

          // Filter out home pages from count
          const validPages = pages.filter(p => p.slug !== 'home' && p.uri !== '/');

          // Expected: homepage + blog + posts + pages + categories + tags
          const expectedCount = 2 + posts.length + validPages.length + categories.length + tags.length;
          expect(entries.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid priority values (0.0 to 1.0)', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 5 }),
        fc.array(sitemapPageArb, { maxLength: 5 }),
        fc.array(sitemapCategoryArb, { maxLength: 3 }),
        fc.array(sitemapTagArb, { maxLength: 3 }),
        (siteUrl, posts, pages, categories, tags) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, categories, tags);

          for (const entry of entries) {
            if (entry.priority !== undefined) {
              expect(entry.priority).toBeGreaterThanOrEqual(0);
              expect(entry.priority).toBeLessThanOrEqual(1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid changeFrequency values', () => {
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 5 }),
        fc.array(sitemapPageArb, { maxLength: 5 }),
        fc.array(sitemapCategoryArb, { maxLength: 3 }),
        fc.array(sitemapTagArb, { maxLength: 3 }),
        (siteUrl, posts, pages, categories, tags) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, categories, tags);

          for (const entry of entries) {
            if (entry.changeFrequency !== undefined) {
              expect(validFrequencies).toContain(entry.changeFrequency);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid lastModified dates', () => {
    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 5 }),
        fc.array(sitemapPageArb, { maxLength: 5 }),
        (siteUrl, posts, pages) => {
          const entries = generateSitemapEntries(siteUrl, posts, pages, [], []);

          for (const entry of entries) {
            if (entry.lastModified !== undefined) {
              // Should be a valid Date
              expect(entry.lastModified instanceof Date).toBe(true);
              expect(isNaN(entry.lastModified.getTime())).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have duplicate URLs', () => {
    // Helper to compute final URL for a page
    const getPageUrl = (siteUrl: string, page: { slug: string; uri: string }) => {
      if (page.slug === 'home' || page.uri === '/') {
        return null; // Excluded
      }
      const pageUrl = page.uri && page.uri !== '/'
        ? `${siteUrl}${page.uri.startsWith('/') ? page.uri : `/${page.uri}`}`
        : `${siteUrl}/${page.slug}`;
      return pageUrl.replace(/\/$/, '');
    };

    fc.assert(
      fc.property(
        siteUrlArb,
        fc.array(sitemapPostArb, { maxLength: 10 }),
        fc.array(sitemapPageArb, { maxLength: 10 }),
        fc.array(sitemapCategoryArb, { maxLength: 5 }),
        fc.array(sitemapTagArb, { maxLength: 5 }),
        (siteUrl, posts, pages, categories, tags) => {
          // Ensure unique slugs for posts
          const uniquePosts = posts.filter((p, i, arr) =>
            arr.findIndex(x => x.slug === p.slug) === i
          );

          // Ensure unique final URLs for pages (not just slugs)
          const seenPageUrls = new Set<string>();
          const uniquePages = pages.filter(p => {
            const url = getPageUrl(siteUrl, p);
            if (url === null || seenPageUrls.has(url)) {
              return false;
            }
            seenPageUrls.add(url);
            return true;
          });

          // Ensure unique slugs for categories
          const uniqueCategories = categories.filter((c, i, arr) =>
            arr.findIndex(x => x.slug === c.slug) === i
          );

          // Ensure unique slugs for tags
          const uniqueTags = tags.filter((t, i, arr) =>
            arr.findIndex(x => x.slug === t.slug) === i
          );

          const entries = generateSitemapEntries(
            siteUrl,
            uniquePosts,
            uniquePages,
            uniqueCategories,
            uniqueTags
          );
          const urls = entries.map(e => e.url);
          const uniqueUrls = [...new Set(urls)];

          expect(urls.length).toBe(uniqueUrls.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
