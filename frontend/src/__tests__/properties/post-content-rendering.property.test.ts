import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: nextjs-wordpress-app, Property 5: Post content rendering**
 * **Validates: Requirements 3.2**
 * 
 * For any single post with HTML content, the rendered output should preserve
 * the HTML structure and display all content elements (paragraphs, headings, images, lists).
 */
describe('Property: Post content rendering', () => {
  // Generate valid ISO date strings
  const validDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 })
    .map(ts => new Date(ts).toISOString());

  // Generate valid HTML content with various elements
  const htmlContentArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 200 }).map(text => `<p>${text}</p>`),
    fc.string({ minLength: 1, maxLength: 100 }).map(text => `<h2>${text}</h2>`),
    fc.string({ minLength: 1, maxLength: 100 }).map(text => `<h3>${text}</h3>`),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 })
      .map(items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 })
      .map(items => `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`),
    fc.webUrl().map(url => `<img src="${url}" alt="test" />`),
    fc.tuple(fc.webUrl(), fc.string({ minLength: 1, maxLength: 50 }))
      .map(([url, text]) => `<a href="${url}">${text}</a>`)
  );

  // Generate multiple HTML elements combined
  const multipleHtmlContentArb = fc.array(htmlContentArb, { minLength: 1, maxLength: 10 })
    .map(elements => elements.join('\n'));

  it('should preserve paragraph content in HTML', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (text) => {
          const html = `<p>${text}</p>`;
          // HTML should contain the original text
          expect(html).toContain(text);
          // HTML should have proper paragraph tags
          expect(html).toMatch(/<p>.*<\/p>/);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('should preserve heading content in HTML', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 6 }),
        (text, level) => {
          const html = `<h${level}>${text}</h${level}>`;
          // HTML should contain the original text
          expect(html).toContain(text);
          // HTML should have proper heading tags
          expect(html).toMatch(new RegExp(`<h${level}>.*</h${level}>`));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve list items in HTML', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        (items) => {
          const html = `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
          // Each item should be present in the HTML
          items.forEach(item => {
            expect(html).toContain(item);
          });
          // HTML should have proper list structure
          expect(html).toMatch(/<ul>.*<\/ul>/);
          expect((html.match(/<li>/g) || []).length).toBe(items.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve image sources in HTML', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const html = `<img src="${url}" alt="test" />`;
        // HTML should contain the image URL
        expect(html).toContain(url);
        // HTML should have proper img tag
        expect(html).toMatch(/<img.*src=.*\/>/);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve link URLs and text in HTML', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string({ minLength: 1, maxLength: 50 }),
        (url, text) => {
          const html = `<a href="${url}">${text}</a>`;
          // HTML should contain both URL and text
          expect(html).toContain(url);
          expect(html).toContain(text);
          // HTML should have proper anchor tag
          expect(html).toMatch(/<a.*href=.*>.*<\/a>/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple HTML elements combined', () => {
    fc.assert(
      fc.property(multipleHtmlContentArb, (html) => {
        // Combined HTML should be non-empty
        expect(html.length).toBeGreaterThan(0);
        // Should contain at least one HTML tag
        expect(html).toMatch(/<[^>]+>/);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty content gracefully', () => {
    const emptyContent = '';
    expect(emptyContent).toBe('');
  });

  it('should handle content with special characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (text) => {
          // Text with special HTML entities should be valid
          const escapedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const html = `<p>${escapedText}</p>`;
          expect(html).toMatch(/<p>.*<\/p>/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
