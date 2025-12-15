<?php
/**
 * Headless Theme Functions
 * 
 * This theme is designed for headless WordPress usage with NextJS frontend.
 * It provides minimal functionality and redirects frontend requests to the NextJS app.
 *
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme setup
 */
function headless_theme_setup() {
    // Add support for post thumbnails
    add_theme_support('post-thumbnails');
    
    // Add support for title tag
    add_theme_support('title-tag');
    
    // Add support for custom logo
    add_theme_support('custom-logo');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'headless-theme'),
        'footer'  => __('Footer Menu', 'headless-theme'),
    ));
}
add_action('after_setup_theme', 'headless_theme_setup');

/**
 * Redirect frontend requests to NextJS application
 * Only redirects if not in admin, REST API, or GraphQL context
 */
function headless_redirect_frontend() {
    // Don't redirect admin pages
    if (is_admin()) {
        return;
    }
    
    // Don't redirect REST API requests
    if (defined('REST_REQUEST') && REST_REQUEST) {
        return;
    }
    
    // Don't redirect GraphQL requests
    if (strpos($_SERVER['REQUEST_URI'], '/graphql') !== false) {
        return;
    }
    
    // Don't redirect wp-json requests
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json') !== false) {
        return;
    }
    
    // Don't redirect login/register pages
    if (strpos($_SERVER['REQUEST_URI'], 'wp-login') !== false || 
        strpos($_SERVER['REQUEST_URI'], 'wp-admin') !== false) {
        return;
    }
    
    // Get the frontend URL
    $frontend_url = defined('HEADLESS_MODE_CLIENT_URL') 
        ? HEADLESS_MODE_CLIENT_URL 
        : 'http://localhost:3000';
    
    // Redirect to frontend with the current path
    $redirect_url = $frontend_url . $_SERVER['REQUEST_URI'];
    wp_redirect($redirect_url, 301);
    exit;
}
add_action('template_redirect', 'headless_redirect_frontend');

/**
 * Enable CORS for GraphQL and REST API
 */
function headless_add_cors_headers() {
    $frontend_url = defined('HEADLESS_MODE_CLIENT_URL') 
        ? HEADLESS_MODE_CLIENT_URL 
        : 'http://localhost:3000';
    
    header("Access-Control-Allow-Origin: $frontend_url");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
}
add_action('init', 'headless_add_cors_headers');

/**
 * Modify REST API response headers
 */
function headless_rest_cors_headers($response) {
    $frontend_url = defined('HEADLESS_MODE_CLIENT_URL') 
        ? HEADLESS_MODE_CLIENT_URL 
        : 'http://localhost:3000';
    
    $response->header('Access-Control-Allow-Origin', $frontend_url);
    $response->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return $response;
}
add_filter('rest_post_dispatch', 'headless_rest_cors_headers');

/**
 * Disable XML-RPC for security
 */
add_filter('xmlrpc_enabled', '__return_false');

/**
 * Remove unnecessary frontend features
 */
function headless_cleanup() {
    // Remove emoji scripts
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
    
    // Remove RSD link
    remove_action('wp_head', 'rsd_link');
    
    // Remove Windows Live Writer manifest
    remove_action('wp_head', 'wlwmanifest_link');
    
    // Remove WordPress version
    remove_action('wp_head', 'wp_generator');
    
    // Remove shortlink
    remove_action('wp_head', 'wp_shortlink_wp_head');
}
add_action('init', 'headless_cleanup');

/**
 * Increase GraphQL query complexity limit for larger queries
 */
function headless_increase_graphql_complexity($max_complexity) {
    return 1000;
}
add_filter('graphql_max_query_complexity', 'headless_increase_graphql_complexity');

/**
 * Add custom image sizes for responsive images
 */
function headless_add_image_sizes() {
    add_image_size('card-thumbnail', 400, 300, true);
    add_image_size('hero-image', 1920, 1080, true);
    add_image_size('og-image', 1200, 630, true);
}
add_action('after_setup_theme', 'headless_add_image_sizes');
