<?php
/**
 * JWT Authentication Configuration
 * 
 * This file configures JWT authentication for the headless WordPress setup.
 * It extends the JWT token with customer data and configures token expiration.
 *
 * Requirements: 10.2
 * 
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Extend JWT token expiration to 7 days
 * 
 * @param int $expire Default expiration timestamp
 * @return int Modified expiration timestamp (7 days from now)
 */
function headless_jwt_auth_expire($expire) {
    // Set token expiration to 7 days
    return time() + (DAY_IN_SECONDS * 7);
}
add_filter('jwt_auth_expire', 'headless_jwt_auth_expire');

/**
 * Add customer data to JWT token response
 * 
 * This filter extends the JWT token response with WooCommerce customer data
 * including billing and shipping addresses.
 *
 * @param array $data The token response data
 * @param WP_User $user The authenticated user
 * @return array Modified token response with customer data
 */
function headless_jwt_auth_token_before_dispatch($data, $user) {
    // Add basic user information
    $data['user_id'] = $user->ID;
    $data['user_email'] = $user->user_email;
    $data['user_display_name'] = $user->display_name;
    $data['user_nicename'] = $user->user_nicename;
    $data['user_registered'] = $user->user_registered;
    
    // Add user roles
    $data['user_roles'] = $user->roles;
    
    // Add WooCommerce customer data if WooCommerce is active
    if (class_exists('WC_Customer')) {
        try {
            $customer = new WC_Customer($user->ID);
            
            // Add billing address
            $data['billing_address'] = array(
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
            );
            
            // Add shipping address
            $data['shipping_address'] = array(
                'first_name' => $customer->get_shipping_first_name(),
                'last_name'  => $customer->get_shipping_last_name(),
                'company'    => $customer->get_shipping_company(),
                'address_1'  => $customer->get_shipping_address_1(),
                'address_2'  => $customer->get_shipping_address_2(),
                'city'       => $customer->get_shipping_city(),
                'state'      => $customer->get_shipping_state(),
                'postcode'   => $customer->get_shipping_postcode(),
                'country'    => $customer->get_shipping_country(),
            );
            
            // Add customer meta
            $data['is_paying_customer'] = $customer->get_is_paying_customer();
            $data['order_count'] = $customer->get_order_count();
            $data['total_spent'] = $customer->get_total_spent();
            
        } catch (Exception $e) {
            // If WooCommerce customer data fails, continue without it
            $data['billing_address'] = null;
            $data['shipping_address'] = null;
        }
    }
    
    return $data;
}
add_filter('jwt_auth_token_before_dispatch', 'headless_jwt_auth_token_before_dispatch', 10, 2);

/**
 * Add custom claims to JWT token payload
 * 
 * @param array $payload The JWT payload
 * @param WP_User $user The authenticated user
 * @return array Modified payload with custom claims
 */
function headless_jwt_auth_payload($payload, $user) {
    // Add user ID to payload for easier access
    $payload['user_id'] = $user->ID;
    
    // Add user roles to payload
    $payload['roles'] = $user->roles;
    
    // Add issued at timestamp
    $payload['iat'] = time();
    
    return $payload;
}
add_filter('jwt_auth_token_before_sign', 'headless_jwt_auth_payload', 10, 2);

/**
 * Validate JWT token and add user data to request
 * 
 * @param mixed $result The validation result
 * @param WP_User $user The authenticated user
 * @return mixed The validation result
 */
function headless_jwt_auth_valid_token($result, $user) {
    // Token is valid, you can add additional validation here if needed
    return $result;
}
add_filter('jwt_auth_valid_token_response', 'headless_jwt_auth_valid_token', 10, 2);

/**
 * Customize JWT authentication error messages
 * 
 * @param WP_Error $error The error object
 * @return WP_Error Modified error object
 */
function headless_jwt_auth_error_messages($error) {
    $error_code = $error->get_error_code();
    
    $custom_messages = array(
        'jwt_auth_invalid_username' => __('Invalid username or email address.', 'headless-theme'),
        'jwt_auth_invalid_password' => __('Invalid password.', 'headless-theme'),
        'jwt_auth_invalid_token'    => __('Invalid authentication token.', 'headless-theme'),
        'jwt_auth_expired_token'    => __('Authentication token has expired.', 'headless-theme'),
        'jwt_auth_bad_config'       => __('JWT authentication is not properly configured.', 'headless-theme'),
    );
    
    if (isset($custom_messages[$error_code])) {
        return new WP_Error($error_code, $custom_messages[$error_code]);
    }
    
    return $error;
}
add_filter('jwt_auth_error', 'headless_jwt_auth_error_messages');

/**
 * Allow JWT authentication for specific REST API endpoints
 * 
 * @param bool $require_token Whether token is required
 * @param WP_REST_Request $request The REST request
 * @return bool Whether token is required
 */
function headless_jwt_auth_whitelist($require_token, $request) {
    // Whitelist certain endpoints that don't require authentication
    $whitelist = array(
        '/wp-json/wp/v2/posts',
        '/wp-json/wp/v2/pages',
        '/wp-json/wp/v2/categories',
        '/wp-json/wp/v2/tags',
        '/wp-json/wc/v3/products',
        '/wp-json/wc/v3/products/categories',
    );
    
    $route = $request->get_route();
    
    foreach ($whitelist as $endpoint) {
        if (strpos($route, $endpoint) === 0 && $request->get_method() === 'GET') {
            return false;
        }
    }
    
    return $require_token;
}
// Note: This filter may not exist in all JWT plugin versions
// add_filter('jwt_auth_require_token', 'headless_jwt_auth_whitelist', 10, 2);

/**
 * Validate JWT token structure
 * 
 * @param string $token The JWT token
 * @return array|WP_Error Decoded token data or error
 */
function headless_validate_jwt_token($token) {
    if (empty($token)) {
        return new WP_Error('jwt_auth_no_token', __('No token provided.', 'headless-theme'));
    }
    
    // Check token format (should have 3 parts separated by dots)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return new WP_Error('jwt_auth_invalid_format', __('Invalid token format.', 'headless-theme'));
    }
    
    // Decode header
    $header = json_decode(base64_decode($parts[0]), true);
    if (!$header || !isset($header['alg'])) {
        return new WP_Error('jwt_auth_invalid_header', __('Invalid token header.', 'headless-theme'));
    }
    
    // Decode payload
    $payload = json_decode(base64_decode($parts[1]), true);
    if (!$payload) {
        return new WP_Error('jwt_auth_invalid_payload', __('Invalid token payload.', 'headless-theme'));
    }
    
    // Check required claims
    $required_claims = array('iss', 'iat', 'exp', 'data');
    foreach ($required_claims as $claim) {
        if (!isset($payload[$claim])) {
            return new WP_Error(
                'jwt_auth_missing_claim',
                sprintf(__('Missing required claim: %s', 'headless-theme'), $claim)
            );
        }
    }
    
    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return new WP_Error('jwt_auth_expired', __('Token has expired.', 'headless-theme'));
    }
    
    return array(
        'header'  => $header,
        'payload' => $payload,
        'valid'   => true,
    );
}

/**
 * Get JWT token expiration time in seconds
 * 
 * @return int Token expiration time in seconds (7 days)
 */
function headless_get_jwt_expiration() {
    return DAY_IN_SECONDS * 7;
}

/**
 * Check if JWT authentication is properly configured
 * 
 * @return bool|WP_Error True if configured, WP_Error otherwise
 */
function headless_check_jwt_configuration() {
    // Check if JWT_AUTH_SECRET_KEY is defined
    if (!defined('JWT_AUTH_SECRET_KEY')) {
        return new WP_Error(
            'jwt_auth_no_secret',
            __('JWT_AUTH_SECRET_KEY is not defined in wp-config.php', 'headless-theme')
        );
    }
    
    // Check if secret key is long enough (minimum 32 characters)
    if (strlen(JWT_AUTH_SECRET_KEY) < 32) {
        return new WP_Error(
            'jwt_auth_weak_secret',
            __('JWT_AUTH_SECRET_KEY should be at least 32 characters long', 'headless-theme')
        );
    }
    
    // Check if JWT_AUTH_CORS_ENABLE is defined
    if (!defined('JWT_AUTH_CORS_ENABLE')) {
        return new WP_Error(
            'jwt_auth_cors_not_set',
            __('JWT_AUTH_CORS_ENABLE is not defined in wp-config.php', 'headless-theme')
        );
    }
    
    return true;
}

/**
 * Add JWT configuration status to site health
 */
function headless_jwt_site_health_tests($tests) {
    $tests['direct']['jwt_auth_config'] = array(
        'label' => __('JWT Authentication Configuration', 'headless-theme'),
        'test'  => 'headless_jwt_site_health_test',
    );
    
    return $tests;
}
add_filter('site_status_tests', 'headless_jwt_site_health_tests');

/**
 * Site health test for JWT configuration
 */
function headless_jwt_site_health_test() {
    $result = array(
        'label'       => __('JWT Authentication is properly configured', 'headless-theme'),
        'status'      => 'good',
        'badge'       => array(
            'label' => __('Security', 'headless-theme'),
            'color' => 'blue',
        ),
        'description' => sprintf(
            '<p>%s</p>',
            __('JWT authentication is configured correctly for headless operation.', 'headless-theme')
        ),
        'actions'     => '',
        'test'        => 'jwt_auth_config',
    );
    
    $config_check = headless_check_jwt_configuration();
    
    if (is_wp_error($config_check)) {
        $result['status'] = 'critical';
        $result['label'] = __('JWT Authentication is not properly configured', 'headless-theme');
        $result['description'] = sprintf(
            '<p>%s</p>',
            $config_check->get_error_message()
        );
    }
    
    return $result;
}
