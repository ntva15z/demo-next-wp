<?php
/**
 * Order Management Configuration
 * 
 * Configures order status workflow and email notifications for WooCommerce.
 * 
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Define valid order status transitions
 * This defines which status transitions are allowed in the workflow
 */
function headless_get_valid_order_status_transitions() {
    return array(
        'pending' => array('processing', 'on-hold', 'cancelled', 'failed'),
        'processing' => array('completed', 'on-hold', 'cancelled', 'refunded'),
        'on-hold' => array('processing', 'pending', 'cancelled', 'failed'),
        'completed' => array('refunded'),
        'cancelled' => array('pending', 'processing'),
        'refunded' => array(),
        'failed' => array('pending', 'processing', 'cancelled'),
    );
}

/**
 * Check if a status transition is valid
 * 
 * @param string $from_status Current order status
 * @param string $to_status Target order status
 * @return bool Whether the transition is valid
 */
function headless_is_valid_status_transition($from_status, $to_status) {
    // Remove 'wc-' prefix if present
    $from_status = str_replace('wc-', '', $from_status);
    $to_status = str_replace('wc-', '', $to_status);
    
    $valid_transitions = headless_get_valid_order_status_transitions();
    
    // If from_status doesn't exist in our map, allow the transition (for custom statuses)
    if (!isset($valid_transitions[$from_status])) {
        return true;
    }
    
    return in_array($to_status, $valid_transitions[$from_status], true);
}

/**
 * Validate order status transition before it happens
 */
function headless_validate_order_status_transition($order_id, $old_status, $new_status, $order) {
    // Skip validation for new orders (no old status)
    if (empty($old_status)) {
        return;
    }
    
    // Log invalid transitions but don't block them (WooCommerce handles this)
    if (!headless_is_valid_status_transition($old_status, $new_status)) {
        error_log(sprintf(
            'Order #%d: Unusual status transition from %s to %s',
            $order_id,
            $old_status,
            $new_status
        ));
    }
}
add_action('woocommerce_order_status_changed', 'headless_validate_order_status_transition', 10, 4);

/**
 * Configure email notifications for order statuses
 */
function headless_configure_order_emails() {
    // Get WooCommerce mailer
    $mailer = WC()->mailer();
    
    if (!$mailer) {
        return;
    }
    
    // Email configuration is handled by WooCommerce settings
    // This function ensures emails are properly initialized
}
add_action('woocommerce_init', 'headless_configure_order_emails');

/**
 * Customize order status email subjects for Vietnamese
 */
function headless_customize_email_subjects($subject, $order, $email) {
    if (!$order) {
        return $subject;
    }
    
    $order_number = $order->get_order_number();
    
    $subjects = array(
        'customer_on_hold_order' => sprintf('Đơn hàng #%s đang chờ xử lý', $order_number),
        'customer_processing_order' => sprintf('Đơn hàng #%s đang được xử lý', $order_number),
        'customer_completed_order' => sprintf('Đơn hàng #%s đã hoàn thành', $order_number),
        'customer_refunded_order' => sprintf('Đơn hàng #%s đã được hoàn tiền', $order_number),
        'customer_note' => sprintf('Ghi chú mới cho đơn hàng #%s', $order_number),
    );
    
    $email_id = $email->id ?? '';
    
    if (isset($subjects[$email_id])) {
        return $subjects[$email_id];
    }
    
    return $subject;
}
add_filter('woocommerce_email_subject_customer_on_hold_order', 'headless_customize_email_subjects', 10, 3);
add_filter('woocommerce_email_subject_customer_processing_order', 'headless_customize_email_subjects', 10, 3);
add_filter('woocommerce_email_subject_customer_completed_order', 'headless_customize_email_subjects', 10, 3);
add_filter('woocommerce_email_subject_customer_refunded_order', 'headless_customize_email_subjects', 10, 3);
add_filter('woocommerce_email_subject_customer_note', 'headless_customize_email_subjects', 10, 3);

/**
 * Add custom order statuses if needed
 * Currently using default WooCommerce statuses:
 * - pending: Chờ thanh toán
 * - processing: Đang xử lý
 * - on-hold: Tạm giữ
 * - completed: Hoàn thành
 * - cancelled: Đã hủy
 * - refunded: Đã hoàn tiền
 * - failed: Thất bại
 */
function headless_register_custom_order_statuses() {
    // Register 'shipped' status for tracking shipments
    register_post_status('wc-shipped', array(
        'label' => _x('Đã giao hàng', 'Order status', 'headless-theme'),
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop(
            'Đã giao hàng <span class="count">(%s)</span>',
            'Đã giao hàng <span class="count">(%s)</span>',
            'headless-theme'
        ),
    ));
}
add_action('init', 'headless_register_custom_order_statuses');

/**
 * Add custom order statuses to WooCommerce order statuses list
 */
function headless_add_custom_order_statuses($order_statuses) {
    $new_statuses = array();
    
    foreach ($order_statuses as $key => $status) {
        $new_statuses[$key] = $status;
        
        // Add 'shipped' after 'processing'
        if ($key === 'wc-processing') {
            $new_statuses['wc-shipped'] = _x('Đã giao hàng', 'Order status', 'headless-theme');
        }
    }
    
    return $new_statuses;
}
add_filter('wc_order_statuses', 'headless_add_custom_order_statuses');

/**
 * Update valid transitions to include shipped status
 */
function headless_get_extended_valid_transitions() {
    return array(
        'pending' => array('processing', 'on-hold', 'cancelled', 'failed'),
        'processing' => array('shipped', 'completed', 'on-hold', 'cancelled', 'refunded'),
        'shipped' => array('completed', 'refunded'),
        'on-hold' => array('processing', 'pending', 'cancelled', 'failed'),
        'completed' => array('refunded'),
        'cancelled' => array('pending', 'processing'),
        'refunded' => array(),
        'failed' => array('pending', 'processing', 'cancelled'),
    );
}

/**
 * Send email notification when order status changes to shipped
 */
function headless_send_shipped_email($order_id, $old_status, $new_status, $order) {
    if ($new_status !== 'shipped') {
        return;
    }
    
    // Get customer email
    $customer_email = $order->get_billing_email();
    
    if (empty($customer_email)) {
        return;
    }
    
    $order_number = $order->get_order_number();
    $subject = sprintf('Đơn hàng #%s đã được giao cho đơn vị vận chuyển', $order_number);
    
    $message = sprintf(
        'Xin chào %s,<br><br>Đơn hàng #%s của bạn đã được giao cho đơn vị vận chuyển.<br><br>Cảm ơn bạn đã mua hàng!',
        $order->get_billing_first_name(),
        $order_number
    );
    
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    wp_mail($customer_email, $subject, $message, $headers);
}
add_action('woocommerce_order_status_changed', 'headless_send_shipped_email', 10, 4);

/**
 * Validate order data completeness
 * Ensures order has all required fields
 * 
 * @param WC_Order $order The order object
 * @return array Validation result with 'valid' boolean and 'errors' array
 */
function headless_validate_order_completeness($order) {
    $errors = array();
    
    // Check customer details
    if (empty($order->get_billing_first_name()) && empty($order->get_billing_last_name())) {
        $errors[] = 'missing_customer_name';
    }
    
    if (empty($order->get_billing_email())) {
        $errors[] = 'missing_customer_email';
    }
    
    if (empty($order->get_billing_phone())) {
        $errors[] = 'missing_customer_phone';
    }
    
    // Check billing address
    if (empty($order->get_billing_address_1())) {
        $errors[] = 'missing_billing_address';
    }
    
    if (empty($order->get_billing_city())) {
        $errors[] = 'missing_billing_city';
    }
    
    // Check shipping address if order needs shipping
    if ($order->needs_shipping_address()) {
        if (empty($order->get_shipping_address_1())) {
            $errors[] = 'missing_shipping_address';
        }
        
        if (empty($order->get_shipping_city())) {
            $errors[] = 'missing_shipping_city';
        }
    }
    
    // Check line items
    $items = $order->get_items();
    if (empty($items)) {
        $errors[] = 'missing_line_items';
    } else {
        foreach ($items as $item) {
            if (empty($item->get_product_id())) {
                $errors[] = 'invalid_line_item_product';
                break;
            }
        }
    }
    
    return array(
        'valid' => empty($errors),
        'errors' => $errors,
    );
}

/**
 * Validate order before status change to processing
 */
function headless_validate_order_before_processing($order_id, $old_status, $new_status, $order) {
    if ($new_status !== 'processing') {
        return;
    }
    
    $validation = headless_validate_order_completeness($order);
    
    if (!$validation['valid']) {
        error_log(sprintf(
            'Order #%d has incomplete data: %s',
            $order_id,
            implode(', ', $validation['errors'])
        ));
    }
}
add_action('woocommerce_order_status_changed', 'headless_validate_order_before_processing', 5, 4);

/**
 * Get order data for GraphQL/API responses
 * Ensures all required fields are included
 * 
 * @param WC_Order $order The order object
 * @return array Order data array
 */
function headless_get_order_data($order) {
    return array(
        'id' => $order->get_id(),
        'order_number' => $order->get_order_number(),
        'status' => $order->get_status(),
        'date_created' => $order->get_date_created() ? $order->get_date_created()->format('c') : null,
        'date_modified' => $order->get_date_modified() ? $order->get_date_modified()->format('c') : null,
        'customer' => array(
            'id' => $order->get_customer_id(),
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'email' => $order->get_billing_email(),
            'phone' => $order->get_billing_phone(),
        ),
        'billing' => array(
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'company' => $order->get_billing_company(),
            'address_1' => $order->get_billing_address_1(),
            'address_2' => $order->get_billing_address_2(),
            'city' => $order->get_billing_city(),
            'state' => $order->get_billing_state(),
            'postcode' => $order->get_billing_postcode(),
            'country' => $order->get_billing_country(),
            'email' => $order->get_billing_email(),
            'phone' => $order->get_billing_phone(),
        ),
        'shipping' => array(
            'first_name' => $order->get_shipping_first_name(),
            'last_name' => $order->get_shipping_last_name(),
            'company' => $order->get_shipping_company(),
            'address_1' => $order->get_shipping_address_1(),
            'address_2' => $order->get_shipping_address_2(),
            'city' => $order->get_shipping_city(),
            'state' => $order->get_shipping_state(),
            'postcode' => $order->get_shipping_postcode(),
            'country' => $order->get_shipping_country(),
        ),
        'line_items' => array_map(function($item) {
            return array(
                'id' => $item->get_id(),
                'product_id' => $item->get_product_id(),
                'variation_id' => $item->get_variation_id(),
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'subtotal' => $item->get_subtotal(),
                'total' => $item->get_total(),
            );
        }, array_values($order->get_items())),
        'totals' => array(
            'subtotal' => $order->get_subtotal(),
            'shipping_total' => $order->get_shipping_total(),
            'discount_total' => $order->get_discount_total(),
            'total' => $order->get_total(),
            'total_tax' => $order->get_total_tax(),
        ),
        'payment_method' => $order->get_payment_method(),
        'payment_method_title' => $order->get_payment_method_title(),
        'customer_note' => $order->get_customer_note(),
    );
}
