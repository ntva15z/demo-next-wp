import Image from 'next/image';
import Link from 'next/link';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand?: string;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  showBrand?: boolean;
}

export default function ProductCard({ product, showBrand = false }: ProductCardProps) {
  const { name, slug, price, originalPrice, image, brand, discount } = product;
  
  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount && discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
      </div>
      
      {showBrand && brand && (
        <span className="text-xs text-gray-500 uppercase tracking-wide">{brand}</span>
      )}
      
      <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#0d4f4f] transition-colors line-clamp-2 mb-1">
        {name}
      </h3>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">
          ${price.toFixed(2)}
        </span>
        {originalPrice && originalPrice > price && (
          <span className="text-sm text-gray-400 line-through">
            ${originalPrice.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}
