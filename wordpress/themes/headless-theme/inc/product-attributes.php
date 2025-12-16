<?php
/**
 * Product Attributes Configuration for Clothing Store
 * 
 * This file registers and configures product attributes for the clothing e-commerce store.
 * It sets up Size and Color attributes with their respective terms.
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
 * Register Size attribute for clothing products
 * 
 * @return int|WP_Error Attribute ID on success, WP_Error on failure
 */
function headless_register_size_attribute() {
    // Check if attribute already exists
    $existing = wc_attribute_taxonomy_id_by_name('pa_size');
    if ($existing) {
        return $existing;
    }
    
    $attribute_data = array(
        'name'         => 'Size',
        'slug'         => 'size',
        'type'         => 'select',
        'order_by'     => 'menu_order',
        'has_archives' => true,
    );
    
    return wc_create_attribute($attribute_data);
}

/**
 * Register Color attribute for clothing products
 * 
 * @return int|WP_Error Attribute ID on success, WP_Error on failure
 */
function headless_register_color_attribute() {
    // Check if attribute already exists
    $existing = wc_attribute_taxonomy_id_by_name('pa_color');
    if ($existing) {
        return $existing;
    }
    
    $attribute_data = array(
        'name'         => 'Color',
        'slug'         => 'color',
        'type'         => 'select', // Can be changed to 'color' if using color picker plugin
        'order_by'     => 'menu_order',
        'has_archives' => true,
    );
    
    return wc_create_attribute($attribute_data);
}

/**
 * Add size terms to the Size attribute taxonomy
 */
function headless_add_size_terms() {
    // Ensure taxonomy is registered
    if (!taxonomy_exists('pa_size')) {
        return;
    }
    
    $sizes = array(
        'XS'  => array('name' => 'XS', 'order' => 1),
        'S'   => array('name' => 'S', 'order' => 2),
        'M'   => array('name' => 'M', 'order' => 3),
        'L'   => array('name' => 'L', 'order' => 4),
        'XL'  => array('name' => 'XL', 'order' => 5),
        'XXL' => array('name' => 'XXL', 'order' => 6),
    );
    
    foreach ($sizes as $slug => $data) {
        // Check if term already exists
        if (!term_exists($data['name'], 'pa_size')) {
            $result = wp_insert_term(
                $data['name'],
                'pa_size',
                array(
                    'slug' => strtolower($slug),
                )
            );
            
            // Set term order if insertion was successful
            if (!is_wp_error($result) && isset($result['term_id'])) {
                update_term_meta($result['term_id'], 'order', $data['order']);
            }
        }
    }
}

/**
 * Add color terms to the Color attribute taxonomy
 */
function headless_add_color_terms() {
    // Ensure taxonomy is registered
    if (!taxonomy_exists('pa_color')) {
        return;
    }
    
    // Colors with their hex codes for potential color picker support
    $colors = array(
        'black'  => array('name' => 'Đen', 'hex' => '#000000', 'order' => 1),
        'white'  => array('name' => 'Trắng', 'hex' => '#FFFFFF', 'order' => 2),
        'red'    => array('name' => 'Đỏ', 'hex' => '#FF0000', 'order' => 3),
        'blue'   => array('name' => 'Xanh Dương', 'hex' => '#0000FF', 'order' => 4),
        'navy'   => array('name' => 'Xanh Navy', 'hex' => '#000080', 'order' => 5),
        'green'  => array('name' => 'Xanh Lá', 'hex' => '#008000', 'order' => 6),
        'yellow' => array('name' => 'Vàng', 'hex' => '#FFFF00', 'order' => 7),
        'pink'   => array('name' => 'Hồng', 'hex' => '#FFC0CB', 'order' => 8),
        'gray'   => array('name' => 'Xám', 'hex' => '#808080', 'order' => 9),
        'brown'  => array('name' => 'Nâu', 'hex' => '#8B4513', 'order' => 10),
        'beige'  => array('name' => 'Be', 'hex' => '#F5F5DC', 'order' => 11),
        'orange' => array('name' => 'Cam', 'hex' => '#FFA500', 'order' => 12),
        'purple' => array('name' => 'Tím', 'hex' => '#800080', 'order' => 13),
    );
    
    foreach ($colors as $slug => $data) {
        // Check if term already exists
        if (!term_exists($data['name'], 'pa_color')) {
            $result = wp_insert_term(
                $data['name'],
                'pa_color',
                array(
                    'slug' => $slug,
                )
            );
            
            // Store color hex code and order as term meta
            if (!is_wp_error($result) && isset($result['term_id'])) {
                update_term_meta($result['term_id'], 'color_hex', $data['hex']);
                update_term_meta($result['term_id'], 'order', $data['order']);
            }
        }
    }
}

/**
 * Setup clothing attributes on init
 * This runs after WooCommerce is fully loaded
 */
function headless_setup_clothing_attributes() {
    // Only run once
    if (get_option('headless_clothing_attributes_setup_complete')) {
        return;
    }
    
    // Register attributes
    $size_result = headless_register_size_attribute();
    $color_result = headless_register_color_attribute();
    
    // If attributes were created successfully, add terms
    if (!is_wp_error($size_result)) {
        // Flush rewrite rules to register taxonomy
        flush_rewrite_rules();
        
        // Add size terms
        headless_add_size_terms();
    }
    
    if (!is_wp_error($color_result)) {
        // Add color terms
        headless_add_color_terms();
    }
    
    // Mark setup as complete
    update_option('headless_clothing_attributes_setup_complete', true);
}
add_action('init', 'headless_setup_clothing_attributes', 20);

/**
 * Re-run attribute setup when WooCommerce is activated
 */
function headless_woocommerce_activated() {
    // Reset the setup flag to allow re-running
    delete_option('headless_clothing_attributes_setup_complete');
}
add_action('activated_plugin', function($plugin) {
    if (strpos($plugin, 'woocommerce') !== false) {
        headless_woocommerce_activated();
    }
});

/**
 * Expose color hex codes in GraphQL for color swatches
 */
function headless_add_color_hex_to_graphql() {
    if (!function_exists('register_graphql_field')) {
        return;
    }
    
    register_graphql_field('TermNode', 'colorHex', array(
        'type'        => 'String',
        'description' => 'Hex color code for color attribute terms',
        'resolve'     => function($term) {
            if ($term->taxonomyName !== 'pa_color') {
                return null;
            }
            return get_term_meta($term->term_id, 'color_hex', true);
        },
    ));
}
add_action('graphql_register_types', 'headless_add_color_hex_to_graphql');

/**
 * Add Material attribute for clothing products (optional)
 * 
 * @return int|WP_Error Attribute ID on success, WP_Error on failure
 */
function headless_register_material_attribute() {
    // Check if attribute already exists
    $existing = wc_attribute_taxonomy_id_by_name('pa_material');
    if ($existing) {
        return $existing;
    }
    
    $attribute_data = array(
        'name'         => 'Material',
        'slug'         => 'material',
        'type'         => 'select',
        'order_by'     => 'menu_order',
        'has_archives' => false,
    );
    
    return wc_create_attribute($attribute_data);
}

/**
 * Add material terms to the Material attribute taxonomy
 */
function headless_add_material_terms() {
    // Ensure taxonomy is registered
    if (!taxonomy_exists('pa_material')) {
        return;
    }
    
    $materials = array(
        'cotton'    => 'Cotton',
        'polyester' => 'Polyester',
        'silk'      => 'Lụa',
        'wool'      => 'Len',
        'linen'     => 'Lanh',
        'denim'     => 'Denim',
        'leather'   => 'Da',
        'nylon'     => 'Nylon',
        'spandex'   => 'Spandex',
        'rayon'     => 'Rayon',
    );
    
    $order = 1;
    foreach ($materials as $slug => $name) {
        if (!term_exists($name, 'pa_material')) {
            $result = wp_insert_term(
                $name,
                'pa_material',
                array('slug' => $slug)
            );
            
            if (!is_wp_error($result) && isset($result['term_id'])) {
                update_term_meta($result['term_id'], 'order', $order);
            }
        }
        $order++;
    }
}

/**
 * Setup additional attributes (Material) on init
 */
function headless_setup_additional_attributes() {
    // Only run once
    if (get_option('headless_additional_attributes_setup_complete')) {
        return;
    }
    
    // Register material attribute
    $material_result = headless_register_material_attribute();
    
    if (!is_wp_error($material_result)) {
        flush_rewrite_rules();
        headless_add_material_terms();
    }
    
    update_option('headless_additional_attributes_setup_complete', true);
}
add_action('init', 'headless_setup_additional_attributes', 25);
