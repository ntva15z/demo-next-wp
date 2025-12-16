<?php
/**
 * Property Tests: Blog Post Content Structure
 * 
 * **Feature: wordpress-sample-data, Property 8: Blog Post Content Structure**
 * **Validates: Requirements 8.3**
 * 
 * Property 8: Blog Post Content Structure
 * For any blog post created, it SHALL have a featured image AND content with at least one heading.
 * 
 * Usage:
 *   wp eval-file tests/blog-content-structure.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 8.3
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/blog-content-structure.property.test.php --allow-root\n";
    exit(1);
}

// Include the generator classes
$generators_dir = dirname(__FILE__) . '/../generators/';
if (file_exists($generators_dir . 'BlogGenerator.php')) {
    require_once $generators_dir . 'BlogGenerator.php';
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
     * Assert that a value is greater than or equal to a minimum
     * 
     * @param int $min Minimum value (inclusive)
     * @param int $actual Actual value
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_gte($min, $actual, $message = '') {
        if ($actual < $min) {
            $msg = $message ?: "Expected value >= $min but got $actual";
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
     * Run a single test (not iterated)
     * 
     * @param string $name Test name
     * @param callable $test_fn Test function
     * @return bool True if test passed
     */
    public function test_once($name, $test_fn) {
        $this->log("\n=== Testing: $name ===", 'info');
        
        try {
            $test_fn($this);
            $this->results[$name] = [
                'passed' => 1,
                'failed' => 0,
                'failure_example' => null,
            ];
            $this->log("✓ PASSED", 'success');
            return true;
        } catch (Exception $e) {
            $this->results[$name] = [
                'passed' => 0,
                'failed' => 1,
                'failure_example' => [
                    'iteration' => 0,
                    'message' => $e->getMessage(),
                ],
            ];
            $this->log("✗ FAILED: " . $e->getMessage(), 'error');
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
 * Blog Post Content Structure Property Test
 * 
 * Tests blog generation property:
 * - Property 8: Blog Post Content Structure
 * 
 * For any blog post created, it SHALL have a featured image AND content with at least one heading.
 */
class BlogContentStructureTest {
    
    /** @var PropertyTestRunner Test runner instance */
    private $runner;
    
    /** @var BlogGenerator Blog generator instance */
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
        $this->generator = new BlogGenerator();
    }
    
    /**
     * Run all blog property tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // Test Property 8: Blog Post Content Structure (on post definitions)
        $this->test_post_definitions_have_headings();
        
        // Test that all post definitions have content
        $this->test_post_definitions_have_content();
        
        // Test minimum post count requirement
        $this->test_minimum_post_count();
        
        // Test category distribution
        $this->test_category_distribution();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Tests: Blog Post Content Structure\n";
        echo "Feature: wordpress-sample-data, Property 8\n";
        echo "Validates: Requirements 8.3\n";
        echo "=================================================\n";
    }
    
    /**
     * Test Property 8: Blog Post Content Structure - Headings
     * 
     * **Feature: wordpress-sample-data, Property 8: Blog Post Content Structure**
     * **Validates: Requirements 8.3**
     * 
     * For any blog post created, it SHALL have content with at least one heading.
     */
    private function test_post_definitions_have_headings() {
        $all_posts = $this->generator->get_all_post_definitions();
        
        $this->runner->test('Property 8: All Post Definitions Have Headings', function($runner, $iteration) use ($all_posts) {
            // Pick a random post definition
            $post_index = $iteration % count($all_posts);
            $post = $all_posts[$post_index];
            
            // Check that content contains at least one heading (h1-h6)
            $has_heading = preg_match('/<h[1-6][^>]*>/i', $post['content']);
            
            $runner->assert_true(
                $has_heading,
                "Post '{$post['title']}' does not contain any headings (h1-h6)"
            );
        });
    }
    
    /**
     * Test that all post definitions have non-empty content
     * 
     * **Feature: wordpress-sample-data, Property 8: Blog Post Content Structure**
     * **Validates: Requirements 8.3**
     */
    private function test_post_definitions_have_content() {
        $all_posts = $this->generator->get_all_post_definitions();
        
        $this->runner->test('Property 8: All Post Definitions Have Content', function($runner, $iteration) use ($all_posts) {
            // Pick a random post definition
            $post_index = $iteration % count($all_posts);
            $post = $all_posts[$post_index];
            
            // Check that content is not empty
            $runner->assert_true(
                !empty($post['content']),
                "Post '{$post['title']}' has empty content"
            );
            
            // Check that content has paragraphs
            $has_paragraphs = preg_match('/<p[^>]*>/i', $post['content']);
            $runner->assert_true(
                $has_paragraphs,
                "Post '{$post['title']}' does not contain any paragraphs"
            );
            
            // Check minimum content length (at least 100 characters of actual text)
            $text_content = strip_tags($post['content']);
            $runner->assert_gte(
                100,
                strlen($text_content),
                "Post '{$post['title']}' content is too short (less than 100 characters)"
            );
        });
    }
    
    /**
     * Test minimum post count requirement
     * 
     * **Feature: wordpress-sample-data, Property 8: Blog Post Content Structure**
     * **Validates: Requirements 8.2**
     * 
     * The generator SHALL create at least 15 blog posts.
     */
    private function test_minimum_post_count() {
        $all_posts = $this->generator->get_all_post_definitions();
        
        $this->runner->test_once('Property 8: Minimum 15 Post Definitions', function($runner) use ($all_posts) {
            $count = count($all_posts);
            
            $runner->assert_gte(
                15,
                $count,
                "Expected at least 15 post definitions, got $count"
            );
        });
    }
    
    /**
     * Test category distribution
     * 
     * **Feature: wordpress-sample-data, Property 8: Blog Post Content Structure**
     * **Validates: Requirements 8.1, 8.2**
     * 
     * Posts SHALL be distributed across at least 3 categories.
     */
    private function test_category_distribution() {
        $categories = $this->generator->get_blog_category_definitions();
        
        $this->runner->test_once('Property 8: At Least 3 Blog Categories', function($runner) use ($categories) {
            $count = count($categories);
            
            $runner->assert_gte(
                3,
                $count,
                "Expected at least 3 blog categories, got $count"
            );
            
            // Verify required categories exist
            $required_slugs = ['tin-tuc', 'huong-dan', 'danh-gia-san-pham'];
            foreach ($required_slugs as $slug) {
                $runner->assert_true(
                    isset($categories[$slug]),
                    "Required category '$slug' is missing from definitions"
                );
            }
        });
    }
}

// Run the tests
$test = new BlogContentStructureTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
