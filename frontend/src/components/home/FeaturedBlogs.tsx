import Image from 'next/image';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category?: string;
  date: string;
}

interface FeaturedBlogsProps {
  title: string;
  posts: BlogPost[];
  viewAllLink?: string;
}

export default function FeaturedBlogs({ title, posts, viewAllLink }: FeaturedBlogsProps) {
  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-[#0d4f4f] hover:underline font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              
              {post.category && (
                <span className="inline-block text-xs font-medium text-[#0d4f4f] uppercase tracking-wide mb-2">
                  {post.category}
                </span>
              )}
              
              <h3 className="font-semibold text-gray-900 group-hover:text-[#0d4f4f] transition-colors line-clamp-2 mb-2">
                {post.title}
              </h3>
              
              <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
              
              <p className="text-xs text-gray-400 mt-2">{post.date}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
