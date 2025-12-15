<?php
/**
 * Main template file
 * 
 * This is a headless theme - all frontend requests are redirected to NextJS.
 * This file exists only to satisfy WordPress theme requirements.
 *
 * @package Headless_Theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// This should never be reached due to template_redirect hook
// But just in case, show a simple message
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php bloginfo('name'); ?> - Headless CMS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f0f0f0;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #0073aa; }
    </style>
</head>
<body>
    <div class="container">
        <h1><?php bloginfo('name'); ?></h1>
        <p>This WordPress installation is running in headless mode.</p>
        <p>Please visit the <a href="<?php echo esc_url(admin_url()); ?>">admin panel</a> to manage content.</p>
    </div>
</body>
</html>
