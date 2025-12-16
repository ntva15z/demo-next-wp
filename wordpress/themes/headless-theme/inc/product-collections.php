<?php
/**
 * Product Collections Custom Taxonomy
 * 
 * This file registers a custom taxonomy for product collections,
 * allowing products to be grouped into seasonal or promotional collections.
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
 * Register the product_collection custom taxonomy
 */
function headless_register_product_collection_taxonomy() {
    $labels = array(
        'name'                       => _x('Collections', 'taxonomy general name', 'headless-theme'),
        'singular_name'              => _x('Collection', 'taxonomy singular name', 'headless-theme'),
        'search_items'               => __('Search Collections', 'headless-theme'),
        'popular_items'              => __('Popular Collections', 'headless-theme'),
        'all_items'                  => __('All Collections', 'headless-theme'),
        'parent_item'                => null,
        'parent_item_colon'          => null,
        'edit_item'                  => __('Edit Collection', 'headless-theme'),
        'update_item'                => __('Update Collection', 'headless-theme'),
        'add_new_item'               => __('Add New Collection', 'headless-theme'),
        'new_item_name'              => __('New Collection Name', 'headless-theme'),
        'separate_items_with_commas' => __('Separate collections with commas', 'headless-theme'),
        'add_or_remove_items'        => __('Add or remove collections', 'headless-theme'),
        'choose_from_most_used'      => __('Choose from the most used collections', 'headless-theme'),
        'not_found'                  => __('No collections found.', 'headless-theme'),
        'menu_name'                  => __('Collections', 'headless-theme'),
        'back_to_items'              => __('← Back to Collections', 'headless-theme'),
    );

    $args = array(
        'hierarchical'          => false, // Non-hierarchical like tags
        'labels'                => $labels,
        'show_ui'               => true,
        'show_admin_column'     => true,
        'show_in_rest'          => true, // Enable REST API support
        'show_in_graphql'       => true, // Enable GraphQL support
        'graphql_single_name'   => 'productCollection',
        'graphql_plural_name'   => 'productCollections',
        'query_var'             => true,
        'rewrite'               => array('slug' => 'collection'),
        'update_count_callback' => '_update_post_term_count',
    );

    register_taxonomy('product_collection', array('product'), $args);
}
add_action('init', 'headless_register_product_collection_taxonomy', 5);

/**
 * Get default product collections
 * 
 * @return array Array of collection data
 */
function headless_get_default_collections() {
    return array(
        'summer-2024' => array(
            'name'        => 'Summer 2024',
            'description' => 'Bộ sưu tập Hè 2024 với các thiết kế tươi mát, năng động',
            'featured'    => true,
        ),
        'winter-2024' => array(
            'name'        => 'Winter 2024',
            'description' => 'Bộ sưu tập Đông 2024 với các thiết kế ấm áp, sang trọng',
            'featured'    => false,
        ),
        'new-arrivals' => array(
            'name'        => 'New Arrivals',
            'description' => 'Sản phẩm mới nhất vừa về cửa hàng',
            'featured'    => true,
        ),
        'best-sellers' => array(
            'name'        => 'Best Sellers',
            'description' => 'Những sản phẩm bán chạy nhất',
            'featured'    => true,
        ),
        'flash-sale' => array(
            'name'        => 'Flash Sale',
            'description' => 'Khuyến mãi giảm giá đặc biệt trong thời gian giới hạn',
            'featured'    => false,
        ),
        'exclusive' => array(
            'name'        => 'Exclusive',
            'description' => 'Bộ sưu tập độc quyền, số lượng giới hạn',
            'featured'    => false,
        ),
    );
}

/**
 * Create a product collection term
 * 
 * @param string $slug Collection slug
 * @param string $name Collection name
 * @param string $description Collection description
 * @param bool $featured Whether the collection is featured
 * @return int|WP_Error Term ID on success, WP_Error on failure
 */
function headless_create_product_collection($slug, $name, $description = '', $featured = false) {
    // Check if collection already exists
    $existing = term_exists($slug, 'product_collection');
    if ($existing) {
        return $existing['term_id'];
    }
    
    $result = wp_insert_term(
        $name,
        'product_collection',
        array(
            'slug'        => $slug,
            'description' => $description,
        )
    );
    
    if (!is_wp_error($result) && isset($result['term_id'])) {
        // Store featured status as term meta
        update_term_meta($result['term_id'], 'featured', $featured ? '1' : '0');
        return $result['term_id'];
    }
    
    return $result;
}

/**
 * Setup default product collections
 */
function headless_setup_product_collections() {
    // Only run once
    if (get_option('headless_product_collections_setup_complete')) {
        return;
    }
    
    // Ensure taxonomy is registered
    if (!taxonomy_exists('product_collection')) {
        return;
    }
    
    $collections = headless_get_default_collections();
    
    foreach ($collections as $slug => $data) {
        headless_create_product_collection(
            $slug,
            $data['name'],
            $data['description'],
            $data['featured']
        );
    }
    
    // Mark setup as complete
    update_option('headless_product_collections_setup_complete', true);
}
add_action('init', 'headless_setup_product_collections', 35);

/**
 * Add featured meta field to collection admin UI
 */
function headless_add_collection_featured_field($term) {
    $featured = '';
    if (is_object($term)) {
        $featured = get_term_meta($term->term_id, 'featured', true);
    }
    ?>
    <tr class="form-field">
        <th scope="row">
            <label for="collection-featured"><?php _e('Featured Collection', 'headless-theme'); ?></label>
        </th>
        <td>
            <input type="checkbox" name="collection_featured" id="collection-featured" value="1" <?php checked($featured, '1'); ?>>
            <p class="description"><?php _e('Check to mark this collection as featured on the homepage.', 'headless-theme'); ?></p>
        </td>
    </tr>
    <?php
}
add_action('product_collection_edit_form_fields', 'headless_add_collection_featured_field');

/**
 * Add featured field to add new collection form
 */
function headless_add_collection_featured_field_new() {
    ?>
    <div class="form-field">
        <label for="collection-featured"><?php _e('Featured Collection', 'headless-theme'); ?></label>
        <input type="checkbox" name="collection_featured" id="collection-featured" value="1">
        <p class="description"><?php _e('Check to mark this collection as featured on the homepage.', 'headless-theme'); ?></p>
    </div>
    <?php
}
add_action('product_collection_add_form_fields', 'headless_add_collection_featured_field_new');

/**
 * Save featured meta field
 */
function headless_save_collection_featured_field($term_id) {
    $featured = isset($_POST['collection_featured']) ? '1' : '0';
    update_term_meta($term_id, 'featured', $featured);
}
add_action('created_product_collection', 'headless_save_collection_featured_field');
add_action('edited_product_collection', 'headless_save_collection_featured_field');

/**
 * Expose collection featured status in GraphQL
 */
function headless_add_collection_fields_to_graphql() {
    if (!function_exists('register_graphql_field')) {
        return;
    }
    
    register_graphql_field('ProductCollection', 'featured', array(
        'type'        => 'Boolean',
        'description' => 'Whether this collection is featured',
        'resolve'     => function($term) {
            return get_term_meta($term->term_id, 'featured', true) === '1';
        },
    ));
}
add_action('graphql_register_types', 'headless_add_collection_fields_to_graphql');

/**
 * Reset collections setup flag when WooCommerce is activated
 */
function headless_reset_collections_on_woocommerce_activation($plugin) {
    if (strpos($plugin, 'woocommerce') !== false) {
        delete_option('headless_product_collections_setup_complete');
    }
}
add_action('activated_plugin', 'headless_reset_collections_on_woocommerce_activation');
