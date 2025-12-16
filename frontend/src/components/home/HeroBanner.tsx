import Image from 'next/image';
import Link from 'next/link';

interface HeroBannerProps {
  title: string;
  subtitle: string;
  discount?: string;
  backgroundImage: string;
  ctaLink?: string;
  ctaText?: string;
  variant?: 'light' | 'dark';
}

export default function HeroBanner({
  title,
  subtitle,
  discount,
  backgroundImage,
  ctaLink = '/shop',
  ctaText = 'Shop Now',
  variant = 'light',
}: HeroBannerProps) {
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-white';
  
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      <Image
        src={backgroundImage}
        alt={title}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold ${textColor} mb-4`}>
            {title}
          </h1>
          <p className={`text-lg md:text-xl ${textColor} mb-2`}>
            {subtitle}
          </p>
          {discount && (
            <p className={`text-xl md:text-2xl font-semibold ${textColor} mb-6`}>
              {discount}
            </p>
          )}
          <Link
            href={ctaLink}
            className="inline-block px-8 py-3 bg-[#0d4f4f] text-white font-semibold rounded hover:bg-[#0a3d3d] transition-colors"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
