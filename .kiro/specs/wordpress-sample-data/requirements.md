# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để thiết lập WordPress với plugins cần thiết và sample data cho hệ thống e-commerce headless. Mục tiêu là cài đặt đầy đủ plugins, tạo dữ liệu mẫu để frontend Next.js có thể test và phát triển các tính năng.

## Glossary

- **Sample Data Generator**: Script PHP/WP-CLI tạo dữ liệu mẫu cho WooCommerce
- **Product**: Sản phẩm trong WooCommerce (simple hoặc variable)
- **Product Variation**: Biến thể của sản phẩm (size, color...)
- **Product Category**: Danh mục sản phẩm
- **Product Attribute**: Thuộc tính sản phẩm (Size, Color, Material...)
- **Customer**: Người dùng WordPress với role customer
- **Order**: Đơn hàng trong WooCommerce
- **Blog Post**: Bài viết WordPress liên quan đến sản phẩm (review, hướng dẫn...)
- **Post Category**: Danh mục bài viết

## Requirements

### Requirement 1

**User Story:** As a developer, I want all required plugins installed and configured, so that the headless e-commerce system works properly.

#### Acceptance Criteria

1. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate WooCommerce plugin
2. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate WPGraphQL plugin
3. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate WooGraphQL plugin for WooCommerce GraphQL support
4. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate JWT Authentication plugin for user authentication
5. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate ACF (Advanced Custom Fields) plugin for custom fields
6. WHEN the setup script runs THEN the Plugin Installer SHALL install and activate WPGraphQL for ACF plugin to expose custom fields via GraphQL
7. WHEN the setup script runs THEN the Plugin Installer SHALL activate the headless-theme as the active theme
8. WHEN plugins are installed THEN the Plugin Installer SHALL verify GraphQL endpoint is accessible at /graphql

### Requirement 2

**User Story:** As a developer, I want sample products with various types, so that I can test product display and filtering on the frontend.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 20 simple products with name, price, description, and images
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 10 variable products with size and color variations
3. WHEN creating products THEN the Sample Data Generator SHALL assign random stock quantities between 0 and 100 for each product
4. WHEN creating products THEN the Sample Data Generator SHALL set sale prices for at least 30% of products

### Requirement 3

**User Story:** As a developer, I want organized product categories and tags, so that I can test category navigation and filtering.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create a hierarchical category structure with at least 3 parent categories and 2-3 child categories each
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 10 product tags
3. WHEN creating products THEN the Sample Data Generator SHALL assign each product to at least one category and one tag

### Requirement 4

**User Story:** As a developer, I want product attributes configured, so that I can test variable products and filtering by attributes.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create global attributes for Size with values XS, S, M, L, XL, XXL
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create global attributes for Color with at least 8 color options
3. WHEN the sample data script runs THEN the Sample Data Generator SHALL create global attributes for Material with at least 5 material options

### Requirement 5

**User Story:** As a developer, I want sample customers and orders, so that I can test order management and customer account features.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 5 customer accounts with Vietnamese addresses
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 10 sample orders with various statuses (pending, processing, completed, cancelled)
3. WHEN creating orders THEN the Sample Data Generator SHALL include 1-5 random products per order

### Requirement 6

**User Story:** As a developer, I want sample product reviews, so that I can test review display and rating features.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 30 product reviews distributed across products
2. WHEN creating reviews THEN the Sample Data Generator SHALL assign ratings from 1 to 5 stars with realistic distribution (more 4-5 star reviews)

### Requirement 7

**User Story:** As a developer, I want WooCommerce configured for Vietnam market, so that I can test localized features.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL configure currency to VND with appropriate formatting
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL configure shipping zones for Vietnam provinces
3. WHEN the sample data script runs THEN the Sample Data Generator SHALL enable Cash on Delivery payment method

### Requirement 8

**User Story:** As a developer, I want sample blog posts related to products, so that I can test blog display and product-blog relationships.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 3 blog categories (Tin tức, Hướng dẫn, Đánh giá sản phẩm)
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create at least 15 blog posts distributed across categories
3. WHEN creating blog posts THEN the Sample Data Generator SHALL include featured images and formatted content with headings and paragraphs
4. WHEN creating blog posts THEN the Sample Data Generator SHALL link relevant posts to related products using custom fields or tags

### Requirement 9

**User Story:** As a developer, I want the sample data script to be idempotent, so that I can run it multiple times without duplicating data.

#### Acceptance Criteria

1. WHEN the sample data script runs multiple times THEN the Sample Data Generator SHALL check for existing data before creating new entries
2. WHEN existing sample data is detected THEN the Sample Data Generator SHALL provide option to reset or skip creation
3. WHEN the script completes THEN the Sample Data Generator SHALL output a summary of created items

### Requirement 10

**User Story:** As a developer, I want sample navigation menus, so that I can test menu display on the frontend.

#### Acceptance Criteria

1. WHEN the sample data script runs THEN the Sample Data Generator SHALL create a Primary Menu with links to main categories and pages
2. WHEN the sample data script runs THEN the Sample Data Generator SHALL create a Footer Menu with links to policy pages and contact
3. WHEN creating menus THEN the Sample Data Generator SHALL register menus in the correct WordPress menu locations

