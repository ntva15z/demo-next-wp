<?php
/**
 * Webhook Integration for NextJS Revalidation
 * 
 * This file handles webhook triggers for NextJS frontend cache revalidation.
 * Webhooks are sent when products, inventory, or orders are updated.
 *
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get the NextJS revalidation URL
 * 
 * @return string The revalidation endpoint URL
 */
function headless_get_revalidate_url() {
    return defined('NEXTJS_REVALIDATE_URL') 
        ? NEXTJS_REVALIDATE_URL 
        : 'http://localhost:3000/api/revalidate';
}

/**
 * Get the NextJS revalidation secret
 * 
 * @return string The revalidation secret
 */
function headless_get_revalidate_secret() {
    return defined('NEXTJS_REVALIDATE_SECRET') 
        ? NEXTJS_REVALIDATE_SECRET 
        : '';
}

/**
 * Trigger NextJS revalidation webhook
 * 
 * Sends a POST request to the NextJS revalidation endpoint with the specified
 * content type and optional additional data.
 * 
 * @param string $type The content type being revalidated (product, inventory, order, etc.)
 * @param string|null $slug Optional slug for specific content
 * @param array $data Additional data to include in the webhook payload
 * @return array|WP_Error Response from wp_remote_post or WP_Error on failure
 */
function headless_trigger_revalidation($type, $slug = null, $data = array()) {
    $revalidate_url = headless_get_revalidate_url();
    $revalidate_secret = headless_get_revalidate_secret();
    
    // Don't send webhook if secret is not configured
    if (empty($revalidate_secret)) {
        return new WP_Error(
            'webhook_secret_missing',
            'NEXTJS_REVALIDATE_SECRET is not configured'
        );
    }
    
    // Build the payload
    $payload = array_merge(array(
        'type' => $type,
        'slug' => $slug,
        'timestamp' => time(),
    ), $data);
    
    // Send the webhook request
    $response = wp_remote_post($revalidate_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'x-revalidate-secret' => $revalidate_secret,
        ),
        'body' => wp_json_encode($payload),
        'timeout' => 5,
        'blocking' => false, // Non-blocking for better performance
    ));
    
    // Log webhook for debugging (only in debug mode)
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log(sprintf(
            '[Headless Webhook] Sent %s webhook for slug: %s',
            $type,
            $slug ?: 'none'
        ));
    }
    
    return $response;
}

/**
 * Build webhook payload with authentication header
 * 
 * This function is used for testing purposes to verify that webhooks
 * include the correct authentication header.
 * 
 * @param string $type The content type
 * @param string|null $slug Optional slug
 * @param array $data Additional data
 * @return array The complete webhook request configuration
 */
function headless_build_webhook_payload($type, $slug = null, $data = array()) {
    $revalidate_secret = headless_get_revalidate_secret();
    
    $payload = array_merge(array(
        'type' => $type,
        'slug' => $slug,
        'timestamp' => time(),
    ), $data);
    
    return array(
        'url' => headless_get_revalidate_url(),
        'headers' => array(
            'Content-Type' => 'application/json',
            'x-revalidate-secret' => $revalidate_secret,
        ),
        'body' => $payload,
    );
}


/**
 * ============================================================================
 * PRODUCT UPDATE WEBHOOKS
 * ============================================================================
 */

/**
 * Trigger webhook when a product is created or updated
 * 
 * @param int $product_id The product ID
 */
function headless_product_updated_webhook($product_id) {
    // Avoid triggering during autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Get the product
    $product = wc_get_product($product_id);
    if (!$product) {
        return;
    }
    
    // Build webhook data
    $webhook_data = array(
        'product_id' => $product_id,
        'stock_status' => $product->get_stock_status(),
        'stock_quantity' => $product->get_stock_quantity(),
        'product_type' => $product->get_type(),
    );
    
    // Trigger the webhook
    headless_trigger_revalidation('product', $product->get_slug(), $webhook_data);
}

// Hook into WooCommerce product save actions
add_action('woocommerce_update_product', 'headless_product_updated_webhook', 10, 1);
add_action('woocommerce_new_product', 'headless_product_updated_webhook', 10, 1);

/**
 * Trigger webhook when a product is trashed or deleted
 * 
 * @param int $product_id The product ID
 */
function headless_product_deleted_webhook($product_id) {
    $product = wc_get_product($product_id);
    if (!$product) {
        return;
    }
    
    $webhook_data = array(
        'product_id' => $product_id,
        'action' => 'deleted',
    );
    
    headless_trigger_revalidation('product', $product->get_slug(), $webhook_data);
}

add_action('woocommerce_before_delete_product', 'headless_product_deleted_webhook', 10, 1);
add_action('wp_trash_post', function($post_id) {
    if (get_post_type($post_id) === 'product') {
        headless_product_deleted_webhook($post_id);
    }
});

/**
 * ============================================================================
 * INVENTORY CHANGE WEBHOOKS
 * ============================================================================
 */

/**
 * Trigger webhook when product stock quantity changes
 * 
 * @param WC_Product $product The product object
 */
function headless_inventory_changed_webhook($product) {
    if (!$product || !is_a($product, 'WC_Product')) {
        return;
    }
    
    $webhook_data = array(
        'product_id' => $product->get_id(),
        'stock_quantity' => $product->get_stock_quantity(),
        'stock_status' => $product->get_stock_status(),
        'manage_stock' => $product->get_manage_stock(),
    );
    
    headless_trigger_revalidation('inventory', $product->get_slug(), $webhook_data);
}

// Hook into WooCommerce stock change actions
add_action('woocommerce_product_set_stock', 'headless_inventory_changed_webhook', 10, 1);
add_action('woocommerce_variation_set_stock', 'headless_inventory_changed_webhook', 10, 1);

/**
 * Trigger webhook when stock status changes
 * 
 * @param int $product_id The product ID
 * @param string $stock_status The new stock status
 */
function headless_stock_status_changed_webhook($product_id, $stock_status) {
    $product = wc_get_product($product_id);
    if (!$product) {
        return;
    }
    
    $webhook_data = array(
        'product_id' => $product_id,
        'stock_status' => $stock_status,
        'stock_quantity' => $product->get_stock_quantity(),
    );
    
    headless_trigger_revalidation('inventory', $product->get_slug(), $webhook_data);
}

add_action('woocommerce_product_set_stock_status', 'headless_stock_status_changed_webhook', 10, 2);

/**
 * ============================================================================
 * ORDER STATUS WEBHOOKS
 * ============================================================================
 */

/**
 * Trigger webhook when order status changes
 * 
 * @param int $order_id The order ID
 * @param string $old_status The previous order status
 * @param string $new_status The new order status
 * @param WC_Order $order The order object
 */
function headless_order_status_changed_webhook($order_id, $old_status, $new_status, $order) {
    if (!$order || !is_a($order, 'WC_Order')) {
        $order = wc_get_order($order_id);
    }
    
    if (!$order) {
        return;
    }
    
    $webhook_data = array(
        'order_id' => $order_id,
        'order_number' => $order->get_order_number(),
        'old_status' => $old_status,
        'new_status' => $new_status,
        'customer_id' => $order->get_customer_id(),
    );
    
    headless_trigger_revalidation('order', null, $webhook_data);
}

add_action('woocommerce_order_status_changed', 'headless_order_status_changed_webhook', 10, 4);

/**
 * Trigger webhook when a new order is created
 * 
 * @param int $order_id The order ID
 */
function headless_new_order_webhook($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }
    
    $webhook_data = array(
        'order_id' => $order_id,
        'order_number' => $order->get_order_number(),
        'status' => $order->get_status(),
        'customer_id' => $order->get_customer_id(),
        'action' => 'created',
    );
    
    headless_trigger_revalidation('order', null, $webhook_data);
}

add_action('woocommerce_new_order', 'headless_new_order_webhook', 10, 1);

/**
 * ============================================================================
 * WEBHOOK UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Validate webhook secret header
 * 
 * This function validates that a webhook request contains the correct
 * authentication header. Used by the NextJS frontend to verify requests.
 * 
 * @param string|null $secret_header The secret header value from the request
 * @param string $expected_secret The expected secret value
 * @return bool True if valid, false otherwise
 */
function headless_validate_webhook_secret($secret_header, $expected_secret) {
    if (empty($secret_header) || empty($expected_secret)) {
        return false;
    }
    
    return hash_equals($expected_secret, $secret_header);
}

/**
 * Check if webhook authentication header is present and valid
 * 
 * @param array $headers The request headers
 * @return bool True if the x-revalidate-secret header is present
 */
function headless_webhook_has_auth_header($headers) {
    return isset($headers['x-revalidate-secret']) && !empty($headers['x-revalidate-secret']);
}
