<?php
/**
 * WooGraphQL Configuration for Headless Setup
 * 
 * This file configures WPGraphQL and WooGraphQL for the Vietnamese e-commerce store.
 * It sets up GraphQL schema extensions, product queries, cart mutations, and order handling.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * @package Headless_Theme
 * @subpackage WooGraphQL
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if WPGraphQL and WooGraphQL are active before proceeding
 */
function headless_check_graphql_plugins() {
    return class_exists('WPGraphQL') && class_exists('WPGraphQL\WooCommerce\WooCommerce');
}

/**
 * Configure WPGraphQL settings
 * Requirements: 2.1
 */
function headless_configure_wpgraphql_settings() {
    // Only run once
    if (get_option('headless_wpgraphql_setup_complete')) {
        return;
    }
    
    // Enable GraphQL introspection (useful for development)
    update_option('graphql_general_settings', array(
        'graphql_endpoint' => 'graphql',
        'graphql_debug_mode_enabled' => defined('WP_DEBUG') && WP_DEBUG,
        'graphql_tracing_enabled' => false,
        'graphql_query_logs_enabled' => false,
    ));
    
    // Mark setup as complete
    update_option('headless_wpgraphql_setup_complete', true);
}
add_action('init', 'headless_configure_wpgraphql_settings', 15);

/**
 * Configure WooGraphQL settings for product queries
 * Requirements: 2.1, 2.4
 */
function headless_configure_woographql_settings() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Only run once
    if (get_option('headless_woographql_setup_complete')) {
        return;
    }
    
    // Enable public introspection for WooGraphQL
    update_option('woographql_settings', array(
        'enable_ql_session_handler' => 'on',
        'enable_unsupported_product_type' => 'off',
        'disable_ql_session_handler' => 'off',
    ));
    
    // Mark setup as complete
    update_option('headless_woographql_setup_complete', true);
}
add_action('init', 'headless_configure_woographql_settings', 15);


/**
 * Extend GraphQL schema with custom product fields
 * Requirements: 2.1, 2.4
 */
function headless_extend_product_graphql_schema() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Add custom field for formatted price in VND
    register_graphql_field('Product', 'formattedPrice', array(
        'type' => 'String',
        'description' => __('Product price formatted in VND', 'headless-theme'),
        'resolve' => function($product) {
            $wc_product = wc_get_product($product->databaseId);
            if (!$wc_product) {
                return null;
            }
            return wc_price($wc_product->get_price());
        },
    ));
    
    // Add custom field for stock availability message
    register_graphql_field('Product', 'stockMessage', array(
        'type' => 'String',
        'description' => __('Human-readable stock availability message', 'headless-theme'),
        'resolve' => function($product) {
            $wc_product = wc_get_product($product->databaseId);
            if (!$wc_product) {
                return null;
            }
            
            $stock_status = $wc_product->get_stock_status();
            $stock_quantity = $wc_product->get_stock_quantity();
            
            switch ($stock_status) {
                case 'instock':
                    if ($stock_quantity !== null && $stock_quantity > 0) {
                        return sprintf(__('Còn %d sản phẩm', 'headless-theme'), $stock_quantity);
                    }
                    return __('Còn hàng', 'headless-theme');
                case 'outofstock':
                    return __('Hết hàng', 'headless-theme');
                case 'onbackorder':
                    return __('Đặt hàng trước', 'headless-theme');
                default:
                    return __('Liên hệ', 'headless-theme');
            }
        },
    ));
    
    // Add custom field for variation count on variable products
    register_graphql_field('VariableProduct', 'variationCount', array(
        'type' => 'Int',
        'description' => __('Number of variations for this product', 'headless-theme'),
        'resolve' => function($product) {
            $wc_product = wc_get_product($product->databaseId);
            if (!$wc_product || !$wc_product->is_type('variable')) {
                return 0;
            }
            return count($wc_product->get_children());
        },
    ));
}
add_action('graphql_register_types', 'headless_extend_product_graphql_schema');

/**
 * Extend GraphQL schema with custom variation fields
 * Requirements: 2.4
 */
function headless_extend_variation_graphql_schema() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Add formatted price for variations
    register_graphql_field('ProductVariation', 'formattedPrice', array(
        'type' => 'String',
        'description' => __('Variation price formatted in VND', 'headless-theme'),
        'resolve' => function($variation) {
            $wc_variation = wc_get_product($variation->databaseId);
            if (!$wc_variation) {
                return null;
            }
            return wc_price($wc_variation->get_price());
        },
    ));
    
    // Add attribute summary for variations
    register_graphql_field('ProductVariation', 'attributeSummary', array(
        'type' => 'String',
        'description' => __('Summary of variation attributes (e.g., "Size: M, Color: Red")', 'headless-theme'),
        'resolve' => function($variation) {
            $wc_variation = wc_get_product($variation->databaseId);
            if (!$wc_variation) {
                return null;
            }
            
            $attributes = $wc_variation->get_attributes();
            $summary_parts = array();
            
            foreach ($attributes as $attribute_name => $attribute_value) {
                $taxonomy = str_replace('attribute_', '', $attribute_name);
                $term = get_term_by('slug', $attribute_value, $taxonomy);
                $label = wc_attribute_label($taxonomy);
                $value = $term ? $term->name : $attribute_value;
                $summary_parts[] = sprintf('%s: %s', $label, $value);
            }
            
            return implode(', ', $summary_parts);
        },
    ));
}
add_action('graphql_register_types', 'headless_extend_variation_graphql_schema');


/**
 * Configure GraphQL cart mutations
 * Requirements: 2.2
 */
function headless_configure_cart_graphql() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Add custom field for cart item formatted subtotal
    register_graphql_field('CartItem', 'formattedSubtotal', array(
        'type' => 'String',
        'description' => __('Cart item subtotal formatted in VND', 'headless-theme'),
        'resolve' => function($cart_item) {
            if (!isset($cart_item['line_subtotal'])) {
                return null;
            }
            return wc_price($cart_item['line_subtotal']);
        },
    ));
    
    // Add custom field for cart formatted total
    register_graphql_field('Cart', 'formattedTotal', array(
        'type' => 'String',
        'description' => __('Cart total formatted in VND', 'headless-theme'),
        'resolve' => function($cart) {
            if (!WC()->cart) {
                return null;
            }
            return wc_price(WC()->cart->get_total('edit'));
        },
    ));
    
    // Add custom field for cart formatted subtotal
    register_graphql_field('Cart', 'formattedSubtotal', array(
        'type' => 'String',
        'description' => __('Cart subtotal formatted in VND', 'headless-theme'),
        'resolve' => function($cart) {
            if (!WC()->cart) {
                return null;
            }
            return wc_price(WC()->cart->get_subtotal());
        },
    ));
    
    // Add custom field for cart item count
    register_graphql_field('Cart', 'itemCount', array(
        'type' => 'Int',
        'description' => __('Total number of items in cart', 'headless-theme'),
        'resolve' => function($cart) {
            if (!WC()->cart) {
                return 0;
            }
            return WC()->cart->get_cart_contents_count();
        },
    ));
}
add_action('graphql_register_types', 'headless_configure_cart_graphql');

/**
 * Configure GraphQL order queries and mutations
 * Requirements: 2.3
 */
function headless_configure_order_graphql() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Add custom field for order formatted total
    register_graphql_field('Order', 'formattedTotal', array(
        'type' => 'String',
        'description' => __('Order total formatted in VND', 'headless-theme'),
        'resolve' => function($order) {
            $wc_order = wc_get_order($order->databaseId);
            if (!$wc_order) {
                return null;
            }
            return wc_price($wc_order->get_total());
        },
    ));
    
    // Add custom field for order status label in Vietnamese
    register_graphql_field('Order', 'statusLabel', array(
        'type' => 'String',
        'description' => __('Order status label in Vietnamese', 'headless-theme'),
        'resolve' => function($order) {
            $wc_order = wc_get_order($order->databaseId);
            if (!$wc_order) {
                return null;
            }
            
            $status = $wc_order->get_status();
            $status_labels = array(
                'pending'    => __('Chờ thanh toán', 'headless-theme'),
                'processing' => __('Đang xử lý', 'headless-theme'),
                'on-hold'    => __('Tạm giữ', 'headless-theme'),
                'completed'  => __('Hoàn thành', 'headless-theme'),
                'cancelled'  => __('Đã hủy', 'headless-theme'),
                'refunded'   => __('Đã hoàn tiền', 'headless-theme'),
                'failed'     => __('Thất bại', 'headless-theme'),
            );
            
            return isset($status_labels[$status]) ? $status_labels[$status] : $status;
        },
    ));
    
    // Add custom field for order date formatted
    register_graphql_field('Order', 'formattedDate', array(
        'type' => 'String',
        'description' => __('Order date formatted for Vietnamese locale', 'headless-theme'),
        'resolve' => function($order) {
            $wc_order = wc_get_order($order->databaseId);
            if (!$wc_order) {
                return null;
            }
            
            $date = $wc_order->get_date_created();
            if (!$date) {
                return null;
            }
            
            return $date->date_i18n('d/m/Y H:i');
        },
    ));
    
    // Add custom field for shipping address formatted
    register_graphql_field('Order', 'formattedShippingAddress', array(
        'type' => 'String',
        'description' => __('Formatted shipping address', 'headless-theme'),
        'resolve' => function($order) {
            $wc_order = wc_get_order($order->databaseId);
            if (!$wc_order) {
                return null;
            }
            return $wc_order->get_formatted_shipping_address();
        },
    ));
    
    // Add custom field for billing address formatted
    register_graphql_field('Order', 'formattedBillingAddress', array(
        'type' => 'String',
        'description' => __('Formatted billing address', 'headless-theme'),
        'resolve' => function($order) {
            $wc_order = wc_get_order($order->databaseId);
            if (!$wc_order) {
                return null;
            }
            return $wc_order->get_formatted_billing_address();
        },
    ));
}
add_action('graphql_register_types', 'headless_configure_order_graphql');


/**
 * Configure GraphQL CORS headers for WooGraphQL
 * Ensures proper CORS handling for GraphQL requests from NextJS frontend
 */
function headless_woographql_cors_headers() {
    // Get frontend URL from environment or use default
    $frontend_url = defined('HEADLESS_MODE_CLIENT_URL') 
        ? HEADLESS_MODE_CLIENT_URL 
        : 'http://localhost:3000';
    
    // Add CORS headers for GraphQL endpoint
    add_filter('graphql_response_headers_to_send', function($headers) use ($frontend_url) {
        $headers['Access-Control-Allow-Origin'] = $frontend_url;
        $headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        $headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, woocommerce-session';
        $headers['Access-Control-Allow-Credentials'] = 'true';
        $headers['Access-Control-Expose-Headers'] = 'woocommerce-session';
        return $headers;
    });
}
add_action('init', 'headless_woographql_cors_headers');

/**
 * Enable WooCommerce session handling for GraphQL
 * Required for cart operations in headless mode
 * Requirements: 2.2
 */
function headless_enable_graphql_session() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Ensure WooCommerce session is initialized for GraphQL requests
    add_action('graphql_init', function() {
        if (!WC()->session) {
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
        }
        
        if (!WC()->cart) {
            WC()->cart = new WC_Cart();
        }
        
        if (!WC()->customer) {
            WC()->customer = new WC_Customer(get_current_user_id(), true);
        }
    });
}
add_action('init', 'headless_enable_graphql_session', 20);

/**
 * Add customer data to GraphQL context for authenticated requests
 * Requirements: 2.3
 */
function headless_add_customer_to_graphql_context($context) {
    if (!headless_check_graphql_plugins()) {
        return $context;
    }
    
    $user_id = get_current_user_id();
    if ($user_id > 0) {
        $context['customer'] = new WC_Customer($user_id);
    }
    
    return $context;
}
add_filter('graphql_request_context', 'headless_add_customer_to_graphql_context');

/**
 * Configure GraphQL query complexity for WooCommerce queries
 * Allows larger queries for product listings with variations
 */
function headless_woographql_query_complexity($max_complexity) {
    // Increase complexity limit for WooCommerce queries
    return 2000;
}
add_filter('graphql_max_query_complexity', 'headless_woographql_query_complexity');

/**
 * Configure GraphQL query depth for nested WooCommerce data
 * Allows deeper nesting for product variations and categories
 */
function headless_woographql_query_depth($max_depth) {
    // Increase depth limit for nested WooCommerce data
    return 15;
}
add_filter('graphql_max_query_depth', 'headless_woographql_query_depth');

/**
 * Register custom GraphQL types for Vietnamese-specific data
 */
function headless_register_custom_graphql_types() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Register VietnamProvince enum type
    register_graphql_enum_type('VietnamProvince', array(
        'description' => __('Vietnam provinces and cities', 'headless-theme'),
        'values' => array(
            'HO_CHI_MINH' => array(
                'value' => 'SG',
                'description' => __('Hồ Chí Minh', 'headless-theme'),
            ),
            'HA_NOI' => array(
                'value' => 'HN',
                'description' => __('Hà Nội', 'headless-theme'),
            ),
            'DA_NANG' => array(
                'value' => 'DN',
                'description' => __('Đà Nẵng', 'headless-theme'),
            ),
            'HAI_PHONG' => array(
                'value' => 'HP',
                'description' => __('Hải Phòng', 'headless-theme'),
            ),
            'CAN_THO' => array(
                'value' => 'CT',
                'description' => __('Cần Thơ', 'headless-theme'),
            ),
        ),
    ));
}
add_action('graphql_register_types', 'headless_register_custom_graphql_types');

/**
 * Add product collection taxonomy to GraphQL
 * Requirements: 2.1
 */
function headless_register_collection_graphql() {
    if (!headless_check_graphql_plugins()) {
        return;
    }
    
    // Register product_collection taxonomy for GraphQL
    register_taxonomy_graphql_fields('product_collection', array(
        'show_in_graphql' => true,
        'graphql_single_name' => 'productCollection',
        'graphql_plural_name' => 'productCollections',
    ));
}
add_action('init', 'headless_register_collection_graphql', 25);

/**
 * Log GraphQL errors for debugging (only in debug mode)
 */
function headless_log_graphql_errors($response, $schema, $operation, $query, $variables, $root_value, $context) {
    if (!defined('WP_DEBUG') || !WP_DEBUG) {
        return $response;
    }
    
    if (isset($response['errors']) && !empty($response['errors'])) {
        error_log('WooGraphQL Error: ' . json_encode($response['errors']));
    }
    
    return $response;
}
add_filter('graphql_response', 'headless_log_graphql_errors', 10, 7);
