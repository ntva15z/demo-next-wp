<?php
/**
 * WooCommerce Configuration for Headless Setup
 * 
 * This file configures WooCommerce for the Vietnamese e-commerce store.
 * It sets up currency, country, tax settings, and other core configurations.
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
 * Set default currency to Vietnamese Dong (VND)
 * 
 * @param string $currency Current currency code
 * @return string VND currency code
 */
function headless_woocommerce_currency($currency) {
    return 'VND';
}
add_filter('woocommerce_currency', 'headless_woocommerce_currency');

/**
 * Set default country to Vietnam
 * 
 * @param string $country Current country code
 * @return string VN country code
 */
function headless_woocommerce_base_country($country) {
    return 'VN';
}
add_filter('woocommerce_countries_base_country', 'headless_woocommerce_base_country');

/**
 * Set default state/province to Ho Chi Minh City
 * 
 * @param string $state Current state code
 * @return string SG state code (Ho Chi Minh City)
 */
function headless_woocommerce_base_state($state) {
    return 'SG';
}
add_filter('woocommerce_countries_base_state', 'headless_woocommerce_base_state');

/**
 * Configure WooCommerce general settings on activation
 */
function headless_woocommerce_setup_options() {
    // Only run once
    if (get_option('headless_woocommerce_setup_complete')) {
        return;
    }
    
    // Currency settings
    update_option('woocommerce_currency', 'VND');
    update_option('woocommerce_currency_pos', 'right_space');
    update_option('woocommerce_price_thousand_sep', '.');
    update_option('woocommerce_price_decimal_sep', ',');
    update_option('woocommerce_price_num_decimals', 0);
    
    // Location settings
    update_option('woocommerce_default_country', 'VN:SG');
    update_option('woocommerce_allowed_countries', 'specific');
    update_option('woocommerce_specific_allowed_countries', array('VN'));
    
    // Store address
    update_option('woocommerce_store_address', '');
    update_option('woocommerce_store_address_2', '');
    update_option('woocommerce_store_city', 'Hồ Chí Minh');
    update_option('woocommerce_store_postcode', '700000');
    
    // Enable taxes
    update_option('woocommerce_calc_taxes', 'yes');
    
    // Mark setup as complete
    update_option('headless_woocommerce_setup_complete', true);
}
add_action('init', 'headless_woocommerce_setup_options', 5);

/**
 * Configure Vietnam tax rates
 * Sets up VAT (10%) for Vietnam
 */
function headless_setup_vietnam_tax_rates() {
    global $wpdb;
    
    // Only run once
    if (get_option('headless_vietnam_tax_setup_complete')) {
        return;
    }
    
    // Check if tax rates table exists
    $table_name = $wpdb->prefix . 'woocommerce_tax_rates';
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") !== $table_name) {
        return;
    }
    
    // Check if Vietnam tax rate already exists
    $existing_rate = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT tax_rate_id FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_country = %s AND tax_rate_name = %s",
            'VN',
            'VAT'
        )
    );
    
    if (!$existing_rate) {
        // Insert Vietnam VAT rate (10%)
        $wpdb->insert(
            $wpdb->prefix . 'woocommerce_tax_rates',
            array(
                'tax_rate_country'  => 'VN',
                'tax_rate_state'    => '',
                'tax_rate'          => '10.0000',
                'tax_rate_name'     => 'VAT',
                'tax_rate_priority' => 1,
                'tax_rate_compound' => 0,
                'tax_rate_shipping' => 1,
                'tax_rate_order'    => 1,
                'tax_rate_class'    => '',
            ),
            array('%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%s')
        );
    }
    
    // Mark tax setup as complete
    update_option('headless_vietnam_tax_setup_complete', true);
}
add_action('init', 'headless_setup_vietnam_tax_rates', 10);

/**
 * Configure tax display settings
 */
function headless_configure_tax_display() {
    // Only run once
    if (get_option('headless_tax_display_setup_complete')) {
        return;
    }
    
    // Tax calculation settings
    update_option('woocommerce_prices_include_tax', 'yes');
    update_option('woocommerce_tax_based_on', 'shipping');
    update_option('woocommerce_shipping_tax_class', 'inherit');
    update_option('woocommerce_tax_round_at_subtotal', 'no');
    
    // Tax display settings
    update_option('woocommerce_tax_display_shop', 'incl');
    update_option('woocommerce_tax_display_cart', 'incl');
    update_option('woocommerce_price_display_suffix', '');
    update_option('woocommerce_tax_total_display', 'itemized');
    
    // Mark setup as complete
    update_option('headless_tax_display_setup_complete', true);
}
add_action('init', 'headless_configure_tax_display', 10);

/**
 * Format VND currency without decimals
 * 
 * @param string $formatted_price Formatted price string
 * @param array $args Price formatting arguments
 * @param float $unformatted_price Raw price value
 * @param string $original_price Original price string
 * @return string Formatted price for VND
 */
function headless_format_vnd_price($formatted_price, $args, $unformatted_price, $original_price) {
    if (get_woocommerce_currency() === 'VND') {
        // Remove decimals for VND
        $formatted_price = number_format($unformatted_price, 0, ',', '.') . ' ₫';
    }
    return $formatted_price;
}
add_filter('wc_price', 'headless_format_vnd_price', 10, 4);

/**
 * Add WooCommerce support to theme
 */
function headless_add_woocommerce_support() {
    add_theme_support('woocommerce', array(
        'thumbnail_image_width' => 400,
        'single_image_width'    => 800,
        'product_grid'          => array(
            'default_rows'    => 4,
            'min_rows'        => 1,
            'max_rows'        => 10,
            'default_columns' => 4,
            'min_columns'     => 1,
            'max_columns'     => 6,
        ),
    ));
    
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'headless_add_woocommerce_support');

/**
 * Disable WooCommerce frontend styles and scripts for headless setup
 * Since we're using NextJS for the frontend, we don't need WooCommerce's frontend assets
 */
function headless_disable_woocommerce_frontend_assets() {
    // Only disable on frontend, not admin
    if (is_admin()) {
        return;
    }
    
    // Dequeue WooCommerce styles
    wp_dequeue_style('woocommerce-general');
    wp_dequeue_style('woocommerce-layout');
    wp_dequeue_style('woocommerce-smallscreen');
    
    // Dequeue WooCommerce scripts
    wp_dequeue_script('wc-cart-fragments');
    wp_dequeue_script('woocommerce');
    wp_dequeue_script('wc-add-to-cart');
}
add_action('wp_enqueue_scripts', 'headless_disable_woocommerce_frontend_assets', 99);
