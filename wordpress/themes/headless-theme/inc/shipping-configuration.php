<?php
/**
 * Shipping Configuration for Vietnam
 * 
 * This file configures WooCommerce shipping zones, methods, and rates
 * for the Vietnamese e-commerce store.
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
 * Free shipping threshold in VND
 * Orders above this amount qualify for free shipping
 * Requirements: 9.3
 */
define('HEADLESS_FREE_SHIPPING_THRESHOLD', 500000);

/**
 * Shipping rates configuration
 * Requirements: 9.1, 9.2
 */
define('HEADLESS_SHIPPING_RATES', array(
    'ho_chi_minh' => array(
        'name' => 'Hồ Chí Minh',
        'flat_rate' => 25000,
        'state_code' => 'VN:SG',
    ),
    'ha_noi' => array(
        'name' => 'Hà Nội',
        'flat_rate' => 30000,
        'state_code' => 'VN:HN',
    ),
    'other_provinces' => array(
        'name' => 'Tỉnh Thành Khác',
        'base_rate' => 35000,
        'weight_rate' => 5000, // Per 500g
        'country_code' => 'VN',
    ),
));

/**
 * Setup Vietnam shipping zones on initialization
 * 
 * Creates three shipping zones:
 * - Zone 1: Hồ Chí Minh (flat rate)
 * - Zone 2: Hà Nội (flat rate)
 * - Zone 3: Other provinces (weight-based)
 * 
 * Requirements: 9.1
 */
function headless_setup_vietnam_shipping_zones() {
    // Only run once
    if (get_option('headless_shipping_zones_setup_complete')) {
        return;
    }
    
    // Ensure WooCommerce shipping classes are loaded
    if (!class_exists('WC_Shipping_Zone')) {
        return;
    }
    
    // Delete existing zones first to avoid duplicates
    headless_delete_existing_shipping_zones();
    
    // Zone 1: Ho Chi Minh City
    $zone_hcm = new WC_Shipping_Zone();
    $zone_hcm->set_zone_name('Hồ Chí Minh');
    $zone_hcm->set_zone_order(1);
    $zone_hcm->save();
    
    // Add Ho Chi Minh location (state code SG)
    $zone_hcm->add_location('VN:SG', 'state');
    
    // Add flat rate shipping method for HCM
    $instance_id_hcm = $zone_hcm->add_shipping_method('flat_rate');
    headless_configure_flat_rate_method($instance_id_hcm, 25000, 'Giao hàng tiêu chuẩn');
    
    // Zone 2: Hanoi
    $zone_hn = new WC_Shipping_Zone();
    $zone_hn->set_zone_name('Hà Nội');
    $zone_hn->set_zone_order(2);
    $zone_hn->save();
    
    // Add Hanoi location (state code HN)
    $zone_hn->add_location('VN:HN', 'state');
    
    // Add flat rate shipping method for Hanoi
    $instance_id_hn = $zone_hn->add_shipping_method('flat_rate');
    headless_configure_flat_rate_method($instance_id_hn, 30000, 'Giao hàng tiêu chuẩn');
    
    // Zone 3: Other provinces (rest of Vietnam)
    $zone_other = new WC_Shipping_Zone();
    $zone_other->set_zone_name('Tỉnh Thành Khác');
    $zone_other->set_zone_order(3);
    $zone_other->save();
    
    // Add Vietnam country (will match all states not covered by specific zones)
    $zone_other->add_location('VN', 'country');
    
    // Add flat rate shipping method for other provinces (weight-based will be calculated via filter)
    $instance_id_other = $zone_other->add_shipping_method('flat_rate');
    headless_configure_flat_rate_method($instance_id_other, 35000, 'Giao hàng tiêu chuẩn');
    
    // Mark setup as complete
    update_option('headless_shipping_zones_setup_complete', true);
}
add_action('woocommerce_init', 'headless_setup_vietnam_shipping_zones', 20);

/**
 * Delete existing shipping zones to avoid duplicates
 */
function headless_delete_existing_shipping_zones() {
    global $wpdb;
    
    // Get all zone IDs except zone 0 (rest of the world)
    $zone_ids = $wpdb->get_col("SELECT zone_id FROM {$wpdb->prefix}woocommerce_shipping_zones WHERE zone_id > 0");
    
    foreach ($zone_ids as $zone_id) {
        $zone = new WC_Shipping_Zone($zone_id);
        $zone->delete();
    }
}

/**
 * Configure a flat rate shipping method
 * 
 * @param int $instance_id The shipping method instance ID
 * @param int $cost The shipping cost in VND
 * @param string $title The shipping method title
 */
function headless_configure_flat_rate_method($instance_id, $cost, $title = 'Giao hàng tiêu chuẩn') {
    $option_key = 'woocommerce_flat_rate_' . $instance_id . '_settings';
    
    $settings = array(
        'title' => $title,
        'tax_status' => 'taxable',
        'cost' => $cost,
        'class_costs' => '',
        'no_class_cost' => '',
        'type' => 'class',
    );
    
    update_option($option_key, $settings);
}


/**
 * Calculate weight-based shipping cost for other provinces
 * 
 * Applies weight-based calculation for zones outside HCM and Hanoi.
 * Base rate: 35,000 VND + 5,000 VND per 500g
 * 
 * Requirements: 9.2
 * 
 * @param array $rates Array of shipping rates
 * @param array $package The shipping package
 * @return array Modified shipping rates
 */
function headless_calculate_weight_based_shipping($rates, $package) {
    // Get the shipping destination
    $destination_state = isset($package['destination']['state']) ? $package['destination']['state'] : '';
    $destination_country = isset($package['destination']['country']) ? $package['destination']['country'] : '';
    
    // Only apply weight-based calculation for Vietnam provinces outside HCM and Hanoi
    if ($destination_country !== 'VN') {
        return $rates;
    }
    
    // HCM (SG) and Hanoi (HN) use flat rate, skip weight calculation
    if (in_array($destination_state, array('SG', 'HN'))) {
        return $rates;
    }
    
    // Calculate total weight of the package
    $total_weight = 0;
    foreach ($package['contents'] as $item) {
        $product = $item['data'];
        $weight = $product->get_weight();
        
        if ($weight) {
            // Convert weight to grams if needed (assuming weight is in kg)
            $weight_in_grams = floatval($weight) * 1000;
            $total_weight += $weight_in_grams * $item['quantity'];
        }
    }
    
    // Calculate weight-based cost
    // Base rate: 35,000 VND
    // Additional: 5,000 VND per 500g (or part thereof)
    $base_rate = 35000;
    $weight_rate = 5000; // Per 500g
    $weight_unit = 500; // grams
    
    // Calculate additional weight cost
    $additional_weight_units = ceil($total_weight / $weight_unit);
    $weight_cost = $additional_weight_units > 0 ? ($additional_weight_units - 1) * $weight_rate : 0;
    
    $total_shipping_cost = $base_rate + $weight_cost;
    
    // Update the shipping rate cost
    foreach ($rates as $rate_key => $rate) {
        if ($rate->method_id === 'flat_rate') {
            // Check if this is for "other provinces" zone
            $zone = WC_Shipping_Zones::get_zone_matching_package($package);
            if ($zone && $zone->get_zone_name() === 'Tỉnh Thành Khác') {
                $rates[$rate_key]->cost = $total_shipping_cost;
                $rates[$rate_key]->label = sprintf(
                    'Giao hàng tiêu chuẩn (%s)',
                    wc_price($total_shipping_cost)
                );
            }
        }
    }
    
    return $rates;
}
add_filter('woocommerce_package_rates', 'headless_calculate_weight_based_shipping', 10, 2);

/**
 * Apply free shipping for orders above threshold
 * 
 * When cart subtotal is >= 500,000 VND, shipping is free.
 * 
 * Requirements: 9.3
 * 
 * @param array $rates Array of shipping rates
 * @param array $package The shipping package
 * @return array Modified shipping rates with free shipping applied
 */
function headless_apply_free_shipping_threshold($rates, $package) {
    // Get cart subtotal (excluding tax)
    $cart_subtotal = WC()->cart->get_subtotal();
    
    // Check if subtotal meets free shipping threshold
    if ($cart_subtotal >= HEADLESS_FREE_SHIPPING_THRESHOLD) {
        foreach ($rates as $rate_key => $rate) {
            // Set cost to 0 for all shipping methods
            $rates[$rate_key]->cost = 0;
            $rates[$rate_key]->label = 'Miễn phí vận chuyển';
            
            // Also set taxes to 0
            if (isset($rates[$rate_key]->taxes)) {
                $rates[$rate_key]->taxes = array();
            }
        }
    }
    
    return $rates;
}
add_filter('woocommerce_package_rates', 'headless_apply_free_shipping_threshold', 20, 2);

/**
 * Get shipping zone for a given address
 * 
 * Helper function to determine which shipping zone applies to an address.
 * 
 * @param string $country Country code
 * @param string $state State code
 * @return array|null Zone information or null if not found
 */
function headless_get_shipping_zone_for_address($country, $state) {
    if ($country !== 'VN') {
        return null;
    }
    
    // Check for specific zones
    if ($state === 'SG') {
        return array(
            'name' => 'Hồ Chí Minh',
            'type' => 'flat_rate',
            'rate' => 25000,
        );
    }
    
    if ($state === 'HN') {
        return array(
            'name' => 'Hà Nội',
            'type' => 'flat_rate',
            'rate' => 30000,
        );
    }
    
    // Default to other provinces
    return array(
        'name' => 'Tỉnh Thành Khác',
        'type' => 'weight_based',
        'base_rate' => 35000,
        'weight_rate' => 5000,
        'weight_unit' => 500,
    );
}

/**
 * Calculate shipping cost for a given zone and weight
 * 
 * Helper function to calculate shipping cost based on zone and package weight.
 * 
 * @param array $zone Zone information from headless_get_shipping_zone_for_address
 * @param float $weight_in_grams Total package weight in grams
 * @param float $cart_subtotal Cart subtotal for free shipping check
 * @return float Shipping cost in VND
 */
function headless_calculate_shipping_cost($zone, $weight_in_grams = 0, $cart_subtotal = 0) {
    // Check for free shipping threshold first
    if ($cart_subtotal >= HEADLESS_FREE_SHIPPING_THRESHOLD) {
        return 0;
    }
    
    if (!$zone) {
        return 0;
    }
    
    // Flat rate zones (HCM and Hanoi)
    if ($zone['type'] === 'flat_rate') {
        return $zone['rate'];
    }
    
    // Weight-based zone (other provinces)
    if ($zone['type'] === 'weight_based') {
        $base_rate = $zone['base_rate'];
        $weight_rate = $zone['weight_rate'];
        $weight_unit = $zone['weight_unit'];
        
        // Calculate additional weight units
        $additional_units = ceil($weight_in_grams / $weight_unit);
        $weight_cost = $additional_units > 0 ? ($additional_units - 1) * $weight_rate : 0;
        
        return $base_rate + $weight_cost;
    }
    
    return 0;
}

/**
 * Check if free shipping applies to a given subtotal
 * 
 * @param float $subtotal Cart subtotal in VND
 * @return bool True if free shipping applies
 */
function headless_qualifies_for_free_shipping($subtotal) {
    return $subtotal >= HEADLESS_FREE_SHIPPING_THRESHOLD;
}

/**
 * Get free shipping threshold value
 * 
 * @return int Free shipping threshold in VND
 */
function headless_get_free_shipping_threshold() {
    return HEADLESS_FREE_SHIPPING_THRESHOLD;
}

/**
 * Add shipping information to REST API
 * 
 * Exposes shipping zone and rate information via REST API.
 */
function headless_add_shipping_info_to_rest_api() {
    register_rest_route('headless/v1', '/shipping/zones', array(
        'methods' => 'GET',
        'callback' => 'headless_get_shipping_zones_api',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('headless/v1', '/shipping/calculate', array(
        'methods' => 'POST',
        'callback' => 'headless_calculate_shipping_api',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'headless_add_shipping_info_to_rest_api');

/**
 * REST API callback to get shipping zones
 * 
 * @return WP_REST_Response
 */
function headless_get_shipping_zones_api() {
    $zones = array(
        array(
            'name' => 'Hồ Chí Minh',
            'state_code' => 'SG',
            'type' => 'flat_rate',
            'rate' => 25000,
            'rate_formatted' => wc_price(25000),
        ),
        array(
            'name' => 'Hà Nội',
            'state_code' => 'HN',
            'type' => 'flat_rate',
            'rate' => 30000,
            'rate_formatted' => wc_price(30000),
        ),
        array(
            'name' => 'Tỉnh Thành Khác',
            'state_code' => '*',
            'type' => 'weight_based',
            'base_rate' => 35000,
            'base_rate_formatted' => wc_price(35000),
            'weight_rate' => 5000,
            'weight_rate_formatted' => wc_price(5000),
            'weight_unit' => '500g',
        ),
    );
    
    return new WP_REST_Response(array(
        'zones' => $zones,
        'free_shipping_threshold' => HEADLESS_FREE_SHIPPING_THRESHOLD,
        'free_shipping_threshold_formatted' => wc_price(HEADLESS_FREE_SHIPPING_THRESHOLD),
    ), 200);
}

/**
 * REST API callback to calculate shipping
 * 
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function headless_calculate_shipping_api($request) {
    $country = $request->get_param('country') ?? 'VN';
    $state = $request->get_param('state') ?? '';
    $weight = floatval($request->get_param('weight') ?? 0);
    $subtotal = floatval($request->get_param('subtotal') ?? 0);
    
    $zone = headless_get_shipping_zone_for_address($country, $state);
    $cost = headless_calculate_shipping_cost($zone, $weight, $subtotal);
    $free_shipping = headless_qualifies_for_free_shipping($subtotal);
    
    return new WP_REST_Response(array(
        'zone' => $zone,
        'shipping_cost' => $cost,
        'shipping_cost_formatted' => wc_price($cost),
        'free_shipping' => $free_shipping,
        'free_shipping_threshold' => HEADLESS_FREE_SHIPPING_THRESHOLD,
    ), 200);
}

/**
 * Display free shipping progress message in cart
 * 
 * Shows customers how much more they need to spend for free shipping.
 */
function headless_display_free_shipping_progress() {
    if (!WC()->cart) {
        return;
    }
    
    $cart_subtotal = WC()->cart->get_subtotal();
    $threshold = HEADLESS_FREE_SHIPPING_THRESHOLD;
    
    if ($cart_subtotal < $threshold) {
        $remaining = $threshold - $cart_subtotal;
        $message = sprintf(
            __('Mua thêm %s để được miễn phí vận chuyển!', 'headless-theme'),
            wc_price($remaining)
        );
        wc_add_notice($message, 'notice');
    }
}
add_action('woocommerce_before_cart', 'headless_display_free_shipping_progress');
