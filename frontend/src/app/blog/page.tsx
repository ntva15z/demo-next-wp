import { Metadata } from 'next';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_POSTS } from '@/lib/wordpress/queries';
import { PostsResponse } from '@/lib/wordpress/types';
import PostList from '@/components/posts/PostList';

/**
 * Blog listing page - displays paginated list of posts
 * Uses ISR with 60 second revalidation
 * Requirements: 3.1, 3.5, 9.2
 */

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest blog posts and articles.',
};

async function getPosts() {
  try {
    const data = await fetchGraphQL<PostsResponse>(
      GET_POSTS,
      { first: 9 },
      { tags: ['posts'], revalidate: 60 }
    );
    return data;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return null;
  }
}

export default async function BlogPage() {
  const data = await getPosts();

  if (!data) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <p className="text-gray-500">Unable to load posts. Please try again later.</p>
      </main>
    );
  }

  const { posts } = data;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <PostList initialPosts={posts.nodes} initialPageInfo={posts.pageInfo} />
    </main>
  );
}
