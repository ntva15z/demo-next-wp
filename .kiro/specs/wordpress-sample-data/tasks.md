# Implementation Plan

## Phase 1: Plugin Installation & Configuration

- [x] 1. Update plugin installation script
  - [x] 1.1 Add ACF plugin installation to install-plugins.sh
    - Add `wp plugin install advanced-custom-fields --activate --allow-root`
    - _Requirements: 1.5_
  - [x] 1.2 Add WPGraphQL for ACF plugin installation
    - Install from GitHub: `wp-graphql/wpgraphql-acf`
    - _Requirements: 1.6_
  - [x] 1.3 Add verification for all plugins
    - Check each plugin is active after installation
    - Verify GraphQL endpoint returns valid response
    - _Requirements: 1.8_

- [x] 2. Create ACF field groups configuration
  - [x] 2.1 Create ACF field group for blog posts
    - Create `related_products` relationship field linking to products
    - Create `post_summary` text field for SEO
    - Register field group for post type 'post'
    - _Requirements: 8.4_
  - [x] 2.2 Create ACF field group for products (optional)
    - Create `video_url` URL field
    - Create `size_guide` WYSIWYG field
    - Register field group for product post type
    - _Requirements: 4.1, 4.2_

## Phase 2: Sample Data Generator Core

- [x] 3. Create sample data generator base structure
  - [x] 3.1 Create main generator script entry point
    - Create `wordpress/scripts/generate-sample-data.php`
    - Add command line argument parsing (--reset, --skip-products, etc.)
    - Add logging and progress output
    - _Requirements: 9.2, 9.3_
  - [x] 3.2 Create data check and idempotency logic
    - Check for existing sample data markers
    - Implement skip/reset logic based on existing data
    - _Requirements: 9.1_
  - [x] 3.3 Write property test for idempotency
    - **Property 9: Idempotency**
    - **Validates: Requirements 9.1**

## Phase 3: WooCommerce Configuration

- [x] 4. Create WooCommerce configuration generator
  - [x] 4.1 Configure store settings for Vietnam
    - Set currency to VND with proper formatting (đ suffix, no decimals)
    - Set store location to Vietnam
    - Configure tax settings
    - _Requirements: 7.1_
  - [x] 4.2 Configure shipping zones
    - Create Vietnam shipping zone
    - Add flat rate shipping method (30,000đ)
    - Add free shipping for orders over 500,000đ
    - _Requirements: 7.2_
  - [x] 4.3 Configure payment methods
    - Enable Cash on Delivery (COD)
    - Configure COD settings for Vietnam
    - _Requirements: 7.3_

## Phase 4: Product Attributes & Categories

- [x] 5. Create attribute generator
  - [x] 5.1 Create global product attributes
    - Create Size attribute with values: XS, S, M, L, XL, XXL
    - Create Color attribute with 8+ colors: Đen, Trắng, Xám, Đỏ, Xanh navy, Xanh lá, Vàng, Hồng
    - Create Material attribute with 5+ values: Cotton, Polyester, Linen, Denim, Kaki
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.2 Write property test for attribute options count
    - **Property: Color attribute has ≥8 options, Material has ≥5 options**
    - **Validates: Requirements 4.2, 4.3**

- [x] 6. Create category generator
  - [x] 6.1 Create product category hierarchy
    - Create parent categories: Thời trang nam, Thời trang nữ, Phụ kiện
    - Create child categories under each parent
    - _Requirements: 3.1_
  - [x] 6.2 Create product tags
    - Create at least 10 tags: basic, premium, sale, new-arrival, bestseller, cotton, summer, winter, casual, formal
    - _Requirements: 3.2_
  - [x] 6.3 Write property test for category hierarchy
    - **Property 4: Category Hierarchy Integrity**
    - **Validates: Requirements 3.1**

## Phase 5: Product Generation

- [x] 7. Create product generator
  - [x] 7.1 Create simple products
    - Generate 20+ simple products with Vietnamese names
    - Set prices in VND (100,000 - 2,000,000)
    - Add descriptions and short descriptions
    - Assign to categories and tags
    - _Requirements: 2.1, 3.3_
  - [x] 7.2 Create variable products with variations
    - Generate 10+ variable products
    - Create variations for size and color combinations
    - Set variation-specific prices and stock
    - _Requirements: 2.2_
  - [x] 7.3 Set stock quantities and sale prices
    - Assign random stock quantities [0-100]
    - Set sale prices for 30%+ of products
    - _Requirements: 2.3, 2.4_
  - [x] 7.4 Add product images
    - Use placeholder images from picsum.photos or similar
    - Add gallery images for variable products
    - _Requirements: 2.1_
  - [x] 7.5 Write property tests for products
    - **Property 1: Product Count Minimums (≥20 simple, ≥10 variable)**
    - **Property 2: Stock Quantity Range [0-100]**
    - **Property 3: Sale Price Distribution (≥30%)**
    - **Property 5: Product Category Assignment**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.3**

- [x] 8. Checkpoint - Verify products created correctly
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Customer & Order Generation

- [x] 9. Create customer generator
  - [x] 9.1 Create customer accounts
    - Generate 5+ customers with Vietnamese names
    - Set billing/shipping addresses in Vietnam
    - Use realistic Vietnamese phone numbers and addresses
    - _Requirements: 5.1_

- [x] 10. Create order generator
  - [x] 10.1 Create sample orders
    - Generate 10+ orders with various statuses
    - Distribute statuses: pending, processing, completed, cancelled
    - Assign orders to customers
    - _Requirements: 5.2_
  - [x] 10.2 Add order line items
    - Add 1-5 random products per order
    - Include both simple and variable products
    - Calculate totals correctly
    - _Requirements: 5.3_
  - [x] 10.3 Write property test for orders
    - **Property 6: Order Line Item Count [1-5]**
    - **Validates: Requirements 5.3**

## Phase 7: Reviews Generation

- [x] 11. Create review generator
  - [x] 11.1 Create product reviews
    - Generate 30+ reviews distributed across products
    - Use Vietnamese reviewer names
    - Write realistic review content
    - _Requirements: 6.1_
  - [x] 11.2 Set review ratings
    - Assign ratings 1-5 with realistic distribution
    - More 4-5 star reviews (positive skew)
    - _Requirements: 6.2_
  - [x] 11.3 Write property test for reviews
    - **Property 7: Review Rating Range [1-5]**
    - **Validates: Requirements 6.2**

## Phase 8: Blog Posts Generation

- [x] 12. Create blog generator
  - [x] 12.1 Create blog categories
    - Create categories: Tin tức, Hướng dẫn, Đánh giá sản phẩm
    - _Requirements: 8.1_
  - [x] 12.2 Create blog posts
    - Generate 15+ posts distributed across categories
    - Write Vietnamese content with headings and paragraphs
    - Add featured images
    - _Requirements: 8.2, 8.3_
  - [x] 12.3 Link posts to products
    - Use ACF related_products field
    - Link review posts to relevant products
    - _Requirements: 8.4_
  - [x] 12.4 Write property test for blog posts
    - **Property 8: Blog Post Content Structure**
    - **Validates: Requirements 8.3**

## Phase 9: Navigation Menus

- [x] 13. Create menu generator
  - [x] 13.1 Create Primary Menu
    - Add links to main categories
    - Add link to blog/tin-tuc
    - Register at primary location
    - _Requirements: 10.1_
  - [x] 13.2 Create Footer Menu
    - Add links to policy pages (if exist)
    - Add contact link
    - Register at footer location
    - _Requirements: 10.2_
  - [x] 13.3 Write property test for menus
    - **Property 10: Menu Location Assignment**
    - **Validates: Requirements 10.3**

## Phase 10: Final Integration

- [x] 14. Create master setup script
  - [x] 14.1 Create unified setup command
    - Create `wordpress/scripts/setup-wordpress.sh`
    - Run plugin installation first
    - Run sample data generation
    - Output summary of all created items
    - _Requirements: 9.3_
  - [x] 14.2 Add Docker integration
    - Update docker-compose.yml with setup command
    - Add healthcheck for WordPress readiness
    - _Requirements: 1.7, 1.8_

- [x] 15. Final Checkpoint - Verify complete setup
  - Ensure all tests pass, ask the user if questions arise.

