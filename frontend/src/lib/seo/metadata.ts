import { Metadata } from 'next';
import { WPSeo, WPPost, WPPage, WPFeaturedImage } from '@/lib/wordpress/types';

/**
 * SEO Metadata Generation Utilities
 * Generates meta tags from Yoast SEO data for NextJS Metadata API
 * Requirements: 6.1, 6.2
 */

export interface SEOInput {
  seo?: WPSeo;
  title: string;
  excerpt?: string;
  featuredImage?: WPFeaturedImage;
  slug: string;
  type: 'article' | 'website';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export interface GeneratedMetadata {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    type: 'article' | 'website';
    images: string[];
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
  twitter: {
    card: 'summary_large_image' | 'summary';
    title: string;
    description: string;
    images?: string[];
  };
  robots?: {
    index: boolean;
    follow: boolean;
  };
  canonical?: string;
}

/**
 * Strips HTML tags from a string
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Generates SEO metadata from WordPress SEO data (Yoast)
 * Returns a structured object with all required meta tags
 */
export function generateSEOMetadata(input: SEOInput): GeneratedMetadata {
  const { seo, title, excerpt, featuredImage, type, publishedTime, modifiedTime, author } = input;

  // Extract description from SEO data or excerpt
  const rawDescription = seo?.metaDesc || excerpt || '';
  const description = truncateText(stripHtmlTags(rawDescription), 160);

  // Determine title
  const metaTitle = seo?.title || title;

  // Collect images
  const images: string[] = [];
  if (seo?.opengraphImage?.sourceUrl) {
    images.push(seo.opengraphImage.sourceUrl);
  } else if (featuredImage?.node?.sourceUrl) {
    images.push(featuredImage.node.sourceUrl);
  }

  // Determine robots directives
  const shouldIndex = seo?.metaRobotsNoindex !== 'noindex';
  const shouldFollow = seo?.metaRobotsNofollow !== 'nofollow';

  // Build OpenGraph metadata
  const openGraph: GeneratedMetadata['openGraph'] = {
    title: seo?.opengraphTitle || metaTitle,
    description: seo?.opengraphDescription || description,
    type,
    images,
  };

  if (type === 'article') {
    if (publishedTime) {
      openGraph.publishedTime = publishedTime;
    }
    if (modifiedTime) {
      openGraph.modifiedTime = modifiedTime;
    }
    if (author) {
      openGraph.authors = [author];
    }
  }

  // Build Twitter Card metadata
  const twitter: GeneratedMetadata['twitter'] = {
    card: images.length > 0 ? 'summary_large_image' : 'summary',
    title: seo?.twitterTitle || seo?.opengraphTitle || metaTitle,
    description: seo?.twitterDescription || seo?.opengraphDescription || description,
  };

  if (images.length > 0) {
    twitter.images = images;
  }

  const result: GeneratedMetadata = {
    title: metaTitle,
    description,
    openGraph,
    twitter,
  };

  // Add robots if not default
  if (!shouldIndex || !shouldFollow) {
    result.robots = {
      index: shouldIndex,
      follow: shouldFollow,
    };
  }

  // Add canonical if provided
  if (seo?.canonical) {
    result.canonical = seo.canonical;
  }

  return result;
}

/**
 * Converts GeneratedMetadata to NextJS Metadata format
 */
export function toNextMetadata(generated: GeneratedMetadata, siteUrl?: string): Metadata {
  const metadata: Metadata = {
    title: generated.title,
    description: generated.description,
    openGraph: {
      title: generated.openGraph.title,
      description: generated.openGraph.description,
      type: generated.openGraph.type,
      images: generated.openGraph.images.map(url => ({ url })),
    },
    twitter: {
      card: generated.twitter.card,
      title: generated.twitter.title,
      description: generated.twitter.description,
      images: generated.twitter.images,
    },
  };

  if (generated.robots) {
    metadata.robots = generated.robots;
  }

  if (generated.canonical) {
    metadata.alternates = {
      canonical: generated.canonical,
    };
  }

  // Add article-specific OpenGraph fields
  if (generated.openGraph.type === 'article' && metadata.openGraph) {
    const og = metadata.openGraph as Record<string, unknown>;
    if (generated.openGraph.publishedTime) {
      og.publishedTime = generated.openGraph.publishedTime;
    }
    if (generated.openGraph.modifiedTime) {
      og.modifiedTime = generated.openGraph.modifiedTime;
    }
    if (generated.openGraph.authors) {
      og.authors = generated.openGraph.authors;
    }
  }

  return metadata;
}

/**
 * Generates metadata for a WordPress post
 */
export function generatePostMetadata(post: WPPost, siteUrl?: string): Metadata {
  const generated = generateSEOMetadata({
    seo: post.seo,
    title: post.title,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    slug: post.slug,
    type: 'article',
    publishedTime: post.date,
    modifiedTime: post.modified,
    author: post.author?.node?.name,
  });

  return toNextMetadata(generated, siteUrl);
}

/**
 * Generates metadata for a WordPress page
 */
export function generatePageMetadata(page: WPPage, siteUrl?: string): Metadata {
  const generated = generateSEOMetadata({
    seo: page.seo,
    title: page.title,
    featuredImage: page.featuredImage,
    slug: page.slug,
    type: 'website',
  });

  return toNextMetadata(generated, siteUrl);
}
