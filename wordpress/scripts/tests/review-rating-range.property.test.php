<?php
/**
 * Property Tests: Review Rating Range
 * 
 * **Feature: wordpress-sample-data, Property 7: Review Rating Range**
 * **Validates: Requirements 6.2**
 * 
 * Property 7: Review Rating Range [1-5]
 * For any product review created, the rating SHALL be in the range [1, 5].
 * 
 * Usage:
 *   wp eval-file tests/review-rating-range.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 6.2
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/review-rating-range.property.test.php --allow-root\n";
    exit(1);
}

// Include the generator classes
$generators_dir = dirname(__FILE__) . '/../generators/';
if (file_exists($generators_dir . 'ReviewGenerator.php')) {
    require_once $generators_dir . 'ReviewGenerator.php';
}

/**
 * Simple Property Test Runner
 * 
 * Provides basic property-based testing functionality for PHP.
 */
class PropertyTestRunner {
    
    /** @var int Number of test iterations */
    private $num_runs = 100;
    
    /** @var array Test results */
    private $results = [];
    
    /**
     * Set number of test runs
     * 
     * @param int $runs Number of iterations
     * @return self
     */
    public function set_runs($runs) {
        $this->num_runs = $runs;
        return $this;
    }

    
    /**
     * Log test output
     * 
     * @param string $message Message to log
     * @param string $type Message type (info, success, error, warning)
     */
    private function log($message, $type = 'info') {
        if (defined('WP_CLI') && WP_CLI) {
            switch ($type) {
                case 'success':
                    WP_CLI::success($message);
                    break;
                case 'error':
                    WP_CLI::error($message, false);
                    break;
                case 'warning':
                    WP_CLI::warning($message);
                    break;
                default:
                    WP_CLI::log($message);
            }
        } else {
            echo "[$type] $message\n";
        }
    }
    
    /**
     * Assert that a condition is true
     * 
     * @param bool $condition Condition to check
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_true($condition, $message = 'Assertion failed') {
        if (!$condition) {
            throw new Exception($message);
        }
    }
    
    /**
     * Assert that a value is within a range
     * 
     * @param int $min Minimum value (inclusive)
     * @param int $max Maximum value (inclusive)
     * @param int $actual Actual value
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_in_range($min, $max, $actual, $message = '') {
        if ($actual < $min || $actual > $max) {
            $msg = $message ?: "Expected value in range [$min, $max] but got $actual";
            throw new Exception($msg);
        }
    }
    
    /**
     * Run a property test
     * 
     * @param string $name Test name
     * @param callable $test_fn Test function
     * @return bool True if test passed
     */
    public function test($name, $test_fn) {
        $this->log("\n=== Testing: $name ===", 'info');
        
        $passed = 0;
        $failed = 0;
        $failure_example = null;
        
        for ($i = 0; $i < $this->num_runs; $i++) {
            try {
                $test_fn($this, $i);
                $passed++;
            } catch (Exception $e) {
                $failed++;
                if ($failure_example === null) {
                    $failure_example = [
                        'iteration' => $i,
                        'message' => $e->getMessage(),
                    ];
                }
            }
        }
        
        $this->results[$name] = [
            'passed' => $passed,
            'failed' => $failed,
            'failure_example' => $failure_example,
        ];
        
        if ($failed === 0) {
            $this->log("✓ PASSED ($passed/$this->num_runs iterations)", 'success');
            return true;
        } else {
            $this->log("✗ FAILED ($failed/$this->num_runs iterations)", 'error');
            $this->log("  First failure at iteration {$failure_example['iteration']}: {$failure_example['message']}", 'error');
            return false;
        }
    }
    
    /**
     * Get test results
     * 
     * @return array Test results
     */
    public function get_results() {
        return $this->results;
    }
    
    /**
     * Print summary of all tests
     * 
     * @return bool True if all tests passed
     */
    public function summary() {
        $this->log("\n=== Test Summary ===", 'info');
        
        $total_passed = 0;
        $total_failed = 0;
        
        foreach ($this->results as $name => $result) {
            $status = $result['failed'] === 0 ? '✓' : '✗';
            $this->log("$status $name: {$result['passed']} passed, {$result['failed']} failed", 'info');
            $total_passed += $result['passed'];
            $total_failed += $result['failed'];
        }
        
        $this->log("\nTotal: $total_passed passed, $total_failed failed", 'info');
        
        if ($total_failed === 0) {
            $this->log("All tests passed!", 'success');
            return true;
        } else {
            $this->log("Some tests failed!", 'error');
            return false;
        }
    }
}


/**
 * Review Rating Range Property Test
 * 
 * Tests review generation property:
 * - Property 7: Review Rating Range [1-5]
 * 
 * For any product review created, the rating SHALL be in the range [1, 5].
 */
class ReviewRatingRangeTest {
    
    /** @var PropertyTestRunner Test runner instance */
    private $runner;
    
    /** @var ReviewGenerator Review generator instance */
    private $generator;
    
    /** @var string Sample data meta key */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->runner = new PropertyTestRunner();
        // Use 100 runs as specified in design document
        $this->runner->set_runs(100);
        $this->generator = new ReviewGenerator();
    }
    
    /**
     * Run all review property tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // Test Property 7: Review Rating Range
        $this->test_review_rating_range();
        
        // Additional test: Rating generation with skew
        $this->test_rating_generation_skew();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Tests: Review Rating Range\n";
        echo "Feature: wordpress-sample-data, Property 7\n";
        echo "Validates: Requirements 6.2\n";
        echo "=================================================\n";
    }
    
    /**
     * Test Property 7: Review Rating Range
     * 
     * **Feature: wordpress-sample-data, Property 7: Review Rating Range**
     * **Validates: Requirements 6.2**
     * 
     * For any product review created, the rating SHALL be in the range [1, 5].
     */
    private function test_review_rating_range() {
        $this->runner->test('Property 7: Review Rating Range [1-5]', function($runner, $iteration) {
            // Generate a rating using the generator's method
            $rating = $this->generator->generate_rating_with_skew();
            
            // Verify rating is in valid range [1, 5]
            $runner->assert_in_range(
                1,
                5,
                $rating,
                "Generated rating $rating is outside valid range [1, 5]"
            );
            
            // Also verify it's an integer
            $runner->assert_true(
                is_int($rating),
                "Rating must be an integer, got " . gettype($rating)
            );
        });
    }
    
    /**
     * Test Rating Generation with Positive Skew
     * 
     * **Feature: wordpress-sample-data, Property 7: Review Rating Range**
     * **Validates: Requirements 6.2**
     * 
     * The rating distribution should have a positive skew (more 4-5 star reviews).
     * This test generates many ratings and verifies the distribution.
     */
    private function test_rating_generation_skew() {
        $this->runner->test('Property 7 (Extended): Rating Distribution Positive Skew', function($runner, $iteration) {
            // Generate 100 ratings and check distribution
            $ratings = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
            
            for ($i = 0; $i < 100; $i++) {
                $rating = $this->generator->generate_rating_with_skew();
                $ratings[$rating]++;
            }
            
            // Verify positive skew: 4-5 star reviews should be more than 1-2 star reviews
            $high_ratings = $ratings[4] + $ratings[5];
            $low_ratings = $ratings[1] + $ratings[2];
            
            $runner->assert_true(
                $high_ratings > $low_ratings,
                "Expected positive skew (4-5 stars: $high_ratings > 1-2 stars: $low_ratings)"
            );
            
            // Verify all ratings are in valid range
            foreach ($ratings as $star => $count) {
                $runner->assert_in_range(
                    1,
                    5,
                    $star,
                    "Rating star value $star is outside valid range [1, 5]"
                );
            }
        });
    }
}

// Run the tests
$test = new ReviewRatingRangeTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
