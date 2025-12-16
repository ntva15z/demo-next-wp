/**
 * Single blog post loading state
 * Displays skeleton UI while post content is being fetched
 * Requirements: 9.4 - Achieve good Lighthouse performance score
 */
export default function PostLoading() {
  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back link skeleton */}
      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      
      {/* Title skeleton */}
      <div className="h-10 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4 mb-6" />
      
      {/* Meta info skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
      
      {/* Featured image skeleton */}
      <div className="h-96 bg-gray-200 rounded-lg animate-pulse mb-8" />
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" />
        
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mt-8" />
        
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
      </div>
      
      {/* Categories/Tags skeleton */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-8 w-20 bg-gray-100 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    </article>
  );
}
