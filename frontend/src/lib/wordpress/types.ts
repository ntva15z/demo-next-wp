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
