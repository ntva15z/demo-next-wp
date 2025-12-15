import Image from 'next/image';
import { WPPage, WPPageWithACF, ACFFieldGroup } from '@/lib/wordpress/types';

/**
 * PageContent component displays WordPress page content
 * Supports ACF custom fields rendering
 * Requirements: 4.1, 4.2
 */
export interface PageContentProps {
  page: WPPage | WPPageWithACF;
}

/**
 * Type guard to check if page has ACF fields
 */
export function hasACFFields(page: WPPage | WPPageWithACF): page is WPPageWithACF {
  return 'acfFields' in page && page.acfFields !== undefined;
}

/**
 * Renders ACF field value based on its type
 */
export function renderACFFieldValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    // Check if it's HTML content
    if (value.includes('<') && value.includes('>')) {
      return (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }
    return <p className="text-gray-700">{value}</p>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className="text-gray-700">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, index) => (
          <li key={index} className="text-gray-700">
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    // Handle image objects from ACF
    if ('url' in value && typeof (value as Record<string, unknown>).url === 'string') {
      const imgObj = value as { url: string; alt?: string; width?: number; height?: number };
      return (
        <Image
          src={imgObj.url}
          alt={imgObj.alt || ''}
          width={imgObj.width || 800}
          height={imgObj.height || 600}
          className="rounded-lg"
        />
      );
    }
    // Fallback for other objects
    return <pre className="text-sm bg-gray-100 p-4 rounded">{JSON.stringify(value, null, 2)}</pre>;
  }

  return null;
}

/**
 * Renders ACF custom fields section
 */
export function ACFFieldsRenderer({ fields }: { fields: ACFFieldGroup }) {
  const entries = Object.entries(fields);
  
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
      <div className="space-y-6">
        {entries.map(([key, value]) => (
          <div key={key} className="acf-field">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 capitalize">
              {key.replace(/_/g, ' ')}
            </h3>
            {renderACFFieldValue(value)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PageContent({ page }: PageContentProps) {
  const { title, content, featuredImage } = page;

  const imageUrl = featuredImage?.node?.sourceUrl;
  const imageAlt = featuredImage?.node?.altText || title;
  const imageWidth = featuredImage?.node?.mediaDetails?.width || 1200;
  const imageHeight = featuredImage?.node?.mediaDetails?.height || 630;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          {title}
        </h1>
      </header>

      {/* Featured Image */}
      {imageUrl && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className="object-cover w-full h-full"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>
      )}

      {/* Main Content */}
      {content && (
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {/* ACF Custom Fields */}
      {hasACFFields(page) && page.acfFields && (
        <ACFFieldsRenderer fields={page.acfFields} />
      )}
    </article>
  );
}
