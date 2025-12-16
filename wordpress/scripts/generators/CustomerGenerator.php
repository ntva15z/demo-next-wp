<?php
/**
 * Customer Generator
 * 
 * Creates WooCommerce customer accounts with Vietnamese names and addresses.
 * 
 * Features:
 * - 5+ customer accounts with Vietnamese names
 * - Billing/shipping addresses in Vietnam
 * - Realistic Vietnamese phone numbers and addresses
 * 
 * @package Headless_Theme
 * @requirements 5.1
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * CustomerGenerator Class
 * 
 * Handles creation of WooCommerce customer accounts.
 */
class CustomerGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Vietnamese first names (given names) */
    private $first_names = [
        'male' => ['Minh', 'Hùng', 'Tuấn', 'Đức', 'Thành', 'Hoàng', 'Long', 'Phúc', 'Quang', 'Việt'],
        'female' => ['Linh', 'Hương', 'Thảo', 'Mai', 'Ngọc', 'Hà', 'Lan', 'Trang', 'Yến', 'Hạnh'],
    ];
    
    /** @var array Vietnamese last names (family names) */
    private $last_names = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
    
    /** @var array Vietnamese middle names */
    private $middle_names = [
        'male' => ['Văn', 'Hữu', 'Đình', 'Công', 'Quốc', 'Xuân', 'Thanh', 'Minh'],
        'female' => ['Thị', 'Ngọc', 'Thanh', 'Hoàng', 'Minh', 'Phương', 'Kim', 'Bích'],
    ];


    /** @var array Vietnamese cities/provinces with districts */
    private $locations = [
        'Hồ Chí Minh' => [
            'state' => 'SG',
            'postcode' => '700000',
            'districts' => ['Quận 1', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'Quận Tân Bình', 'Quận Phú Nhuận', 'Thủ Đức'],
            'streets' => ['Nguyễn Huệ', 'Lê Lợi', 'Đồng Khởi', 'Hai Bà Trưng', 'Pasteur', 'Nam Kỳ Khởi Nghĩa', 'Điện Biên Phủ'],
        ],
        'Hà Nội' => [
            'state' => 'HN',
            'postcode' => '100000',
            'districts' => ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Thanh Xuân', 'Long Biên'],
            'streets' => ['Phố Huế', 'Bà Triệu', 'Trần Hưng Đạo', 'Lý Thường Kiệt', 'Nguyễn Trãi', 'Kim Mã', 'Láng Hạ'],
        ],
        'Đà Nẵng' => [
            'state' => 'DN',
            'postcode' => '550000',
            'districts' => ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'],
            'streets' => ['Bạch Đằng', 'Nguyễn Văn Linh', 'Trần Phú', 'Lê Duẩn', 'Phan Châu Trinh', 'Hoàng Diệu'],
        ],
        'Cần Thơ' => [
            'state' => 'CT',
            'postcode' => '900000',
            'districts' => ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
            'streets' => ['Nguyễn Trãi', 'Hòa Bình', 'Trần Hưng Đạo', 'Mậu Thân', 'Cách Mạng Tháng 8'],
        ],
        'Hải Phòng' => [
            'state' => 'HP',
            'postcode' => '180000',
            'districts' => ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Kiến An', 'Hải An', 'Đồ Sơn'],
            'streets' => ['Lạch Tray', 'Trần Phú', 'Điện Biên Phủ', 'Tô Hiệu', 'Lê Lợi', 'Cầu Đất'],
        ],
    ];
    
    /** @var array Customer definitions - will be generated dynamically */
    private $customers = [];
    
    /** @var array Created customer IDs */
    private $created_customers = [];

    /**
     * Constructor
     * 
     * @param SampleDataGenerator $generator Main generator instance
     */
    public function __construct($generator = null) {
        $this->generator = $generator;
        $this->generate_customer_definitions();
    }
    
    /**
     * Generate customer definitions with Vietnamese data
     */
    private function generate_customer_definitions() {
        // Generate 8 customers (more than required 5)
        $this->customers = [
            $this->create_customer_definition('male', 0),
            $this->create_customer_definition('female', 1),
            $this->create_customer_definition('male', 2),
            $this->create_customer_definition('female', 3),
            $this->create_customer_definition('male', 4),
            $this->create_customer_definition('female', 5),
            $this->create_customer_definition('male', 6),
            $this->create_customer_definition('female', 7),
        ];
    }
    
    /**
     * Create a single customer definition
     * 
     * @param string $gender 'male' or 'female'
     * @param int $index Customer index for unique email
     * @return array Customer definition
     */
    private function create_customer_definition($gender, $index) {
        $last_name = $this->last_names[array_rand($this->last_names)];
        $middle_name = $this->middle_names[$gender][array_rand($this->middle_names[$gender])];
        $first_name = $this->first_names[$gender][array_rand($this->first_names[$gender])];
        
        // Vietnamese full name format: Last Middle First
        $full_name = "$last_name $middle_name $first_name";
        
        // Pick a random city
        $cities = array_keys($this->locations);
        $city = $cities[array_rand($cities)];
        $location = $this->locations[$city];
        
        // Generate address
        $street_number = rand(1, 500);
        $street = $location['streets'][array_rand($location['streets'])];
        $district = $location['districts'][array_rand($location['districts'])];
        
        // Generate Vietnamese phone number (10 digits starting with 09, 03, 07, 08)
        $phone_prefixes = ['09', '03', '07', '08'];
        $phone_prefix = $phone_prefixes[array_rand($phone_prefixes)];
        $phone = $phone_prefix . str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
        
        // Create email from name (simplified, no diacritics)
        $email_name = $this->remove_vietnamese_diacritics(strtolower($first_name));
        $email = "customer{$index}_{$email_name}@example.com";
        
        return [
            'email' => $email,
            'first_name' => $first_name,
            'last_name' => "$last_name $middle_name",
            'display_name' => $full_name,
            'billing' => [
                'first_name' => $first_name,
                'last_name' => "$last_name $middle_name",
                'company' => '',
                'address_1' => "$street_number $street",
                'address_2' => $district,
                'city' => $city,
                'state' => $location['state'],
                'postcode' => $location['postcode'],
                'country' => 'VN',
                'phone' => $phone,
                'email' => $email,
            ],
            'shipping' => [
                'first_name' => $first_name,
                'last_name' => "$last_name $middle_name",
                'company' => '',
                'address_1' => "$street_number $street",
                'address_2' => $district,
                'city' => $city,
                'state' => $location['state'],
                'postcode' => $location['postcode'],
                'country' => 'VN',
                'phone' => $phone,
            ],
        ];
    }


    /**
     * Remove Vietnamese diacritics from string
     * 
     * @param string $str Input string
     * @return string String without diacritics
     */
    private function remove_vietnamese_diacritics($str) {
        $vietnamese = [
            'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ',
            'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ',
            'ì', 'í', 'ị', 'ỉ', 'ĩ',
            'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ',
            'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ',
            'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ',
            'đ',
            'À', 'Á', 'Ạ', 'Ả', 'Ã', 'Â', 'Ầ', 'Ấ', 'Ậ', 'Ẩ', 'Ẫ', 'Ă', 'Ằ', 'Ắ', 'Ặ', 'Ẳ', 'Ẵ',
            'È', 'É', 'Ẹ', 'Ẻ', 'Ẽ', 'Ê', 'Ề', 'Ế', 'Ệ', 'Ể', 'Ễ',
            'Ì', 'Í', 'Ị', 'Ỉ', 'Ĩ',
            'Ò', 'Ó', 'Ọ', 'Ỏ', 'Õ', 'Ô', 'Ồ', 'Ố', 'Ộ', 'Ổ', 'Ỗ', 'Ơ', 'Ờ', 'Ớ', 'Ợ', 'Ở', 'Ỡ',
            'Ù', 'Ú', 'Ụ', 'Ủ', 'Ũ', 'Ư', 'Ừ', 'Ứ', 'Ự', 'Ử', 'Ữ',
            'Ỳ', 'Ý', 'Ỵ', 'Ỷ', 'Ỹ',
            'Đ',
        ];
        
        $ascii = [
            'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
            'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
            'i', 'i', 'i', 'i', 'i',
            'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
            'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
            'y', 'y', 'y', 'y', 'y',
            'd',
            'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',
            'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',
            'I', 'I', 'I', 'I', 'I',
            'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O',
            'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U',
            'Y', 'Y', 'Y', 'Y', 'Y',
            'D',
        ];
        
        return str_replace($vietnamese, $ascii, $str);
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
     * Run all customer creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting customer generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Create customers
        $this->create_customers();
        
        $this->log('Customer generation complete!', 'success');
        return true;
    }
    
    /**
     * Create customer accounts
     * 
     * Requirements: 5.1 - Create at least 5 customer accounts with Vietnamese addresses
     * 
     * @return array Array of created customer IDs
     */
    public function create_customers() {
        $this->log('Creating customer accounts...');
        $created = [];
        
        foreach ($this->customers as $index => $customer_data) {
            $customer_id = $this->create_customer($customer_data, $index);
            
            if ($customer_id) {
                $created[] = $customer_id;
                $this->created_customers[] = $customer_id;
                $this->log("  - Created customer: {$customer_data['display_name']} (ID: $customer_id)");
            }
        }
        
        $count = count($created);
        $this->log("Created $count customers", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('customers', $count);
        }
        
        return $created;
    }


    /**
     * Create a single customer account
     * 
     * @param array $data Customer data
     * @param int $index Customer index
     * @return int|false Customer ID or false on failure
     */
    private function create_customer($data, $index) {
        // Check if customer already exists by email
        $existing_user = get_user_by('email', $data['email']);
        
        if ($existing_user) {
            $this->log("    - Customer with email '{$data['email']}' already exists (ID: {$existing_user->ID})");
            return $existing_user->ID;
        }
        
        // Create WooCommerce customer
        $customer = new WC_Customer();
        
        // Basic info
        $customer->set_email($data['email']);
        $customer->set_first_name($data['first_name']);
        $customer->set_last_name($data['last_name']);
        $customer->set_display_name($data['display_name']);
        $customer->set_username($this->generate_username($data['email']));
        $customer->set_password(wp_generate_password(12, true, true));
        
        // Billing address
        $customer->set_billing_first_name($data['billing']['first_name']);
        $customer->set_billing_last_name($data['billing']['last_name']);
        $customer->set_billing_company($data['billing']['company']);
        $customer->set_billing_address_1($data['billing']['address_1']);
        $customer->set_billing_address_2($data['billing']['address_2']);
        $customer->set_billing_city($data['billing']['city']);
        $customer->set_billing_state($data['billing']['state']);
        $customer->set_billing_postcode($data['billing']['postcode']);
        $customer->set_billing_country($data['billing']['country']);
        $customer->set_billing_phone($data['billing']['phone']);
        $customer->set_billing_email($data['billing']['email']);
        
        // Shipping address
        $customer->set_shipping_first_name($data['shipping']['first_name']);
        $customer->set_shipping_last_name($data['shipping']['last_name']);
        $customer->set_shipping_company($data['shipping']['company']);
        $customer->set_shipping_address_1($data['shipping']['address_1']);
        $customer->set_shipping_address_2($data['shipping']['address_2']);
        $customer->set_shipping_city($data['shipping']['city']);
        $customer->set_shipping_state($data['shipping']['state']);
        $customer->set_shipping_postcode($data['shipping']['postcode']);
        $customer->set_shipping_country($data['shipping']['country']);
        $customer->set_shipping_phone($data['shipping']['phone']);
        
        // Save customer
        $customer_id = $customer->save();
        
        if (!$customer_id) {
            $this->log("    - Failed to create customer: {$data['email']}", 'error');
            return false;
        }
        
        // Mark as sample data
        update_user_meta($customer_id, self::SAMPLE_DATA_META_KEY, '1');
        
        // Set role to customer
        $user = new WP_User($customer_id);
        $user->set_role('customer');
        
        return $customer_id;
    }
    
    /**
     * Generate username from email
     * 
     * @param string $email Email address
     * @return string Username
     */
    private function generate_username($email) {
        $username = sanitize_user(current(explode('@', $email)), true);
        
        // Ensure unique username
        $base_username = $username;
        $counter = 1;
        
        while (username_exists($username)) {
            $username = $base_username . $counter;
            $counter++;
        }
        
        return $username;
    }
    
    /**
     * Get all created customer IDs
     * 
     * @return array Array of customer IDs
     */
    public function get_created_customers() {
        return $this->created_customers;
    }
    
    /**
     * Get customer definitions
     * 
     * @return array Customer definitions
     */
    public function get_customer_definitions() {
        return $this->customers;
    }
    
    /**
     * Get customer statistics for verification
     * 
     * @return array Customer statistics
     */
    public function get_customer_stats() {
        $stats = [
            'total_count' => 0,
            'with_billing_address' => 0,
            'with_shipping_address' => 0,
            'with_vietnam_address' => 0,
            'with_phone' => 0,
        ];
        
        // Get all sample customers
        $customer_ids = get_users([
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'fields' => 'ID',
        ]);
        
        foreach ($customer_ids as $customer_id) {
            $customer = new WC_Customer($customer_id);
            $stats['total_count']++;
            
            // Check billing address
            if ($customer->get_billing_address_1()) {
                $stats['with_billing_address']++;
            }
            
            // Check shipping address
            if ($customer->get_shipping_address_1()) {
                $stats['with_shipping_address']++;
            }
            
            // Check Vietnam address
            if ($customer->get_billing_country() === 'VN') {
                $stats['with_vietnam_address']++;
            }
            
            // Check phone
            if ($customer->get_billing_phone()) {
                $stats['with_phone']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Get all sample customers with details
     * 
     * @return array Array of customer data
     */
    public function get_sample_customers() {
        $customers = [];
        
        $customer_ids = get_users([
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'fields' => 'ID',
        ]);
        
        foreach ($customer_ids as $customer_id) {
            $customer = new WC_Customer($customer_id);
            $customers[] = [
                'id' => $customer_id,
                'email' => $customer->get_email(),
                'first_name' => $customer->get_first_name(),
                'last_name' => $customer->get_last_name(),
                'display_name' => $customer->get_display_name(),
                'billing' => [
                    'address_1' => $customer->get_billing_address_1(),
                    'address_2' => $customer->get_billing_address_2(),
                    'city' => $customer->get_billing_city(),
                    'state' => $customer->get_billing_state(),
                    'postcode' => $customer->get_billing_postcode(),
                    'country' => $customer->get_billing_country(),
                    'phone' => $customer->get_billing_phone(),
                ],
                'shipping' => [
                    'address_1' => $customer->get_shipping_address_1(),
                    'address_2' => $customer->get_shipping_address_2(),
                    'city' => $customer->get_shipping_city(),
                    'state' => $customer->get_shipping_state(),
                    'postcode' => $customer->get_shipping_postcode(),
                    'country' => $customer->get_shipping_country(),
                ],
            ];
        }
        
        return $customers;
    }
    
    /**
     * Verify customer data integrity
     * 
     * @return array Verification results
     */
    public function verify_customer_data() {
        $stats = $this->get_customer_stats();
        
        $results = [
            'valid' => true,
            'total_customers' => $stats['total_count'],
            'meets_minimum' => $stats['total_count'] >= 5,
            'all_have_billing' => $stats['with_billing_address'] === $stats['total_count'],
            'all_have_shipping' => $stats['with_shipping_address'] === $stats['total_count'],
            'all_in_vietnam' => $stats['with_vietnam_address'] === $stats['total_count'],
            'all_have_phone' => $stats['with_phone'] === $stats['total_count'],
            'issues' => [],
        ];
        
        if (!$results['meets_minimum']) {
            $results['valid'] = false;
            $results['issues'][] = "Only {$stats['total_count']} customers created, minimum is 5";
        }
        
        if (!$results['all_have_billing']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all customers have billing addresses";
        }
        
        if (!$results['all_have_shipping']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all customers have shipping addresses";
        }
        
        if (!$results['all_in_vietnam']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all customers have Vietnam addresses";
        }
        
        if (!$results['all_have_phone']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all customers have phone numbers";
        }
        
        return $results;
    }
}
