import Image from 'next/image';
import Link from 'next/link';

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  image: string;
}

interface ProductGridProps {
  products: ShopProduct[];
  viewMode?: 'grid' | 'list';
}

function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.discount && product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{product.discount}%
          </span>
        )}
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-[#0d4f4f] transition-colors">
        {product.name}
      </h3>

      <p className="text-gray-500 text-xs mb-1">{product.brand}</p>

      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs text-gray-600">{product.rating}</span>
        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">
          Rs. {product.price.toLocaleString()}
        </span>
        {product.originalPrice && (
          <>
            <span className="text-gray-400 text-xs line-through">
              Rs. {product.originalPrice.toLocaleString()}
            </span>
            {product.discount && (
              <span className="text-green-600 text-xs">({product.discount}% off)</span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

export default function ProductGrid({ products, viewMode = 'grid' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
          : 'space-y-4'
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
