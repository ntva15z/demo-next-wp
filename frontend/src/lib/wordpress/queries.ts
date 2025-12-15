/**
 * GraphQL Queries for WordPress WPGraphQL API
 * 
 * These queries are designed to work with:
 * - WPGraphQL plugin
 * - WPGraphQL for ACF (Advanced Custom Fields)
 * - WPGraphQL Yoast SEO Addon
 */

// ============================================
// Post Queries
// ============================================

/**
 * Get paginated list of posts
 * @param first - Number of posts to fetch
 * @param after - Cursor for pagination
 */
export const GET_POSTS = `
  query GetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
        author {
          node {
            id
            name
            slug
            avatar {
              url
            }
          }
        }
      }
    }
  }
`;


/**
 * Get single post by slug with full content and SEO data
 * @param slug - Post slug
 */
export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      excerpt
      date
      modified
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes {
          id
          name
          slug
        }
      }
      tags {
        nodes {
          id
          name
          slug
        }
      }
      author {
        node {
          id
          name
          slug
          avatar {
            url
          }
          description
        }
      }
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
        twitterTitle
        twitterDescription
        canonical
      }
    }
  }
`;

/**
 * Get all post slugs for static generation
 */
export const GET_ALL_POSTS_SLUGS = `
  query GetAllPostsSlugs {
    posts(first: 1000) {
      nodes {
        slug
      }
    }
  }
`;

/**
 * Get posts by category slug
 * @param categorySlug - Category slug
 * @param first - Number of posts to fetch
 * @param after - Cursor for pagination
 */
export const GET_POSTS_BY_CATEGORY = `
  query GetPostsByCategory($categorySlug: String!, $first: Int!, $after: String) {
    posts(where: { categoryName: $categorySlug }, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

/**
 * Get posts by tag slug
 * @param tagSlug - Tag slug
 * @param first - Number of posts to fetch
 * @param after - Cursor for pagination
 */
export const GET_POSTS_BY_TAG = `
  query GetPostsByTag($tagSlug: String!, $first: Int!, $after: String) {
    posts(where: { tag: $tagSlug }, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  }
`;


// ============================================
// Page Queries
// ============================================

/**
 * Get single page by slug/URI with full content and SEO data
 * @param slug - Page slug or URI
 */
export const GET_PAGE_BY_SLUG = `
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      databaseId
      title
      slug
      uri
      content
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      parent {
        node {
          ... on Page {
            id
            slug
            title
          }
        }
      }
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
        twitterTitle
        twitterDescription
        canonical
      }
    }
  }
`;

/**
 * Get all page slugs and URIs for static generation
 */
export const GET_ALL_PAGES_SLUGS = `
  query GetAllPagesSlugs {
    pages(first: 1000) {
      nodes {
        slug
        uri
      }
    }
  }
`;

/**
 * Get paginated list of pages
 * @param first - Number of pages to fetch
 * @param after - Cursor for pagination
 */
export const GET_PAGES = `
  query GetPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        uri
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

// ============================================
// Menu Queries
// ============================================

/**
 * Get menu items by location
 * @param location - Menu location enum (e.g., PRIMARY, FOOTER)
 */
export const GET_MENU = `
  query GetMenu($location: MenuLocationEnum!) {
    menuItems(where: { location: $location }, first: 50) {
      nodes {
        id
        label
        url
        path
        parentId
        cssClasses
        target
        order
      }
    }
  }
`;

/**
 * Get all menus with their items
 */
export const GET_ALL_MENUS = `
  query GetAllMenus {
    menus {
      nodes {
        id
        name
        slug
        locations
        menuItems {
          nodes {
            id
            label
            url
            path
            parentId
            cssClasses
            target
            order
          }
        }
      }
    }
  }
`;


// ============================================
// Category & Tag Queries
// ============================================

/**
 * Get all categories
 */
export const GET_CATEGORIES = `
  query GetCategories {
    categories(first: 100) {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
  }
`;

/**
 * Get single category by slug
 * @param slug - Category slug
 */
export const GET_CATEGORY_BY_SLUG = `
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      count
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
      }
    }
  }
`;

/**
 * Get all tags
 */
export const GET_TAGS = `
  query GetTags {
    tags(first: 100) {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
  }
`;

/**
 * Get single tag by slug
 * @param slug - Tag slug
 */
export const GET_TAG_BY_SLUG = `
  query GetTagBySlug($slug: ID!) {
    tag(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      count
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
      }
    }
  }
`;

// ============================================
// Sitemap Queries
// ============================================

/**
 * Get all content for sitemap generation
 */
export const GET_SITEMAP_DATA = `
  query GetSitemapData {
    posts(first: 1000) {
      nodes {
        slug
        modified
      }
    }
    pages(first: 1000) {
      nodes {
        slug
        uri
        modified
      }
    }
    categories(first: 100) {
      nodes {
        slug
      }
    }
    tags(first: 100) {
      nodes {
        slug
      }
    }
  }
`;
