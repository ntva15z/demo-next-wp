<?php
/**
 * Product Tags Configuration
 * 
 * This file sets up default product tags for the Vietnamese clothing e-commerce store.
 * Tags are used for filtering and highlighting special products.
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
 * Get default product tags
 * 
 * @return array Array of tag data with slug, name, description, and styling info
 */
function headless_get_default_product_tags() {
    return array(
        'sale' => array(
            'name'        => 'Sale',
            'description' => 'Sản phẩm đang giảm giá',
            'badge_color' => '#FF0000',
            'badge_text'  => '#FFFFFF',
            'priority'    => 1,
        ),
        'new' => array(
            'name'        => 'New',
            'description' => 'Sản phẩm mới về',
            'badge_color' => '#00AA00',
            'badge_text'  => '#FFFFFF',
            'priority'    => 2,
        ),
        'hot' => array(
            'name'        => 'Hot',
            'description' => 'Sản phẩm hot, được yêu thích',
            'badge_color' => '#FF6600',
            'badge_text'  => '#FFFFFF',
            'priority'    => 3,
        ),
        'limited' => array(
            'name'        => 'Limited',
            'description' => 'Sản phẩm số lượng giới hạn',
            'badge_color' => '#9900CC',
            'badge_text'  => '#FFFFFF',
            'priority'    => 4,
        ),
        'trending' => array(
            'name'        => 'Trending',
            'description' => 'Sản phẩm đang thịnh hành',
            'badge_color' => '#0066CC',
            'badge_text'  => '#FFFFFF',
            'priority'    => 5,
        ),
        'bestseller' => array(
            'name'        => 'Bestseller',
            'description' => 'Sản phẩm bán chạy nhất',
            'badge_color' => '#FFD700',
            'badge_text'  => '#000000',
            'priority'    => 6,
        ),
        'exclusive' => array(
            'name'        => 'Exclusive',
            'description' => 'Sản phẩm độc quyền',
            'badge_color' => '#000000',
            'badge_text'  => '#FFFFFF',
            'priority'    => 7,
        ),
        'eco-friendly' => array(
            'name'        => 'Eco-Friendly',
            'description' => 'Sản phẩm thân thiện môi trường',
            'badge_color' => '#228B22',
            'badge_text'  => '#FFFFFF',
            'priority'    => 8,
        ),
    );
}

/**
 * Create a product tag
 * 
 * @param string $slug Tag slug
 * @param string $name Tag name
 * @param string $description Tag description
 * @param string $badge_color Badge background color (hex)
 * @param string $badge_text Badge text color (hex)
 * @param int $priority Display priority
 * @return int|WP_Error Term ID on success, WP_Error on failure
 */
function headless_create_product_tag($slug, $name, $description = '', $badge_color = '', $badge_text = '', $priority = 0) {
    // Check if tag already exists
    $existing = term_exists($slug, 'product_tag');
    if ($existing) {
        // Update meta for existing tag
        $term_id = $existing['term_id'];
        if ($badge_color) {
            update_term_meta($term_id, 'badge_color', $badge_color);
        }
        if ($badge_text) {
            update_term_meta($term_id, 'badge_text_color', $badge_text);
        }
        update_term_meta($term_id, 'priority', $priority);
        return $term_id;
    }
    
    $result = wp_insert_term(
        $name,
        'product_tag',
        array(
            'slug'        => $slug,
            'description' => $description,
        )
    );
    
    if (!is_wp_error($result) && isset($result['term_id'])) {
        // Store badge styling as term meta
        update_term_meta($result['term_id'], 'badge_color', $badge_color);
        update_term_meta($result['term_id'], 'badge_text_color', $badge_text);
        update_term_meta($result['term_id'], 'priority', $priority);
        return $result['term_id'];
    }
    
    return $result;
}

/**
 * Setup default product tags
 */
function headless_setup_product_tags() {
    // Only run once
    if (get_option('headless_product_tags_setup_complete')) {
        return;
    }
    
    // Ensure product_tag taxonomy exists
    if (!taxonomy_exists('product_tag')) {
        return;
    }
    
    $tags = headless_get_default_product_tags();
    
    foreach ($tags as $slug => $data) {
        headless_create_product_tag(
            $slug,
            $data['name'],
            $data['description'],
            $data['badge_color'],
            $data['badge_text'],
            $data['priority']
        );
    }
    
    // Mark setup as complete
    update_option('headless_product_tags_setup_complete', true);
}
add_action('init', 'headless_setup_product_tags', 35);

/**
 * Add badge color fields to product tag admin UI
 */
function headless_add_tag_badge_fields($term) {
    $badge_color = '';
    $badge_text = '';
    $priority = 0;
    
    if (is_object($term)) {
        $badge_color = get_term_meta($term->term_id, 'badge_color', true);
        $badge_text = get_term_meta($term->term_id, 'badge_text_color', true);
        $priority = get_term_meta($term->term_id, 'priority', true);
    }
    ?>
    <tr class="form-field">
        <th scope="row">
            <label for="badge-color"><?php _e('Badge Background Color', 'headless-theme'); ?></label>
        </th>
        <td>
            <input type="color" name="badge_color" id="badge-color" value="<?php echo esc_attr($badge_color); ?>">
            <p class="description"><?php _e('Background color for the product badge.', 'headless-theme'); ?></p>
        </td>
    </tr>
    <tr class="form-field">
        <th scope="row">
            <label for="badge-text-color"><?php _e('Badge Text Color', 'headless-theme'); ?></label>
        </th>
        <td>
            <input type="color" name="badge_text_color" id="badge-text-color" value="<?php echo esc_attr($badge_text); ?>">
            <p class="description"><?php _e('Text color for the product badge.', 'headless-theme'); ?></p>
        </td>
    </tr>
    <tr class="form-field">
        <th scope="row">
            <label for="tag-priority"><?php _e('Display Priority', 'headless-theme'); ?></label>
        </th>
        <td>
            <input type="number" name="tag_priority" id="tag-priority" value="<?php echo esc_attr($priority); ?>" min="0">
            <p class="description"><?php _e('Lower numbers display first when multiple tags are present.', 'headless-theme'); ?></p>
        </td>
    </tr>
    <?php
}
add_action('product_tag_edit_form_fields', 'headless_add_tag_badge_fields');

/**
 * Add badge fields to add new tag form
 */
function headless_add_tag_badge_fields_new() {
    ?>
    <div class="form-field">
        <label for="badge-color"><?php _e('Badge Background Color', 'headless-theme'); ?></label>
        <input type="color" name="badge_color" id="badge-color" value="#FF0000">
        <p class="description"><?php _e('Background color for the product badge.', 'headless-theme'); ?></p>
    </div>
    <div class="form-field">
        <label for="badge-text-color"><?php _e('Badge Text Color', 'headless-theme'); ?></label>
        <input type="color" name="badge_text_color" id="badge-text-color" value="#FFFFFF">
        <p class="description"><?php _e('Text color for the product badge.', 'headless-theme'); ?></p>
    </div>
    <div class="form-field">
        <label for="tag-priority"><?php _e('Display Priority', 'headless-theme'); ?></label>
        <input type="number" name="tag_priority" id="tag-priority" value="0" min="0">
        <p class="description"><?php _e('Lower numbers display first when multiple tags are present.', 'headless-theme'); ?></p>
    </div>
    <?php
}
add_action('product_tag_add_form_fields', 'headless_add_tag_badge_fields_new');

/**
 * Save badge meta fields
 */
function headless_save_tag_badge_fields($term_id) {
    if (isset($_POST['badge_color'])) {
        update_term_meta($term_id, 'badge_color', sanitize_hex_color($_POST['badge_color']));
    }
    if (isset($_POST['badge_text_color'])) {
        update_term_meta($term_id, 'badge_text_color', sanitize_hex_color($_POST['badge_text_color']));
    }
    if (isset($_POST['tag_priority'])) {
        update_term_meta($term_id, 'priority', absint($_POST['tag_priority']));
    }
}
add_action('created_product_tag', 'headless_save_tag_badge_fields');
add_action('edited_product_tag', 'headless_save_tag_badge_fields');

/**
 * Expose tag badge styling in GraphQL
 */
function headless_add_tag_fields_to_graphql() {
    if (!function_exists('register_graphql_field')) {
        return;
    }
    
    // Badge background color
    register_graphql_field('ProductTag', 'badgeColor', array(
        'type'        => 'String',
        'description' => 'Badge background color (hex)',
        'resolve'     => function($term) {
            return get_term_meta($term->term_id, 'badge_color', true);
        },
    ));
    
    // Badge text color
    register_graphql_field('ProductTag', 'badgeTextColor', array(
        'type'        => 'String',
        'description' => 'Badge text color (hex)',
        'resolve'     => function($term) {
            return get_term_meta($term->term_id, 'badge_text_color', true);
        },
    ));
    
    // Display priority
    register_graphql_field('ProductTag', 'priority', array(
        'type'        => 'Int',
        'description' => 'Display priority (lower numbers first)',
        'resolve'     => function($term) {
            return (int) get_term_meta($term->term_id, 'priority', true);
        },
    ));
}
add_action('graphql_register_types', 'headless_add_tag_fields_to_graphql');

/**
 * Reset tags setup flag when WooCommerce is activated
 */
function headless_reset_tags_on_woocommerce_activation($plugin) {
    if (strpos($plugin, 'woocommerce') !== false) {
        delete_option('headless_product_tags_setup_complete');
    }
}
add_action('activated_plugin', 'headless_reset_tags_on_woocommerce_activation');
