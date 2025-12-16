# Implementation Plan

## WordPress E-commerce CMS Setup

- [x] 1. Update Docker configuration for WooCommerce
  - [x] 1.1 Update Dockerfile to include WooCommerce dependencies
    - Add PHP extensions: gd, zip, intl for WooCommerce
    - Install WP-CLI for plugin management
    - _Requirements: 1.1_
  - [x] 1.2 Update docker-compose.yml with WooCommerce environment variables
    - Add WOOCOMMERCE_CURRENCY, WOOCOMMERCE_COUNTRY env vars
    - Configure JWT_AUTH_SECRET_KEY
    - _Requirements: 1.2, 1.3_
  - [x] 1.3 Create WooCommerce plugin installation script
    - Script to install WooCommerce, WPGraphQL, WooGraphQL via WP-CLI
    - Auto-activate plugins on container start
    - _Requirements: 1.1, 2.1_

- [x] 2. Configure WooCommerce core settings
  - [x] 2.1 Create WooCommerce setup PHP file
    - Set default currency to VND
    - Set default country to Vietnam
    - Configure tax settings for Vietnam
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 2.2 Write property test for variation data integrity
    - **Property 1: Variable product variation data integrity**
    - **Validates: Requirements 2.4, 3.4, 5.1**
  - [x] 2.3 Create product attributes configuration
    - Register Size attribute with terms (XS, S, M, L, XL, XXL)
    - Register Color attribute with color picker support
    - _Requirements: 3.2, 3.3_
  - [x] 2.4 Write property test for category hierarchy
    - **Property 2: Category hierarchy consistency**
    - **Validates: Requirements 4.1**


- [x] 3. Setup product categories and taxonomy
  - [x] 3.1 Create default clothing categories hierarchy
    - Create parent categories: Áo, Quần, Váy & Đầm, Phụ Kiện
    - Create child categories for each parent
    - _Requirements: 4.1, 4.2_
  - [x] 3.2 Create custom taxonomy for product collections
    - Register 'product_collection' taxonomy
    - Add sample collections: Summer 2024, New Arrivals, Best Sellers
    - _Requirements: 4.4_
  - [x] 3.3 Configure product tags
    - Setup default tags: Sale, New, Hot, Limited
    - _Requirements: 4.3_

- [x] 4. Implement inventory management
  - [x] 4.1 Configure stock management settings
    - Enable stock management at product level
    - Set low stock threshold notification
    - Configure backorder settings
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 4.2 Write property test for stock status synchronization
    - **Property 3: Stock status synchronization**
    - **Validates: Requirements 5.2**
  - [x] 4.3 Write property test for price field completeness
    - **Property 4: Price field completeness**
    - **Validates: Requirements 6.1**

- [x] 5. Configure pricing and promotions
  - [x] 5.1 Setup sale price scheduling functionality
    - Configure scheduled sale price feature
    - Test date-based sale activation
    - _Requirements: 6.2_
  - [x] 5.2 Configure coupon system
    - Enable percentage, fixed amount, and free shipping coupons
    - Setup coupon restrictions (min amount, usage limits)
    - _Requirements: 6.3, 6.4_
  - [x] 5.3 Write property test for coupon restriction enforcement
    - **Property 5: Coupon restriction enforcement**
    - **Validates: Requirements 6.4**

- [x] 6. Checkpoint - Verify WooCommerce core setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Setup shipping configuration
  - [x] 7.1 Create Vietnam shipping zones
    - Zone 1: Hồ Chí Minh (flat rate)
    - Zone 2: Hà Nội (flat rate)
    - Zone 3: Other provinces (weight-based)
    - _Requirements: 9.1_
  - [x] 7.2 Configure shipping methods and rates
    - Setup flat rate shipping
    - Configure weight-based shipping calculation
    - _Requirements: 9.2_
  - [x] 7.3 Implement free shipping threshold
    - Set threshold at 500,000 VND
    - Auto-apply free shipping for qualifying orders
    - _Requirements: 9.3_
  - [x] 7.4 Write property test for shipping zone rate application
    - **Property 8: Shipping zone rate application**
    - **Validates: Requirements 9.1**
  - [x] 7.5 Write property test for shipping cost calculation
    - **Property 9: Shipping cost calculation**
    - **Validates: Requirements 9.2**
  - [x] 7.6 Write property test for free shipping threshold
    - **Property 10: Free shipping threshold**
    - **Validates: Requirements 9.3**


- [x] 8. Configure payment gateways
  - [x] 8.1 Enable Cash on Delivery (COD)
    - Configure COD payment method
    - Set COD availability by shipping zone
    - _Requirements: 8.1_
  - [x] 8.2 Install and configure VNPay gateway
    - Install VNPay WooCommerce plugin
    - Configure API credentials (sandbox mode)
    - _Requirements: 8.2_
  - [x] 8.3 Install and configure MoMo gateway
    - Install MoMo WooCommerce plugin
    - Configure API credentials (sandbox mode)
    - _Requirements: 8.3_

- [x] 9. Setup order management
  - [x] 9.1 Configure order status workflow
    - Setup custom order statuses if needed
    - Configure email notifications per status
    - _Requirements: 7.2, 7.3_
  - [x] 9.2 Write property test for order data completeness
    - **Property 6: Order data completeness**
    - **Validates: Requirements 7.1**
  - [x] 9.3 Write property test for order status workflow validity
    - **Property 7: Order status workflow validity**
    - **Validates: Requirements 7.3**

- [x] 10. Checkpoint - Verify shipping and payment setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Configure JWT authentication
  - [x] 11.1 Install JWT Authentication plugin
    - Install jwt-authentication-for-wp-rest-api
    - Configure JWT_AUTH_SECRET_KEY in wp-config
    - _Requirements: 10.2_
  - [x] 11.2 Extend JWT token with customer data
    - Add customer billing/shipping addresses to token
    - Configure token expiration (7 days)
    - _Requirements: 10.2_
  - [x] 11.3 Write property test for JWT authentication validity
    - **Property 11: JWT authentication validity**
    - **Validates: Requirements 10.2**

- [x] 12. Setup customer account features
  - [x] 12.1 Configure customer registration
    - Enable customer registration
    - Setup registration form fields
    - _Requirements: 10.1_
  - [x] 12.2 Configure multiple shipping addresses
    - Enable address book feature
    - Setup address management endpoints
    - _Requirements: 10.4_
  - [x] 12.3 Write property test for customer order history retrieval
    - **Property 12: Customer order history retrieval**
    - **Validates: Requirements 10.3**
  - [x] 12.4 Write property test for multiple shipping addresses storage
    - **Property 13: Multiple shipping addresses storage**
    - **Validates: Requirements 10.4**


- [x] 13. Configure product reviews system
  - [x] 13.1 Enable and configure product reviews
    - Enable reviews on products
    - Require admin approval for new reviews
    - Enable verified purchase badge
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 13.2 Write property test for review data storage
    - **Property 14: Review data storage**
    - **Validates: Requirements 11.1**
  - [x] 13.3 Write property test for verified purchase badge accuracy
    - **Property 15: Verified purchase badge accuracy**
    - **Validates: Requirements 11.2**
  - [x] 13.4 Write property test for review moderation default status
    - **Property 16: Review moderation default status**
    - **Validates: Requirements 11.3**
  - [x] 13.5 Write property test for average rating calculation
    - **Property 17: Average rating calculation**
    - **Validates: Requirements 11.4**

- [x] 14. Checkpoint - Verify customer features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Setup webhook integration
  - [x] 15.1 Create webhook handler for NextJS revalidation
    - Create webhook trigger functions
    - Configure webhook URL and secret
    - _Requirements: 12.1, 12.4_
  - [x] 15.2 Implement product update webhook
    - Trigger on product create/update
    - Include product slug and stock status
    - _Requirements: 12.1_
  - [x] 15.3 Implement inventory change webhook
    - Trigger on stock quantity change
    - Include stock quantity and status
    - _Requirements: 12.2_
  - [x] 15.4 Implement order status webhook
    - Trigger on order status change
    - Include order ID and status transition
    - _Requirements: 12.3_
  - [x] 15.5 Write property test for webhook authentication header
    - **Property 18: Webhook authentication header**
    - **Validates: Requirements 12.4**

- [x] 16. Install and configure WooGraphQL
  - [x] 16.1 Install WPGraphQL and WooGraphQL plugins
    - Install via WP-CLI or manual upload
    - Activate and configure plugins
    - _Requirements: 2.1_
  - [x] 16.2 Configure GraphQL schema for products
    - Verify product queries work correctly
    - Test variable product with variations
    - _Requirements: 2.1, 2.4_
  - [x] 16.3 Configure GraphQL mutations for cart
    - Test addToCart, updateCartItemQuantities, removeCartItem
    - Verify cart totals calculation
    - _Requirements: 2.2_
  - [x] 16.4 Configure GraphQL for orders
    - Test order queries and mutations
    - Verify customer order history
    - _Requirements: 2.3_

- [-] 17. Final Checkpoint - Complete CMS verification
  - Ensure all tests pass, ask the user if questions arise.
