<?php
/**
 * Customer Account Configuration
 * 
 * Configures customer registration, account features, and multiple shipping addresses.
 * 
 * Requirements: 10.1, 10.3, 10.4
 * 
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enable customer registration on WooCommerce
 */
function headless_enable_customer_registration() {
    // Enable registration on "My Account" page
    update_option('woocommerce_enable_myaccount_registration', 'yes');
    
    // Enable registration during checkout
    update_option('woocommerce_enable_signup_and_login_from_checkout', 'yes');
    
    // Enable guest checkout (optional, but good for flexibility)
    update_option('woocommerce_enable_guest_checkout', 'yes');
    
    // Generate username from email
    update_option('woocommerce_registration_generate_username', 'yes');
    
    // Generate password automatically (user can change later)
    update_option('woocommerce_registration_generate_password', 'no');
}
add_action('init', 'headless_enable_customer_registration');

/**
 * Configure registration form fields
 * Adds additional fields to the registration form
 */
function headless_registration_form_fields() {
    // First name field
    woocommerce_form_field('billing_first_name', array(
        'type'        => 'text',
        'label'       => __('Họ', 'headless-theme'),
        'placeholder' => __('Nhập họ của bạn', 'headless-theme'),
        'required'    => true,
        'class'       => array('form-row-first'),
    ));
    
    // Last name field
    woocommerce_form_field('billing_last_name', array(
        'type'        => 'text',
        'label'       => __('Tên', 'headless-theme'),
        'placeholder' => __('Nhập tên của bạn', 'headless-theme'),
        'required'    => true,
        'class'       => array('form-row-last'),
    ));
    
    // Phone field
    woocommerce_form_field('billing_phone', array(
        'type'        => 'tel',
        'label'       => __('Số điện thoại', 'headless-theme'),
        'placeholder' => __('Nhập số điện thoại', 'headless-theme'),
        'required'    => true,
        'class'       => array('form-row-wide'),
    ));
}
add_action('woocommerce_register_form_start', 'headless_registration_form_fields');

/**
 * Validate registration form fields
 */
function headless_validate_registration_fields($errors, $username, $email) {
    // Validate first name
    if (isset($_POST['billing_first_name']) && empty($_POST['billing_first_name'])) {
        $errors->add('billing_first_name_error', __('Vui lòng nhập họ của bạn.', 'headless-theme'));
    }
    
    // Validate last name
    if (isset($_POST['billing_last_name']) && empty($_POST['billing_last_name'])) {
        $errors->add('billing_last_name_error', __('Vui lòng nhập tên của bạn.', 'headless-theme'));
    }
    
    // Validate phone
    if (isset($_POST['billing_phone']) && empty($_POST['billing_phone'])) {
        $errors->add('billing_phone_error', __('Vui lòng nhập số điện thoại.', 'headless-theme'));
    }
    
    // Validate phone format (Vietnamese phone numbers)
    if (isset($_POST['billing_phone']) && !empty($_POST['billing_phone'])) {
        $phone = sanitize_text_field($_POST['billing_phone']);
        if (!preg_match('/^(0|\+84)[0-9]{9,10}$/', $phone)) {
            $errors->add('billing_phone_format_error', __('Số điện thoại không hợp lệ.', 'headless-theme'));
        }
    }
    
    return $errors;
}
add_filter('woocommerce_registration_errors', 'headless_validate_registration_fields', 10, 3);

/**
 * Save registration form fields to user meta
 */
function headless_save_registration_fields($customer_id) {
    if (isset($_POST['billing_first_name'])) {
        update_user_meta($customer_id, 'billing_first_name', sanitize_text_field($_POST['billing_first_name']));
        update_user_meta($customer_id, 'first_name', sanitize_text_field($_POST['billing_first_name']));
    }
    
    if (isset($_POST['billing_last_name'])) {
        update_user_meta($customer_id, 'billing_last_name', sanitize_text_field($_POST['billing_last_name']));
        update_user_meta($customer_id, 'last_name', sanitize_text_field($_POST['billing_last_name']));
    }
    
    if (isset($_POST['billing_phone'])) {
        update_user_meta($customer_id, 'billing_phone', sanitize_text_field($_POST['billing_phone']));
    }
}
add_action('woocommerce_created_customer', 'headless_save_registration_fields');

/**
 * Get customer profile data
 * 
 * @param int $customer_id Customer ID
 * @return array Customer profile data
 */
function headless_get_customer_profile($customer_id) {
    if (!$customer_id) {
        return null;
    }
    
    $customer = new WC_Customer($customer_id);
    
    return array(
        'id'           => $customer_id,
        'email'        => $customer->get_email(),
        'first_name'   => $customer->get_first_name(),
        'last_name'    => $customer->get_last_name(),
        'display_name' => $customer->get_display_name(),
        'date_created' => $customer->get_date_created() ? $customer->get_date_created()->format('c') : null,
        'billing'      => array(
            'first_name' => $customer->get_billing_first_name(),
            'last_name'  => $customer->get_billing_last_name(),
            'company'    => $customer->get_billing_company(),
            'address_1'  => $customer->get_billing_address_1(),
            'address_2'  => $customer->get_billing_address_2(),
            'city'       => $customer->get_billing_city(),
            'state'      => $customer->get_billing_state(),
            'postcode'   => $customer->get_billing_postcode(),
            'country'    => $customer->get_billing_country(),
            'email'      => $customer->get_billing_email(),
            'phone'      => $customer->get_billing_phone(),
        ),
        'shipping'     => array(
            'first_name' => $customer->get_shipping_first_name(),
            'last_name'  => $customer->get_shipping_last_name(),
            'company'    => $customer->get_shipping_company(),
            'address_1'  => $customer->get_shipping_address_1(),
            'address_2'  => $customer->get_shipping_address_2(),
            'city'       => $customer->get_shipping_city(),
            'state'      => $customer->get_shipping_state(),
            'postcode'   => $customer->get_shipping_postcode(),
            'country'    => $customer->get_shipping_country(),
        ),
        'is_paying_customer' => $customer->get_is_paying_customer(),
        'order_count'        => $customer->get_order_count(),
        'total_spent'        => $customer->get_total_spent(),
    );
}



// ============================================
// Multiple Shipping Addresses Feature
// Requirements: 10.4
// ============================================

/**
 * Meta key for storing multiple shipping addresses
 */
define('HEADLESS_SHIPPING_ADDRESSES_META_KEY', '_headless_shipping_addresses');

/**
 * Maximum number of shipping addresses per customer
 */
define('HEADLESS_MAX_SHIPPING_ADDRESSES', 10);

/**
 * Get all shipping addresses for a customer
 * 
 * @param int $customer_id Customer ID
 * @return array Array of shipping addresses
 */
function headless_get_shipping_addresses($customer_id) {
    if (!$customer_id) {
        return array();
    }
    
    $addresses = get_user_meta($customer_id, HEADLESS_SHIPPING_ADDRESSES_META_KEY, true);
    
    if (!is_array($addresses)) {
        return array();
    }
    
    return $addresses;
}

/**
 * Add a new shipping address for a customer
 * 
 * @param int $customer_id Customer ID
 * @param array $address Address data
 * @return array Result with 'success' boolean and 'address_id' or 'error'
 */
function headless_add_shipping_address($customer_id, $address) {
    if (!$customer_id) {
        return array('success' => false, 'error' => 'invalid_customer_id');
    }
    
    // Validate address
    $validation = headless_validate_shipping_address($address);
    if (!$validation['valid']) {
        return array('success' => false, 'error' => $validation['errors'][0]);
    }
    
    $addresses = headless_get_shipping_addresses($customer_id);
    
    // Check maximum addresses limit
    if (count($addresses) >= HEADLESS_MAX_SHIPPING_ADDRESSES) {
        return array('success' => false, 'error' => 'max_addresses_reached');
    }
    
    // Generate unique address ID
    $address_id = uniqid('addr_', true);
    
    // Sanitize and structure address data
    $new_address = array(
        'id'         => $address_id,
        'label'      => isset($address['label']) ? sanitize_text_field($address['label']) : '',
        'first_name' => sanitize_text_field($address['first_name'] ?? ''),
        'last_name'  => sanitize_text_field($address['last_name'] ?? ''),
        'company'    => sanitize_text_field($address['company'] ?? ''),
        'address_1'  => sanitize_text_field($address['address_1'] ?? ''),
        'address_2'  => sanitize_text_field($address['address_2'] ?? ''),
        'city'       => sanitize_text_field($address['city'] ?? ''),
        'state'      => sanitize_text_field($address['state'] ?? ''),
        'postcode'   => sanitize_text_field($address['postcode'] ?? ''),
        'country'    => sanitize_text_field($address['country'] ?? 'VN'),
        'phone'      => sanitize_text_field($address['phone'] ?? ''),
        'is_default' => !empty($address['is_default']) || count($addresses) === 0,
        'created_at' => current_time('c'),
        'updated_at' => current_time('c'),
    );
    
    // If this is set as default, unset other defaults
    if ($new_address['is_default']) {
        foreach ($addresses as &$addr) {
            $addr['is_default'] = false;
        }
    }
    
    $addresses[] = $new_address;
    
    update_user_meta($customer_id, HEADLESS_SHIPPING_ADDRESSES_META_KEY, $addresses);
    
    return array('success' => true, 'address_id' => $address_id, 'address' => $new_address);
}

/**
 * Update an existing shipping address
 * 
 * @param int $customer_id Customer ID
 * @param string $address_id Address ID
 * @param array $address Updated address data
 * @return array Result with 'success' boolean
 */
function headless_update_shipping_address($customer_id, $address_id, $address) {
    if (!$customer_id) {
        return array('success' => false, 'error' => 'invalid_customer_id');
    }
    
    // Validate address
    $validation = headless_validate_shipping_address($address);
    if (!$validation['valid']) {
        return array('success' => false, 'error' => $validation['errors'][0]);
    }
    
    $addresses = headless_get_shipping_addresses($customer_id);
    $found = false;
    
    foreach ($addresses as $index => &$addr) {
        if ($addr['id'] === $address_id) {
            // Update address fields
            $addr['label']      = isset($address['label']) ? sanitize_text_field($address['label']) : $addr['label'];
            $addr['first_name'] = sanitize_text_field($address['first_name'] ?? $addr['first_name']);
            $addr['last_name']  = sanitize_text_field($address['last_name'] ?? $addr['last_name']);
            $addr['company']    = sanitize_text_field($address['company'] ?? $addr['company']);
            $addr['address_1']  = sanitize_text_field($address['address_1'] ?? $addr['address_1']);
            $addr['address_2']  = sanitize_text_field($address['address_2'] ?? $addr['address_2']);
            $addr['city']       = sanitize_text_field($address['city'] ?? $addr['city']);
            $addr['state']      = sanitize_text_field($address['state'] ?? $addr['state']);
            $addr['postcode']   = sanitize_text_field($address['postcode'] ?? $addr['postcode']);
            $addr['country']    = sanitize_text_field($address['country'] ?? $addr['country']);
            $addr['phone']      = sanitize_text_field($address['phone'] ?? $addr['phone']);
            $addr['updated_at'] = current_time('c');
            
            // Handle default flag
            if (isset($address['is_default']) && $address['is_default']) {
                // Unset other defaults
                foreach ($addresses as &$other_addr) {
                    $other_addr['is_default'] = false;
                }
                $addr['is_default'] = true;
            }
            
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        return array('success' => false, 'error' => 'address_not_found');
    }
    
    update_user_meta($customer_id, HEADLESS_SHIPPING_ADDRESSES_META_KEY, $addresses);
    
    return array('success' => true, 'address' => $addresses[$index]);
}

/**
 * Delete a shipping address
 * 
 * @param int $customer_id Customer ID
 * @param string $address_id Address ID
 * @return array Result with 'success' boolean
 */
function headless_delete_shipping_address($customer_id, $address_id) {
    if (!$customer_id) {
        return array('success' => false, 'error' => 'invalid_customer_id');
    }
    
    $addresses = headless_get_shipping_addresses($customer_id);
    $found = false;
    $was_default = false;
    
    foreach ($addresses as $index => $addr) {
        if ($addr['id'] === $address_id) {
            $was_default = $addr['is_default'];
            unset($addresses[$index]);
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        return array('success' => false, 'error' => 'address_not_found');
    }
    
    // Re-index array
    $addresses = array_values($addresses);
    
    // If deleted address was default and there are other addresses, set first as default
    if ($was_default && count($addresses) > 0) {
        $addresses[0]['is_default'] = true;
    }
    
    update_user_meta($customer_id, HEADLESS_SHIPPING_ADDRESSES_META_KEY, $addresses);
    
    return array('success' => true);
}

/**
 * Get a specific shipping address by ID
 * 
 * @param int $customer_id Customer ID
 * @param string $address_id Address ID
 * @return array|null Address data or null if not found
 */
function headless_get_shipping_address($customer_id, $address_id) {
    $addresses = headless_get_shipping_addresses($customer_id);
    
    foreach ($addresses as $addr) {
        if ($addr['id'] === $address_id) {
            return $addr;
        }
    }
    
    return null;
}

/**
 * Get the default shipping address for a customer
 * 
 * @param int $customer_id Customer ID
 * @return array|null Default address or null if none
 */
function headless_get_default_shipping_address($customer_id) {
    $addresses = headless_get_shipping_addresses($customer_id);
    
    foreach ($addresses as $addr) {
        if (!empty($addr['is_default'])) {
            return $addr;
        }
    }
    
    // Return first address if no default is set
    return !empty($addresses) ? $addresses[0] : null;
}

/**
 * Set a shipping address as default
 * 
 * @param int $customer_id Customer ID
 * @param string $address_id Address ID
 * @return array Result with 'success' boolean
 */
function headless_set_default_shipping_address($customer_id, $address_id) {
    if (!$customer_id) {
        return array('success' => false, 'error' => 'invalid_customer_id');
    }
    
    $addresses = headless_get_shipping_addresses($customer_id);
    $found = false;
    
    foreach ($addresses as &$addr) {
        if ($addr['id'] === $address_id) {
            $addr['is_default'] = true;
            $found = true;
        } else {
            $addr['is_default'] = false;
        }
    }
    
    if (!$found) {
        return array('success' => false, 'error' => 'address_not_found');
    }
    
    update_user_meta($customer_id, HEADLESS_SHIPPING_ADDRESSES_META_KEY, $addresses);
    
    return array('success' => true);
}

/**
 * Validate shipping address data
 * 
 * @param array $address Address data to validate
 * @return array Validation result with 'valid' boolean and 'errors' array
 */
function headless_validate_shipping_address($address) {
    $errors = array();
    
    // Required fields
    if (empty($address['first_name']) && empty($address['last_name'])) {
        $errors[] = 'missing_name';
    }
    
    if (empty($address['address_1'])) {
        $errors[] = 'missing_address';
    }
    
    if (empty($address['city'])) {
        $errors[] = 'missing_city';
    }
    
    if (empty($address['country'])) {
        $errors[] = 'missing_country';
    }
    
    // Validate phone format if provided
    if (!empty($address['phone'])) {
        $phone = $address['phone'];
        if (!preg_match('/^(0|\+84)?[0-9]{9,10}$/', $phone)) {
            $errors[] = 'invalid_phone_format';
        }
    }
    
    return array(
        'valid'  => empty($errors),
        'errors' => $errors,
    );
}



// ============================================
// Customer Order History
// Requirements: 10.3
// ============================================

/**
 * Get customer order history
 * 
 * @param int $customer_id Customer ID
 * @param array $args Query arguments (limit, offset, status)
 * @return array Array of orders with details
 */
function headless_get_customer_order_history($customer_id, $args = array()) {
    if (!$customer_id) {
        return array('orders' => array(), 'total' => 0);
    }
    
    $defaults = array(
        'limit'   => 10,
        'offset'  => 0,
        'status'  => array('any'),
        'orderby' => 'date',
        'order'   => 'DESC',
    );
    
    $args = wp_parse_args($args, $defaults);
    
    // Query orders
    $query_args = array(
        'customer_id' => $customer_id,
        'limit'       => $args['limit'],
        'offset'      => $args['offset'],
        'orderby'     => $args['orderby'],
        'order'       => $args['order'],
        'paginate'    => true,
    );
    
    if ($args['status'] !== array('any')) {
        $query_args['status'] = $args['status'];
    }
    
    $results = wc_get_orders($query_args);
    
    $orders = array();
    foreach ($results->orders as $order) {
        $orders[] = headless_format_order_for_history($order);
    }
    
    return array(
        'orders' => $orders,
        'total'  => $results->total,
        'pages'  => $results->max_num_pages,
    );
}

/**
 * Format order data for history display
 * 
 * @param WC_Order $order Order object
 * @return array Formatted order data
 */
function headless_format_order_for_history($order) {
    $line_items = array();
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $line_items[] = array(
            'id'           => $item->get_id(),
            'product_id'   => $item->get_product_id(),
            'variation_id' => $item->get_variation_id(),
            'name'         => $item->get_name(),
            'quantity'     => $item->get_quantity(),
            'subtotal'     => $item->get_subtotal(),
            'total'        => $item->get_total(),
            'image'        => $product ? wp_get_attachment_url($product->get_image_id()) : null,
            'sku'          => $product ? $product->get_sku() : null,
        );
    }
    
    return array(
        'id'                   => $order->get_id(),
        'order_number'         => $order->get_order_number(),
        'status'               => $order->get_status(),
        'status_label'         => wc_get_order_status_name($order->get_status()),
        'date_created'         => $order->get_date_created() ? $order->get_date_created()->format('c') : null,
        'date_modified'        => $order->get_date_modified() ? $order->get_date_modified()->format('c') : null,
        'date_completed'       => $order->get_date_completed() ? $order->get_date_completed()->format('c') : null,
        'subtotal'             => $order->get_subtotal(),
        'shipping_total'       => $order->get_shipping_total(),
        'discount_total'       => $order->get_discount_total(),
        'total'                => $order->get_total(),
        'total_tax'            => $order->get_total_tax(),
        'currency'             => $order->get_currency(),
        'payment_method'       => $order->get_payment_method(),
        'payment_method_title' => $order->get_payment_method_title(),
        'billing'              => array(
            'first_name' => $order->get_billing_first_name(),
            'last_name'  => $order->get_billing_last_name(),
            'company'    => $order->get_billing_company(),
            'address_1'  => $order->get_billing_address_1(),
            'address_2'  => $order->get_billing_address_2(),
            'city'       => $order->get_billing_city(),
            'state'      => $order->get_billing_state(),
            'postcode'   => $order->get_billing_postcode(),
            'country'    => $order->get_billing_country(),
            'email'      => $order->get_billing_email(),
            'phone'      => $order->get_billing_phone(),
        ),
        'shipping'             => array(
            'first_name' => $order->get_shipping_first_name(),
            'last_name'  => $order->get_shipping_last_name(),
            'company'    => $order->get_shipping_company(),
            'address_1'  => $order->get_shipping_address_1(),
            'address_2'  => $order->get_shipping_address_2(),
            'city'       => $order->get_shipping_city(),
            'state'      => $order->get_shipping_state(),
            'postcode'   => $order->get_shipping_postcode(),
            'country'    => $order->get_shipping_country(),
        ),
        'line_items'           => $line_items,
        'customer_note'        => $order->get_customer_note(),
    );
}

// ============================================
// REST API Endpoints for Customer Account
// ============================================

/**
 * Register REST API routes for customer account
 */
function headless_register_customer_account_routes() {
    // Shipping addresses endpoints
    register_rest_route('headless/v1', '/customer/shipping-addresses', array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'headless_rest_get_shipping_addresses',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => 'headless_rest_add_shipping_address',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
    ));
    
    register_rest_route('headless/v1', '/customer/shipping-addresses/(?P<address_id>[a-zA-Z0-9_\.]+)', array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'headless_rest_get_shipping_address',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
        array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => 'headless_rest_update_shipping_address',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
        array(
            'methods'             => WP_REST_Server::DELETABLE,
            'callback'            => 'headless_rest_delete_shipping_address',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
    ));
    
    register_rest_route('headless/v1', '/customer/shipping-addresses/(?P<address_id>[a-zA-Z0-9_\.]+)/default', array(
        array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => 'headless_rest_set_default_shipping_address',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
    ));
    
    // Order history endpoint
    register_rest_route('headless/v1', '/customer/orders', array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'headless_rest_get_order_history',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
    ));
    
    // Customer profile endpoint
    register_rest_route('headless/v1', '/customer/profile', array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'headless_rest_get_customer_profile',
            'permission_callback' => 'headless_rest_customer_permission_check',
        ),
    ));
}
add_action('rest_api_init', 'headless_register_customer_account_routes');

/**
 * Permission check for customer endpoints
 */
function headless_rest_customer_permission_check($request) {
    return is_user_logged_in();
}

/**
 * REST: Get all shipping addresses
 */
function headless_rest_get_shipping_addresses($request) {
    $customer_id = get_current_user_id();
    $addresses = headless_get_shipping_addresses($customer_id);
    
    return rest_ensure_response(array(
        'success'   => true,
        'addresses' => $addresses,
    ));
}

/**
 * REST: Add a new shipping address
 */
function headless_rest_add_shipping_address($request) {
    $customer_id = get_current_user_id();
    $address = $request->get_json_params();
    
    $result = headless_add_shipping_address($customer_id, $address);
    
    if (!$result['success']) {
        return new WP_Error('add_address_failed', $result['error'], array('status' => 400));
    }
    
    return rest_ensure_response($result);
}

/**
 * REST: Get a specific shipping address
 */
function headless_rest_get_shipping_address($request) {
    $customer_id = get_current_user_id();
    $address_id = $request->get_param('address_id');
    
    $address = headless_get_shipping_address($customer_id, $address_id);
    
    if (!$address) {
        return new WP_Error('address_not_found', 'Address not found', array('status' => 404));
    }
    
    return rest_ensure_response(array(
        'success' => true,
        'address' => $address,
    ));
}

/**
 * REST: Update a shipping address
 */
function headless_rest_update_shipping_address($request) {
    $customer_id = get_current_user_id();
    $address_id = $request->get_param('address_id');
    $address = $request->get_json_params();
    
    $result = headless_update_shipping_address($customer_id, $address_id, $address);
    
    if (!$result['success']) {
        return new WP_Error('update_address_failed', $result['error'], array('status' => 400));
    }
    
    return rest_ensure_response($result);
}

/**
 * REST: Delete a shipping address
 */
function headless_rest_delete_shipping_address($request) {
    $customer_id = get_current_user_id();
    $address_id = $request->get_param('address_id');
    
    $result = headless_delete_shipping_address($customer_id, $address_id);
    
    if (!$result['success']) {
        return new WP_Error('delete_address_failed', $result['error'], array('status' => 400));
    }
    
    return rest_ensure_response($result);
}

/**
 * REST: Set default shipping address
 */
function headless_rest_set_default_shipping_address($request) {
    $customer_id = get_current_user_id();
    $address_id = $request->get_param('address_id');
    
    $result = headless_set_default_shipping_address($customer_id, $address_id);
    
    if (!$result['success']) {
        return new WP_Error('set_default_failed', $result['error'], array('status' => 400));
    }
    
    return rest_ensure_response($result);
}

/**
 * REST: Get customer order history
 */
function headless_rest_get_order_history($request) {
    $customer_id = get_current_user_id();
    
    $args = array(
        'limit'  => $request->get_param('limit') ?? 10,
        'offset' => $request->get_param('offset') ?? 0,
        'status' => $request->get_param('status') ? explode(',', $request->get_param('status')) : array('any'),
    );
    
    $result = headless_get_customer_order_history($customer_id, $args);
    
    return rest_ensure_response(array(
        'success' => true,
        'orders'  => $result['orders'],
        'total'   => $result['total'],
        'pages'   => $result['pages'],
    ));
}

/**
 * REST: Get customer profile
 */
function headless_rest_get_customer_profile($request) {
    $customer_id = get_current_user_id();
    $profile = headless_get_customer_profile($customer_id);
    
    if (!$profile) {
        return new WP_Error('profile_not_found', 'Customer profile not found', array('status' => 404));
    }
    
    return rest_ensure_response(array(
        'success' => true,
        'profile' => $profile,
    ));
}
