import Image from 'next/image';
import Link from 'next/link';
import { WPPost, WPCategory, WPTag } from '@/lib/wordpress/types';
import { formatDate } from './PostCard';

/**
 * PostContent component displays full post content with categories and tags
 * Renders HTML content safely and displays taxonomy links
 * Requirements: 3.2, 3.3
 */
export interface PostContentProps {
  post: WPPost;
}

/**
 * Generates a link URL for a category
 */
export function getCategoryUrl(category: WPCategory): string {
  return `/category/${category.slug}`;
}

/**
 * Generates a link URL for a tag
 */
export function getTagUrl(tag: WPTag): string {
  return `/tag/${tag.slug}`;
}

export default function PostContent({ post }: PostContentProps) {
  const {
    title,
    content,
    date,
    modified,
    featuredImage,
    categories,
    tags,
    author,
  } = post;

  const imageUrl = featuredImage?.node?.sourceUrl;
  const imageAlt = featuredImage?.node?.altText || title;
  const imageWidth = featuredImage?.node?.mediaDetails?.width || 1200;
  const imageHeight = featuredImage?.node?.mediaDetails?.height || 630;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <time dateTime={date} className="text-sm">
            Published: {formatDate(date)}
          </time>
          {modified && modified !== date && (
            <time dateTime={modified} className="text-sm">
              Updated: {formatDate(modified)}
            </time>
          )}
          {author?.node && (
            <span className="text-sm">
              By <span className="font-medium">{author.node.name}</span>
            </span>
          )}
        </div>

        {/* Categories */}
        {categories?.nodes && categories.nodes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.nodes.map((category) => (
              <Link
                key={category.id}
                href={getCategoryUrl(category)}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {imageUrl && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className="object-cover w-full h-full"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>
      )}

      {/* Content */}
      {content && (
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}


      {/* Tags */}
      {tags?.nodes && tags.nodes.length > 0 && (
        <footer className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.nodes.map((tag) => (
              <Link
                key={tag.id}
                href={getTagUrl(tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
