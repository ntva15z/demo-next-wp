/**
 * Blog listing page loading state
 * Displays skeleton UI while posts are being fetched
 * Requirements: 9.4 - Achieve good Lighthouse performance score
 */
export default function BlogLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page title skeleton */}
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-8" />
      
      {/* Post cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Featured image skeleton */}
            <div className="h-48 bg-gray-200 animate-pulse" />
            
            <div className="p-4">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
              
              {/* Excerpt skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              </div>
              
              {/* Meta skeleton */}
              <div className="mt-4 flex items-center gap-4">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
