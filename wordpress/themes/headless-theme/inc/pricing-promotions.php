<?php
/**
 * Pricing and Promotions Configuration
 * 
 * This file configures WooCommerce pricing features including:
 * - Sale price scheduling
 * - Coupon system configuration
 * - Discount rules and restrictions
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

// ============================================
// Sale Price Scheduling Configuration
// Requirements: 6.2
// ============================================

/**
 * Configure sale price scheduling settings
 * 
 * Enables scheduled sale prices with date-based activation.
 * WooCommerce has built-in support for scheduled sales, this ensures
 * the feature is properly configured.
 */
function headless_configure_sale_scheduling() {
    // Only run once
    if (get_option('headless_sale_scheduling_setup_complete')) {
        return;
    }
    
    // Enable sale price scheduling (this is enabled by default in WooCommerce)
    // We ensure the cron job for scheduled sales is properly set up
    if (!wp_next_scheduled('woocommerce_scheduled_sales')) {
        wp_schedule_event(time(), 'twicedaily', 'woocommerce_scheduled_sales');
    }
    
    // Mark setup as complete
    update_option('headless_sale_scheduling_setup_complete', true);
}
add_action('init', 'headless_configure_sale_scheduling', 15);

/**
 * Process scheduled sales more frequently
 * 
 * By default, WooCommerce checks scheduled sales twice daily.
 * This adds an hourly check for more precise sale activation.
 */
function headless_add_hourly_sale_check() {
    if (!wp_next_scheduled('headless_hourly_sale_check')) {
        wp_schedule_event(time(), 'hourly', 'headless_hourly_sale_check');
    }
}
add_action('init', 'headless_add_hourly_sale_check');

/**
 * Hourly sale check callback
 * 
 * Triggers WooCommerce's scheduled sales processing.
 */
function headless_process_hourly_sales() {
    if (class_exists('WC_Product_Data_Store_CPT')) {
        $data_store = WC_Data_Store::load('product');
        if (method_exists($data_store, 'get_starting_sales') && method_exists($data_store, 'get_ending_sales')) {
            // Get products with sales starting today
            $starting_sales = $data_store->get_starting_sales();
            foreach ($starting_sales as $product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $product->set_date_on_sale_from('');
                    $product->save();
                }
            }
            
            // Get products with sales ending today
            $ending_sales = $data_store->get_ending_sales();
            foreach ($ending_sales as $product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $product->set_date_on_sale_to('');
                    $product->set_sale_price('');
                    $product->save();
                }
            }
        }
    }
}
add_action('headless_hourly_sale_check', 'headless_process_hourly_sales');

/**
 * Validate sale price dates
 * 
 * Ensures sale start date is before end date when saving products.
 * 
 * @param int $product_id The product ID being saved
 */
function headless_validate_sale_dates($product_id) {
    $product = wc_get_product($product_id);
    
    if (!$product) {
        return;
    }
    
    $sale_from = $product->get_date_on_sale_from();
    $sale_to = $product->get_date_on_sale_to();
    
    // If both dates are set, validate that from < to
    if ($sale_from && $sale_to) {
        if ($sale_from->getTimestamp() >= $sale_to->getTimestamp()) {
            // Clear invalid dates
            $product->set_date_on_sale_from('');
            $product->set_date_on_sale_to('');
            $product->save();
            
            // Add admin notice
            if (is_admin()) {
                add_action('admin_notices', function() {
                    echo '<div class="notice notice-error"><p>';
                    echo esc_html__('Sale start date must be before end date. Sale dates have been cleared.', 'headless-theme');
                    echo '</p></div>';
                });
            }
        }
    }
}
add_action('woocommerce_update_product', 'headless_validate_sale_dates', 20);

/**
 * Check if a product is currently on scheduled sale
 * 
 * @param WC_Product $product The product to check
 * @return bool True if product is on scheduled sale
 */
function headless_is_on_scheduled_sale($product) {
    if (!$product) {
        return false;
    }
    
    $sale_price = $product->get_sale_price();
    if (empty($sale_price)) {
        return false;
    }
    
    $now = current_time('timestamp', true);
    $sale_from = $product->get_date_on_sale_from();
    $sale_to = $product->get_date_on_sale_to();
    
    // Check if within sale period
    $sale_started = !$sale_from || $sale_from->getTimestamp() <= $now;
    $sale_not_ended = !$sale_to || $sale_to->getTimestamp() >= $now;
    
    return $sale_started && $sale_not_ended;
}

/**
 * Expose sale schedule info via REST API
 */
function headless_add_sale_schedule_to_rest_api() {
    register_rest_field('product', 'sale_schedule_info', array(
        'get_callback' => function($product_arr) {
            $product = wc_get_product($product_arr['id']);
            
            if (!$product) {
                return null;
            }
            
            $sale_from = $product->get_date_on_sale_from();
            $sale_to = $product->get_date_on_sale_to();
            
            return array(
                'on_sale' => $product->is_on_sale(),
                'sale_price' => $product->get_sale_price(),
                'regular_price' => $product->get_regular_price(),
                'sale_from' => $sale_from ? $sale_from->date('Y-m-d H:i:s') : null,
                'sale_to' => $sale_to ? $sale_to->date('Y-m-d H:i:s') : null,
                'is_scheduled_sale' => headless_is_on_scheduled_sale($product),
            );
        },
        'schema' => array(
            'description' => 'Sale schedule information',
            'type' => 'object',
        ),
    ));
}
add_action('rest_api_init', 'headless_add_sale_schedule_to_rest_api');


// ============================================
// Coupon System Configuration
// Requirements: 6.3, 6.4
// ============================================

/**
 * Configure coupon system settings
 * 
 * Enables and configures the WooCommerce coupon system with support for:
 * - Percentage discounts
 * - Fixed amount discounts
 * - Free shipping coupons
 * - Usage restrictions
 */
function headless_configure_coupon_system() {
    // Only run once
    if (get_option('headless_coupon_system_setup_complete')) {
        return;
    }
    
    // Enable coupons
    update_option('woocommerce_enable_coupons', 'yes');
    
    // Calculate coupon discounts sequentially
    update_option('woocommerce_calc_discounts_sequentially', 'yes');
    
    // Mark setup as complete
    update_option('headless_coupon_system_setup_complete', true);
}
add_action('init', 'headless_configure_coupon_system', 15);

/**
 * Validate coupon minimum order amount
 * 
 * Enforces minimum order amount restriction for coupons.
 * Requirements: 6.4
 * 
 * @param bool $valid Whether the coupon is valid
 * @param WC_Coupon $coupon The coupon being validated
 * @param WC_Discounts $discounts The discounts object
 * @return bool|WP_Error Whether the coupon is valid or error
 */
function headless_validate_coupon_minimum_amount($valid, $coupon, $discounts) {
    if (!$valid || is_wp_error($valid)) {
        return $valid;
    }
    
    $minimum_amount = $coupon->get_minimum_amount();
    
    if ($minimum_amount > 0) {
        $cart_subtotal = WC()->cart ? WC()->cart->get_subtotal() : 0;
        
        if ($cart_subtotal < $minimum_amount) {
            return new WP_Error(
                'coupon_min_amount_not_met',
                sprintf(
                    __('Đơn hàng tối thiểu phải đạt %s để sử dụng mã giảm giá này.', 'headless-theme'),
                    wc_price($minimum_amount)
                )
            );
        }
    }
    
    return $valid;
}
add_filter('woocommerce_coupon_is_valid', 'headless_validate_coupon_minimum_amount', 10, 3);

/**
 * Validate coupon usage limits
 * 
 * Enforces per-coupon and per-user usage limits.
 * Requirements: 6.4
 * 
 * @param bool $valid Whether the coupon is valid
 * @param WC_Coupon $coupon The coupon being validated
 * @param WC_Discounts $discounts The discounts object
 * @return bool|WP_Error Whether the coupon is valid or error
 */
function headless_validate_coupon_usage_limits($valid, $coupon, $discounts) {
    if (!$valid || is_wp_error($valid)) {
        return $valid;
    }
    
    // Check total usage limit
    $usage_limit = $coupon->get_usage_limit();
    $usage_count = $coupon->get_usage_count();
    
    if ($usage_limit > 0 && $usage_count >= $usage_limit) {
        return new WP_Error(
            'coupon_usage_limit_reached',
            __('Mã giảm giá này đã hết lượt sử dụng.', 'headless-theme')
        );
    }
    
    // Check per-user usage limit
    $usage_limit_per_user = $coupon->get_usage_limit_per_user();
    
    if ($usage_limit_per_user > 0) {
        $current_user_id = get_current_user_id();
        
        if ($current_user_id > 0) {
            $used_by = $coupon->get_used_by();
            $user_usage_count = count(array_filter($used_by, function($user) use ($current_user_id) {
                return (int) $user === $current_user_id;
            }));
            
            if ($user_usage_count >= $usage_limit_per_user) {
                return new WP_Error(
                    'coupon_user_usage_limit_reached',
                    __('Bạn đã sử dụng hết lượt cho mã giảm giá này.', 'headless-theme')
                );
            }
        }
    }
    
    return $valid;
}
add_filter('woocommerce_coupon_is_valid', 'headless_validate_coupon_usage_limits', 15, 3);

/**
 * Create sample coupons for testing
 * 
 * Creates example coupons demonstrating different discount types.
 * Only runs in development environment.
 */
function headless_create_sample_coupons() {
    // Only run once and only in development
    if (get_option('headless_sample_coupons_created') || !defined('WP_DEBUG') || !WP_DEBUG) {
        return;
    }
    
    // Sample percentage discount coupon
    $percentage_coupon = array(
        'post_title' => 'GIAM10',
        'post_content' => '',
        'post_status' => 'publish',
        'post_type' => 'shop_coupon',
    );
    
    $coupon_id = wp_insert_post($percentage_coupon);
    if ($coupon_id && !is_wp_error($coupon_id)) {
        update_post_meta($coupon_id, 'discount_type', 'percent');
        update_post_meta($coupon_id, 'coupon_amount', '10');
        update_post_meta($coupon_id, 'individual_use', 'no');
        update_post_meta($coupon_id, 'usage_limit', '100');
        update_post_meta($coupon_id, 'usage_limit_per_user', '1');
        update_post_meta($coupon_id, 'minimum_amount', '200000');
        update_post_meta($coupon_id, 'maximum_amount', '');
    }
    
    // Sample fixed amount discount coupon
    $fixed_coupon = array(
        'post_title' => 'GIAM50K',
        'post_content' => '',
        'post_status' => 'publish',
        'post_type' => 'shop_coupon',
    );
    
    $coupon_id = wp_insert_post($fixed_coupon);
    if ($coupon_id && !is_wp_error($coupon_id)) {
        update_post_meta($coupon_id, 'discount_type', 'fixed_cart');
        update_post_meta($coupon_id, 'coupon_amount', '50000');
        update_post_meta($coupon_id, 'individual_use', 'no');
        update_post_meta($coupon_id, 'usage_limit', '50');
        update_post_meta($coupon_id, 'usage_limit_per_user', '2');
        update_post_meta($coupon_id, 'minimum_amount', '300000');
        update_post_meta($coupon_id, 'maximum_amount', '');
    }
    
    // Sample free shipping coupon
    $shipping_coupon = array(
        'post_title' => 'FREESHIP',
        'post_content' => '',
        'post_status' => 'publish',
        'post_type' => 'shop_coupon',
    );
    
    $coupon_id = wp_insert_post($shipping_coupon);
    if ($coupon_id && !is_wp_error($coupon_id)) {
        update_post_meta($coupon_id, 'discount_type', 'percent');
        update_post_meta($coupon_id, 'coupon_amount', '0');
        update_post_meta($coupon_id, 'free_shipping', 'yes');
        update_post_meta($coupon_id, 'individual_use', 'no');
        update_post_meta($coupon_id, 'usage_limit', '');
        update_post_meta($coupon_id, 'usage_limit_per_user', '');
        update_post_meta($coupon_id, 'minimum_amount', '100000');
        update_post_meta($coupon_id, 'maximum_amount', '');
    }
    
    // Mark as complete
    update_option('headless_sample_coupons_created', true);
}
add_action('init', 'headless_create_sample_coupons', 20);

/**
 * Expose coupon validation info via REST API
 */
function headless_add_coupon_info_to_rest_api() {
    register_rest_field('shop_coupon', 'coupon_restrictions', array(
        'get_callback' => function($coupon_arr) {
            $coupon = new WC_Coupon($coupon_arr['id']);
            
            if (!$coupon) {
                return null;
            }
            
            return array(
                'discount_type' => $coupon->get_discount_type(),
                'amount' => $coupon->get_amount(),
                'minimum_amount' => $coupon->get_minimum_amount(),
                'maximum_amount' => $coupon->get_maximum_amount(),
                'usage_limit' => $coupon->get_usage_limit(),
                'usage_limit_per_user' => $coupon->get_usage_limit_per_user(),
                'usage_count' => $coupon->get_usage_count(),
                'free_shipping' => $coupon->get_free_shipping(),
                'individual_use' => $coupon->get_individual_use(),
                'exclude_sale_items' => $coupon->get_exclude_sale_items(),
            );
        },
        'schema' => array(
            'description' => 'Coupon restriction information',
            'type' => 'object',
        ),
    ));
}
add_action('rest_api_init', 'headless_add_coupon_info_to_rest_api');

/**
 * Helper function to check if coupon is applicable to cart
 * 
 * @param string $coupon_code The coupon code to check
 * @return array Result with is_valid and message
 */
function headless_check_coupon_applicability($coupon_code) {
    $coupon = new WC_Coupon($coupon_code);
    
    if (!$coupon->get_id()) {
        return array(
            'is_valid' => false,
            'message' => __('Mã giảm giá không tồn tại.', 'headless-theme'),
            'error_code' => 'invalid_coupon',
        );
    }
    
    // Check if coupon is expired
    $expiry_date = $coupon->get_date_expires();
    if ($expiry_date && $expiry_date->getTimestamp() < current_time('timestamp', true)) {
        return array(
            'is_valid' => false,
            'message' => __('Mã giảm giá đã hết hạn.', 'headless-theme'),
            'error_code' => 'coupon_expired',
        );
    }
    
    // Check minimum amount
    $minimum_amount = $coupon->get_minimum_amount();
    $cart_subtotal = WC()->cart ? WC()->cart->get_subtotal() : 0;
    
    if ($minimum_amount > 0 && $cart_subtotal < $minimum_amount) {
        return array(
            'is_valid' => false,
            'message' => sprintf(
                __('Đơn hàng tối thiểu phải đạt %s để sử dụng mã giảm giá này.', 'headless-theme'),
                wc_price($minimum_amount)
            ),
            'error_code' => 'coupon_min_amount_not_met',
            'minimum_amount' => $minimum_amount,
            'cart_subtotal' => $cart_subtotal,
        );
    }
    
    // Check usage limit
    $usage_limit = $coupon->get_usage_limit();
    $usage_count = $coupon->get_usage_count();
    
    if ($usage_limit > 0 && $usage_count >= $usage_limit) {
        return array(
            'is_valid' => false,
            'message' => __('Mã giảm giá này đã hết lượt sử dụng.', 'headless-theme'),
            'error_code' => 'coupon_usage_limit_reached',
        );
    }
    
    return array(
        'is_valid' => true,
        'message' => __('Mã giảm giá hợp lệ.', 'headless-theme'),
        'discount_type' => $coupon->get_discount_type(),
        'amount' => $coupon->get_amount(),
        'free_shipping' => $coupon->get_free_shipping(),
    );
}
