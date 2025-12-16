<?php
/**
 * Order Generator
 * 
 * Creates WooCommerce sample orders with:
 * - 10+ orders with various statuses (pending, processing, completed, cancelled)
 * - 1-5 random products per order (both simple and variable)
 * - Correct total calculations
 * - Assignment to existing customers
 * 
 * @package Headless_Theme
 * @requirements 5.2, 5.3
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * OrderGenerator Class
 * 
 * Handles creation of WooCommerce sample orders.
 */
class OrderGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Order statuses to distribute */
    private $order_statuses = [
        'pending',
        'processing', 
        'completed',
        'cancelled',
    ];
    
    /** @var array Created order IDs */
    private $created_orders = [];
    
    /** @var array Available customer IDs */
    private $customer_ids = [];
    
    /** @var array Available product IDs (simple products) */
    private $simple_product_ids = [];
    
    /** @var array Available variable product IDs with their variations */
    private $variable_products = [];

    /**
     * Constructor
     * 
     * @param SampleDataGenerator $generator Main generator instance
     */
    public function __construct($generator = null) {
        $this->generator = $generator;
    }

    
    /**
     * Log message through main generator or directly
     * 
     * @param string $message Message to log
     * @param string $type Message type (info, warning, error, success)
     */
    private function log($message, $type = 'info') {
        if ($this->generator) {
            switch ($type) {
                case 'warning':
                    $this->generator->log_warning($message);
                    break;
                case 'error':
                    $this->generator->log_error($message);
                    break;
                case 'success':
                    $this->generator->log_success($message);
                    break;
                default:
                    $this->generator->log_info($message);
            }
        } else {
            echo "[$type] $message\n";
        }
    }
    
    /**
     * Run all order creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting order generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Load available customers and products
        $this->load_customers();
        $this->load_products();
        
        // Verify we have data to work with
        if (empty($this->customer_ids)) {
            $this->log('No customers found. Please run CustomerGenerator first.', 'error');
            return false;
        }
        
        if (empty($this->simple_product_ids) && empty($this->variable_products)) {
            $this->log('No products found. Please run ProductGenerator first.', 'error');
            return false;
        }
        
        // Create orders
        $this->create_orders();
        
        $this->log('Order generation complete!', 'success');
        return true;
    }
    
    /**
     * Load available customer IDs
     */
    private function load_customers() {
        $this->customer_ids = get_users([
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'fields' => 'ID',
        ]);
        
        $this->log('Found ' . count($this->customer_ids) . ' sample customers');
    }
    
    /**
     * Load available products (both simple and variable)
     */
    private function load_products() {
        // Load simple products
        $simple_products = wc_get_products([
            'limit' => -1,
            'type' => 'simple',
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        $this->simple_product_ids = $simple_products;
        
        // Load variable products with their variations
        $variable_products = wc_get_products([
            'limit' => -1,
            'type' => 'variable',
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($variable_products as $product) {
            $variations = $product->get_children();
            if (!empty($variations)) {
                $this->variable_products[$product->get_id()] = $variations;
            }
        }
        
        $this->log('Found ' . count($this->simple_product_ids) . ' simple products');
        $this->log('Found ' . count($this->variable_products) . ' variable products');
    }

    
    /**
     * Create sample orders
     * 
     * Requirements: 5.2 - Create at least 10 sample orders with various statuses
     * Requirements: 5.3 - Include 1-5 random products per order
     * 
     * @param int $count Number of orders to create (default 12 to exceed minimum of 10)
     * @return array Array of created order IDs
     */
    public function create_orders($count = 12) {
        $this->log('Creating sample orders...');
        $created = [];
        
        for ($i = 0; $i < $count; $i++) {
            // Distribute statuses evenly
            $status_index = $i % count($this->order_statuses);
            $status = $this->order_statuses[$status_index];
            
            // Pick a random customer
            $customer_id = $this->customer_ids[array_rand($this->customer_ids)];
            
            $order_id = $this->create_order($customer_id, $status, $i);
            
            if ($order_id) {
                $created[] = $order_id;
                $this->created_orders[] = $order_id;
                $this->log("  - Created order #$order_id (Status: $status)");
            }
        }
        
        $count = count($created);
        $this->log("Created $count orders", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('orders', $count);
        }
        
        return $created;
    }
    
    /**
     * Create a single order
     * 
     * @param int $customer_id Customer ID
     * @param string $status Order status
     * @param int $index Order index for reference
     * @return int|false Order ID or false on failure
     */
    private function create_order($customer_id, $status, $index) {
        // Get customer data
        $customer = new WC_Customer($customer_id);
        
        // Create order
        $order = wc_create_order([
            'customer_id' => $customer_id,
            'status' => $status,
        ]);
        
        if (is_wp_error($order)) {
            $this->log("    - Failed to create order: " . $order->get_error_message(), 'error');
            return false;
        }
        
        // Add line items (1-5 random products)
        // Requirements: 5.3 - Include 1-5 random products per order
        $num_items = rand(1, 5);
        $this->add_line_items($order, $num_items);
        
        // Set billing address from customer
        $order->set_billing_first_name($customer->get_billing_first_name());
        $order->set_billing_last_name($customer->get_billing_last_name());
        $order->set_billing_company($customer->get_billing_company());
        $order->set_billing_address_1($customer->get_billing_address_1());
        $order->set_billing_address_2($customer->get_billing_address_2());
        $order->set_billing_city($customer->get_billing_city());
        $order->set_billing_state($customer->get_billing_state());
        $order->set_billing_postcode($customer->get_billing_postcode());
        $order->set_billing_country($customer->get_billing_country());
        $order->set_billing_phone($customer->get_billing_phone());
        $order->set_billing_email($customer->get_billing_email());
        
        // Set shipping address from customer
        $order->set_shipping_first_name($customer->get_shipping_first_name());
        $order->set_shipping_last_name($customer->get_shipping_last_name());
        $order->set_shipping_company($customer->get_shipping_company());
        $order->set_shipping_address_1($customer->get_shipping_address_1());
        $order->set_shipping_address_2($customer->get_shipping_address_2());
        $order->set_shipping_city($customer->get_shipping_city());
        $order->set_shipping_state($customer->get_shipping_state());
        $order->set_shipping_postcode($customer->get_shipping_postcode());
        $order->set_shipping_country($customer->get_shipping_country());
        
        // Set payment method (COD - Cash on Delivery)
        $order->set_payment_method('cod');
        $order->set_payment_method_title('Thanh toán khi nhận hàng');
        
        // Add shipping
        $this->add_shipping($order);
        
        // Calculate totals
        $order->calculate_totals();
        
        // Mark as sample data
        $order->update_meta_data(self::SAMPLE_DATA_META_KEY, '1');
        
        // Set order date (random within last 30 days for variety)
        $days_ago = rand(0, 30);
        $order_date = date('Y-m-d H:i:s', strtotime("-$days_ago days"));
        $order->set_date_created($order_date);
        
        // Save order
        $order->save();
        
        return $order->get_id();
    }

    
    /**
     * Add line items to an order
     * 
     * Requirements: 5.3 - Include both simple and variable products
     * 
     * @param WC_Order $order Order object
     * @param int $num_items Number of items to add (1-5)
     */
    private function add_line_items($order, $num_items) {
        $added_products = []; // Track to avoid duplicates
        $attempts = 0;
        $max_attempts = $num_items * 3; // Allow extra attempts to handle duplicates
        
        while (count($added_products) < $num_items && $attempts < $max_attempts) {
            $attempts++;
            
            // Decide whether to add simple or variable product
            // Mix both types: 60% simple, 40% variable (if available)
            $use_variable = !empty($this->variable_products) && rand(1, 100) <= 40;
            
            if ($use_variable) {
                // Add variable product (variation)
                $product_ids = array_keys($this->variable_products);
                $product_id = $product_ids[array_rand($product_ids)];
                
                // Skip if already added
                if (in_array($product_id, $added_products)) {
                    continue;
                }
                
                // Get a random variation
                $variations = $this->variable_products[$product_id];
                $variation_id = $variations[array_rand($variations)];
                
                $variation = wc_get_product($variation_id);
                if (!$variation) {
                    continue;
                }
                
                // Random quantity 1-3
                $quantity = rand(1, 3);
                
                // Add to order
                $order->add_product($variation, $quantity);
                $added_products[] = $product_id;
                
            } else {
                // Add simple product
                if (empty($this->simple_product_ids)) {
                    continue;
                }
                
                $product_id = $this->simple_product_ids[array_rand($this->simple_product_ids)];
                
                // Skip if already added
                if (in_array($product_id, $added_products)) {
                    continue;
                }
                
                $product = wc_get_product($product_id);
                if (!$product) {
                    continue;
                }
                
                // Random quantity 1-3
                $quantity = rand(1, 3);
                
                // Add to order
                $order->add_product($product, $quantity);
                $added_products[] = $product_id;
            }
        }
        
        // Ensure at least 1 item is added (fallback)
        if (empty($added_products)) {
            // Try to add any available product
            if (!empty($this->simple_product_ids)) {
                $product_id = $this->simple_product_ids[0];
                $product = wc_get_product($product_id);
                if ($product) {
                    $order->add_product($product, 1);
                }
            } elseif (!empty($this->variable_products)) {
                $product_ids = array_keys($this->variable_products);
                $variations = $this->variable_products[$product_ids[0]];
                $variation = wc_get_product($variations[0]);
                if ($variation) {
                    $order->add_product($variation, 1);
                }
            }
        }
    }
    
    /**
     * Add shipping to an order
     * 
     * @param WC_Order $order Order object
     */
    private function add_shipping($order) {
        // Get order subtotal to determine shipping
        $subtotal = $order->get_subtotal();
        
        // Free shipping for orders over 500,000 VND
        $free_shipping_threshold = 500000;
        $flat_rate = 30000; // 30,000 VND
        
        $shipping_item = new WC_Order_Item_Shipping();
        
        if ($subtotal >= $free_shipping_threshold) {
            $shipping_item->set_method_title('Miễn phí vận chuyển');
            $shipping_item->set_method_id('free_shipping');
            $shipping_item->set_total(0);
        } else {
            $shipping_item->set_method_title('Giao hàng tiêu chuẩn');
            $shipping_item->set_method_id('flat_rate');
            $shipping_item->set_total($flat_rate);
        }
        
        $order->add_item($shipping_item);
    }

    
    /**
     * Get all created order IDs
     * 
     * @return array Array of order IDs
     */
    public function get_created_orders() {
        return $this->created_orders;
    }
    
    /**
     * Get order statistics for verification
     * 
     * @return array Order statistics
     */
    public function get_order_stats() {
        $stats = [
            'total_count' => 0,
            'by_status' => [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ],
            'line_item_counts' => [],
            'with_customer' => 0,
            'with_shipping' => 0,
        ];
        
        // Get all sample orders
        $orders = wc_get_orders([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($orders as $order) {
            $stats['total_count']++;
            
            // Count by status
            $status = $order->get_status();
            if (isset($stats['by_status'][$status])) {
                $stats['by_status'][$status]++;
            }
            
            // Count line items
            $item_count = count($order->get_items());
            $stats['line_item_counts'][] = $item_count;
            
            // Check customer assignment
            if ($order->get_customer_id() > 0) {
                $stats['with_customer']++;
            }
            
            // Check shipping
            if (count($order->get_shipping_methods()) > 0) {
                $stats['with_shipping']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Get all sample orders with details
     * 
     * @return array Array of order data
     */
    public function get_sample_orders() {
        $orders_data = [];
        
        $orders = wc_get_orders([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($orders as $order) {
            $line_items = [];
            foreach ($order->get_items() as $item) {
                $line_items[] = [
                    'product_id' => $item->get_product_id(),
                    'variation_id' => $item->get_variation_id(),
                    'name' => $item->get_name(),
                    'quantity' => $item->get_quantity(),
                    'total' => $item->get_total(),
                ];
            }
            
            $orders_data[] = [
                'id' => $order->get_id(),
                'status' => $order->get_status(),
                'customer_id' => $order->get_customer_id(),
                'total' => $order->get_total(),
                'line_items' => $line_items,
                'line_item_count' => count($line_items),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
            ];
        }
        
        return $orders_data;
    }
    
    /**
     * Verify order data integrity
     * 
     * @return array Verification results
     */
    public function verify_order_data() {
        $stats = $this->get_order_stats();
        
        $results = [
            'valid' => true,
            'total_orders' => $stats['total_count'],
            'meets_minimum' => $stats['total_count'] >= 10,
            'has_status_distribution' => $this->check_status_distribution($stats['by_status']),
            'line_items_in_range' => $this->check_line_item_range($stats['line_item_counts']),
            'all_have_customer' => $stats['with_customer'] === $stats['total_count'],
            'issues' => [],
        ];
        
        if (!$results['meets_minimum']) {
            $results['valid'] = false;
            $results['issues'][] = "Only {$stats['total_count']} orders created, minimum is 10";
        }
        
        if (!$results['has_status_distribution']) {
            $results['valid'] = false;
            $results['issues'][] = "Orders not distributed across all statuses";
        }
        
        if (!$results['line_items_in_range']) {
            $results['valid'] = false;
            $results['issues'][] = "Some orders have line items outside range [1-5]";
        }
        
        if (!$results['all_have_customer']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all orders are assigned to customers";
        }
        
        return $results;
    }
    
    /**
     * Check if orders are distributed across statuses
     * 
     * @param array $status_counts Status counts
     * @return bool True if distributed
     */
    private function check_status_distribution($status_counts) {
        // At least one order in each status
        foreach ($status_counts as $status => $count) {
            if ($count === 0) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Check if all line item counts are in range [1-5]
     * 
     * @param array $counts Line item counts
     * @return bool True if all in range
     */
    private function check_line_item_range($counts) {
        foreach ($counts as $count) {
            if ($count < 1 || $count > 5) {
                return false;
            }
        }
        return true;
    }
}
