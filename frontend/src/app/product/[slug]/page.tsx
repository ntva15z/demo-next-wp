'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ProductGallery,
  ProductInfo,
  ProductTabs,
  RelatedProducts,
} from '@/components/product';

/**
 * Product Detail Page
 * Based on Figma design - Globex theme
 */

// Mock product data - Replace with actual API call
const mockProduct = {
  id: '1',
  name: 'Womens Denim Jacket (Blue)',
  slug: 'womens-denim-jacket-blue',
  brand: 'Brand Name',
  seller: 'Sellers Name',
  price: 700,
  originalPrice: 1000,
  discount: 30,
  rating: 4.4,
  reviewCount: 56,
  images: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
  ],
  sizes: [
    { id: 's1', name: 'XS', value: 'XS', available: false },
    { id: 's2', name: 'S', value: 'S', available: true },
    { id: 's3', name: 'M', value: 'M', available: true },
    { id: 's4', name: 'L', value: 'L', available: true },
    { id: 's5', name: 'XL', value: 'XL', available: true },
  ],
  colors: [
    { id: 'c1', name: 'Blue', value: '#3b82f6' },
    { id: 'c2', name: 'Black', value: '#1f2937' },
    { id: 'c3', name: 'Light Blue', value: '#93c5fd' },
    { id: 'c4', name: 'White', value: '#f9fafb' },
  ],
  offers: [
    { title: 'Special offer', description: 'get 25% off', link: '#' },
    { title: 'Bank offer', description: 'get 30% off on Axis Bank Credit card', link: '#' },
    { title: 'Wallet offer', description: 'get 40% cashback via Paytm wallet on first transaction', link: '#' },
    { title: 'Special offer', description: 'get 25% off', link: '#' },
  ],
  description: 'Blue washed jacket, has a spread collar, 4 pockets, button closure, long sleeves, straight hem',
  sizeAndFit: 'The model (height 5\'8") is wearing a size S',
  materialAndCare: ['100% cotton', 'Machine Wash'],
  specifications: {
    'Fabric': '100% Cotton',
    'Fit': 'Regular Fit',
    'Wash Care': 'Machine Wash',
    'Pattern': 'Solid',
    'Sleeve Length': 'Long Sleeves',
    'Collar': 'Spread Collar',
  },
  reviews: [
    {
      id: 'r1',
      author: 'Sarah M.',
      rating: 5,
      date: 'Dec 10, 2025',
      comment: 'Amazing quality! The jacket fits perfectly and looks exactly like the photos.',
    },
    {
      id: 'r2',
      author: 'John D.',
      rating: 4,
      date: 'Dec 8, 2025',
      comment: 'Great jacket, comfortable material. Slightly larger than expected but still good.',
    },
  ],
};

const similarProducts = [
  {
    id: '2',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-2',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
  },
  {
    id: '3',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-3',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
  },
  {
    id: '4',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-4',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&q=80',
  },
  {
    id: '5',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-5',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
  },
  {
    id: '6',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-6',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
  },
];

const customerAlsoLike = [
  {
    id: '7',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-7',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  },
  {
    id: '8',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-8',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80',
  },
  {
    id: '9',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-9',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
  },
  {
    id: '10',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-10',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80',
  },
  {
    id: '11',
    name: 'Womens Denim Jacket',
    slug: 'womens-denim-jacket-11',
    brand: 'Brand Name',
    price: 700,
    originalPrice: 1000,
    discount: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&q=80',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // In real app, fetch product by slug
  const product = mockProduct;

  const handleAddToCart = (size: string, color: string, quantity: number) => {
    console.log('Add to cart:', { slug, size, color, quantity });
    // TODO: Implement cart functionality
    alert(`Added to cart: ${product.name} - Size: ${size}, Color: ${color}, Qty: ${quantity}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-[#0d4f4f]">Home</Link></li>
            <li>/</li>
            <li><Link href="/shop" className="hover:text-[#0d4f4f]">Shop</Link></li>
            <li>/</li>
            <li><Link href="/category/women" className="hover:text-[#0d4f4f]">Women</Link></li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery
            images={product.images}
            productName={product.name}
          />

          {/* Product Info */}
          <ProductInfo
            name={product.name}
            brand={product.brand}
            seller={product.seller}
            price={product.price}
            originalPrice={product.originalPrice}
            discount={product.discount}
            rating={product.rating}
            reviewCount={product.reviewCount}
            sizes={product.sizes}
            colors={product.colors}
            offers={product.offers}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Product Tabs */}
        <ProductTabs
          description={product.description}
          specifications={product.specifications}
          sizeAndFit={product.sizeAndFit}
          materialAndCare={product.materialAndCare}
          reviews={product.reviews}
        />

        {/* Similar Products */}
        <RelatedProducts
          title="Similar Products"
          products={similarProducts}
        />

        {/* Customer Also Like */}
        <RelatedProducts
          title="Customer Also Like"
          products={customerAlsoLike}
        />
      </div>
    </div>
  );
}
