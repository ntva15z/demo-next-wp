'use client';

import { useState } from 'react';

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  available?: boolean;
}

interface ProductOffer {
  title: string;
  description: string;
  link?: string;
}

interface ProductInfoProps {
  name: string;
  brand: string;
  seller?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  sizes: ProductVariant[];
  colors: ProductVariant[];
  offers?: ProductOffer[];
  onAddToCart: (size: string, color: string, quantity: number) => void;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-2">
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
      <span className="text-sm text-gray-600">{rating}</span>
      <span className="text-sm text-gray-400">|</span>
      <span className="text-sm text-gray-600">{reviewCount} Reviews</span>
    </div>
  );
}

export default function ProductInfo({
  name,
  brand,
  seller,
  price,
  originalPrice,
  discount,
  rating,
  reviewCount,
  sizes,
  colors,
  offers = [],
  onAddToCart,
}: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.value || '');
  const [quantity] = useState(1);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    onAddToCart(selectedSize, selectedColor, quantity);
  };

  return (
    <div className="space-y-6">
      {/* Title & Brand */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">{name}</h1>
        <p className="text-gray-500">
          {brand}
          {seller && <span className="text-gray-400"> · Sold by: {seller}</span>}
        </p>
      </div>

      {/* Rating */}
      <StarRating rating={rating} reviewCount={reviewCount} />

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-gray-900">Rs. {price.toLocaleString()}</span>
        {originalPrice && (
          <>
            <span className="text-lg text-gray-400 line-through">Rs. {originalPrice.toLocaleString()}</span>
            {discount && (
              <span className="text-green-600 font-medium">({discount}% off)</span>
            )}
          </>
        )}
      </div>

      {/* Size Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-900">Select Size</span>
          <button className="text-[#0d4f4f] text-sm hover:underline">Size Chart &gt;</button>
        </div>
        <div className="flex gap-3">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => size.available !== false && setSelectedSize(size.value)}
              disabled={size.available === false}
              className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors ${
                selectedSize === size.value
                  ? 'border-[#0d4f4f] bg-[#0d4f4f] text-white'
                  : size.available === false
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <span className="font-medium text-gray-900 block mb-3">Select Color</span>
        <div className="flex gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.value)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                selectedColor === color.value
                  ? 'border-[#0d4f4f] ring-2 ring-[#0d4f4f] ring-offset-2'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Best Offers */}
      {offers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Best Offers</h3>
          <ul className="space-y-2">
            {offers.map((offer, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600">•</span>
                <span className="text-gray-600">
                  <span className="font-medium">{offer.title}</span> {offer.description}
                  {offer.link && (
                    <a href={offer.link} className="text-[#0d4f4f] ml-1 hover:underline">T&C</a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add to Cart */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-[#0d4f4f] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0a3d3d] transition-colors"
        >
          Add to cart
        </button>
        <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
