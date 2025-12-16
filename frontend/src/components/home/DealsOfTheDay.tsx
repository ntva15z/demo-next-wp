import Image from 'next/image';
import Link from 'next/link';
import { Product } from './ProductCard';

interface DealsOfTheDayProps {
  title: string;
  products: Product[];
}

export default function DealsOfTheDay({ title, products }: DealsOfTheDayProps) {
  return (
    <section className="py-12 px-4 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{title}</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Brand Logo */}
              {product.brand && (
                <div className="flex justify-center mb-3">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
                    {product.brand}
                  </span>
                </div>
              )}
              
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              
              {/* Product Info */}
              <h3 className="text-sm font-medium text-gray-900 text-center mb-2">
                {product.name}
              </h3>
              
              <div className="flex items-center justify-center gap-2">
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
