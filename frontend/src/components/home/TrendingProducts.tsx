import ProductCard, { Product } from './ProductCard';

interface TrendingProductsProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

export default function TrendingProducts({ title, products, viewAllLink }: TrendingProductsProps) {
  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          {viewAllLink && (
            <a
              href={viewAllLink}
              className="text-[#0d4f4f] hover:underline font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showBrand />
          ))}
        </div>
      </div>
    </section>
  );
}
