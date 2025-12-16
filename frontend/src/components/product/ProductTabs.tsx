'use client';

import { useState } from 'react';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
}

interface ProductTabsProps {
  description: string;
  specifications?: Record<string, string>;
  sizeAndFit?: string;
  materialAndCare?: string[];
  reviews?: Review[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductTabs({
  description,
  specifications,
  sizeAndFit,
  materialAndCare,
  reviews = [],
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Product Details' },
    { id: 'specifications', label: 'Specification' },
    { id: 'reviews', label: 'Ratings & Reviews' },
  ];

  return (
    <div className="border-t border-gray-200 mt-8 pt-8">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#0d4f4f]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d4f4f]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Product Details</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>

            {sizeAndFit && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Size & Fit</h3>
                <p className="text-gray-600 text-sm">{sizeAndFit}</p>
              </div>
            )}

            {materialAndCare && materialAndCare.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Material & Care</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  {materialAndCare.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specifications' && specifications && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-gray-500 text-sm w-32">{key}</span>
                <span className="text-gray-900 text-sm">{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {review.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.author}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-gray-400 text-sm">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
