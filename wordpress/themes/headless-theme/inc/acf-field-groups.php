<?php
/**
 * ACF Field Groups Configuration
 * 
 * Registers custom field groups for blog posts and products
 * to enable product-blog relationships and additional product metadata.
 *
 * @package Headless_Theme
 * @requirements 8.4, 4.1, 4.2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register ACF field groups programmatically
 * 
 * This function registers field groups using ACF's acf_add_local_field_group()
 * which allows version control and consistent deployment across environments.
 */
function headless_register_acf_field_groups() {
    // Check if ACF is active
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    // Register Blog Post Fields group
    headless_register_blog_post_fields();
    
    // Register Product Fields group (optional enhancement)
    headless_register_product_fields();
}
add_action('acf/init', 'headless_register_acf_field_groups');

/**
 * Register ACF field group for blog posts
 * 
 * Creates fields for linking posts to related products and SEO summary.
 * Requirements: 8.4 - Link relevant posts to related products using custom fields
 */
function headless_register_blog_post_fields() {
    acf_add_local_field_group(array(
        'key' => 'group_blog_post_fields',
        'title' => 'Blog Post Fields',
        'fields' => array(
            // Related Products - Relationship field linking to WooCommerce products
            array(
                'key' => 'field_related_products',
                'label' => 'Related Products',
                'name' => 'related_products',
                'type' => 'relationship',
                'instructions' => 'Select products related to this blog post. These will be displayed alongside the post content.',
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => array(
                    'width' => '',
                    'class' => '',
                    'id' => '',
                ),
                'post_type' => array(
                    0 => 'product',
                ),
                'taxonomy' => '',
                'filters' => array(
                    0 => 'search',
                    1 => 'taxonomy',
                ),
                'elements' => array(
                    0 => 'featured_image',
                ),
                'min' => 0,
                'max' => 10,
                'return_format' => 'id',
            ),
            // Post Summary - Text field for SEO
            array(
                'key' => 'field_post_summary',
                'label' => 'Post Summary',
                'name' => 'post_summary',
                'type' => 'textarea',
                'instructions' => 'A brief summary of the post for SEO purposes. This will be used as the meta description if no excerpt is provided.',
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => array(
                    'width' => '',
                    'class' => '',
                    'id' => '',
                ),
                'default_value' => '',
                'placeholder' => 'Enter a brief summary (150-160 characters recommended)',
                'maxlength' => 300,
                'rows' => 3,
                'new_lines' => '',
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'post_type',
                    'operator' => '==',
                    'value' => 'post',
                ),
            ),
        ),
        'menu_order' => 0,
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
        'hide_on_screen' => '',
        'active' => true,
        'description' => 'Custom fields for blog posts to link with products and improve SEO.',
        'show_in_rest' => 1,
        'show_in_graphql' => 1,
        'graphql_field_name' => 'blogPostFields',
    ));
}

/**
 * Register ACF field group for products (optional enhancement)
 * 
 * Creates fields for product video URL and size guide.
 * Requirements: 4.1, 4.2 - Additional product metadata
 */
function headless_register_product_fields() {
    acf_add_local_field_group(array(
        'key' => 'group_product_fields',
        'title' => 'Product Additional Fields',
        'fields' => array(
            // Video URL - URL field for product video
            array(
                'key' => 'field_video_url',
                'label' => 'Product Video URL',
                'name' => 'video_url',
                'type' => 'url',
                'instructions' => 'Enter a YouTube or Vimeo URL for the product video.',
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => array(
                    'width' => '',
                    'class' => '',
                    'id' => '',
                ),
                'default_value' => '',
                'placeholder' => 'https://www.youtube.com/watch?v=...',
            ),
            // Size Guide - WYSIWYG field for size information
            array(
                'key' => 'field_size_guide',
                'label' => 'Size Guide',
                'name' => 'size_guide',
                'type' => 'wysiwyg',
                'instructions' => 'Enter size guide information for this product. Include measurements and fitting advice.',
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => array(
                    'width' => '',
                    'class' => '',
                    'id' => '',
                ),
                'default_value' => '',
                'tabs' => 'all',
                'toolbar' => 'full',
                'media_upload' => 1,
                'delay' => 0,
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'post_type',
                    'operator' => '==',
                    'value' => 'product',
                ),
            ),
        ),
        'menu_order' => 0,
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
        'hide_on_screen' => '',
        'active' => true,
        'description' => 'Additional fields for WooCommerce products including video and size guide.',
        'show_in_rest' => 1,
        'show_in_graphql' => 1,
        'graphql_field_name' => 'productFields',
    ));
}

/**
 * Expose ACF fields to WPGraphQL
 * 
 * Ensures ACF fields are available in GraphQL queries for the headless frontend.
 */
function headless_acf_graphql_settings() {
    // Check if WPGraphQL for ACF is active
    if (!function_exists('acf_get_field_groups')) {
        return;
    }
    
    // Enable GraphQL for all ACF field groups by default
    add_filter('acf/settings/show_in_graphql', '__return_true');
}
add_action('init', 'headless_acf_graphql_settings');

/**
 * Add helper function to get related products for a post
 * 
 * @param int $post_id The post ID
 * @return array Array of product IDs
 */
function headless_get_related_products($post_id = null) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    if (!function_exists('get_field')) {
        return array();
    }
    
    $related_products = get_field('related_products', $post_id);
    
    return is_array($related_products) ? $related_products : array();
}

/**
 * Add helper function to get post summary
 * 
 * @param int $post_id The post ID
 * @return string The post summary or empty string
 */
function headless_get_post_summary($post_id = null) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    if (!function_exists('get_field')) {
        return '';
    }
    
    $summary = get_field('post_summary', $post_id);
    
    return $summary ? $summary : '';
}

/**
 * Add helper function to get product video URL
 * 
 * @param int $product_id The product ID
 * @return string The video URL or empty string
 */
function headless_get_product_video_url($product_id = null) {
    if (!$product_id) {
        $product_id = get_the_ID();
    }
    
    if (!function_exists('get_field')) {
        return '';
    }
    
    $video_url = get_field('video_url', $product_id);
    
    return $video_url ? $video_url : '';
}

/**
 * Add helper function to get product size guide
 * 
 * @param int $product_id The product ID
 * @return string The size guide HTML or empty string
 */
function headless_get_product_size_guide($product_id = null) {
    if (!$product_id) {
        $product_id = get_the_ID();
    }
    
    if (!function_exists('get_field')) {
        return '';
    }
    
    $size_guide = get_field('size_guide', $product_id);
    
    return $size_guide ? $size_guide : '';
}
