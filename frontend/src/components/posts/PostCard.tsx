import Link from 'next/link';
import Image from 'next/image';
import { WPPost } from '@/lib/wordpress/types';

/**
 * PostCard component displays a single post in a card format
 * Shows title, excerpt, featured image, and publication date
 * Requirements: 3.1
 */
export interface PostCardProps {
  post: WPPost;
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Strips HTML tags from a string and truncates to a maximum length
 */
export function stripHtmlAndTruncate(html: string | undefined, maxLength: number = 150): string {
  if (!html) return '';
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
}

export default function PostCard({ post }: PostCardProps) {
  const { title, slug, excerpt, date, featuredImage } = post;
  const imageUrl = featuredImage?.node?.sourceUrl;
  const imageAlt = featuredImage?.node?.altText || title;
  const imageWidth = featuredImage?.node?.mediaDetails?.width || 800;
  const imageHeight = featuredImage?.node?.mediaDetails?.height || 450;

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/blog/${slug}`} className="block">
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {title}
          </h2>
          {excerpt && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {stripHtmlAndTruncate(excerpt)}
            </p>
          )}
          <time dateTime={date} className="text-sm text-gray-500">
            {formatDate(date)}
          </time>
        </div>
      </Link>
    </article>
  );
}
