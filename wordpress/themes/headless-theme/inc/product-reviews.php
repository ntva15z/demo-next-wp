<?php
/**
 * Product Reviews Configuration
 * 
 * Configures WooCommerce product reviews with:
 * - Reviews enabled on products
 * - Admin approval required for new reviews
 * - Verified purchase badge support
 * - Average rating calculation
 *
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enable product reviews in WooCommerce
 */
function headless_enable_product_reviews() {
    // Enable reviews on products
    update_option('woocommerce_enable_reviews', 'yes');
    
    // Enable review ratings
    update_option('woocommerce_enable_review_rating', 'yes');
    
    // Require rating for reviews
    update_option('woocommerce_review_rating_required', 'yes');
    
    // Enable verified owner label
    update_option('woocommerce_review_rating_verification_label', 'yes');
    
    // Only allow verified owners to review
    update_option('woocommerce_review_rating_verification_required', 'no');
}
add_action('init', 'headless_enable_product_reviews');

/**
 * Require admin approval for new reviews (moderation)
 * Sets all new comments on products to require moderation
 */
function headless_require_review_moderation() {
    // Require manual approval for comments
    update_option('comment_moderation', '1');
    
    // Hold comments for moderation
    update_option('comment_previously_approved', '0');
}
add_action('init', 'headless_require_review_moderation');

/**
 * Force new product reviews to pending status
 * 
 * @param array $commentdata Comment data
 * @return array Modified comment data
 */
function headless_set_review_pending_status($commentdata) {
    // Check if this is a product review
    if (isset($commentdata['comment_post_ID'])) {
        $post_type = get_post_type($commentdata['comment_post_ID']);
        
        if ($post_type === 'product') {
            // Force pending status for product reviews
            $commentdata['comment_approved'] = 0;
        }
    }
    
    return $commentdata;
}
add_filter('preprocess_comment', 'headless_set_review_pending_status');

/**
 * Check if a reviewer has purchased the product
 * 
 * @param int $product_id Product ID
 * @param string $email Reviewer email
 * @return bool True if verified purchase
 */
function headless_is_verified_purchase($product_id, $email) {
    if (empty($email) || empty($product_id)) {
        return false;
    }
    
    // Get customer by email
    $customer = get_user_by('email', $email);
    
    if (!$customer) {
        // Check guest orders
        return headless_check_guest_purchase($product_id, $email);
    }
    
    // Check if customer has purchased this product
    return wc_customer_bought_product($email, $customer->ID, $product_id);
}

/**
 * Check if a guest has purchased the product
 * 
 * @param int $product_id Product ID
 * @param string $email Guest email
 * @return bool True if guest purchased the product
 */
function headless_check_guest_purchase($product_id, $email) {
    global $wpdb;
    
    // Query orders by billing email
    $orders = $wpdb->get_results($wpdb->prepare(
        "SELECT p.ID FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type = 'shop_order'
        AND p.post_status IN ('wc-completed', 'wc-processing')
        AND pm.meta_key = '_billing_email'
        AND pm.meta_value = %s",
        $email
    ));
    
    if (empty($orders)) {
        return false;
    }
    
    // Check if any order contains the product
    foreach ($orders as $order_post) {
        $order = wc_get_order($order_post->ID);
        if ($order) {
            foreach ($order->get_items() as $item) {
                if ($item->get_product_id() == $product_id || 
                    $item->get_variation_id() == $product_id) {
                    return true;
                }
            }
        }
    }
    
    return false;
}


/**
 * Add verified purchase badge to review meta
 * 
 * @param int $comment_id Comment ID
 */
function headless_add_verified_badge_meta($comment_id) {
    $comment = get_comment($comment_id);
    
    if (!$comment) {
        return;
    }
    
    $post_type = get_post_type($comment->comment_post_ID);
    
    if ($post_type !== 'product') {
        return;
    }
    
    // Check if verified purchase
    $is_verified = headless_is_verified_purchase(
        $comment->comment_post_ID,
        $comment->comment_author_email
    );
    
    // Store verified status as comment meta
    update_comment_meta($comment_id, 'verified', $is_verified ? 1 : 0);
}
add_action('comment_post', 'headless_add_verified_badge_meta');

/**
 * Get review data with all required fields
 * 
 * @param int $review_id Review/Comment ID
 * @return array|null Review data or null if not found
 */
function headless_get_review_data($review_id) {
    $comment = get_comment($review_id);
    
    if (!$comment) {
        return null;
    }
    
    $post_type = get_post_type($comment->comment_post_ID);
    
    if ($post_type !== 'product') {
        return null;
    }
    
    // Get rating from comment meta
    $rating = get_comment_meta($review_id, 'rating', true);
    
    // Get verified status
    $verified = get_comment_meta($review_id, 'verified', true);
    
    return array(
        'id' => (int) $comment->comment_ID,
        'productId' => (int) $comment->comment_post_ID,
        'rating' => (int) $rating,
        'content' => $comment->comment_content,
        'author' => array(
            'name' => $comment->comment_author,
            'email' => $comment->comment_author_email,
        ),
        'date' => $comment->comment_date,
        'dateGmt' => $comment->comment_date_gmt,
        'verified' => (bool) $verified,
        'status' => headless_get_review_status($comment->comment_approved),
    );
}

/**
 * Convert WordPress comment status to review status
 * 
 * @param string|int $approved Comment approved status
 * @return string Review status
 */
function headless_get_review_status($approved) {
    switch ($approved) {
        case '1':
        case 1:
            return 'APPROVED';
        case '0':
        case 0:
            return 'PENDING';
        case 'spam':
            return 'SPAM';
        case 'trash':
            return 'TRASH';
        default:
            return 'PENDING';
    }
}

/**
 * Calculate average rating for a product
 * 
 * @param int $product_id Product ID
 * @return float Average rating rounded to 1 decimal place
 */
function headless_calculate_average_rating($product_id) {
    global $wpdb;
    
    // Get all approved reviews with ratings for this product
    $ratings = $wpdb->get_col($wpdb->prepare(
        "SELECT cm.meta_value FROM {$wpdb->comments} c
        INNER JOIN {$wpdb->commentmeta} cm ON c.comment_ID = cm.comment_id
        WHERE c.comment_post_ID = %d
        AND c.comment_approved = '1'
        AND c.comment_type = 'review'
        AND cm.meta_key = 'rating'
        AND cm.meta_value > 0",
        $product_id
    ));
    
    if (empty($ratings)) {
        return 0.0;
    }
    
    // Calculate arithmetic mean
    $sum = array_sum(array_map('intval', $ratings));
    $count = count($ratings);
    
    // Round to 1 decimal place
    return round($sum / $count, 1);
}

/**
 * Update product average rating when review is approved
 * 
 * @param int $comment_id Comment ID
 * @param string $new_status New status
 * @param string $old_status Old status
 */
function headless_update_product_rating_on_status_change($comment_id, $new_status, $old_status) {
    $comment = get_comment($comment_id);
    
    if (!$comment) {
        return;
    }
    
    $post_type = get_post_type($comment->comment_post_ID);
    
    if ($post_type !== 'product') {
        return;
    }
    
    // Recalculate average rating
    $average = headless_calculate_average_rating($comment->comment_post_ID);
    
    // Update product meta
    $product = wc_get_product($comment->comment_post_ID);
    if ($product) {
        $product->set_average_rating($average);
        $product->save();
    }
}
add_action('transition_comment_status', 'headless_update_product_rating_on_status_change', 10, 3);

/**
 * Submit a product review
 * 
 * @param array $data Review data
 * @return array|WP_Error Review result or error
 */
function headless_submit_product_review($data) {
    // Validate required fields
    if (empty($data['product_id'])) {
        return new WP_Error('missing_product_id', 'Product ID is required');
    }
    
    if (empty($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
        return new WP_Error('invalid_rating', 'Rating must be between 1 and 5');
    }
    
    if (empty($data['content'])) {
        return new WP_Error('missing_content', 'Review content is required');
    }
    
    if (empty($data['author_name'])) {
        return new WP_Error('missing_author_name', 'Author name is required');
    }
    
    if (empty($data['author_email']) || !is_email($data['author_email'])) {
        return new WP_Error('invalid_email', 'Valid email is required');
    }
    
    // Check product exists
    $product = wc_get_product($data['product_id']);
    if (!$product) {
        return new WP_Error('product_not_found', 'Product not found');
    }
    
    // Prepare comment data
    $commentdata = array(
        'comment_post_ID' => $data['product_id'],
        'comment_author' => sanitize_text_field($data['author_name']),
        'comment_author_email' => sanitize_email($data['author_email']),
        'comment_content' => sanitize_textarea_field($data['content']),
        'comment_type' => 'review',
        'comment_approved' => 0, // Always pending for moderation
    );
    
    // Insert comment
    $comment_id = wp_insert_comment($commentdata);
    
    if (!$comment_id) {
        return new WP_Error('insert_failed', 'Failed to submit review');
    }
    
    // Add rating meta
    add_comment_meta($comment_id, 'rating', (int) $data['rating']);
    
    // Add verified purchase badge
    headless_add_verified_badge_meta($comment_id);
    
    return array(
        'success' => true,
        'review_id' => $comment_id,
        'status' => 'PENDING',
        'message' => 'Review submitted and pending approval',
    );
}

/**
 * Get product reviews
 * 
 * @param int $product_id Product ID
 * @param array $args Query arguments
 * @return array Reviews data
 */
function headless_get_product_reviews($product_id, $args = array()) {
    $defaults = array(
        'status' => 'approve',
        'post_id' => $product_id,
        'type' => 'review',
        'orderby' => 'comment_date',
        'order' => 'DESC',
        'number' => 10,
        'offset' => 0,
    );
    
    $args = wp_parse_args($args, $defaults);
    
    $comments = get_comments($args);
    $reviews = array();
    
    foreach ($comments as $comment) {
        $reviews[] = headless_get_review_data($comment->comment_ID);
    }
    
    // Get total count
    $count_args = $args;
    $count_args['count'] = true;
    unset($count_args['number'], $count_args['offset']);
    $total = get_comments($count_args);
    
    return array(
        'reviews' => $reviews,
        'total' => $total,
        'average_rating' => headless_calculate_average_rating($product_id),
    );
}

/**
 * REST API endpoint for submitting reviews
 */
function headless_register_review_endpoints() {
    register_rest_route('headless/v1', '/reviews', array(
        'methods' => 'POST',
        'callback' => 'headless_rest_submit_review',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('headless/v1', '/products/(?P<id>\d+)/reviews', array(
        'methods' => 'GET',
        'callback' => 'headless_rest_get_product_reviews',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'headless_register_review_endpoints');

/**
 * REST callback for submitting review
 * 
 * @param WP_REST_Request $request Request object
 * @return WP_REST_Response Response
 */
function headless_rest_submit_review($request) {
    $data = array(
        'product_id' => $request->get_param('product_id'),
        'rating' => $request->get_param('rating'),
        'content' => $request->get_param('content'),
        'author_name' => $request->get_param('author_name'),
        'author_email' => $request->get_param('author_email'),
    );
    
    $result = headless_submit_product_review($data);
    
    if (is_wp_error($result)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => $result->get_error_message(),
        ), 400);
    }
    
    return new WP_REST_Response($result, 201);
}

/**
 * REST callback for getting product reviews
 * 
 * @param WP_REST_Request $request Request object
 * @return WP_REST_Response Response
 */
function headless_rest_get_product_reviews($request) {
    $product_id = $request->get_param('id');
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 10;
    
    $args = array(
        'number' => $per_page,
        'offset' => ($page - 1) * $per_page,
    );
    
    $result = headless_get_product_reviews($product_id, $args);
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $result,
    ), 200);
}
