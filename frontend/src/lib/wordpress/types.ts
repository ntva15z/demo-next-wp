/**
 * WordPress GraphQL Types
 * Type definitions for WordPress data fetched via WPGraphQL
 */

// ============================================
// Media Types
// ============================================

export interface WPMediaDetails {
  width: number;
  height: number;
}

export interface WPImage {
  sourceUrl: string;
  altText: string;
  mediaDetails?: WPMediaDetails;
}

export interface WPFeaturedImage {
  node: WPImage;
}

// ============================================
// Taxonomy Types
// ============================================

export interface WPCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface WPTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface WPCategoryConnection {
  nodes: WPCategory[];
}

export interface WPTagConnection {
  nodes: WPTag[];
}

// ============================================
// SEO Types (Yoast SEO)
// ============================================

export interface WPSeo {
  title: string;
  metaDesc: string;
  opengraphTitle: string;
  opengraphDescription: string;
  opengraphImage?: {
    sourceUrl: string;
  };
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
  focusKeywords?: string[];
  metaRobotsNoindex?: string;
  metaRobotsNofollow?: string;
}


// ============================================
// Post Types
// ============================================

export interface WPPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  date: string;
  modified?: string;
  featuredImage?: WPFeaturedImage;
  categories?: WPCategoryConnection;
  tags?: WPTagConnection;
  seo?: WPSeo;
  author?: {
    node: WPAuthor;
  };
}

export interface WPAuthor {
  id: string;
  name: string;
  slug: string;
  avatar?: {
    url: string;
  };
  description?: string;
}

// ============================================
// Page Types
// ============================================

export interface WPPage {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  uri: string;
  content: string;
  featuredImage?: WPFeaturedImage;
  seo?: WPSeo;
  parent?: {
    node: {
      id: string;
      slug: string;
      title: string;
    };
  };
}

// ============================================
// Menu Types
// ============================================

export interface WPMenuItem {
  id: string;
  label: string;
  url: string;
  path: string;
  parentId: string | null;
  cssClasses?: string[];
  target?: string;
  order?: number;
}

export interface WPMenuItemWithChildren extends WPMenuItem {
  children: WPMenuItemWithChildren[];
}

export interface WPMenuItemConnection {
  nodes: WPMenuItem[];
}

// ============================================
// Pagination Types
// ============================================

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

// ============================================
// GraphQL Response Types
// ============================================

export interface PostsResponse {
  posts: {
    pageInfo: PageInfo;
    nodes: WPPost[];
  };
}

export interface PostResponse {
  post: WPPost | null;
}

export interface PagesResponse {
  pages: {
    pageInfo: PageInfo;
    nodes: WPPage[];
  };
}

export interface PageResponse {
  page: WPPage | null;
}

export interface MenuResponse {
  menuItems: WPMenuItemConnection;
}

export interface AllPostsSlugsResponse {
  posts: {
    nodes: Array<{ slug: string }>;
  };
}

export interface AllPagesSlugsResponse {
  pages: {
    nodes: Array<{ slug: string; uri: string }>;
  };
}

// ============================================
// ACF Custom Fields Types
// ============================================

export interface ACFFieldGroup {
  [key: string]: unknown;
}

export interface WPPageWithACF extends WPPage {
  acfFields?: ACFFieldGroup;
}

export interface WPPostWithACF extends WPPost {
  acfFields?: ACFFieldGroup;
}


// ============================================
// WooCommerce Types
// ============================================

export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER';
export type ProductType = 'SIMPLE' | 'VARIABLE' | 'GROUPED' | 'EXTERNAL';

export interface WooImage {
  sourceUrl: string;
  altText: string;
}

export interface WooAttribute {
  id: string;
  name: string;        // e.g., "Size"
  slug: string;        // e.g., "pa_size"
  options: string[];   // e.g., ["S", "M", "L"]
  variation: boolean;  // Used for variations
  visible: boolean;
}

export interface WooVariationAttribute {
  name: string;   // e.g., "pa_size"
  value: string;  // e.g., "M"
}

export interface WooVariation {
  id: string;
  databaseId: number;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  stockStatus: StockStatus;
  stockQuantity: number | null;
  attributes: WooVariationAttribute[];
  image: WooImage | null;
}

export interface WooCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  image: WooImage | null;
  parent: WooCategory | null;
  children: WooCategory[];
  count: number;
}

export interface WooProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  type: ProductType;
  description: string;
  shortDescription: string;
  sku: string;
  price: string;           // Formatted: "350,000₫"
  regularPrice: string;
  salePrice: string | null;
  onSale: boolean;
  stockStatus: StockStatus;
  stockQuantity: number | null;
  image: WooImage;
  galleryImages: WooImage[];
  categories: WooCategory[];
  attributes: WooAttribute[];
  variations?: WooVariation[];  // Only for variable products
  averageRating: number;
  reviewCount: number;
}


// ============================================
// WooCommerce Cart Types
// ============================================

export interface WooCartItem {
  key: string;
  product: {
    node: WooProduct;
  };
  variation: {
    node: WooVariation;
  } | null;
  quantity: number;
  subtotal: string;
  total: string;
}

export interface WooCoupon {
  code: string;
  discountAmount: string;
  discountType: string;
}

export interface WooShippingMethod {
  id: string;
  label: string;
  cost: string;
}

export interface WooCart {
  contents: {
    nodes: WooCartItem[];
  };
  subtotal: string;
  subtotalTax: string;
  shippingTotal: string;
  shippingTax: string;
  discountTotal: string;
  total: string;
  totalTax: string;
  appliedCoupons: {
    nodes: WooCoupon[];
  };
  chosenShippingMethods: string[];
  availableShippingMethods: WooShippingMethod[];
  // Custom fields added by theme
  formattedTotal?: string;
  formattedSubtotal?: string;
  itemCount?: number;
}

// ============================================
// WooCommerce Order Types
// ============================================

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'ON_HOLD' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'FAILED';

export interface WooAddress {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;  // Only in billing
}

export interface WooLineItem {
  product: {
    node: WooProduct;
  };
  variation: {
    node: WooVariation;
  } | null;
  quantity: number;
  subtotal: string;
  total: string;
}

export interface WooShippingLine {
  methodTitle: string;
  total: string;
}

export interface WooOrder {
  id: string;
  databaseId: number;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  dateCompleted: string | null;
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
  total: string;
  paymentMethod: string;
  paymentMethodTitle: string;
  billing: WooAddress;
  shipping: WooAddress;
  lineItems: {
    nodes: WooLineItem[];
  };
  shippingLines: {
    nodes: WooShippingLine[];
  };
  customerNote: string;
  // Custom fields added by theme
  formattedTotal?: string;
  statusLabel?: string;
  formattedDate?: string;
  formattedShippingAddress?: string;
  formattedBillingAddress?: string;
}

export interface WooCustomer {
  id: string;
  databaseId: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  billing: WooAddress;
  shipping: WooAddress;
  orders: {
    nodes: WooOrder[];
  };
}

// ============================================
// WooCommerce Review Types
// ============================================

export type ReviewStatus = 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH';

export interface WooReview {
  id: string;
  databaseId: number;
  rating: number;        // 1-5
  content: string;
  date: string;
  author: {
    name: string;
    email: string;
  };
  verified: boolean;     // Verified purchase
  status: ReviewStatus;
  product: {
    node: WooProduct;
  };
}

// ============================================
// WooCommerce GraphQL Response Types
// ============================================

export interface ProductsResponse {
  products: {
    pageInfo: PageInfo;
    nodes: WooProduct[];
  };
}

export interface ProductResponse {
  product: WooProduct | null;
}

export interface CartResponse {
  cart: WooCart;
}

export interface AddToCartResponse {
  addToCart: {
    cartItem: WooCartItem;
    cart: WooCart;
  };
}

export interface UpdateCartResponse {
  updateItemQuantities: {
    cart: WooCart;
  };
}

export interface RemoveCartItemResponse {
  removeItemsFromCart: {
    cart: WooCart;
  };
}

export interface CheckoutResponse {
  checkout: {
    order: WooOrder;
    result: string;
    redirect: string;
  };
}

export interface CustomerResponse {
  customer: WooCustomer;
}

export interface OrderResponse {
  order: WooOrder | null;
}
