<?php
/**
 * Review Generator
 * 
 * Creates WooCommerce product reviews with:
 * - 30+ reviews distributed across products
 * - Vietnamese reviewer names
 * - Realistic review content
 * - Ratings 1-5 with positive skew (more 4-5 star reviews)
 * 
 * @package Headless_Theme
 * @requirements 6.1, 6.2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ReviewGenerator Class
 * 
 * Handles creation of WooCommerce product reviews.
 */
class ReviewGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Vietnamese reviewer names (first names) */
    private $reviewer_first_names = [
        'Minh', 'Hùng', 'Tuấn', 'Đức', 'Thành', 'Hoàng', 'Long', 'Phúc', 'Quang', 'Việt',
        'Linh', 'Hương', 'Thảo', 'Mai', 'Ngọc', 'Hà', 'Lan', 'Trang', 'Yến', 'Hạnh',
        'An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khoa', 'Nam', 'Phong', 'Sơn', 'Tùng',
    ];
    
    /** @var array Vietnamese last names */
    private $reviewer_last_names = [
        'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
        'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý',
    ];

    
    /** @var array Positive review templates (for 4-5 star reviews) */
    private $positive_reviews = [
        'Sản phẩm rất đẹp, chất lượng tốt. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop lần sau!',
        'Mình rất hài lòng với sản phẩm này. Đúng như mô tả, màu sắc đẹp, chất liệu thoáng mát.',
        'Sản phẩm chất lượng, giá cả hợp lý. Shop tư vấn nhiệt tình. Recommend cho mọi người!',
        'Đã mua lần thứ 2 rồi, vẫn rất ưng ý. Chất vải mềm mại, form dáng chuẩn.',
        'Giao hàng siêu nhanh, sản phẩm đẹp hơn hình. Chắc chắn sẽ quay lại mua tiếp.',
        'Chất lượng vượt mong đợi so với giá tiền. Rất đáng mua!',
        'Sản phẩm đẹp, đường may tỉ mỉ, chất liệu cao cấp. 5 sao cho shop!',
        'Mua làm quà tặng, người nhận rất thích. Đóng gói đẹp, giao hàng đúng hẹn.',
        'Form dáng chuẩn, mặc lên rất tôn dáng. Sẽ giới thiệu cho bạn bè.',
        'Lần đầu mua ở shop, rất hài lòng. Sản phẩm giống hình, chất lượng tốt.',
        'Chất vải mát, không xù lông sau khi giặt. Rất đáng tiền!',
        'Shop gói hàng cẩn thận, sản phẩm không bị nhăn. Chất lượng 10/10.',
        'Màu sắc đẹp, đúng như hình. Mặc thoải mái, không bị bí.',
        'Sản phẩm xịn, giá hợp lý. Đã mua nhiều lần, lần nào cũng ưng.',
        'Chất liệu cao cấp, đường may chắc chắn. Rất hài lòng với sản phẩm này.',
    ];
    
    /** @var array Neutral review templates (for 3 star reviews) */
    private $neutral_reviews = [
        'Sản phẩm tạm ổn, đúng giá tiền. Giao hàng hơi lâu một chút.',
        'Chất lượng bình thường, không có gì đặc biệt. Có thể cải thiện thêm.',
        'Sản phẩm OK, nhưng màu hơi khác so với hình. Vẫn chấp nhận được.',
        'Giao hàng nhanh nhưng sản phẩm không như kỳ vọng. Tạm được.',
        'Chất vải ổn, form hơi rộng so với size thường mặc. Cần xem kỹ bảng size.',
    ];
    
    /** @var array Negative review templates (for 1-2 star reviews) */
    private $negative_reviews = [
        'Sản phẩm không giống hình, chất liệu mỏng hơn mong đợi.',
        'Giao hàng chậm, đóng gói sơ sài. Sản phẩm bị nhăn.',
        'Màu sắc khác xa so với hình ảnh. Hơi thất vọng.',
        'Chất lượng không tương xứng với giá tiền. Cần cải thiện.',
        'Size không đúng như bảng size, phải đổi lại. Hơi phiền.',
    ];
    
    /** @var array Created review IDs */
    private $created_reviews = [];
    
    /** @var array Available product IDs */
    private $product_ids = [];

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
     * Run all review creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting review generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Load available products
        $this->load_products();
        
        // Verify we have products to review
        if (empty($this->product_ids)) {
            $this->log('No products found. Please run ProductGenerator first.', 'error');
            return false;
        }
        
        // Create reviews
        $this->create_reviews();
        
        $this->log('Review generation complete!', 'success');
        return true;
    }
    
    /**
     * Load available product IDs
     */
    private function load_products() {
        // Get all sample products (both simple and variable)
        $products = wc_get_products([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        
        $this->product_ids = $products;
        $this->log('Found ' . count($this->product_ids) . ' sample products for reviews');
    }
    
    /**
     * Create product reviews
     * 
     * Requirements: 6.1 - Create at least 30 product reviews distributed across products
     * Requirements: 6.2 - Assign ratings from 1 to 5 stars with realistic distribution
     * 
     * @param int $count Number of reviews to create (default 35 to exceed minimum of 30)
     * @return array Array of created review IDs
     */
    public function create_reviews($count = 35) {
        $this->log('Creating product reviews...');
        $created = [];
        
        // Distribute reviews across products
        $product_count = count($this->product_ids);
        
        for ($i = 0; $i < $count; $i++) {
            // Pick a product (distribute somewhat evenly, but allow some products to have more)
            $product_index = $i % $product_count;
            // Add some randomness to distribution
            if (rand(1, 100) <= 30) {
                $product_index = array_rand($this->product_ids);
            }
            $product_id = $this->product_ids[$product_index];
            
            // Generate rating with positive skew
            $rating = $this->generate_rating_with_skew();
            
            $review_id = $this->create_review($product_id, $rating, $i);
            
            if ($review_id) {
                $created[] = $review_id;
                $this->created_reviews[] = $review_id;
                $product = wc_get_product($product_id);
                $product_name = $product ? $product->get_name() : "Product #$product_id";
                $this->log("  - Created review #$review_id for '$product_name' (Rating: $rating stars)");
            }
        }
        
        $count = count($created);
        $this->log("Created $count reviews", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('reviews', $count);
        }
        
        return $created;
    }
    
    /**
     * Generate a rating with positive skew (more 4-5 star reviews)
     * 
     * Requirements: 6.2 - More 4-5 star reviews (positive skew)
     * 
     * Distribution:
     * - 5 stars: 40%
     * - 4 stars: 30%
     * - 3 stars: 15%
     * - 2 stars: 10%
     * - 1 star: 5%
     * 
     * @return int Rating from 1 to 5
     */
    public function generate_rating_with_skew() {
        $rand = rand(1, 100);
        
        if ($rand <= 40) {
            return 5; // 40% chance
        } elseif ($rand <= 70) {
            return 4; // 30% chance
        } elseif ($rand <= 85) {
            return 3; // 15% chance
        } elseif ($rand <= 95) {
            return 2; // 10% chance
        } else {
            return 1; // 5% chance
        }
    }

    
    /**
     * Create a single product review
     * 
     * @param int $product_id Product ID
     * @param int $rating Rating (1-5)
     * @param int $index Review index for unique email
     * @return int|false Review ID or false on failure
     */
    private function create_review($product_id, $rating, $index) {
        // Generate reviewer name
        $first_name = $this->reviewer_first_names[array_rand($this->reviewer_first_names)];
        $last_name = $this->reviewer_last_names[array_rand($this->reviewer_last_names)];
        $reviewer_name = "$last_name $first_name";
        
        // Generate reviewer email
        $email_name = $this->remove_vietnamese_diacritics(strtolower($first_name));
        $reviewer_email = "reviewer{$index}_{$email_name}@example.com";
        
        // Get review content based on rating
        $review_content = $this->get_review_content($rating);
        
        // Check if similar review already exists (by email and product)
        $existing_reviews = get_comments([
            'post_id' => $product_id,
            'author_email' => $reviewer_email,
            'type' => 'review',
            'count' => true,
        ]);
        
        if ($existing_reviews > 0) {
            $this->log("    - Review from '$reviewer_email' for product #$product_id already exists");
            return false;
        }
        
        // Create the review comment
        $comment_data = [
            'comment_post_ID' => $product_id,
            'comment_author' => $reviewer_name,
            'comment_author_email' => $reviewer_email,
            'comment_content' => $review_content,
            'comment_type' => 'review',
            'comment_approved' => 1, // Approved
            'comment_date' => $this->generate_random_date(),
        ];
        
        $review_id = wp_insert_comment($comment_data);
        
        if (!$review_id) {
            $this->log("    - Failed to create review for product #$product_id", 'error');
            return false;
        }
        
        // Set the rating meta
        update_comment_meta($review_id, 'rating', $rating);
        
        // Mark as sample data
        update_comment_meta($review_id, self::SAMPLE_DATA_META_KEY, '1');
        
        // Update product average rating
        $this->update_product_rating($product_id);
        
        return $review_id;
    }
    
    /**
     * Get review content based on rating
     * 
     * @param int $rating Rating (1-5)
     * @return string Review content
     */
    private function get_review_content($rating) {
        if ($rating >= 4) {
            return $this->positive_reviews[array_rand($this->positive_reviews)];
        } elseif ($rating === 3) {
            return $this->neutral_reviews[array_rand($this->neutral_reviews)];
        } else {
            return $this->negative_reviews[array_rand($this->negative_reviews)];
        }
    }
    
    /**
     * Generate a random date within the last 60 days
     * 
     * @return string Date in MySQL format
     */
    private function generate_random_date() {
        $days_ago = rand(0, 60);
        $hours_ago = rand(0, 23);
        $minutes_ago = rand(0, 59);
        
        return date('Y-m-d H:i:s', strtotime("-$days_ago days -$hours_ago hours -$minutes_ago minutes"));
    }
    
    /**
     * Update product average rating after adding review
     * 
     * @param int $product_id Product ID
     */
    private function update_product_rating($product_id) {
        // Get all approved reviews for this product
        $reviews = get_comments([
            'post_id' => $product_id,
            'type' => 'review',
            'status' => 'approve',
        ]);
        
        if (empty($reviews)) {
            return;
        }
        
        // Calculate average rating
        $total_rating = 0;
        $count = 0;
        
        foreach ($reviews as $review) {
            $rating = get_comment_meta($review->comment_ID, 'rating', true);
            if ($rating) {
                $total_rating += (int) $rating;
                $count++;
            }
        }
        
        if ($count > 0) {
            $average = round($total_rating / $count, 2);
            update_post_meta($product_id, '_wc_average_rating', $average);
            update_post_meta($product_id, '_wc_review_count', $count);
            update_post_meta($product_id, '_wc_rating_count', serialize([$average => $count]));
        }
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
        ];
        
        $ascii = [
            'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
            'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
            'i', 'i', 'i', 'i', 'i',
            'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
            'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
            'y', 'y', 'y', 'y', 'y',
            'd',
        ];
        
        return str_replace($vietnamese, $ascii, $str);
    }

    
    /**
     * Get all created review IDs
     * 
     * @return array Array of review IDs
     */
    public function get_created_reviews() {
        return $this->created_reviews;
    }
    
    /**
     * Get review statistics for verification
     * 
     * @return array Review statistics
     */
    public function get_review_stats() {
        $stats = [
            'total_count' => 0,
            'by_rating' => [
                1 => 0,
                2 => 0,
                3 => 0,
                4 => 0,
                5 => 0,
            ],
            'products_with_reviews' => 0,
            'ratings' => [], // All individual ratings for property testing
        ];
        
        // Get all sample reviews
        $reviews = get_comments([
            'type' => 'review',
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        $products_reviewed = [];
        
        foreach ($reviews as $review) {
            $stats['total_count']++;
            
            // Get rating
            $rating = (int) get_comment_meta($review->comment_ID, 'rating', true);
            $stats['ratings'][] = $rating;
            
            if (isset($stats['by_rating'][$rating])) {
                $stats['by_rating'][$rating]++;
            }
            
            // Track products with reviews
            $products_reviewed[$review->comment_post_ID] = true;
        }
        
        $stats['products_with_reviews'] = count($products_reviewed);
        
        return $stats;
    }
    
    /**
     * Get all sample reviews with details
     * 
     * @return array Array of review data
     */
    public function get_sample_reviews() {
        $reviews_data = [];
        
        $reviews = get_comments([
            'type' => 'review',
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($reviews as $review) {
            $rating = (int) get_comment_meta($review->comment_ID, 'rating', true);
            $product = wc_get_product($review->comment_post_ID);
            
            $reviews_data[] = [
                'id' => $review->comment_ID,
                'product_id' => $review->comment_post_ID,
                'product_name' => $product ? $product->get_name() : 'Unknown',
                'author' => $review->comment_author,
                'email' => $review->comment_author_email,
                'rating' => $rating,
                'content' => $review->comment_content,
                'date' => $review->comment_date,
            ];
        }
        
        return $reviews_data;
    }
    
    /**
     * Verify review data integrity
     * 
     * @return array Verification results
     */
    public function verify_review_data() {
        $stats = $this->get_review_stats();
        
        $results = [
            'valid' => true,
            'total_reviews' => $stats['total_count'],
            'meets_minimum' => $stats['total_count'] >= 30,
            'all_ratings_valid' => $this->check_ratings_valid($stats['ratings']),
            'has_positive_skew' => $this->check_positive_skew($stats['by_rating']),
            'distributed_across_products' => $stats['products_with_reviews'] >= 5,
            'rating_distribution' => $stats['by_rating'],
            'issues' => [],
        ];
        
        if (!$results['meets_minimum']) {
            $results['valid'] = false;
            $results['issues'][] = "Only {$stats['total_count']} reviews created, minimum is 30";
        }
        
        if (!$results['all_ratings_valid']) {
            $results['valid'] = false;
            $results['issues'][] = "Some reviews have ratings outside valid range [1-5]";
        }
        
        if (!$results['has_positive_skew']) {
            $results['valid'] = false;
            $results['issues'][] = "Rating distribution does not show positive skew (more 4-5 star reviews)";
        }
        
        if (!$results['distributed_across_products']) {
            $results['valid'] = false;
            $results['issues'][] = "Reviews not distributed across enough products";
        }
        
        return $results;
    }
    
    /**
     * Check if all ratings are in valid range [1-5]
     * 
     * @param array $ratings Array of ratings
     * @return bool True if all valid
     */
    private function check_ratings_valid($ratings) {
        foreach ($ratings as $rating) {
            if ($rating < 1 || $rating > 5) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Check if rating distribution has positive skew
     * 
     * @param array $by_rating Rating counts by star
     * @return bool True if positive skew exists
     */
    private function check_positive_skew($by_rating) {
        // Positive skew means more 4-5 star reviews than 1-2 star reviews
        $high_ratings = $by_rating[4] + $by_rating[5];
        $low_ratings = $by_rating[1] + $by_rating[2];
        
        return $high_ratings > $low_ratings;
    }
    
    /**
     * Get positive review templates
     * 
     * @return array Positive review templates
     */
    public function get_positive_reviews() {
        return $this->positive_reviews;
    }
    
    /**
     * Get neutral review templates
     * 
     * @return array Neutral review templates
     */
    public function get_neutral_reviews() {
        return $this->neutral_reviews;
    }
    
    /**
     * Get negative review templates
     * 
     * @return array Negative review templates
     */
    public function get_negative_reviews() {
        return $this->negative_reviews;
    }
    
    /**
     * Get reviewer first names
     * 
     * @return array Reviewer first names
     */
    public function get_reviewer_first_names() {
        return $this->reviewer_first_names;
    }
    
    /**
     * Get reviewer last names
     * 
     * @return array Reviewer last names
     */
    public function get_reviewer_last_names() {
        return $this->reviewer_last_names;
    }
}
