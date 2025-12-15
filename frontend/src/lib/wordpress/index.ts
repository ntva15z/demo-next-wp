/**
 * WordPress GraphQL Library
 * 
 * Exports all WordPress-related utilities, types, and queries
 */

// Client and error handling
export {
  fetchGraphQL,
  createGraphQLClient,
  WordPressAPIError,
  type FetchGraphQLOptions,
  type GraphQLResponse,
} from './client';

// TypeScript types
export type {
  // Media
  WPImage,
  WPMediaDetails,
  WPFeaturedImage,
  // Taxonomy
  WPCategory,
  WPTag,
  WPCategoryConnection,
  WPTagConnection,
  // SEO
  WPSeo,
  // Content
  WPPost,
  WPPage,
  WPAuthor,
  WPPostWithACF,
  WPPageWithACF,
  ACFFieldGroup,
  // Menu
  WPMenuItem,
  WPMenuItemWithChildren,
  WPMenuItemConnection,
  // Pagination
  PageInfo,
  // Response types
  PostsResponse,
  PostResponse,
  PagesResponse,
  PageResponse,
  MenuResponse,
  AllPostsSlugsResponse,
  AllPagesSlugsResponse,
} from './types';

// GraphQL queries
export {
  // Posts
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_ALL_POSTS_SLUGS,
  GET_POSTS_BY_CATEGORY,
  GET_POSTS_BY_TAG,
  // Pages
  GET_PAGE_BY_SLUG,
  GET_ALL_PAGES_SLUGS,
  GET_PAGES,
  // Menus
  GET_MENU,
  GET_ALL_MENUS,
  // Categories & Tags
  GET_CATEGORIES,
  GET_CATEGORY_BY_SLUG,
  GET_TAGS,
  GET_TAG_BY_SLUG,
  // Sitemap
  GET_SITEMAP_DATA,
} from './queries';
