<?php
/**
 * Sample Data Generator for WordPress/WooCommerce
 * 
 * This script generates sample data for the headless e-commerce system including:
 * - Products (simple and variable)
 * - Categories and tags
 * - Customers and orders
 * - Reviews
 * - Blog posts
 * - Navigation menus
 * 
 * Usage:
 *   wp eval-file generate-sample-data.php [options] --allow-root
 * 
 * Options:
 *   --reset              Reset existing sample data before generating new data
 *   --skip-products      Skip product generation
 *   --skip-customers     Skip customer generation
 *   --skip-orders        Skip order generation
 *   --skip-reviews       Skip review generation
 *   --skip-blog          Skip blog post generation
 *   --skip-menus         Skip menu generation
 *   --dry-run            Show what would be created without making changes
 * 
 * @package Headless_Theme
 * @requirements 9.2, 9.3
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This script must be run via WP-CLI: wp eval-file generate-sample-data.php --allow-root\n";
    exit(1);
}

// Include generator classes
$generators_dir = __DIR__ . '/generators/';
if (file_exists($generators_dir . 'ConfigGenerator.php')) {
    require_once $generators_dir . 'ConfigGenerator.php';
}
if (file_exists($generators_dir . 'AttributeGenerator.php')) {
    require_once $generators_dir . 'AttributeGenerator.php';
}
if (file_exists($generators_dir . 'CategoryGenerator.php')) {
    require_once $generators_dir . 'CategoryGenerator.php';
}
if (file_exists($generators_dir . 'ProductGenerator.php')) {
    require_once $generators_dir . 'ProductGenerator.php';
}
if (file_exists($generators_dir . 'CustomerGenerator.php')) {
    require_once $generators_dir . 'CustomerGenerator.php';
}
if (file_exists($generators_dir . 'OrderGenerator.php')) {
    require_once $generators_dir . 'OrderGenerator.php';
}
if (file_exists($generators_dir . 'ReviewGenerator.php')) {
    require_once $generators_dir . 'ReviewGenerator.php';
}
if (file_exists($generators_dir . 'BlogGenerator.php')) {
    require_once $generators_dir . 'BlogGenerator.php';
}
if (file_exists($generators_dir . 'MenuGenerator.php')) {
    require_once $generators_dir . 'MenuGenerator.php';
}

/**
 * Sample Data Checker Class
 * 
 * Handles idempotency checks for sample data generation.
 * Provides methods to check for existing data and manage data markers.
 * 
 * Requirements: 9.1 - Idempotency
 */
class SampleDataChecker {
    
    /** @var string Option key for tracking sample data marker */
    const MARKER_OPTION = 'headless_sample_data_generated';
    
    /** @var string Option key for tracking generation timestamp */
    const TIMESTAMP_OPTION = 'headless_sample_data_timestamp';
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /**
     * Check if sample data marker exists
     * 
     * @return bool True if marker exists
     */
    public static function has_marker() {
        return get_option(self::MARKER_OPTION, false) !== false;
    }
    
    /**
     * Get the sample data marker info
     * 
     * @return array|false Marker data or false if not set
     */
    public static function get_marker() {
        return get_option(self::MARKER_OPTION, false);
    }
    
    /**
     * Get last generation timestamp
     * 
     * @return string|false Timestamp or false if not set
     */
    public static function get_timestamp() {
        return get_option(self::TIMESTAMP_OPTION, false);
    }
    
    /**
     * Set the sample data marker
     * 
     * @param array $data Additional data to store with marker
     */
    public static function set_marker($data = []) {
        $marker_data = array_merge([
            'version' => '1.0',
            'generated_at' => current_time('mysql'),
        ], $data);
        
        update_option(self::MARKER_OPTION, $marker_data);
        update_option(self::TIMESTAMP_OPTION, current_time('mysql'));
    }
    
    /**
     * Clear the sample data marker
     */
    public static function clear_marker() {
        delete_option(self::MARKER_OPTION);
        delete_option(self::TIMESTAMP_OPTION);
    }
    
    /**
     * Count existing sample products
     * 
     * @return int Number of sample products
     */
    public static function count_sample_products() {
        if (!function_exists('wc_get_products')) {
            return 0;
        }
        
        $products = wc_get_products([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        
        return count($products);
    }
    
    /**
     * Count existing sample orders
     * 
     * @return int Number of sample orders
     */
    public static function count_sample_orders() {
        if (!function_exists('wc_get_orders')) {
            return 0;
        }
        
        $orders = wc_get_orders([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        
        return count($orders);
    }
    
    /**
     * Count existing sample customers
     * 
     * @return int Number of sample customers
     */
    public static function count_sample_customers() {
        $customers = get_users([
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'fields' => 'ID',
        ]);
        
        return count($customers);
    }
    
    /**
     * Count existing sample blog posts
     * 
     * @return int Number of sample blog posts
     */
    public static function count_sample_posts() {
        $posts = get_posts([
            'post_type' => 'post',
            'numberposts' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'fields' => 'ids',
        ]);
        
        return count($posts);
    }
    
    /**
     * Count existing sample reviews
     * 
     * @return int Number of sample reviews
     */
    public static function count_sample_reviews() {
        $reviews = get_comments([
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'count' => true,
        ]);
        
        return (int) $reviews;
    }
    
    /**
     * Get full status of existing sample data
     * 
     * @return array Status information
     */
    public static function get_status() {
        return [
            'has_marker' => self::has_marker(),
            'timestamp' => self::get_timestamp(),
            'counts' => [
                'products' => self::count_sample_products(),
                'orders' => self::count_sample_orders(),
                'customers' => self::count_sample_customers(),
                'posts' => self::count_sample_posts(),
                'reviews' => self::count_sample_reviews(),
            ],
        ];
    }
    
    /**
     * Check if any sample data exists (regardless of marker)
     * 
     * @return bool True if any sample data exists
     */
    public static function has_any_sample_data() {
        $status = self::get_status();
        $counts = $status['counts'];
        
        return array_sum($counts) > 0;
    }
}

/**
 * Sample Data Generator Class
 * 
 * Main orchestrator for generating all sample data.
 * Implements idempotency checks and provides logging/progress output.
 */
class SampleDataGenerator {
    
    /** @var string Option key for tracking sample data marker */
    const SAMPLE_DATA_MARKER = 'headless_sample_data_generated';
    
    /** @var string Option key for tracking generation timestamp */
    const SAMPLE_DATA_TIMESTAMP = 'headless_sample_data_timestamp';
    
    /** @var array Command line arguments */
    private $args = [];
    
    /** @var array Summary of created items */
    private $summary = [];
    
    /** @var bool Whether to run in dry-run mode */
    private $dry_run = false;
    
    /** @var bool Whether to reset existing data */
    private $reset = false;
    
    /** @var array Sections to skip */
    private $skip_sections = [];

    
    /**
     * Constructor - parse command line arguments
     */
    public function __construct() {
        $this->parse_arguments();
        $this->initialize_summary();
    }
    
    /**
     * Parse command line arguments
     * 
     * Supports: --reset, --skip-*, --dry-run
     * Requirements: 9.2
     */
    private function parse_arguments() {
        global $argv;
        
        if (!is_array($argv)) {
            $argv = [];
        }
        
        foreach ($argv as $arg) {
            if (strpos($arg, '--') === 0) {
                $arg = substr($arg, 2);
                
                // Handle flags
                if ($arg === 'reset') {
                    $this->reset = true;
                } elseif ($arg === 'dry-run') {
                    $this->dry_run = true;
                } elseif (strpos($arg, 'skip-') === 0) {
                    $section = substr($arg, 5);
                    $this->skip_sections[] = $section;
                }
            }
        }
        
        $this->args = [
            'reset' => $this->reset,
            'dry_run' => $this->dry_run,
            'skip_sections' => $this->skip_sections,
        ];
    }
    
    /**
     * Initialize summary tracking
     */
    private function initialize_summary() {
        $this->summary = [
            'products_simple' => 0,
            'products_variable' => 0,
            'variations' => 0,
            'categories' => 0,
            'tags' => 0,
            'attributes' => 0,
            'customers' => 0,
            'orders' => 0,
            'reviews' => 0,
            'blog_posts' => 0,
            'blog_categories' => 0,
            'menus' => 0,
            'menu_items' => 0,
        ];
    }
    
    /**
     * Log informational message
     * 
     * @param string $message Message to log
     */
    public function log_info($message) {
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::log("\033[32m[INFO]\033[0m " . $message);
        } else {
            echo "[INFO] " . $message . "\n";
        }
    }
    
    /**
     * Log warning message
     * 
     * @param string $message Message to log
     */
    public function log_warning($message) {
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::warning($message);
        } else {
            echo "[WARN] " . $message . "\n";
        }
    }
    
    /**
     * Log error message
     * 
     * @param string $message Message to log
     */
    public function log_error($message) {
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::error($message, false);
        } else {
            echo "[ERROR] " . $message . "\n";
        }
    }
    
    /**
     * Log success message
     * 
     * @param string $message Message to log
     */
    public function log_success($message) {
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::success($message);
        } else {
            echo "[SUCCESS] " . $message . "\n";
        }
    }
    
    /**
     * Log section header
     * 
     * @param string $title Section title
     */
    public function log_section($title) {
        $line = str_repeat('=', 50);
        $this->log_info($line);
        $this->log_info($title);
        $this->log_info($line);
    }

    
    /**
     * Check if sample data already exists
     * 
     * Uses SampleDataChecker for idempotency verification.
     * Requirements: 9.1 - Idempotency check
     * 
     * @return bool True if sample data marker exists
     */
    public function has_existing_data() {
        return SampleDataChecker::has_marker();
    }
    
    /**
     * Get timestamp of last sample data generation
     * 
     * @return string|false Timestamp or false if not set
     */
    public function get_last_generation_time() {
        return SampleDataChecker::get_timestamp();
    }
    
    /**
     * Mark sample data as generated
     * 
     * @param array $data_info Information about generated data
     */
    public function mark_data_generated($data_info = []) {
        SampleDataChecker::set_marker($data_info);
    }
    
    /**
     * Clear sample data marker
     */
    public function clear_data_marker() {
        SampleDataChecker::clear_marker();
    }
    
    /**
     * Get detailed status of existing sample data
     * 
     * @return array Status information
     */
    public function get_data_status() {
        return SampleDataChecker::get_status();
    }
    
    /**
     * Check if a section should be skipped
     * 
     * @param string $section Section name
     * @return bool True if section should be skipped
     */
    public function should_skip($section) {
        return in_array($section, $this->skip_sections);
    }
    
    /**
     * Check if running in dry-run mode
     * 
     * @return bool True if dry-run mode
     */
    public function is_dry_run() {
        return $this->dry_run;
    }
    
    /**
     * Check if reset mode is enabled
     * 
     * @return bool True if reset mode
     */
    public function is_reset_mode() {
        return $this->reset;
    }
    
    /**
     * Increment summary counter
     * 
     * @param string $key Summary key
     * @param int $count Amount to increment
     */
    public function increment_summary($key, $count = 1) {
        if (isset($this->summary[$key])) {
            $this->summary[$key] += $count;
        }
    }
    
    /**
     * Get summary data
     * 
     * @return array Summary data
     */
    public function get_summary() {
        return $this->summary;
    }
    
    /**
     * Reset existing sample data
     * 
     * Removes all sample data created by previous runs.
     * Requirements: 9.2 - Option to reset
     */
    public function reset_sample_data() {
        $this->log_section('Resetting Existing Sample Data');
        
        if ($this->dry_run) {
            $this->log_info('[DRY RUN] Would reset all sample data');
            return;
        }
        
        // Reset products
        $this->log_info('Removing sample products...');
        $products = wc_get_products([
            'limit' => -1,
            'meta_key' => '_sample_data',
            'meta_value' => '1',
        ]);
        foreach ($products as $product) {
            $product->delete(true);
        }
        $this->log_info('Removed ' . count($products) . ' products');
        
        // Reset orders
        $this->log_info('Removing sample orders...');
        $orders = wc_get_orders([
            'limit' => -1,
            'meta_key' => '_sample_data',
            'meta_value' => '1',
        ]);
        foreach ($orders as $order) {
            $order->delete(true);
        }
        $this->log_info('Removed ' . count($orders) . ' orders');
        
        // Reset customers (users with sample_data meta)
        $this->log_info('Removing sample customers...');
        $customers = get_users([
            'meta_key' => '_sample_data',
            'meta_value' => '1',
        ]);
        foreach ($customers as $customer) {
            wp_delete_user($customer->ID);
        }
        $this->log_info('Removed ' . count($customers) . ' customers');
        
        // Reset blog posts
        $this->log_info('Removing sample blog posts...');
        $posts = get_posts([
            'post_type' => 'post',
            'numberposts' => -1,
            'meta_key' => '_sample_data',
            'meta_value' => '1',
        ]);
        foreach ($posts as $post) {
            wp_delete_post($post->ID, true);
        }
        $this->log_info('Removed ' . count($posts) . ' blog posts');
        
        // Reset reviews
        $this->log_info('Removing sample reviews...');
        $reviews = get_comments([
            'meta_key' => '_sample_data',
            'meta_value' => '1',
        ]);
        foreach ($reviews as $review) {
            wp_delete_comment($review->comment_ID, true);
        }
        $this->log_info('Removed ' . count($reviews) . ' reviews');
        
        // Clear marker
        $this->clear_data_marker();
        
        $this->log_success('Sample data reset complete');
    }

    
    /**
     * Output summary of created items
     * 
     * Requirements: 9.3 - Output summary of created items
     */
    public function output_summary() {
        $this->log_section('Sample Data Generation Summary');
        
        $summary = $this->get_summary();
        
        $this->log_info('Products:');
        $this->log_info('  - Simple products: ' . $summary['products_simple']);
        $this->log_info('  - Variable products: ' . $summary['products_variable']);
        $this->log_info('  - Variations: ' . $summary['variations']);
        
        $this->log_info('Taxonomy:');
        $this->log_info('  - Categories: ' . $summary['categories']);
        $this->log_info('  - Tags: ' . $summary['tags']);
        $this->log_info('  - Attributes: ' . $summary['attributes']);
        
        $this->log_info('Customers & Orders:');
        $this->log_info('  - Customers: ' . $summary['customers']);
        $this->log_info('  - Orders: ' . $summary['orders']);
        
        $this->log_info('Reviews:');
        $this->log_info('  - Product reviews: ' . $summary['reviews']);
        
        $this->log_info('Blog:');
        $this->log_info('  - Blog posts: ' . $summary['blog_posts']);
        $this->log_info('  - Blog categories: ' . $summary['blog_categories']);
        
        $this->log_info('Navigation:');
        $this->log_info('  - Menus: ' . $summary['menus']);
        $this->log_info('  - Menu items: ' . $summary['menu_items']);
        
        $total = array_sum($summary);
        $this->log_success('Total items created: ' . $total);
    }
    
    /**
     * Run the sample data generation
     * 
     * Main entry point that orchestrates all generators.
     * Requirements: 9.1, 9.2, 9.3
     */
    public function run() {
        $this->log_section('WordPress Sample Data Generator');
        $this->log_info('Starting sample data generation...');
        
        // Show configuration
        $this->log_info('Configuration:');
        $this->log_info('  - Reset mode: ' . ($this->reset ? 'Yes' : 'No'));
        $this->log_info('  - Dry run: ' . ($this->dry_run ? 'Yes' : 'No'));
        if (!empty($this->skip_sections)) {
            $this->log_info('  - Skipping: ' . implode(', ', $this->skip_sections));
        }
        
        // Check for existing data (idempotency)
        // Requirements: 9.1 - Check for existing data before creating new entries
        if ($this->has_existing_data() && !$this->reset) {
            $last_time = $this->get_last_generation_time();
            $status = $this->get_data_status();
            
            $this->log_warning('Sample data already exists (generated: ' . $last_time . ')');
            $this->log_info('Existing sample data counts:');
            $this->log_info('  - Products: ' . $status['counts']['products']);
            $this->log_info('  - Orders: ' . $status['counts']['orders']);
            $this->log_info('  - Customers: ' . $status['counts']['customers']);
            $this->log_info('  - Blog posts: ' . $status['counts']['posts']);
            $this->log_info('  - Reviews: ' . $status['counts']['reviews']);
            $this->log_warning('Use --reset flag to regenerate data');
            $this->log_info('Skipping generation to maintain idempotency.');
            return;
        }
        
        // Reset if requested
        if ($this->reset && $this->has_existing_data()) {
            $this->reset_sample_data();
        }
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log_error('WooCommerce is not active. Please install and activate WooCommerce first.');
            return;
        }
        
        // Run generators in order
        // Note: Individual generator classes will be implemented in subsequent tasks
        
        if (!$this->should_skip('config')) {
            $this->log_section('Phase 1: WooCommerce Configuration');
            if (class_exists('ConfigGenerator')) {
                $config_generator = new ConfigGenerator($this);
                $config_generator->run();
            } else {
                $this->log_warning('ConfigGenerator class not found, skipping configuration');
            }
        }
        
        if (!$this->should_skip('attributes')) {
            $this->log_section('Phase 2: Product Attributes');
            if (class_exists('AttributeGenerator')) {
                $attribute_generator = new AttributeGenerator($this);
                $attribute_generator->run();
            } else {
                $this->log_warning('AttributeGenerator class not found, skipping attributes');
            }
        }
        
        if (!$this->should_skip('categories')) {
            $this->log_section('Phase 3: Categories & Tags');
            if (class_exists('CategoryGenerator')) {
                $category_generator = new CategoryGenerator($this);
                $category_generator->run();
            } else {
                $this->log_warning('CategoryGenerator class not found, skipping categories');
            }
        }
        
        if (!$this->should_skip('products')) {
            $this->log_section('Phase 4: Products');
            if (class_exists('ProductGenerator')) {
                $product_generator = new ProductGenerator($this);
                $product_generator->run();
            } else {
                $this->log_warning('ProductGenerator class not found, skipping products');
            }
        }
        
        if (!$this->should_skip('customers')) {
            $this->log_section('Phase 5: Customers');
            if (class_exists('CustomerGenerator')) {
                $customer_generator = new CustomerGenerator($this);
                $customer_generator->run();
            } else {
                $this->log_warning('CustomerGenerator class not found, skipping customers');
            }
        }
        
        if (!$this->should_skip('orders')) {
            $this->log_section('Phase 6: Orders');
            if (class_exists('OrderGenerator')) {
                $order_generator = new OrderGenerator($this);
                $order_generator->run();
            } else {
                $this->log_warning('OrderGenerator class not found, skipping orders');
            }
        }
        
        if (!$this->should_skip('reviews')) {
            $this->log_section('Phase 7: Reviews');
            if (class_exists('ReviewGenerator')) {
                $review_generator = new ReviewGenerator($this);
                $review_generator->run();
            } else {
                $this->log_warning('ReviewGenerator class not found, skipping reviews');
            }
        }
        
        if (!$this->should_skip('blog')) {
            $this->log_section('Phase 8: Blog Posts');
            if (class_exists('BlogGenerator')) {
                $blog_generator = new BlogGenerator($this);
                $blog_generator->run();
            } else {
                $this->log_warning('BlogGenerator class not found, skipping blog posts');
            }
        }
        
        if (!$this->should_skip('menus')) {
            $this->log_section('Phase 9: Navigation Menus');
            if (class_exists('MenuGenerator')) {
                $menu_generator = new MenuGenerator($this);
                $menu_generator->run();
            } else {
                $this->log_warning('MenuGenerator class not found, skipping menus');
            }
        }
        
        // Mark data as generated (unless dry run)
        if (!$this->dry_run) {
            $this->mark_data_generated($this->summary);
        }
        
        // Output summary
        $this->output_summary();
        
        $this->log_success('Sample data generation complete!');
    }
}

// Run the generator
$generator = new SampleDataGenerator();
$generator->run();
