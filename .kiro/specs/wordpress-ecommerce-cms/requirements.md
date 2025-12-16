# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu cho việc mở rộng WordPress Headless CMS để hỗ trợ tính năng e-commerce bán quần áo. WordPress sẽ được cấu hình với WooCommerce làm backend quản lý sản phẩm, đơn hàng, và thanh toán, đồng thời expose dữ liệu qua GraphQL API (WPGraphQL + WooGraphQL) cho NextJS frontend.

## Glossary

- **WooCommerce**: Plugin WordPress cung cấp đầy đủ tính năng e-commerce
- **WooGraphQL**: Plugin mở rộng WPGraphQL để expose WooCommerce data qua GraphQL
- **Product**: Sản phẩm quần áo với các thuộc tính như size, màu sắc, giá
- **Variable Product**: Sản phẩm có nhiều biến thể (variations) theo size/màu
- **Product Variation**: Một biến thể cụ thể của sản phẩm (VD: Áo size M màu đỏ)
- **Product Category**: Danh mục sản phẩm (VD: Áo, Quần, Váy, Phụ kiện)
- **Product Attribute**: Thuộc tính sản phẩm (VD: Size, Color, Material)
- **Cart**: Giỏ hàng chứa các sản phẩm người dùng chọn mua
- **Order**: Đơn hàng được tạo sau khi checkout
- **Payment Gateway**: Cổng thanh toán (VNPay, MoMo, COD)
- **Inventory**: Quản lý tồn kho sản phẩm
- **SKU**: Stock Keeping Unit - mã định danh sản phẩm

## Requirements

### Requirement 1: WooCommerce Installation và Configuration

**User Story:** As a store administrator, I want WooCommerce properly configured, so that I can manage products and orders efficiently.

#### Acceptance Criteria

1. WHEN WordPress Docker container starts THEN the WordPress CMS SHALL have WooCommerce plugin pre-installed and activated
2. WHEN WooCommerce is configured THEN the WordPress CMS SHALL have Vietnamese Dong (VND) as default currency
3. WHEN WooCommerce is configured THEN the WordPress CMS SHALL have Vietnam as default shipping country
4. WHEN WooCommerce is configured THEN the WordPress CMS SHALL enable tax calculation for Vietnamese tax rates

### Requirement 2: WooGraphQL Integration

**User Story:** As a developer, I want WooCommerce data exposed via GraphQL, so that NextJS frontend can fetch product and order data.

#### Acceptance Criteria

1. WHEN WooGraphQL plugin is installed THEN the WordPress CMS SHALL expose product queries via GraphQL endpoint
2. WHEN WooGraphQL plugin is installed THEN the WordPress CMS SHALL expose cart mutations via GraphQL endpoint
3. WHEN WooGraphQL plugin is installed THEN the WordPress CMS SHALL expose order queries and mutations via GraphQL endpoint
4. WHEN GraphQL queries are executed THEN the WordPress CMS SHALL return properly typed product data including variations

### Requirement 3: Product Management - Clothing Specific

**User Story:** As a store administrator, I want to manage clothing products with size and color variations, so that customers can select their preferred options.

#### Acceptance Criteria

1. WHEN a product is created THEN the WordPress CMS SHALL support Variable Product type with multiple variations
2. WHEN product attributes are defined THEN the WordPress CMS SHALL include Size attribute (XS, S, M, L, XL, XXL)
3. WHEN product attributes are defined THEN the WordPress CMS SHALL include Color attribute with color swatches
4. WHEN a product variation is created THEN the WordPress CMS SHALL track individual SKU and stock quantity per variation
5. WHEN product images are uploaded THEN the WordPress CMS SHALL support multiple gallery images per product

### Requirement 4: Product Categories và Taxonomy

**User Story:** As a store administrator, I want to organize products into categories, so that customers can browse products easily.

#### Acceptance Criteria

1. WHEN product categories are created THEN the WordPress CMS SHALL support hierarchical category structure (Parent > Child)
2. WHEN a category is created THEN the WordPress CMS SHALL allow category image and description
3. WHEN products are tagged THEN the WordPress CMS SHALL support product tags for filtering (VD: "Sale", "New Arrival", "Best Seller")
4. WHEN product collections are needed THEN the WordPress CMS SHALL support custom taxonomy for collections (VD: "Summer 2024", "Winter Collection")

### Requirement 5: Inventory Management

**User Story:** As a store administrator, I want to track product inventory, so that I can manage stock levels and prevent overselling.

#### Acceptance Criteria

1. WHEN stock management is enabled THEN the WordPress CMS SHALL track stock quantity per product variation
2. WHEN stock reaches zero THEN the WordPress CMS SHALL mark product variation as "Out of Stock"
3. WHEN stock is low THEN the WordPress CMS SHALL send notification to administrator at configurable threshold
4. WHEN backorders are configured THEN the WordPress CMS SHALL allow customers to order out-of-stock items with notification

### Requirement 6: Pricing và Promotions

**User Story:** As a store administrator, I want to set prices and run promotions, so that I can attract customers and increase sales.

#### Acceptance Criteria

1. WHEN a product price is set THEN the WordPress CMS SHALL support regular price and sale price
2. WHEN a sale is scheduled THEN the WordPress CMS SHALL automatically apply sale price during specified date range
3. WHEN coupon codes are created THEN the WordPress CMS SHALL support percentage discount, fixed amount, and free shipping coupons
4. WHEN coupon restrictions are set THEN the WordPress CMS SHALL enforce minimum order amount and usage limits

### Requirement 7: Order Management

**User Story:** As a store administrator, I want to manage customer orders, so that I can process and fulfill orders efficiently.

#### Acceptance Criteria

1. WHEN an order is placed THEN the WordPress CMS SHALL create order record with customer details and line items
2. WHEN order status changes THEN the WordPress CMS SHALL send email notification to customer
3. WHEN order is processed THEN the WordPress CMS SHALL support status workflow (Pending → Processing → Shipped → Completed)
4. WHEN order needs modification THEN the WordPress CMS SHALL allow administrator to edit order items and totals

### Requirement 8: Payment Gateway Integration

**User Story:** As a store administrator, I want multiple payment options, so that customers can pay using their preferred method.

#### Acceptance Criteria

1. WHEN checkout is initiated THEN the WordPress CMS SHALL offer Cash on Delivery (COD) payment option
2. WHEN online payment is needed THEN the WordPress CMS SHALL integrate with VNPay payment gateway
3. WHEN online payment is needed THEN the WordPress CMS SHALL integrate with MoMo payment gateway
4. WHEN payment is completed THEN the WordPress CMS SHALL update order status and send confirmation

### Requirement 9: Shipping Configuration

**User Story:** As a store administrator, I want to configure shipping options, so that customers can choose delivery method.

#### Acceptance Criteria

1. WHEN shipping zones are configured THEN the WordPress CMS SHALL support different rates for different regions in Vietnam
2. WHEN shipping method is selected THEN the WordPress CMS SHALL calculate shipping cost based on order weight or total
3. WHEN free shipping threshold is set THEN the WordPress CMS SHALL apply free shipping for orders above specified amount
4. WHEN shipping is calculated THEN the WordPress CMS SHALL integrate with Vietnam shipping carriers (GHN, GHTK, Viettel Post)

### Requirement 10: Customer Account Management

**User Story:** As a customer, I want to manage my account, so that I can track orders and save shipping information.

#### Acceptance Criteria

1. WHEN a customer registers THEN the WordPress CMS SHALL create customer account with profile information
2. WHEN a customer logs in THEN the WordPress CMS SHALL authenticate via JWT tokens for headless frontend
3. WHEN a customer views account THEN the WordPress CMS SHALL display order history and tracking information
4. WHEN a customer saves address THEN the WordPress CMS SHALL store multiple shipping addresses per account

### Requirement 11: Product Reviews và Ratings

**User Story:** As a customer, I want to read and write product reviews, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN a customer submits review THEN the WordPress CMS SHALL store review with rating (1-5 stars) and comment
2. WHEN reviews are displayed THEN the WordPress CMS SHALL show verified purchase badge for customers who bought the product
3. WHEN reviews are moderated THEN the WordPress CMS SHALL require admin approval before publishing
4. WHEN product rating is calculated THEN the WordPress CMS SHALL compute average rating from all approved reviews

### Requirement 12: Webhook Integration for Frontend

**User Story:** As a developer, I want WordPress to notify frontend of changes, so that product and inventory data stays synchronized.

#### Acceptance Criteria

1. WHEN a product is created or updated THEN the WordPress CMS SHALL trigger webhook to NextJS revalidation endpoint
2. WHEN inventory changes THEN the WordPress CMS SHALL trigger webhook to update stock status on frontend
3. WHEN order status changes THEN the WordPress CMS SHALL trigger webhook for real-time order tracking
4. WHEN webhook is sent THEN the WordPress CMS SHALL include secret header for authentication

