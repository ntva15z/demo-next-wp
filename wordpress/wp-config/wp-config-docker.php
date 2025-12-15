<?php
/**
 * WordPress configuration for Docker environment
 * 
 * This file is used when running WordPress in Docker containers.
 * Environment variables are set in docker-compose.yml
 */

// Database settings from environment variables
define('DB_NAME', getenv('WORDPRESS_DB_NAME') ?: 'wordpress');
define('DB_USER', getenv('WORDPRESS_DB_USER') ?: 'wordpress');
define('DB_PASSWORD', getenv('WORDPRESS_DB_PASSWORD') ?: 'wordpress');
define('DB_HOST', getenv('WORDPRESS_DB_HOST') ?: 'db');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// Authentication unique keys and salts
// Generate at: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

// WordPress database table prefix
$table_prefix = 'wp_';

// Debug mode (enabled for development)
define('WP_DEBUG', (bool) getenv('WORDPRESS_DEBUG') ?: false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Headless mode settings
define('HEADLESS_MODE_CLIENT_URL', getenv('HEADLESS_CLIENT_URL') ?: 'http://localhost:3000');

// Disable file editing in admin
define('DISALLOW_FILE_EDIT', true);

// Absolute path to the WordPress directory
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// Sets up WordPress vars and included files
require_once ABSPATH . 'wp-settings.php';
