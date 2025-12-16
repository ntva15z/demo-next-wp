<?php
/**
 * Inventory Management Configuration
 * 
 * This file configures WooCommerce inventory/stock management settings
 * including stock tracking, low stock notifications, and backorder settings.
 *
 * @package Headless_Theme
 * @subpackage WooCommerce
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if WooCommerce is active before proceeding
 */
if (!class_exists('WooCommerce')) {
    return;
}

/**
 * Configure stock management settings on initialization
 * 
 * Enables stock management at product level, sets low stock threshold,
 * and configures backorder settings.
 * 
 * Requirements: 5.1, 5.3, 5.4
 */
function headless_configure_stock_management() {
    // Only run once
    if (get_option('headless_stock_management_setup_complete')) {
        return;
    }
    
    // Enable stock management globally
    update_option('woocommerce_manage_stock', 'yes');
    
    // Hold stock for unpaid orders (60 minutes)
    update_option('woocommerce_hold_stock_minutes', 60);
    
    // Low stock threshold - notify admin when stock reaches this level
    // Requirements: 5.3
    update_option('woocommerce_notify_low_stock_amount', 5);
    
    // Out of stock threshold
    update_option('woocommerce_notify_no_stock_amount', 0);
    
    // Enable low stock notifications
    update_option('woocommerce_notify_low_stock', 'yes');
    
    // Enable out of stock notifications
    update_option('woocommerce_notify_no_stock', 'yes');
    
    // Stock display format (show stock quantity)
    update_option('woocommerce_stock_format', '');
    
    // Hide out of stock items from catalog (optional - set to 'no' to show)
    update_option('woocommerce_hide_out_of_stock_items', 'no');
    
    // Mark setup as complete
    update_option('headless_stock_management_setup_complete', true);
}
add_action('init', 'headless_configure_stock_management', 15);

/**
 * Configure backorder settings
 * 
 * Sets up default backorder behavior for products.
 * Requirements: 5.4
 */
function headless_configure_backorder_settings() {
    // Only run once
    if (get_option('headless_backorder_setup_complete')) {
        return;
    }
    
    // Default backorder setting for new products
    // Options: 'no', 'notify', 'yes'
    // 'notify' = Allow backorders but notify customer
    update_option('woocommerce_backorders_default', 'notify');
    
    // Mark setup as complete
    update_option('headless_backorder_setup_complete', true);
}
add_action('init', 'headless_configure_backorder_settings', 15);

/**
 * Set default stock management for new products
 * 
 * Ensures new products have stock management enabled by default.
 * Requirements: 5.1
 * 
 * @param int $post_id The product post ID
 * @param WP_Post $post The post object
 * @param bool $update Whether this is an update
 */
function headless_set_default_stock_management($post_id, $post, $update) {
    // Only for new products, not updates
    if ($update) {
        return;
    }
    
    // Only for product post type
    if ($post->post_type !== 'product') {
        return;
    }
    
    // Set manage stock to yes by default
    update_post_meta($post_id, '_manage_stock', 'yes');
    
    // Set default stock status to in stock
    update_post_meta($post_id, '_stock_status', 'instock');
    
    // Set default backorder setting
    update_post_meta($post_id, '_backorders', 'notify');
}
add_action('wp_insert_post', 'headless_set_default_stock_management', 10, 3);

/**
 * Auto-update stock status based on quantity
 * 
 * When stock quantity changes, automatically update stock status.
 * Requirements: 5.2
 * 
 * @param WC_Product $product The product object
 */
function headless_auto_update_stock_status($product) {
    if (!$product->managing_stock()) {
        return;
    }
    
    $stock_quantity = $product->get_stock_quantity();
    $backorders_allowed = $product->backorders_allowed();
    
    // If stock is zero or less and backorders not allowed, set to out of stock
    if ($stock_quantity <= 0 && !$backorders_allowed) {
        $product->set_stock_status('outofstock');
    } elseif ($stock_quantity <= 0 && $backorders_allowed) {
        // Stock is zero but backorders allowed
        $product->set_stock_status('onbackorder');
    } elseif ($stock_quantity > 0) {
        // Stock is positive
        $product->set_stock_status('instock');
    }
}
add_action('woocommerce_product_set_stock', 'headless_auto_update_stock_status', 10, 1);

/**
 * Configure low stock notification email recipient
 * 
 * Sends low stock notifications to the store admin email.
 * Requirements: 5.3
 * 
 * @param string $recipient Current recipient email
 * @param WC_Product $product The product with low stock
 * @return string Modified recipient email
 */
function headless_low_stock_notification_recipient($recipient, $product) {
    // Use the admin email for low stock notifications
    $admin_email = get_option('admin_email');
    
    if (!empty($admin_email)) {
        return $admin_email;
    }
    
    return $recipient;
}
add_filter('woocommerce_email_recipient_low_stock', 'headless_low_stock_notification_recipient', 10, 2);
add_filter('woocommerce_email_recipient_no_stock', 'headless_low_stock_notification_recipient', 10, 2);

/**
 * Add custom low stock threshold per product
 * 
 * Allows setting a custom low stock threshold for individual products.
 * Requirements: 5.3
 * 
 * @param int $threshold The current threshold
 * @param WC_Product $product The product
 * @return int The threshold to use
 */
function headless_custom_low_stock_threshold($threshold, $product) {
    // Check if product has a custom threshold set
    $custom_threshold = $product->get_meta('_custom_low_stock_threshold');
    
    if (!empty($custom_threshold) && is_numeric($custom_threshold)) {
        return (int) $custom_threshold;
    }
    
    // Return default threshold
    return $threshold;
}
add_filter('woocommerce_low_stock_amount', 'headless_custom_low_stock_threshold', 10, 2);

/**
 * Validate stock before adding to cart
 * 
 * Ensures customers cannot add more items than available stock.
 * Requirements: 5.1
 * 
 * @param bool $passed Whether validation passed
 * @param int $product_id The product ID
 * @param int $quantity The quantity being added
 * @param int $variation_id The variation ID (if applicable)
 * @return bool Whether validation passed
 */
function headless_validate_stock_on_add_to_cart($passed, $product_id, $quantity, $variation_id = 0) {
    $product = $variation_id ? wc_get_product($variation_id) : wc_get_product($product_id);
    
    if (!$product || !$product->managing_stock()) {
        return $passed;
    }
    
    $stock_quantity = $product->get_stock_quantity();
    
    // Check if requested quantity exceeds available stock
    if ($stock_quantity !== null && $quantity > $stock_quantity) {
        if (!$product->backorders_allowed()) {
            wc_add_notice(
                sprintf(
                    __('Xin lỗi, chúng tôi chỉ còn %d sản phẩm "%s" trong kho.', 'headless-theme'),
                    $stock_quantity,
                    $product->get_name()
                ),
                'error'
            );
            return false;
        }
    }
    
    return $passed;
}
add_filter('woocommerce_add_to_cart_validation', 'headless_validate_stock_on_add_to_cart', 10, 4);

/**
 * Expose stock management settings via REST API
 * 
 * Adds stock management information to product REST API responses.
 */
function headless_add_stock_info_to_rest_api() {
    register_rest_field('product', 'stock_management_info', array(
        'get_callback' => function($product_arr) {
            $product = wc_get_product($product_arr['id']);
            
            if (!$product) {
                return null;
            }
            
            return array(
                'manage_stock' => $product->managing_stock(),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status' => $product->get_stock_status(),
                'backorders' => $product->get_backorders(),
                'backorders_allowed' => $product->backorders_allowed(),
                'low_stock_amount' => $product->get_low_stock_amount(),
            );
        },
        'schema' => array(
            'description' => 'Stock management information',
            'type' => 'object',
        ),
    ));
}
add_action('rest_api_init', 'headless_add_stock_info_to_rest_api');
