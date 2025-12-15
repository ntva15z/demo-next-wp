import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_PAGE_BY_SLUG, GET_ALL_PAGES_SLUGS } from '@/lib/wordpress/queries';
import { PageResponse, AllPagesSlugsResponse } from '@/lib/wordpress/types';
import PageContent from '@/components/pages/PageContent';

/**
 * Dynamic page route for WordPress pages
 * Implements generateStaticParams for SSG and generateMetadata for SEO
 * Requirements: 4.1, 4.3, 4.4
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Reserved slugs that should not be handled by this route
const RESERVED_SLUGS = ['blog', 'api', 'category', 'tag'];

/**
 * Generate static params for all pages at build time
 */
export async function generateStaticParams() {
  try {
    const data = await fetchGraphQL<AllPagesSlugsResponse>(
      GET_ALL_PAGES_SLUGS,
      undefined,
      { revalidate: 3600 }
    );
    
    return data.pages.nodes
      .filter(page => !RESERVED_SLUGS.includes(page.slug))
      .map((page) => ({
        slug: page.slug,
      }));
  } catch (error) {
    console.error('Failed to generate static params for pages:', error);
    return [];
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Skip reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return { title: 'Page Not Found' };
  }
  
  try {
    const data = await fetchGraphQL<PageResponse>(
      GET_PAGE_BY_SLUG,
      { slug: `/${slug}/` },
      { tags: [`page-${slug}`], revalidate: 60 }
    );

    if (!data.page) {
      return { title: 'Page Not Found' };
    }

    const { seo, title, featuredImage } = data.page;

    return {
      title: seo?.title || title,
      description: seo?.metaDesc,
      openGraph: {
        title: seo?.opengraphTitle || title,
        description: seo?.opengraphDescription || seo?.metaDesc,
        type: 'website',
        images: seo?.opengraphImage?.sourceUrl
          ? [{ url: seo.opengraphImage.sourceUrl }]
          : featuredImage?.node?.sourceUrl
          ? [{ url: featuredImage.node.sourceUrl }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.twitterTitle || seo?.opengraphTitle || title,
        description: seo?.twitterDescription || seo?.opengraphDescription || seo?.metaDesc,
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata for page:', error);
    return { title: 'Page' };
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  // Skip reserved slugs - let other routes handle them
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  let page;
  try {
    const data = await fetchGraphQL<PageResponse>(
      GET_PAGE_BY_SLUG,
      { slug: `/${slug}/` },
      { tags: [`page-${slug}`], revalidate: 60 }
    );
    page = data.page;
  } catch (error) {
    console.error('Failed to fetch page:', error);
    notFound();
  }

  if (!page) {
    notFound();
  }

  return <PageContent page={page} />;
}
