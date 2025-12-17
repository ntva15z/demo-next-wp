#!/bin/bash
# Script to configure JWT Authentication in wp-config.php

WP_CONFIG="/var/www/html/wp-config.php"

# Wait for wp-config.php to exist
while [ ! -f "$WP_CONFIG" ]; do
    echo "Waiting for wp-config.php..."
    sleep 2
done

# Check if JWT_AUTH_SECRET_KEY is already defined
if ! grep -q "JWT_AUTH_SECRET_KEY" "$WP_CONFIG"; then
    echo "Adding JWT configuration to wp-config.php..."
    
    # Add JWT config before "That's all, stop editing!"
    sed -i "/That's all, stop editing/i\\
/* JWT Authentication Configuration */\\
define('JWT_AUTH_SECRET_KEY', getenv('JWT_AUTH_SECRET_KEY') ?: 'your-jwt-secret-key-minimum-32-characters-long');\\
define('JWT_AUTH_CORS_ENABLE', true);\\
" "$WP_CONFIG"
    
    echo "JWT configuration added successfully!"
else
    echo "JWT configuration already exists in wp-config.php"
fi
