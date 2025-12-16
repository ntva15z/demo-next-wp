import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
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

interface RelatedProductsProps {
  title: string;
  products: RelatedProduct[];
}

function ProductCard({ product }: { product: RelatedProduct }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-[200px]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="200px"
        />
      </div>
      
      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
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

export default function RelatedProducts({ title, products }: RelatedProductsProps) {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
