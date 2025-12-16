# Implementation Plan

## Phase 1: Project Setup

- [x] 1. Initialize NextJS project with TypeScript and Tailwind CSS
  - [x] 1.1 Create NextJS 14 project with App Router
    - Run `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir`
    - Configure `next.config.js` for image domains
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Set up environment variables with Zod validation
    - Create `src/lib/env.ts` with schema validation
    - Create `.env.local.example` template
    - _Requirements: 1.3_
  - [x] 1.3 Write property test for environment validation
    - **Property 1: Environment variable validation**
    - **Validates: Requirements 1.3**

## Phase 2: WordPress Docker Setup

- [x] 2. Set up WordPress Docker environment
  - [x] 2.1 Create Docker Compose configuration
    - Create `docker-compose.yml` with WordPress, MySQL, phpMyAdmin
    - Create `wordpress/Dockerfile` with PHP 8.2
    - _Requirements: 7.1, 7.4_
  - [x] 2.2 Configure WordPress for headless mode
    - Create minimal headless theme
    - Document required plugins (WPGraphQL, ACF, Yoast)
    - _Requirements: 7.2, 7.3_

## Phase 3: GraphQL Client

- [x] 3. Implement GraphQL client and types
  - [x] 3.1 Create GraphQL client with fetch wrapper
    - Create `src/lib/wordpress/client.ts`
    - Implement error handling with custom error class
    - _Requirements: 2.1, 2.3_
  - [x] 3.2 Write property test for GraphQL error handling
    - **Property 3: GraphQL error handling**
    - **Validates: Requirements 2.3**
  - [x] 3.3 Define TypeScript types for WordPress data
    - Create `src/lib/wordpress/types.ts`
    - Define interfaces for Post, Page, Menu, SEO
    - _Requirements: 2.2_
  - [x] 3.4 Write property test for GraphQL response type safety
    - **Property 2: GraphQL response type safety**
    - **Validates: Requirements 2.2**
  - [x] 3.5 Create GraphQL queries
    - Create `src/lib/wordpress/queries.ts`
    - Implement queries for posts, pages, menus
    - _Requirements: 2.1, 2.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Layout Components

- [x] 5. Implement layout components
  - [x] 5.1 Create Header component with navigation
    - Create `src/components/layout/Header.tsx`
    - Fetch menu from WordPress
    - _Requirements: 5.1_
  - [x] 5.2 Create Navigation component with nested menu support
    - Create `src/components/layout/Navigation.tsx`
    - Implement `buildMenuTree` function
    - Support desktop and mobile responsive layouts
    - _Requirements: 5.2, 5.4_
  - [x] 5.3 Write property test for menu tree building
    - **Property 8: Menu tree building**
    - **Validates: Requirements 5.2**
  - [x] 5.4 Write property test for active menu highlighting
    - **Property 9: Active menu highlighting**
    - **Validates: Requirements 5.3**
  - [x] 5.5 Create Footer component
    - Create `src/components/layout/Footer.tsx`
    - _Requirements: 5.1_
  - [x] 5.6 Create root layout with Header and Footer
    - Update `src/app/layout.tsx`
    - Configure fonts with next/font
    - _Requirements: 9.3_

## Phase 5: Blog Features

- [x] 6. Implement blog listing and single post pages
  - [x] 6.1 Create PostCard component
    - Create `src/components/posts/PostCard.tsx`
    - Display title, excerpt, featured image, date
    - _Requirements: 3.1_
  - [x] 6.2 Write property test for post list rendering
    - **Property 4: Post list rendering completeness**
    - **Validates: Requirements 3.1**
  - [x] 6.3 Create PostList component with pagination
    - Create `src/components/posts/PostList.tsx`
    - Implement cursor-based pagination
    - _Requirements: 3.1_
  - [x] 6.4 Create blog listing page
    - Create `src/app/blog/page.tsx`
    - Fetch posts with ISR (revalidate: 60)
    - _Requirements: 3.1, 3.5, 9.2_
  - [x] 6.5 Create PostContent component
    - Create `src/components/posts/PostContent.tsx`
    - Render HTML content safely
    - Display categories and tags with links
    - _Requirements: 3.2, 3.3_
  - [x] 6.6 Write property test for post content rendering
    - **Property 5: Post content rendering**
    - **Validates: Requirements 3.2**
  - [x] 6.7 Write property test for category/tag linking
    - **Property 6: Category and tag linking**
    - **Validates: Requirements 3.3**
  - [x] 6.8 Create single post page with dynamic routing
    - Create `src/app/blog/[slug]/page.tsx`
    - Implement `generateStaticParams` for SSG
    - Implement `generateMetadata` for SEO
    - _Requirements: 3.2, 3.4, 9.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Static Pages

- [x] 8. Implement static page rendering
  - [x] 8.1 Create PageContent component
    - Create `src/components/pages/PageContent.tsx`
    - Support ACF custom fields rendering
    - _Requirements: 4.1, 4.2_
  - [x] 8.2 Write property test for page content rendering
    - **Property 7: Page content rendering**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 8.3 Create dynamic page route
    - Create `src/app/[slug]/page.tsx`
    - Implement `generateStaticParams`
    - Handle 404 for non-existent pages
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 8.4 Create 404 error page
    - Create `src/app/not-found.tsx`
    - _Requirements: 4.3_

## Phase 7: SEO Implementation

- [x] 9. Implement SEO features
  - [x] 9.1 Create SEO metadata generation utilities
    - Create `src/lib/seo/metadata.ts`
    - Generate meta tags from Yoast SEO data
    - _Requirements: 6.1, 6.2_
  - [x] 9.2 Write property test for SEO metadata completeness
    - **Property 10: SEO metadata completeness**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 9.3 Create JSON-LD structured data component
    - Create `src/components/seo/JsonLd.tsx`
    - Implement Article and WebPage schemas
    - _Requirements: 6.4_
  - [x] 9.4 Write property test for JSON-LD validity
    - **Property 11: JSON-LD structured data validity**
    - **Validates: Requirements 6.4**
  - [x] 9.5 Create XML sitemap
    - Create `src/app/sitemap.ts`
    - Generate sitemap from WordPress content
    - _Requirements: 6.3_
  - [x] 9.6 Write property test for sitemap completeness
    - **Property 12: Sitemap content completeness**
    - **Validates: Requirements 6.3**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Revalidation System

- [x] 11. Implement on-demand revalidation
  - [x] 11.1 Create revalidation API route
    - Create `src/app/api/revalidate/route.ts`
    - Implement secret validation
    - Handle different content types (post, page, menu)
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 11.2 Write property test for webhook secret validation
    - **Property 13: Webhook secret validation**
    - **Validates: Requirements 8.3**
  - [x] 11.3 Write property test for content revalidation
    - **Property 14: Content revalidation on update**
    - **Validates: Requirements 3.5, 4.4, 8.1, 8.2**
  - [x] 11.4 Document WordPress webhook setup
    - Create webhook configuration guide
    - Document WP Webhooks plugin setup
    - _Requirements: 8.1_

## Phase 9: Error Handling and Polish

- [x] 12. Implement error handling
  - [x] 12.1 Create ErrorBoundary component
    - Create `src/components/ErrorBoundary.tsx`
    - _Requirements: 2.3_
  - [x] 12.2 Create loading states
    - Create loading.tsx files for routes
    - _Requirements: 9.4_
  - [x] 12.3 Create error pages
    - Create `src/app/error.tsx`
    - _Requirements: 2.3_

## Phase 10: Final Integration

- [x] 13. Create homepage
  - [x] 13.1 Implement homepage with featured content
    - Create `src/app/page.tsx`
    - Display recent posts and featured pages
    - _Requirements: 3.1, 4.1_

- [x] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
