<?php
/**
 * WooCommerce Configuration Generator
 * 
 * Configures WooCommerce settings for Vietnam market including:
 * - Store settings (currency, location)
 * - Shipping zones and methods
 * - Payment methods
 * 
 * @package Headless_Theme
 * @requirements 7.1, 7.2, 7.3
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ConfigGenerator Class
 * 
 * Handles WooCommerce configuration for Vietnam market.
 */
class ConfigGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
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
     * Run all configuration tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting WooCommerce configuration for Vietnam market...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Configure store settings
        $this->configure_store_settings();
        
        // Configure shipping zones
        $this->configure_shipping_zones();
        
        // Configure payment methods
        $this->configure_payment_methods();
        
        $this->log('WooCommerce configuration complete!', 'success');
        return true;
    }

    
    /**
     * Configure store settings for Vietnam
     * 
     * Sets currency to VND, store location to Vietnam, and tax settings.
     * Requirements: 7.1
     * 
     * @return bool True on success
     */
    public function configure_store_settings() {
        $this->log('Configuring store settings for Vietnam...');
        
        // Set store location to Vietnam
        update_option('woocommerce_default_country', 'VN');
        update_option('woocommerce_store_address', '123 Nguyễn Huệ');
        update_option('woocommerce_store_address_2', 'Quận 1');
        update_option('woocommerce_store_city', 'Hồ Chí Minh');
        update_option('woocommerce_store_postcode', '700000');
        $this->log('  - Store location set to Vietnam');
        
        // Set currency to VND with proper formatting
        // đ suffix, no decimals, thousand separator with dot
        update_option('woocommerce_currency', 'VND');
        update_option('woocommerce_currency_pos', 'right_space'); // Price đ
        update_option('woocommerce_price_thousand_sep', '.');
        update_option('woocommerce_price_decimal_sep', ',');
        update_option('woocommerce_price_num_decimals', '0'); // No decimals for VND
        $this->log('  - Currency set to VND with proper formatting');
        
        // Configure tax settings
        update_option('woocommerce_calc_taxes', 'yes');
        update_option('woocommerce_prices_include_tax', 'yes'); // Prices include tax (common in Vietnam)
        update_option('woocommerce_tax_based_on', 'base'); // Tax based on store base address
        update_option('woocommerce_tax_display_shop', 'incl'); // Display prices including tax
        update_option('woocommerce_tax_display_cart', 'incl');
        update_option('woocommerce_tax_total_display', 'single'); // Display as single total
        $this->log('  - Tax settings configured');
        
        // Create Vietnam VAT tax rate (10%)
        $this->create_vietnam_tax_rate();
        
        // Set weight and dimension units
        update_option('woocommerce_weight_unit', 'kg');
        update_option('woocommerce_dimension_unit', 'cm');
        $this->log('  - Weight/dimension units set to kg/cm');
        
        // Enable guest checkout (common for Vietnam e-commerce)
        update_option('woocommerce_enable_guest_checkout', 'yes');
        update_option('woocommerce_enable_checkout_login_reminder', 'yes');
        $this->log('  - Guest checkout enabled');
        
        $this->log('Store settings configured successfully', 'success');
        return true;
    }
    
    /**
     * Create Vietnam VAT tax rate
     * 
     * @return int|false Tax rate ID or false on failure
     */
    private function create_vietnam_tax_rate() {
        global $wpdb;
        
        // Check if Vietnam tax rate already exists
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT tax_rate_id FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_country = %s AND tax_rate_name = %s",
                'VN',
                'VAT'
            )
        );
        
        if ($existing) {
            $this->log('  - Vietnam VAT tax rate already exists');
            return (int) $existing;
        }
        
        // Create standard VAT rate for Vietnam (10%)
        $tax_rate = array(
            'tax_rate_country'  => 'VN',
            'tax_rate_state'    => '',
            'tax_rate'          => '10.0000',
            'tax_rate_name'     => 'VAT',
            'tax_rate_priority' => 1,
            'tax_rate_compound' => 0,
            'tax_rate_shipping' => 1,
            'tax_rate_order'    => 1,
            'tax_rate_class'    => '',
        );
        
        $wpdb->insert($wpdb->prefix . 'woocommerce_tax_rates', $tax_rate);
        $tax_rate_id = $wpdb->insert_id;
        
        if ($tax_rate_id) {
            $this->log('  - Vietnam VAT tax rate (10%) created');
            return $tax_rate_id;
        }
        
        return false;
    }

    
    /**
     * Configure shipping zones for Vietnam
     * 
     * Creates Vietnam shipping zone with flat rate and free shipping methods.
     * Requirements: 7.2
     * 
     * @return bool True on success
     */
    public function configure_shipping_zones() {
        $this->log('Configuring shipping zones...');
        
        // Check if WooCommerce shipping zones class exists
        if (!class_exists('WC_Shipping_Zones')) {
            $this->log('WC_Shipping_Zones class not found', 'error');
            return false;
        }
        
        // Check if Vietnam zone already exists
        $existing_zones = WC_Shipping_Zones::get_zones();
        $vietnam_zone = null;
        
        foreach ($existing_zones as $zone_data) {
            if ($zone_data['zone_name'] === 'Vietnam' || $zone_data['zone_name'] === 'Việt Nam') {
                $vietnam_zone = WC_Shipping_Zones::get_zone($zone_data['id']);
                $this->log('  - Vietnam shipping zone already exists');
                break;
            }
        }
        
        // Create Vietnam shipping zone if it doesn't exist
        if (!$vietnam_zone) {
            $vietnam_zone = new WC_Shipping_Zone();
            $vietnam_zone->set_zone_name('Việt Nam');
            $vietnam_zone->set_zone_order(1);
            $vietnam_zone->save();
            
            // Add Vietnam as zone location
            $vietnam_zone->add_location('VN', 'country');
            $vietnam_zone->save();
            
            $this->log('  - Vietnam shipping zone created');
        }
        
        // Get existing shipping methods for this zone
        $existing_methods = $vietnam_zone->get_shipping_methods();
        $has_flat_rate = false;
        $has_free_shipping = false;
        
        foreach ($existing_methods as $method) {
            if ($method->id === 'flat_rate') {
                $has_flat_rate = true;
            }
            if ($method->id === 'free_shipping') {
                $has_free_shipping = true;
            }
        }
        
        // Add flat rate shipping method (30,000đ)
        if (!$has_flat_rate) {
            $instance_id = $vietnam_zone->add_shipping_method('flat_rate');
            
            if ($instance_id) {
                // Configure flat rate settings
                $flat_rate_settings = array(
                    'title'      => 'Giao hàng tiêu chuẩn',
                    'tax_status' => 'taxable',
                    'cost'       => '30000', // 30,000 VND
                    'type'       => 'class', // Per class
                );
                
                update_option('woocommerce_flat_rate_' . $instance_id . '_settings', $flat_rate_settings);
                $this->log('  - Flat rate shipping added (30,000đ)');
            }
        } else {
            $this->log('  - Flat rate shipping already exists');
        }
        
        // Add free shipping for orders over 500,000đ
        if (!$has_free_shipping) {
            $instance_id = $vietnam_zone->add_shipping_method('free_shipping');
            
            if ($instance_id) {
                // Configure free shipping settings
                $free_shipping_settings = array(
                    'title'      => 'Miễn phí vận chuyển',
                    'requires'   => 'min_amount', // Requires minimum order amount
                    'min_amount' => '500000', // 500,000 VND
                );
                
                update_option('woocommerce_free_shipping_' . $instance_id . '_settings', $free_shipping_settings);
                $this->log('  - Free shipping added (orders over 500,000đ)');
            }
        } else {
            $this->log('  - Free shipping already exists');
        }
        
        // Create "Rest of World" zone for international shipping (optional)
        $this->create_rest_of_world_zone();
        
        $this->log('Shipping zones configured successfully', 'success');
        return true;
    }
    
    /**
     * Create Rest of World shipping zone
     * 
     * @return bool True on success
     */
    private function create_rest_of_world_zone() {
        // Check if it already exists (zone ID 0 is the default "Locations not covered" zone)
        $rest_of_world = WC_Shipping_Zones::get_zone(0);
        
        if ($rest_of_world) {
            $existing_methods = $rest_of_world->get_shipping_methods();
            
            if (empty($existing_methods)) {
                // Add flat rate for international shipping
                $instance_id = $rest_of_world->add_shipping_method('flat_rate');
                
                if ($instance_id) {
                    $settings = array(
                        'title'      => 'International Shipping',
                        'tax_status' => 'taxable',
                        'cost'       => '200000', // 200,000 VND for international
                        'type'       => 'order',
                    );
                    
                    update_option('woocommerce_flat_rate_' . $instance_id . '_settings', $settings);
                    $this->log('  - International shipping added to Rest of World zone');
                }
            }
        }
        
        return true;
    }

    
    /**
     * Configure payment methods for Vietnam
     * 
     * Enables Cash on Delivery (COD) payment method.
     * Requirements: 7.3
     * 
     * @return bool True on success
     */
    public function configure_payment_methods() {
        $this->log('Configuring payment methods...');
        
        // Enable Cash on Delivery (COD)
        $this->enable_cod_payment();
        
        // Disable other payment methods that aren't configured
        $this->disable_unconfigured_payment_methods();
        
        $this->log('Payment methods configured successfully', 'success');
        return true;
    }
    
    /**
     * Enable and configure Cash on Delivery payment method
     * 
     * @return bool True on success
     */
    private function enable_cod_payment() {
        // Get COD gateway settings
        $cod_settings = get_option('woocommerce_cod_settings', array());
        
        // Configure COD settings for Vietnam
        $cod_settings = array_merge($cod_settings, array(
            'enabled'            => 'yes',
            'title'              => 'Thanh toán khi nhận hàng (COD)',
            'description'        => 'Thanh toán bằng tiền mặt khi nhận hàng. Vui lòng chuẩn bị đúng số tiền để thuận tiện cho việc giao hàng.',
            'instructions'       => 'Quý khách vui lòng thanh toán cho nhân viên giao hàng khi nhận được sản phẩm. Đơn hàng sẽ được giao trong vòng 2-5 ngày làm việc.',
            'enable_for_methods' => array(), // Enable for all shipping methods
            'enable_for_virtual' => 'no', // Disable for virtual products
        ));
        
        update_option('woocommerce_cod_settings', $cod_settings);
        $this->log('  - Cash on Delivery (COD) enabled');
        
        return true;
    }
    
    /**
     * Disable payment methods that aren't properly configured
     * 
     * @return void
     */
    private function disable_unconfigured_payment_methods() {
        // Disable PayPal if not configured
        $paypal_settings = get_option('woocommerce_paypal_settings', array());
        if (empty($paypal_settings['email'])) {
            $paypal_settings['enabled'] = 'no';
            update_option('woocommerce_paypal_settings', $paypal_settings);
            $this->log('  - PayPal disabled (not configured)');
        }
        
        // Disable direct bank transfer if not configured
        $bacs_settings = get_option('woocommerce_bacs_settings', array());
        if (empty($bacs_settings['account_details']) || !is_array($bacs_settings['account_details']) || empty($bacs_settings['account_details'])) {
            $bacs_settings['enabled'] = 'no';
            update_option('woocommerce_bacs_settings', $bacs_settings);
            $this->log('  - Bank transfer disabled (not configured)');
        }
        
        // Disable check payments (not common in Vietnam)
        $cheque_settings = get_option('woocommerce_cheque_settings', array());
        $cheque_settings['enabled'] = 'no';
        update_option('woocommerce_cheque_settings', $cheque_settings);
        $this->log('  - Check payments disabled');
    }
    
    /**
     * Get current store configuration
     * 
     * @return array Current configuration values
     */
    public function get_current_config() {
        return array(
            'store' => array(
                'country'         => get_option('woocommerce_default_country'),
                'address'         => get_option('woocommerce_store_address'),
                'city'            => get_option('woocommerce_store_city'),
                'postcode'        => get_option('woocommerce_store_postcode'),
            ),
            'currency' => array(
                'code'            => get_option('woocommerce_currency'),
                'position'        => get_option('woocommerce_currency_pos'),
                'thousand_sep'    => get_option('woocommerce_price_thousand_sep'),
                'decimal_sep'     => get_option('woocommerce_price_decimal_sep'),
                'num_decimals'    => get_option('woocommerce_price_num_decimals'),
            ),
            'tax' => array(
                'calc_taxes'      => get_option('woocommerce_calc_taxes'),
                'prices_incl_tax' => get_option('woocommerce_prices_include_tax'),
                'tax_based_on'    => get_option('woocommerce_tax_based_on'),
            ),
            'shipping_zones'      => $this->get_shipping_zones_info(),
            'payment_methods'     => $this->get_payment_methods_info(),
        );
    }
    
    /**
     * Get shipping zones information
     * 
     * @return array Shipping zones data
     */
    private function get_shipping_zones_info() {
        if (!class_exists('WC_Shipping_Zones')) {
            return array();
        }
        
        $zones = WC_Shipping_Zones::get_zones();
        $zones_info = array();
        
        foreach ($zones as $zone_data) {
            $zone = WC_Shipping_Zones::get_zone($zone_data['id']);
            $methods = $zone->get_shipping_methods();
            
            $methods_info = array();
            foreach ($methods as $method) {
                $methods_info[] = array(
                    'id'    => $method->id,
                    'title' => $method->get_title(),
                );
            }
            
            $zones_info[] = array(
                'id'       => $zone_data['id'],
                'name'     => $zone_data['zone_name'],
                'methods'  => $methods_info,
            );
        }
        
        return $zones_info;
    }
    
    /**
     * Get payment methods information
     * 
     * @return array Payment methods data
     */
    private function get_payment_methods_info() {
        if (!function_exists('WC')) {
            return array();
        }
        
        $gateways = WC()->payment_gateways()->payment_gateways();
        $methods_info = array();
        
        foreach ($gateways as $gateway) {
            $methods_info[] = array(
                'id'      => $gateway->id,
                'title'   => $gateway->get_title(),
                'enabled' => $gateway->enabled === 'yes',
            );
        }
        
        return $methods_info;
    }
}
