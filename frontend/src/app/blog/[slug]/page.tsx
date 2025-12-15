import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_POST_BY_SLUG, GET_ALL_POSTS_SLUGS } from '@/lib/wordpress/queries';
import { PostResponse, AllPostsSlugsResponse } from '@/lib/wordpress/types';
import PostContent from '@/components/posts/PostContent';

/**
 * Single post page with dynamic routing
 * Implements generateStaticParams for SSG and generateMetadata for SEO
 * Requirements: 3.2, 3.4, 9.1
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all posts at build time
 */
export async function generateStaticParams() {
  try {
    const data = await fetchGraphQL<AllPostsSlugsResponse>(
      GET_ALL_POSTS_SLUGS,
      undefined,
      { revalidate: 3600 }
    );
    return data.posts.nodes.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const data = await fetchGraphQL<PostResponse>(
      GET_POST_BY_SLUG,
      { slug },
      { tags: [`post-${slug}`], revalidate: 60 }
    );

    if (!data.post) {
      return { title: 'Post Not Found' };
    }


    const { seo, title, featuredImage, excerpt } = data.post;

    return {
      title: seo?.title || title,
      description: seo?.metaDesc || excerpt?.replace(/<[^>]*>/g, '').slice(0, 160),
      openGraph: {
        title: seo?.opengraphTitle || title,
        description: seo?.opengraphDescription || seo?.metaDesc,
        type: 'article',
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
    console.error('Failed to generate metadata:', error);
    return { title: 'Blog Post' };
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    const data = await fetchGraphQL<PostResponse>(
      GET_POST_BY_SLUG,
      { slug },
      { tags: [`post-${slug}`], revalidate: 60 }
    );
    post = data.post;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    notFound();
  }

  if (!post) {
    notFound();
  }

  return <PostContent post={post} />;
}
