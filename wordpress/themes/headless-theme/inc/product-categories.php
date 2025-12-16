<?php
/**
 * Product Categories Configuration for Clothing Store
 * 
 * This file sets up the default product category hierarchy for the Vietnamese
 * clothing e-commerce store. It creates parent categories and their children.
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
 * Get the default clothing categories hierarchy
 * 
 * @return array Hierarchical array of categories with parent and children
 */
function headless_get_clothing_categories() {
    return array(
        'ao' => array(
            'name'        => 'Áo',
            'description' => 'Các loại áo thời trang nam nữ',
            'children'    => array(
                'ao-thun'   => array('name' => 'Áo Thun', 'description' => 'Áo thun nam nữ các loại'),
                'ao-so-mi'  => array('name' => 'Áo Sơ Mi', 'description' => 'Áo sơ mi công sở và casual'),
                'ao-khoac'  => array('name' => 'Áo Khoác', 'description' => 'Áo khoác các loại'),
                'ao-len'    => array('name' => 'Áo Len', 'description' => 'Áo len và áo sweater'),
                'ao-polo'   => array('name' => 'Áo Polo', 'description' => 'Áo polo nam nữ'),
            ),
        ),
        'quan' => array(
            'name'        => 'Quần',
            'description' => 'Các loại quần thời trang nam nữ',
            'children'    => array(
                'quan-jean'  => array('name' => 'Quần Jean', 'description' => 'Quần jean nam nữ'),
                'quan-tay'   => array('name' => 'Quần Tây', 'description' => 'Quần tây công sở'),
                'quan-short' => array('name' => 'Quần Short', 'description' => 'Quần short nam nữ'),
                'quan-jogger' => array('name' => 'Quần Jogger', 'description' => 'Quần jogger thể thao'),
            ),
        ),
        'vay-dam' => array(
            'name'        => 'Váy & Đầm',
            'description' => 'Váy và đầm thời trang nữ',
            'children'    => array(
                'vay-ngan'     => array('name' => 'Váy Ngắn', 'description' => 'Váy ngắn thời trang'),
                'dam-maxi'     => array('name' => 'Đầm Maxi', 'description' => 'Đầm maxi dài'),
                'dam-cong-so'  => array('name' => 'Đầm Công Sở', 'description' => 'Đầm công sở thanh lịch'),
                'dam-du-tiec'  => array('name' => 'Đầm Dự Tiệc', 'description' => 'Đầm dự tiệc sang trọng'),
            ),
        ),
        'phu-kien' => array(
            'name'        => 'Phụ Kiện',
            'description' => 'Phụ kiện thời trang',
            'children'    => array(
                'tui-xach'   => array('name' => 'Túi Xách', 'description' => 'Túi xách nam nữ'),
                'that-lung'  => array('name' => 'Thắt Lưng', 'description' => 'Thắt lưng da'),
                'mu-non'     => array('name' => 'Mũ Nón', 'description' => 'Mũ nón thời trang'),
                'khan-choang' => array('name' => 'Khăn Choàng', 'description' => 'Khăn choàng và khăn quàng'),
            ),
        ),
    );
}

/**
 * Create a product category with optional parent
 * 
 * @param string $slug Category slug
 * @param string $name Category name
 * @param string $description Category description
 * @param int $parent_id Parent category ID (0 for top-level)
 * @param int $order Menu order
 * @return int|WP_Error Term ID on success, WP_Error on failure
 */
function headless_create_product_category($slug, $name, $description = '', $parent_id = 0, $order = 0) {
    // Check if category already exists
    $existing = term_exists($slug, 'product_cat');
    if ($existing) {
        return $existing['term_id'];
    }
    
    $result = wp_insert_term(
        $name,
        'product_cat',
        array(
            'slug'        => $slug,
            'description' => $description,
            'parent'      => $parent_id,
        )
    );
    
    if (!is_wp_error($result) && isset($result['term_id'])) {
        // Set menu order
        update_term_meta($result['term_id'], 'order', $order);
        return $result['term_id'];
    }
    
    return $result;
}

/**
 * Setup default clothing categories hierarchy
 * Creates parent categories and their children
 */
function headless_setup_clothing_categories() {
    // Only run once
    if (get_option('headless_clothing_categories_setup_complete')) {
        return;
    }
    
    // Ensure product_cat taxonomy exists
    if (!taxonomy_exists('product_cat')) {
        return;
    }
    
    $categories = headless_get_clothing_categories();
    $parent_order = 1;
    
    foreach ($categories as $parent_slug => $parent_data) {
        // Create parent category
        $parent_id = headless_create_product_category(
            $parent_slug,
            $parent_data['name'],
            $parent_data['description'],
            0,
            $parent_order
        );
        
        // Create child categories if parent was created successfully
        if (!is_wp_error($parent_id) && isset($parent_data['children'])) {
            $child_order = 1;
            foreach ($parent_data['children'] as $child_slug => $child_data) {
                headless_create_product_category(
                    $child_slug,
                    $child_data['name'],
                    $child_data['description'],
                    $parent_id,
                    $child_order
                );
                $child_order++;
            }
        }
        
        $parent_order++;
    }
    
    // Mark setup as complete
    update_option('headless_clothing_categories_setup_complete', true);
}
add_action('init', 'headless_setup_clothing_categories', 30);

/**
 * Reset categories setup flag when WooCommerce is activated
 */
function headless_reset_categories_on_woocommerce_activation($plugin) {
    if (strpos($plugin, 'woocommerce') !== false) {
        delete_option('headless_clothing_categories_setup_complete');
    }
}
add_action('activated_plugin', 'headless_reset_categories_on_woocommerce_activation');

/**
 * Get category hierarchy for a given category
 * Returns the full path from root to the category
 * 
 * @param int $category_id Category term ID
 * @return array Array of category objects from root to current
 */
function headless_get_category_hierarchy($category_id) {
    $hierarchy = array();
    $current = get_term($category_id, 'product_cat');
    
    while ($current && !is_wp_error($current)) {
        array_unshift($hierarchy, $current);
        
        if ($current->parent === 0) {
            break;
        }
        
        $current = get_term($current->parent, 'product_cat');
    }
    
    return $hierarchy;
}

/**
 * Expose category hierarchy in GraphQL
 */
function headless_add_category_hierarchy_to_graphql() {
    if (!function_exists('register_graphql_field')) {
        return;
    }
    
    register_graphql_field('ProductCategory', 'hierarchy', array(
        'type'        => array('list_of' => 'ProductCategory'),
        'description' => 'Full category hierarchy from root to current category',
        'resolve'     => function($category) {
            $hierarchy = headless_get_category_hierarchy($category->term_id);
            return array_map(function($term) {
                return new \WPGraphQL\Model\Term($term);
            }, $hierarchy);
        },
    ));
}
add_action('graphql_register_types', 'headless_add_category_hierarchy_to_graphql');
