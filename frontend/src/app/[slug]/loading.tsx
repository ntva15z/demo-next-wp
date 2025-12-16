/**
 * Dynamic page loading state
 * Displays skeleton UI while page content is being fetched
 * Requirements: 9.4 - Achieve good Lighthouse performance score
 */
export default function PageLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Title skeleton */}
      <div className="h-12 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-12 bg-gray-200 rounded animate-pulse w-2/3 mb-8" />
      
      {/* Featured image skeleton (optional) */}
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse mb-8" />
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" />
        
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4 mt-8" />
        
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mt-8" />
        
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}
