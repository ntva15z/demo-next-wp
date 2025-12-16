import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Content types that can be revalidated
 */
export type RevalidateContentType = 'post' | 'page' | 'menu' | 'product' | 'inventory' | 'order' | 'all';

/**
 * Request body for revalidation webhook
 */
export interface RevalidateRequestBody {
  type: RevalidateContentType;
  slug?: string;
  product_id?: number;
  order_id?: number;
  stock_status?: string;
  stock_quantity?: number;
  old_status?: string;
  new_status?: string;
  timestamp?: number;
}

/**
 * Response from revalidation endpoint
 */
export interface RevalidateResponse {
  revalidated: boolean;
  type: RevalidateContentType;
  slug?: string;
  timestamp: number;
  message?: string;
}

/**
 * Validates the webhook secret from request headers
 * @param request - The incoming request
 * @param expectedSecret - The expected secret value
 * @returns true if secret is valid, false otherwise
 */
export function validateWebhookSecret(
  secretHeader: string | null,
  expectedSecret: string
): boolean {
  if (!secretHeader) {
    return false;
  }
  return secretHeader === expectedSecret;
}

/**
 * Performs revalidation based on content type and optional slug
 * @param type - The type of content to revalidate
 * @param slug - Optional slug for specific content
 * @returns Object containing revalidated tags and paths
 */
export function performRevalidation(
  type: RevalidateContentType,
  slug?: string
): { tags: string[]; paths: string[] } {
  const revalidatedTags: string[] = [];
  const revalidatedPaths: string[] = [];

  switch (type) {
    case 'post':
      revalidateTag('posts', 'max');
      revalidatedTags.push('posts');
      if (slug) {
        revalidateTag(`post-${slug}`, 'max');
        revalidatePath(`/blog/${slug}`);
        revalidatedTags.push(`post-${slug}`);
        revalidatedPaths.push(`/blog/${slug}`);
      }
      revalidatePath('/blog');
      revalidatedPaths.push('/blog');
      break;

    case 'page':
      revalidateTag('pages', 'max');
      revalidatedTags.push('pages');
      if (slug) {
        revalidateTag(`page-${slug}`, 'max');
        revalidatePath(`/${slug}`);
        revalidatedTags.push(`page-${slug}`);
        revalidatedPaths.push(`/${slug}`);
      }
      break;

    case 'menu':
      revalidateTag('menu', 'max');
      revalidatedTags.push('menu');
      break;

    case 'product':
      revalidateTag('products', 'max');
      revalidatedTags.push('products');
      if (slug) {
        revalidateTag(`product-${slug}`, 'max');
        revalidatePath(`/shop/${slug}`);
        revalidatedTags.push(`product-${slug}`);
        revalidatedPaths.push(`/shop/${slug}`);
      }
      revalidatePath('/shop');
      revalidatedPaths.push('/shop');
      break;

    case 'inventory':
      revalidateTag('products', 'max');
      revalidateTag('inventory', 'max');
      revalidatedTags.push('products', 'inventory');
      if (slug) {
        revalidateTag(`product-${slug}`, 'max');
        revalidatePath(`/shop/${slug}`);
        revalidatedTags.push(`product-${slug}`);
        revalidatedPaths.push(`/shop/${slug}`);
      }
      revalidatePath('/shop');
      revalidatedPaths.push('/shop');
      break;

    case 'order':
      revalidateTag('orders', 'max');
      revalidatedTags.push('orders');
      revalidatePath('/account/orders');
      revalidatedPaths.push('/account/orders');
      break;

    case 'all':
    default:
      revalidateTag('posts', 'max');
      revalidateTag('pages', 'max');
      revalidateTag('menu', 'max');
      revalidateTag('products', 'max');
      revalidateTag('inventory', 'max');
      revalidateTag('orders', 'max');
      revalidatedTags.push('posts', 'pages', 'menu', 'products', 'inventory', 'orders');
      break;
  }

  return { tags: revalidatedTags, paths: revalidatedPaths };
}

/**
 * POST handler for revalidation webhook
 * 
 * Validates the webhook secret and triggers cache revalidation
 * for the specified content type.
 * 
 * @param request - The incoming request
 * @returns JSON response with revalidation status
 */
export async function POST(request: NextRequest): Promise<NextResponse<RevalidateResponse | { message: string }>> {
  const secret = request.headers.get('x-revalidate-secret');
  const expectedSecret = process.env.REVALIDATE_SECRET;

  // Validate secret
  if (!expectedSecret) {
    console.error('REVALIDATE_SECRET environment variable is not set');
    return NextResponse.json(
      { message: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!validateWebhookSecret(secret, expectedSecret)) {
    console.warn('Revalidation request with invalid secret');
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    );
  }

  try {
    const body: RevalidateRequestBody = await request.json();
    const { type, slug } = body;

    // Validate content type
    const validTypes: RevalidateContentType[] = ['post', 'page', 'menu', 'product', 'inventory', 'order', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: `Invalid content type: ${type}` },
        { status: 400 }
      );
    }

    // Perform revalidation
    const { tags, paths } = performRevalidation(type, slug);

    console.log(`Revalidated: type=${type}, slug=${slug || 'none'}, tags=[${tags.join(', ')}], paths=[${paths.join(', ')}]`);

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { message: 'Error processing revalidation request' },
      { status: 500 }
    );
  }
}
