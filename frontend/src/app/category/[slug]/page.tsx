'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProductFilters, ProductGrid, SortDropdown } from '@/components/shop';
import type { ShopProduct } from '@/components/shop';

/**
 * Category Page - Dynamic route for product categories
 * Based on Figma design - Globex theme
 */

// Mock category data
const categoryData: Record<string, { name: string; description: string }> = {
  women: { name: 'Women', description: 'Explore our collection of women\'s fashion' },
  men: { name: 'Men', description: 'Discover the latest in men\'s fashion' },
  kids: { name: 'Kids', description: 'Adorable styles for your little ones' },
  accessories: { name: 'Accessories', description: 'Complete your look with our accessories' },
  footwear: { name: 'Footwear', description: 'Step out in style' },
};

// Mock filter data
const filterSections = [
  {
    id: 'brand',
    title: 'Brand',
    type: 'checkbox' as const,
    options: [
      { id: 'tokyo-talkies', label: 'Tokyo Talkies', count: 206 },
      { id: 'roadster', label: 'Roadster', count: 178 },
      { id: 'here-now', label: 'Here&Now', count: 756 },
      { id: 'high-star', label: 'High Star', count: 65 },
      { id: 'miss-chase', label: 'Miss Chase', count: 88 },
      { id: 'voxati', label: 'Voxati', count: 201 },
    ],
    expanded: true,
  },
  {
    id: 'price',
    title: 'Price',
    type: 'checkbox' as const,
    options: [
      { id: 'under-500', label: 'Rs. 100 to Rs. 500', count: 206 },
      { id: '500-1000', label: 'Rs. 500 to Rs. 1000', count: 2020 },
      { id: '1000-1500', label: 'Rs. 1000 to Rs. 1500', count: 206 },
      { id: '1500-2000', label: 'Rs. 1500 to Rs. 2000', count: 206 },
    ],
    expanded: true,
  },
  {
    id: 'color',
    title: 'Color',
    type: 'checkbox' as const,
    options: [
      { id: 'blue', label: 'Blue', count: 100 },
      { id: 'black', label: 'Black', count: 100 },
      { id: 'white', label: 'White', count: 100 },
      { id: 'red', label: 'Red', count: 100 },
    ],
    expanded: true,
  },
  {
    id: 'discount',
    title: 'Discount Range',
    type: 'checkbox' as const,
    options: [
      { id: '10-above', label: '10% and above', count: 65 },
      { id: '20-above', label: '20% and above', count: 85 },
      { id: '30-above', label: '30% and above', count: 76 },
      { id: '40-above', label: '40% and above', count: 100 },
    ],
    expanded: true,
  },
];

const sortOptions = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
  { id: 'rating', label: 'Customer Rating' },
];

// Mock products
const mockProducts: ShopProduct[] = Array.from({ length: 12 }, (_, i) => ({
  id: `cat-product-${i + 1}`,
  name: 'Womens Denim Jacket',
  slug: `womens-denim-jacket-cat-${i + 1}`,
  brand: 'Brand Name',
  price: 700,
  originalPrice: 1000,
  discount: 30,
  rating: 4.4,
  image: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  ][i % 4],
}));

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const category = categoryData[slug] || { name: slug, description: '' };

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: values,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-[#0d4f4f]">Home</Link></li>
            <li>/</li>
            <li><Link href="/shop" className="hover:text-[#0d4f4f]">Shop</Link></li>
            <li>/</li>
            <li className="text-gray-900">{category.name}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{mockProducts.length} products found</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm">Filters</span>
            </button>

            <SortDropdown
              options={sortOptions}
              selected={sortBy}
              onSelect={setSortBy}
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <div className="hidden lg:block">
            <ProductFilters
              filters={filterSections}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Products */}
          <div className="flex-1">
            <ProductGrid products={mockProducts} />

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <nav className="flex items-center gap-2">
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50" disabled>
                  Previous
                </button>
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    className={`w-10 h-10 text-sm rounded-lg ${
                      page === 1
                        ? 'bg-[#0d4f4f] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <ProductFilters
                  filters={filterSections}
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onClearAll={handleClearAll}
                />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-[#0d4f4f] text-white py-3 rounded-lg font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
