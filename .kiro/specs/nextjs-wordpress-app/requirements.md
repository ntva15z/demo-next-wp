# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu cho việc phát triển source code ứng dụng web sử dụng NextJS làm frontend và WordPress Headless làm CMS. WordPress chỉ đóng vai trò quản lý nội dung và cung cấp dữ liệu qua GraphQL API (WPGraphQL), trong khi NextJS xử lý việc render và hiển thị nội dung cho người dùng cuối.

## Glossary

- **NextJS Application**: Ứng dụng frontend React framework với Server-Side Rendering (SSR) và Static Site Generation (SSG)
- **WordPress Headless CMS**: WordPress được cấu hình chỉ làm backend CMS, cung cấp content qua API
- **WPGraphQL**: Plugin WordPress cung cấp GraphQL API endpoint
- **ISR (Incremental Static Regeneration)**: Kỹ thuật NextJS cho phép regenerate static pages sau khi build
- **Apollo Client**: GraphQL client library cho React/NextJS
- **Custom Post Type**: Loại bài viết tùy chỉnh trong WordPress
- **ACF (Advanced Custom Fields)**: Plugin WordPress cho phép tạo custom fields
- **Revalidation**: Quá trình cập nhật cached content khi có thay đổi từ CMS

## Requirements

### Requirement 1: NextJS Project Setup

**User Story:** As a developer, I want a well-structured NextJS project, so that I can develop and maintain the frontend efficiently.

#### Acceptance Criteria

1. WHEN the project is initialized THEN the NextJS Application SHALL use App Router with TypeScript configuration
2. WHEN the project is set up THEN the NextJS Application SHALL include ESLint and Prettier for code quality
3. WHEN environment variables are needed THEN the NextJS Application SHALL load configuration from .env files with type-safe validation
4. WHEN the application builds THEN the NextJS Application SHALL generate optimized production bundle

### Requirement 2: GraphQL Integration

**User Story:** As a developer, I want to fetch content from WordPress via GraphQL, so that I can display dynamic content on the frontend.

#### Acceptance Criteria

1. WHEN GraphQL client is configured THEN the NextJS Application SHALL connect to WordPress WPGraphQL endpoint
2. WHEN GraphQL queries are executed THEN the NextJS Application SHALL handle responses with proper TypeScript types
3. WHEN GraphQL errors occur THEN the NextJS Application SHALL handle errors gracefully and display fallback content
4. WHEN fetching data THEN the NextJS Application SHALL cache responses appropriately based on content type

### Requirement 3: Content Display - Posts

**User Story:** As a visitor, I want to read blog posts, so that I can consume the published content.

#### Acceptance Criteria

1. WHEN a visitor accesses the blog listing page THEN the NextJS Application SHALL display paginated list of posts with title, excerpt, and featured image
2. WHEN a visitor clicks on a post THEN the NextJS Application SHALL display the full post content with proper formatting
3. WHEN a post has categories or tags THEN the NextJS Application SHALL display and link to category/tag archive pages
4. WHEN a post contains images THEN the NextJS Application SHALL optimize and lazy-load images using next/image
5. WHEN posts are updated in WordPress THEN the NextJS Application SHALL revalidate cached content within 60 seconds

### Requirement 4: Content Display - Pages

**User Story:** As a visitor, I want to view static pages, so that I can access information like About, Contact, and Services.

#### Acceptance Criteria

1. WHEN a visitor accesses a page URL THEN the NextJS Application SHALL render the page content from WordPress
2. WHEN a page uses custom fields (ACF) THEN the NextJS Application SHALL render custom field data appropriately
3. WHEN a page does not exist THEN the NextJS Application SHALL display a 404 error page
4. WHEN pages are updated in WordPress THEN the NextJS Application SHALL revalidate cached content within 60 seconds

### Requirement 5: Navigation and Menus

**User Story:** As a visitor, I want to navigate the website easily, so that I can find content quickly.

#### Acceptance Criteria

1. WHEN the website loads THEN the NextJS Application SHALL display navigation menu fetched from WordPress
2. WHEN menu items have children THEN the NextJS Application SHALL render dropdown/nested menu structure
3. WHEN a visitor is on a page THEN the NextJS Application SHALL highlight the active menu item
4. WHEN navigation is rendered THEN the NextJS Application SHALL support both desktop and mobile responsive layouts

### Requirement 6: SEO Optimization

**User Story:** As a content manager, I want proper SEO implementation, so that content ranks well in search engines.

#### Acceptance Criteria

1. WHEN a page is rendered THEN the NextJS Application SHALL include meta title and description from WordPress SEO data
2. WHEN a page is rendered THEN the NextJS Application SHALL generate proper Open Graph and Twitter Card meta tags
3. WHEN the site is crawled THEN the NextJS Application SHALL provide XML sitemap generated from WordPress content
4. WHEN pages are rendered THEN the NextJS Application SHALL include structured data (JSON-LD) for articles and pages

### Requirement 7: WordPress Docker Setup

**User Story:** As a developer, I want a local WordPress development environment, so that I can develop and test CMS features locally.

#### Acceptance Criteria

1. WHEN Docker Compose is executed THEN the WordPress Container SHALL start with PHP 8.2 and required extensions
2. WHEN WordPress starts THEN the WordPress Container SHALL have WPGraphQL and ACF plugins pre-installed
3. WHEN media is uploaded THEN the WordPress Container SHALL store files in a persistent volume
4. WHEN database is needed THEN the MySQL Container SHALL provide persistent data storage

### Requirement 8: Revalidation Webhook

**User Story:** As a content editor, I want content updates to appear on the website quickly, so that visitors see the latest content.

#### Acceptance Criteria

1. WHEN content is published or updated in WordPress THEN the WordPress CMS SHALL trigger a webhook to NextJS
2. WHEN NextJS receives revalidation webhook THEN the NextJS Application SHALL revalidate affected pages
3. WHEN webhook is called THEN the NextJS Application SHALL verify webhook secret before processing
4. WHEN revalidation completes THEN the NextJS Application SHALL log the revalidation status

### Requirement 9: Performance Optimization

**User Story:** As a visitor, I want the website to load fast, so that I have a good user experience.

#### Acceptance Criteria

1. WHEN static pages are built THEN the NextJS Application SHALL use Static Site Generation where possible
2. WHEN dynamic content is needed THEN the NextJS Application SHALL use ISR with appropriate revalidation intervals
3. WHEN fonts are loaded THEN the NextJS Application SHALL use next/font for optimized font loading
4. WHEN the page loads THEN the NextJS Application SHALL achieve Lighthouse performance score above 90
