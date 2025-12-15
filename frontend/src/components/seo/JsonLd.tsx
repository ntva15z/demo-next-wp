import { WPPost, WPPage } from '@/lib/wordpress/types';

/**
 * JSON-LD Structured Data Component
 * Implements Article and WebPage schemas according to Schema.org specifications
 * Requirements: 6.4
 */

// ============================================
// Schema.org Type Definitions
// ============================================

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  datePublished: string;
  dateModified?: string;
  author?: PersonSchema | PersonSchema[];
  publisher?: OrganizationSchema;
  image?: string | string[];
  description?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
  articleSection?: string[];
  keywords?: string[];
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description?: string;
  url?: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  isPartOf?: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
}

export interface PersonSchema {
  '@type': 'Person';
  name: string;
  url?: string;
}

export interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

// ============================================
// Schema Generation Functions
// ============================================

export interface ArticleSchemaInput {
  post: WPPost;
  siteUrl: string;
  siteName?: string;
  publisherLogo?: string;
}

/**
 * Generates Article schema from WordPress post data
 */
export function generateArticleSchema(input: ArticleSchemaInput): ArticleSchema {
  const { post, siteUrl, siteName = 'Website', publisherLogo } = input;

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
  };

  // Add modified date if available
  if (post.modified) {
    schema.dateModified = post.modified;
  }

  // Add author if available
  if (post.author?.node) {
    schema.author = {
      '@type': 'Person',
      name: post.author.node.name,
    };
  }

  // Add publisher
  schema.publisher = {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  };

  if (publisherLogo) {
    schema.publisher.logo = {
      '@type': 'ImageObject',
      url: publisherLogo,
    };
  }

  // Add image if available
  if (post.featuredImage?.node?.sourceUrl) {
    schema.image = post.featuredImage.node.sourceUrl;
  }

  // Add description from excerpt or SEO
  if (post.seo?.metaDesc) {
    schema.description = post.seo.metaDesc;
  } else if (post.excerpt) {
    // Strip HTML tags from excerpt
    schema.description = post.excerpt.replace(/<[^>]*>/g, '').trim();
  }

  // Add main entity of page
  schema.mainEntityOfPage = {
    '@type': 'WebPage',
    '@id': `${siteUrl}/blog/${post.slug}`,
  };

  // Add categories as article sections
  if (post.categories?.nodes && post.categories.nodes.length > 0) {
    schema.articleSection = post.categories.nodes.map(cat => cat.name);
  }

  // Add tags as keywords
  if (post.tags?.nodes && post.tags.nodes.length > 0) {
    schema.keywords = post.tags.nodes.map(tag => tag.name);
  }

  return schema;
}

export interface WebPageSchemaInput {
  page: WPPage;
  siteUrl: string;
  siteName?: string;
}

/**
 * Generates WebPage schema from WordPress page data
 */
export function generateWebPageSchema(input: WebPageSchemaInput): WebPageSchema {
  const { page, siteUrl, siteName = 'Website' } = input;

  const schema: WebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    url: `${siteUrl}/${page.slug}`,
  };

  // Add description from SEO
  if (page.seo?.metaDesc) {
    schema.description = page.seo.metaDesc;
  }

  // Add image if available
  if (page.featuredImage?.node?.sourceUrl) {
    schema.image = page.featuredImage.node.sourceUrl;
  }

  // Add site information
  schema.isPartOf = {
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  };

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

/**
 * Generates BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  siteUrl: string
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}` } : {}),
    })),
  };
}

// ============================================
// React Components
// ============================================

interface JsonLdProps {
  data: ArticleSchema | WebPageSchema | BreadcrumbSchema;
}

/**
 * Renders JSON-LD structured data as a script tag
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface ArticleJsonLdProps {
  post: WPPost;
  siteUrl: string;
  siteName?: string;
  publisherLogo?: string;
}

/**
 * Renders Article JSON-LD for blog posts
 */
export function ArticleJsonLd({ post, siteUrl, siteName, publisherLogo }: ArticleJsonLdProps) {
  const schema = generateArticleSchema({ post, siteUrl, siteName, publisherLogo });
  return <JsonLd data={schema} />;
}

interface WebPageJsonLdProps {
  page: WPPage;
  siteUrl: string;
  siteName?: string;
}

/**
 * Renders WebPage JSON-LD for static pages
 */
export function WebPageJsonLd({ page, siteUrl, siteName }: WebPageJsonLdProps) {
  const schema = generateWebPageSchema({ page, siteUrl, siteName });
  return <JsonLd data={schema} />;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
  siteUrl: string;
}

/**
 * Renders BreadcrumbList JSON-LD
 */
export function BreadcrumbJsonLd({ items, siteUrl }: BreadcrumbJsonLdProps) {
  const schema = generateBreadcrumbSchema(items, siteUrl);
  return <JsonLd data={schema} />;
}

export default JsonLd;
