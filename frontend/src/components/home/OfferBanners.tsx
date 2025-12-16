import Image from 'next/image';
import Link from 'next/link';

interface OfferBanner {
  id: string;
  brand: string;
  discount: string;
  image: string;
  link: string;
  bgColor?: string;
}

interface OfferBannersProps {
  title: string;
  banners: OfferBanner[];
}

export default function OfferBanners({ title, banners }: OfferBannersProps) {
  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.link}
              className="group relative overflow-hidden rounded-lg h-[200px] md:h-[250px]"
              style={{ backgroundColor: banner.bgColor || '#f5f0e8' }}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-1/2 p-6 md:p-8">
                  <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-3">
                    {banner.brand}
                  </span>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {banner.discount}
                  </p>
                </div>
                <div className="w-1/2 h-full relative">
                  <Image
                    src={banner.image}
                    alt={banner.brand}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
