#!/bin/bash
#
# WooCommerce Plugin Installation Script
# This script installs and activates required plugins for the headless e-commerce setup
# Run this script after WordPress is fully initialized
#
# Requirements: 1.1, 2.1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for WordPress to be ready
wait_for_wordpress() {
    log_info "Waiting for WordPress to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if wp core is-installed --allow-root 2>/dev/null; then
            log_info "WordPress is ready!"
            return 0
        fi
        log_warn "WordPress not ready yet, attempt $attempt/$max_attempts..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "WordPress did not become ready in time"
    return 1
}

# Install and activate a plugin
install_plugin() {
    local plugin_slug=$1
    local plugin_name=$2
    
    log_info "Checking plugin: $plugin_name ($plugin_slug)..."
    
    if wp plugin is-installed "$plugin_slug" --allow-root 2>/dev/null; then
        log_info "$plugin_name is already installed"
        if ! wp plugin is-active "$plugin_slug" --allow-root 2>/dev/null; then
            log_info "Activating $plugin_name..."
            wp plugin activate "$plugin_slug" --allow-root
        fi
    else
        log_info "Installing $plugin_name..."
        wp plugin install "$plugin_slug" --activate --allow-root
    fi
    
    log_info "$plugin_name is installed and active"
}


# Install plugin from URL (for premium or GitHub plugins)
install_plugin_from_url() {
    local plugin_slug=$1
    local plugin_name=$2
    local plugin_url=$3
    
    log_info "Checking plugin: $plugin_name ($plugin_slug)..."
    
    if wp plugin is-installed "$plugin_slug" --allow-root 2>/dev/null; then
        log_info "$plugin_name is already installed"
        if ! wp plugin is-active "$plugin_slug" --allow-root 2>/dev/null; then
            log_info "Activating $plugin_name..."
            wp plugin activate "$plugin_slug" --allow-root
        fi
    else
        log_info "Installing $plugin_name from URL..."
        wp plugin install "$plugin_url" --activate --allow-root
    fi
    
    log_info "$plugin_name is installed and active"
}

# Main installation function
main() {
    log_info "=========================================="
    log_info "WooCommerce Plugin Installation Script"
    log_info "=========================================="
    
    # Change to WordPress directory
    cd /var/www/html
    
    # Wait for WordPress to be ready
    wait_for_wordpress
    
    log_info ""
    log_info "Installing required plugins..."
    log_info ""
    
    # 1. Install WooCommerce (Core e-commerce functionality)
    # Requirements: 1.1
    install_plugin "woocommerce" "WooCommerce"
    
    # 2. Install WPGraphQL (GraphQL API for WordPress)
    # Requirements: 2.1
    install_plugin "wp-graphql" "WPGraphQL"
    
    # 3. Install WooGraphQL (WooCommerce GraphQL extension)
    # Requirements: 2.1, 2.2, 2.3, 2.4
    # Note: WooGraphQL is available on WordPress.org as wp-graphql-woocommerce
    # This plugin exposes WooCommerce data via GraphQL including:
    # - Product queries with variations (2.1, 2.4)
    # - Cart mutations (addToCart, updateCartItemQuantities, removeCartItem) (2.2)
    # - Order queries and mutations (2.3)
    install_plugin "wp-graphql-woocommerce" "WooGraphQL"
    
    # 4. Install JWT Authentication for WP REST API
    # Requirements: 10.2
    install_plugin "jwt-authentication-for-wp-rest-api" "JWT Authentication"
    
    log_info ""
    log_info "=========================================="
    log_info "Plugin installation complete!"
    log_info "=========================================="
    log_info ""
    
    # List installed plugins
    log_info "Installed plugins:"
    wp plugin list --allow-root
    
    log_info ""
    log_info "Verifying GraphQL endpoint..."
    verify_graphql_endpoint
    
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure WooCommerce settings in WordPress admin"
    log_info "2. Set up JWT_AUTH_SECRET_KEY in wp-config.php"
    log_info "3. Configure payment gateways (VNPay, MoMo)"
    log_info "4. Set up shipping zones for Vietnam"
    log_info "5. Test GraphQL endpoint at: http://localhost:8800/graphql"
}

# Verify GraphQL endpoint is working
verify_graphql_endpoint() {
    log_info "Testing GraphQL endpoint..."
    
    # Simple introspection query to verify GraphQL is working
    local query='{"query":"{ __typename }"}'
    local site_url=$(wp option get siteurl --allow-root 2>/dev/null || echo "http://localhost:8800")
    local graphql_url="${site_url}/graphql"
    
    # Try to query the GraphQL endpoint
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$query" \
        "$graphql_url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "__typename"; then
        log_info "GraphQL endpoint is working!"
        log_info "Endpoint URL: $graphql_url"
    else
        log_warn "Could not verify GraphQL endpoint. It may need WordPress to be fully initialized."
        log_warn "Try accessing $graphql_url manually after WordPress is ready."
    fi
}

# Run main function
main "$@"
