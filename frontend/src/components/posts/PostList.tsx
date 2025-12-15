'use client';

import { useState } from 'react';
import { WPPost, PageInfo } from '@/lib/wordpress/types';
import PostCard from './PostCard';

/**
 * PostList component displays a list of posts with cursor-based pagination
 * Requirements: 3.1
 */
export interface PostListProps {
  initialPosts: WPPost[];
  initialPageInfo: PageInfo;
  onLoadMore?: (cursor: string) => Promise<{ posts: WPPost[]; pageInfo: PageInfo }>;
}

export default function PostList({ initialPosts, initialPageInfo, onLoadMore }: PostListProps) {
  const [posts, setPosts] = useState<WPPost[]>(initialPosts);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor || !onLoadMore) return;

    setIsLoading(true);
    try {
      const result = await onLoadMore(pageInfo.endCursor);
      setPosts((prev) => [...prev, ...result.posts]);
      setPageInfo(result.pageInfo);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No posts found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {pageInfo.hasNextPage && onLoadMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
