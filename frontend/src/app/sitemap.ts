import { MetadataRoute } from 'next';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_SITEMAP_DATA } from '@/lib/wordpress/queries';

/**
 * XML Sitemap Generation
 * Generates sitemap from WordPress content
 * Requirements: 6.3
 */

interface SitemapPost {
  slug: string;
  modified?: string;
}

interface SitemapPage {
  slug: string;
  uri: string;
  modified?: string;
}

interface SitemapCategory {
  slug: string;
}

interface SitemapTag {
  slug: string;
}

interface SitemapDataResponse {
  posts: {
    nodes: SitemapPost[];
  };
  pages: {
    nodes: SitemapPage[];
  };
  categories: {
    nodes: SitemapCategory[];
  };
  tags: {
    nodes: SitemapTag[];
  };
}

/**
 * Generates sitemap entries from WordPress content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const data = await fetchGraphQL<SitemapDataResponse>(
      GET_SITEMAP_DATA,
      undefined,
      { revalidate: 3600 } // Revalidate every hour
    );

    const entries: MetadataRoute.Sitemap = [];

    // Add homepage
    entries.push({
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });

    // Add blog listing page
    entries.push({
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });

    // Add posts
    if (data.posts?.nodes) {
      for (const post of data.posts.nodes) {
        entries.push({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: post.modified ? new Date(post.modified) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Add pages (excluding homepage which is handled separately)
    if (data.pages?.nodes) {
      for (const page of data.pages.nodes) {
        // Skip if it's the homepage
        if (page.slug === 'home' || page.uri === '/') {
          continue;
        }

        // Use URI if available, otherwise use slug
        const pageUrl = page.uri && page.uri !== '/'
          ? `${siteUrl}${page.uri.startsWith('/') ? page.uri : `/${page.uri}`}`
          : `${siteUrl}/${page.slug}`;

        entries.push({
          url: pageUrl.replace(/\/$/, ''), // Remove trailing slash
          lastModified: page.modified ? new Date(page.modified) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }

    // Add category archive pages
    if (data.categories?.nodes) {
      for (const category of data.categories.nodes) {
        entries.push({
          url: `${siteUrl}/category/${category.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }

    // Add tag archive pages
    if (data.tags?.nodes) {
      for (const tag of data.tags.nodes) {
        entries.push({
          url: `${siteUrl}/tag/${tag.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }

    return entries;
  } catch (error) {
    console.error('Failed to generate sitemap:', error);

    // Return minimal sitemap on error
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}

/**
 * Helper function to generate sitemap entries from content arrays
 * Useful for testing and external usage
 */
export function generateSitemapEntries(
  siteUrl: string,
  posts: SitemapPost[],
  pages: SitemapPage[],
  categories: SitemapCategory[],
  tags: SitemapTag[]
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Add homepage
  entries.push({
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Add blog listing page
  entries.push({
    url: `${siteUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });

  // Add posts
  for (const post of posts) {
    entries.push({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.modified ? new Date(post.modified) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Add pages
  for (const page of pages) {
    if (page.slug === 'home' || page.uri === '/') {
      continue;
    }

    const pageUrl = page.uri && page.uri !== '/'
      ? `${siteUrl}${page.uri.startsWith('/') ? page.uri : `/${page.uri}`}`
      : `${siteUrl}/${page.slug}`;

    entries.push({
      url: pageUrl.replace(/\/$/, ''),
      lastModified: page.modified ? new Date(page.modified) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Add categories
  for (const category of categories) {
    entries.push({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // Add tags
  for (const tag of tags) {
    entries.push({
      url: `${siteUrl}/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return entries;
}
