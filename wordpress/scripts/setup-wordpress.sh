#!/bin/bash
#
# WordPress Unified Setup Script
# 
# This script orchestrates the complete WordPress setup including:
# 1. Plugin installation and activation
# 2. Sample data generation
# 3. Summary output of all created items
#
# Usage:
#   docker-compose exec wordpress bash /var/www/html/scripts/setup-wordpress.sh [options]
#
# Options:
#   --reset              Reset existing sample data before generating new data
#   --skip-plugins       Skip plugin installation
#   --skip-data          Skip sample data generation
#   --dry-run            Show what would be created without making changes
#   --help               Show this help message
#
# Requirements: 9.3 - Output summary of created items
#
# @package Headless_Theme

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WP_DIR="/var/www/html"

# Default options
SKIP_PLUGINS=false
SKIP_DATA=false
RESET_DATA=false
DRY_RUN=false

# Timing
START_TIME=$(date +%s)

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

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
}

log_header() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                           ║${NC}"
    echo -e "${BLUE}║     WordPress Headless E-Commerce Setup Script            ║${NC}"
    echo -e "${BLUE}║                                                           ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Show help message
show_help() {
    echo "WordPress Unified Setup Script"
    echo ""
    echo "Usage: setup-wordpress.sh [options]"
    echo ""
    echo "Options:"
    echo "  --reset          Reset existing sample data before generating new data"
    echo "  --skip-plugins   Skip plugin installation"
    echo "  --skip-data      Skip sample data generation"
    echo "  --dry-run        Show what would be created without making changes"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Full setup"
    echo "  setup-wordpress.sh"
    echo ""
    echo "  # Reset and regenerate all data"
    echo "  setup-wordpress.sh --reset"
    echo ""
    echo "  # Only install plugins"
    echo "  setup-wordpress.sh --skip-data"
    echo ""
    echo "  # Only generate sample data"
    echo "  setup-wordpress.sh --skip-plugins"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --reset)
                RESET_DATA=true
                shift
                ;;
            --skip-plugins)
                SKIP_PLUGINS=true
                shift
                ;;
            --skip-data)
                SKIP_DATA=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_warn "Unknown option: $1"
                shift
                ;;
        esac
    done
}

# Wait for WordPress to be ready
wait_for_wordpress() {
    log_info "Waiting for WordPress to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if wp core is-installed --allow-root 2>/dev/null; then
            log_success "WordPress is ready!"
            return 0
        fi
        log_warn "WordPress not ready yet, attempt $attempt/$max_attempts..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "WordPress did not become ready in time"
    return 1
}

# Wait for database to be ready
wait_for_database() {
    log_info "Waiting for database connection..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if wp db check --allow-root 2>/dev/null; then
            log_success "Database connection established!"
            return 0
        fi
        log_warn "Database not ready yet, attempt $attempt/$max_attempts..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Database did not become ready in time"
    return 1
}

# Run plugin installation
run_plugin_installation() {
    log_section "Phase 1: Plugin Installation"
    
    if [ "$SKIP_PLUGINS" = true ]; then
        log_info "Skipping plugin installation (--skip-plugins flag)"
        return 0
    fi
    
    local plugin_script="/var/www/html/wp-content/themes/headless-theme/../../../install-plugins.sh"
    
    # Check multiple possible locations for the install script
    if [ -f "/var/www/html/install-plugins.sh" ]; then
        plugin_script="/var/www/html/install-plugins.sh"
    elif [ -f "/usr/local/bin/install-plugins.sh" ]; then
        plugin_script="/usr/local/bin/install-plugins.sh"
    elif [ -f "$SCRIPT_DIR/../install-plugins.sh" ]; then
        plugin_script="$SCRIPT_DIR/../install-plugins.sh"
    fi
    
    if [ -f "$plugin_script" ]; then
        log_info "Running plugin installation script..."
        bash "$plugin_script"
        log_success "Plugin installation complete!"
    else
        log_warn "Plugin installation script not found at expected locations"
        log_warn "Attempting inline plugin installation..."
        
        # Inline plugin installation as fallback
        install_plugins_inline
    fi
}

# Inline plugin installation (fallback)
install_plugins_inline() {
    cd "$WP_DIR"
    
    local plugins=(
        "woocommerce"
        "wp-graphql"
        "wp-graphql-woocommerce"
        "jwt-authentication-for-wp-rest-api"
        "advanced-custom-fields"
        "wpgraphql-acf"
    )
    
    for plugin in "${plugins[@]}"; do
        log_info "Installing $plugin..."
        if wp plugin is-installed "$plugin" --allow-root 2>/dev/null; then
            log_info "$plugin is already installed"
            if ! wp plugin is-active "$plugin" --allow-root 2>/dev/null; then
                wp plugin activate "$plugin" --allow-root
            fi
        else
            wp plugin install "$plugin" --activate --allow-root || log_warn "Failed to install $plugin"
        fi
    done
    
    # Activate headless theme
    log_info "Activating headless-theme..."
    wp theme activate headless-theme --allow-root 2>/dev/null || log_warn "Could not activate headless-theme"
}

# Run sample data generation
run_sample_data_generation() {
    log_section "Phase 2: Sample Data Generation"
    
    if [ "$SKIP_DATA" = true ]; then
        log_info "Skipping sample data generation (--skip-data flag)"
        return 0
    fi
    
    local data_script="$SCRIPT_DIR/generate-sample-data.php"
    
    if [ ! -f "$data_script" ]; then
        data_script="/var/www/html/scripts/generate-sample-data.php"
    fi
    
    if [ -f "$data_script" ]; then
        log_info "Running sample data generation script..."
        
        # Build arguments
        local args=""
        if [ "$RESET_DATA" = true ]; then
            args="$args --reset"
        fi
        if [ "$DRY_RUN" = true ]; then
            args="$args --dry-run"
        fi
        
        wp eval-file "$data_script" $args --allow-root
        log_success "Sample data generation complete!"
    else
        log_error "Sample data generation script not found at: $data_script"
        return 1
    fi
}

# Verify GraphQL endpoint
verify_graphql() {
    log_section "Phase 3: Verification"
    
    log_info "Verifying GraphQL endpoint..."
    
    local site_url=$(wp option get siteurl --allow-root 2>/dev/null || echo "http://localhost:8800")
    local graphql_url="${site_url}/graphql"
    
    # Simple introspection query
    local query='{"query":"{ __typename }"}'
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$query" \
        "$graphql_url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "__typename"; then
        log_success "GraphQL endpoint is working at: $graphql_url"
    else
        log_warn "Could not verify GraphQL endpoint. It may need WordPress to be fully initialized."
    fi
}

# Output final summary
# Requirements: 9.3 - Output summary of created items
output_final_summary() {
    log_section "Setup Summary"
    
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    log_info "Configuration used:"
    log_info "  - Skip plugins: $SKIP_PLUGINS"
    log_info "  - Skip data: $SKIP_DATA"
    log_info "  - Reset data: $RESET_DATA"
    log_info "  - Dry run: $DRY_RUN"
    echo ""
    
    # Get counts from WordPress
    log_info "Current data counts:"
    
    # Products
    local product_count=$(wp post list --post_type=product --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Products: $product_count"
    
    # Categories
    local category_count=$(wp term list product_cat --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Product Categories: $category_count"
    
    # Tags
    local tag_count=$(wp term list product_tag --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Product Tags: $tag_count"
    
    # Orders
    local order_count=$(wp post list --post_type=shop_order --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Orders: $order_count"
    
    # Customers
    local customer_count=$(wp user list --role=customer --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Customers: $customer_count"
    
    # Blog posts
    local post_count=$(wp post list --post_type=post --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Blog Posts: $post_count"
    
    # Reviews
    local review_count=$(wp comment list --type=review --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Reviews: $review_count"
    
    # Menus
    local menu_count=$(wp menu list --format=count --allow-root 2>/dev/null || echo "0")
    log_info "  - Menus: $menu_count"
    
    echo ""
    log_info "Active plugins:"
    wp plugin list --status=active --format=table --allow-root 2>/dev/null || log_warn "Could not list plugins"
    
    echo ""
    log_info "Duration: ${duration} seconds"
    
    echo ""
    log_success "WordPress setup complete!"
    echo ""
    log_info "Next steps:"
    log_info "  1. Access WordPress admin at: http://localhost:8800/wp-admin"
    log_info "  2. Access GraphQL endpoint at: http://localhost:8800/graphql"
    log_info "  3. Start the Next.js frontend: cd frontend && npm run dev"
}

# Main function
main() {
    log_header
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show configuration
    log_info "Starting WordPress setup with configuration:"
    log_info "  - Skip plugins: $SKIP_PLUGINS"
    log_info "  - Skip data: $SKIP_DATA"
    log_info "  - Reset data: $RESET_DATA"
    log_info "  - Dry run: $DRY_RUN"
    
    # Change to WordPress directory
    cd "$WP_DIR"
    
    # Wait for services
    wait_for_database
    wait_for_wordpress
    
    # Run plugin installation
    run_plugin_installation
    
    # Run sample data generation
    run_sample_data_generation
    
    # Verify setup
    verify_graphql
    
    # Output summary
    output_final_summary
}

# Run main function
main "$@"
