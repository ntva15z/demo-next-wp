import Link from 'next/link';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_POSTS, GET_PAGES } from '@/lib/wordpress/queries';
import { PostsResponse, PagesResponse, WPPost, WPPage } from '@/lib/wordpress/types';
import PostCard from '@/components/posts/PostCard';
import Image from 'next/image';

/**
 * Homepage - displays featured content including recent posts and pages
 * Uses ISR with 60 second revalidation
 * Requirements: 3.1, 4.1
 */

export const revalidate = 60;

/**
 * Fetch recent posts for the homepage
 */
async function getRecentPosts(): Promise<WPPost[]> {
  try {
    const data = await fetchGraphQL<PostsResponse>(
      GET_POSTS,
      { first: 6 },
      { tags: ['posts'], revalidate: 60 }
    );
    return data.posts.nodes;
  } catch (error) {
    console.error('Failed to fetch recent posts:', error);
    return [];
  }
}

/**
 * Fetch featured pages for the homepage
 */
async function getFeaturedPages(): Promise<WPPage[]> {
  try {
    const data = await fetchGraphQL<PagesResponse>(
      GET_PAGES,
      { first: 4 },
      { tags: ['pages'], revalidate: 60 }
    );
    return data.pages.nodes;
  } catch (error) {
    console.error('Failed to fetch featured pages:', error);
    return [];
  }
}

/**
 * Page card component for displaying featured pages
 */
function PageCard({ page }: { page: WPPage }) {
  const { title, slug, uri, featuredImage } = page;
  const imageUrl = featuredImage?.node?.sourceUrl;
  const imageAlt = featuredImage?.node?.altText || title;

  // Use uri if available, otherwise construct from slug
  const pageUrl = uri || `/${slug}`;

  return (
    <Link
      href={pageUrl}
      className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {imageUrl ? (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-4xl font-bold opacity-50">
            {title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [recentPosts, featuredPages] = await Promise.all([
    getRecentPosts(),
    getFeaturedPages(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to Our Website
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover our latest content, insights, and stories powered by WordPress and NextJS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/blog"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Read Our Blog
            </Link>
            <Link
              href="/about"
              className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      {recentPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Recent Posts</h2>
              <Link
                href="/blog"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                View All
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Pages Section */}
      {featuredPages.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Explore Our Pages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State - when no content is available */}
      {recentPosts.length === 0 && featuredPages.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-500 text-lg">
              Content is being loaded. Please check back soon.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
