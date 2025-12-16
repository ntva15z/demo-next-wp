import {
  HeroBanner,
  TrendingProducts,
  DealsOfTheDay,
  OfferBanners,
  CategoryGrid,
  Testimonials,
  FeaturedBlogs,
} from '@/components/home';
import type { Product } from '@/components/home';

/**
 * Homepage - E-commerce fashion store
 * Based on Figma design - Globex theme
 */

// Mock data - Replace with actual API calls to WordPress/WooCommerce
const heroData = {
  title: 'PRADA',
  subtitle: 'Big Fashion Festival',
  discount: '50% - 80% off',
  backgroundImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80',
};

const trendingProducts: Product[] = [
  {
    id: '1',
    name: 'Women Textured Handheld Bag',
    slug: 'women-textured-handheld-bag',
    price: 29.99,
    originalPrice: 59.99,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
    brand: 'Zara',
    discount: 50,
  },
  {
    id: '2',
    name: 'Womens Casual Wear Dress',
    slug: 'womens-casual-wear-dress',
    price: 45.00,
    originalPrice: 75.00,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
    brand: 'H&M',
    discount: 40,
  },
  {
    id: '3',
    name: 'Floral Print Wrap Dress',
    slug: 'floral-print-wrap-dress',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
    brand: 'Mango',
  },
  {
    id: '4',
    name: 'Women Red Solid Top',
    slug: 'women-red-solid-top',
    price: 25.00,
    originalPrice: 40.00,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
    brand: 'Forever 21',
    discount: 38,
  },
  {
    id: '5',
    name: 'Classic Denim Jacket',
    slug: 'classic-denim-jacket',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    brand: "Levi's",
  },
];

const dealsProducts: Product[] = [
  {
    id: '6',
    name: 'Best of Styles',
    slug: 'levis-best-styles-1',
    price: 19.99,
    originalPrice: 39.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    brand: "Levi's",
  },
  {
    id: '7',
    name: 'Best of Styles',
    slug: 'levis-best-styles-2',
    price: 24.99,
    originalPrice: 49.99,
    image: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&q=80',
    brand: "Levi's",
  },
  {
    id: '8',
    name: 'Best of Styles',
    slug: 'levis-best-styles-3',
    price: 29.99,
    originalPrice: 59.99,
    image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&q=80',
    brand: "Levi's",
  },
];

const offerBanners = [
  {
    id: '1',
    brand: "Levi's",
    discount: 'Min 60% off',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    link: '/shop/levis',
    bgColor: '#f5f0e8',
  },
  {
    id: '2',
    brand: 'Forever 21',
    discount: 'Min 50% off',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    link: '/shop/forever21',
    bgColor: '#e8f0f5',
  },
];

const categories = [
  {
    id: '1',
    name: 'Women',
    slug: 'women',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
  },
  {
    id: '2',
    name: 'Men',
    slug: 'men',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
  {
    id: '3',
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=400&q=80',
  },
  {
    id: '4',
    name: 'Footwear',
    slug: 'footwear',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80',
  },
];

const testimonials = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    rating: 5,
    comment: 'Amazing quality and fast shipping! The dress fits perfectly and looks exactly like the photos. Will definitely shop here again.',
    date: 'Dec 10, 2025',
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    rating: 5,
    comment: 'Great customer service and the products are top-notch. The return process was smooth when I needed to exchange sizes.',
    date: 'Dec 8, 2025',
  },
  {
    id: '3',
    name: 'Emily Davis',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    rating: 4,
    comment: 'Love the variety of styles available. Found some unique pieces that I couldnt find anywhere else. Highly recommend!',
    date: 'Dec 5, 2025',
  },
];

const blogPosts = [
  {
    id: '1',
    title: 'Top 10 Fashion Trends for Winter 2025',
    slug: 'top-10-fashion-trends-winter-2025',
    excerpt: 'Discover the hottest fashion trends that will dominate this winter season.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    category: 'Fashion',
    date: 'Dec 15, 2025',
  },
  {
    id: '2',
    title: 'How to Style Your Denim Jacket',
    slug: 'how-to-style-denim-jacket',
    excerpt: 'Learn different ways to wear your favorite denim jacket for any occasion.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    category: 'Style Guide',
    date: 'Dec 12, 2025',
  },
  {
    id: '3',
    title: 'Sustainable Fashion: A Complete Guide',
    slug: 'sustainable-fashion-guide',
    excerpt: 'Everything you need to know about making eco-friendly fashion choices.',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
    category: 'Sustainability',
    date: 'Dec 10, 2025',
  },
  {
    id: '4',
    title: 'Accessorizing 101: Elevate Your Look',
    slug: 'accessorizing-101',
    excerpt: 'Master the art of accessorizing to transform any outfit from basic to stunning.',
    image: 'https://images.unsplash.com/photo-1611923134239-b9be5816e23c?w=400&q=80',
    category: 'Accessories',
    date: 'Dec 8, 2025',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <HeroBanner
        title={heroData.title}
        subtitle={heroData.subtitle}
        discount={heroData.discount}
        backgroundImage={heroData.backgroundImage}
        ctaLink="/shop"
        ctaText="Shop Now"
      />

      {/* Trending Now */}
      <TrendingProducts
        title="Trending Now"
        products={trendingProducts}
        viewAllLink="/shop/trending"
      />

      {/* Deals of the Day */}
      <DealsOfTheDay
        title="Deals of the Day"
        products={dealsProducts}
      />

      {/* Trending Offers */}
      <OfferBanners
        title="Trending Offers"
        banners={offerBanners}
      />

      {/* Secondary Hero Banner */}
      <HeroBanner
        title="FOREVER 21"
        subtitle="Big Fashion Festival"
        discount="50% - 80% off"
        backgroundImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80"
        ctaLink="/shop/forever21"
        ctaText="Explore Collection"
        variant="dark"
      />

      {/* Shop by Categories */}
      <CategoryGrid
        title="Shop by Categories"
        categories={categories}
      />

      {/* Testimonials */}
      <Testimonials
        title="What Our Customers Says"
        testimonials={testimonials}
      />

      {/* Featured Blogs */}
      <FeaturedBlogs
        title="Featured Blogs"
        posts={blogPosts}
        viewAllLink="/blog"
      />
    </div>
  );
}
