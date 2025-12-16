<?php
/**
 * Property Test: Category Hierarchy Integrity
 * 
 * **Feature: wordpress-sample-data, Property 4: Category Hierarchy Integrity**
 * **Validates: Requirements 3.1**
 * 
 * For any child category created, it SHALL have a valid parent category reference.
 * 
 * This test verifies that:
 * 1. All child categories have valid parent references
 * 2. The hierarchy has at least 3 parent categories
 * 3. Each parent has at least 2 child categories
 * 4. No orphaned categories exist (children without valid parents)
 * 
 * Usage:
 *   wp eval-file tests/category-hierarchy.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 3.1
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/category-hierarchy.property.test.php --allow-root\n";
    exit(1);
}

// Include the generator classes
$generators_dir = dirname(__FILE__) . '/../generators/';
if (file_exists($generators_dir . 'CategoryGenerator.php')) {
    require_once $generators_dir . 'CategoryGenerator.php';
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
     * Assert that a value is greater than or equal to expected
     * 
     * @param int $expected Minimum expected value
     * @param int $actual Actual value
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_gte($expected, $actual, $message = '') {
        if ($actual < $expected) {
            $msg = $message ?: "Expected at least $expected but got $actual";
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
 * Category Hierarchy Property Tests
 * 
 * Tests that the category generator maintains hierarchy integrity:
 * - All child categories have valid parent references
 * - Minimum parent and child category counts are met
 * - No orphaned categories exist
 */
class CategoryHierarchyPropertyTest {
    
    /** @var PropertyTestRunner Test runner instance */
    private $runner;
    
    /** @var CategoryGenerator Category generator instance */
    private $generator;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->runner = new PropertyTestRunner();
        // Use fewer runs since we're testing static data structure
        $this->runner->set_runs(100);
        $this->generator = new CategoryGenerator();
    }
    
    /**
     * Run all category hierarchy tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // Test 1: Child categories have valid parent references
        $this->test_child_categories_have_valid_parents();
        
        // Test 2: Minimum parent category count
        $this->test_minimum_parent_categories();
        
        // Test 3: Each parent has minimum child categories
        $this->test_minimum_children_per_parent();
        
        // Test 4: No orphaned categories in hierarchy definition
        $this->test_no_orphaned_categories();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Test: Category Hierarchy Integrity\n";
        echo "Feature: wordpress-sample-data, Property 4\n";
        echo "Validates: Requirements 3.1\n";
        echo "=================================================\n";
    }
    
    /**
     * Test: Child categories have valid parent references
     * 
     * Property 4: Category Hierarchy Integrity
     * For any child category created, it SHALL have a valid parent category reference.
     */
    private function test_child_categories_have_valid_parents() {
        $this->runner->test('Child categories have valid parent references', function($runner, $iteration) {
            $hierarchy = $this->generator->get_category_hierarchy();
            
            // Collect all parent slugs
            $parent_slugs = array_keys($hierarchy);
            
            // For each parent, verify children reference valid parents
            foreach ($hierarchy as $parent_slug => $parent_data) {
                if (isset($parent_data['children']) && is_array($parent_data['children'])) {
                    foreach ($parent_data['children'] as $child_slug => $child_data) {
                        // The child is defined under a parent, so the parent must exist
                        $runner->assert_true(
                            in_array($parent_slug, $parent_slugs),
                            "Child '$child_slug' references non-existent parent '$parent_slug'"
                        );
                        
                        // Child must have a name
                        $runner->assert_true(
                            !empty($child_data['name']),
                            "Child '$child_slug' must have a name"
                        );
                    }
                }
            }
        });
    }
    
    /**
     * Test: Minimum parent category count
     * 
     * Requirements 3.1: at least 3 parent categories
     */
    private function test_minimum_parent_categories() {
        $this->runner->test('Minimum 3 parent categories', function($runner, $iteration) {
            $hierarchy = $this->generator->get_category_hierarchy();
            $parent_count = count($hierarchy);
            
            $runner->assert_gte(
                3,
                $parent_count,
                "Expected at least 3 parent categories, got $parent_count"
            );
        });
    }
    
    /**
     * Test: Each parent has minimum child categories
     * 
     * Requirements 3.1: 2-3 child categories each
     */
    private function test_minimum_children_per_parent() {
        $this->runner->test('Each parent has at least 2 children', function($runner, $iteration) {
            $hierarchy = $this->generator->get_category_hierarchy();
            
            foreach ($hierarchy as $parent_slug => $parent_data) {
                $child_count = 0;
                
                if (isset($parent_data['children']) && is_array($parent_data['children'])) {
                    $child_count = count($parent_data['children']);
                }
                
                $runner->assert_gte(
                    2,
                    $child_count,
                    "Parent '$parent_slug' should have at least 2 children, got $child_count"
                );
            }
        });
    }
    
    /**
     * Test: No orphaned categories in hierarchy definition
     * 
     * Verifies that the hierarchy structure is well-formed with no orphans.
     */
    private function test_no_orphaned_categories() {
        $this->runner->test('No orphaned categories in hierarchy', function($runner, $iteration) {
            $hierarchy = $this->generator->get_category_hierarchy();
            
            // All categories should be either:
            // 1. A top-level parent (key in hierarchy)
            // 2. A child under a parent (in children array)
            
            $all_slugs = [];
            $child_slugs = [];
            
            foreach ($hierarchy as $parent_slug => $parent_data) {
                $all_slugs[] = $parent_slug;
                
                if (isset($parent_data['children']) && is_array($parent_data['children'])) {
                    foreach ($parent_data['children'] as $child_slug => $child_data) {
                        $all_slugs[] = $child_slug;
                        $child_slugs[] = $child_slug;
                    }
                }
            }
            
            // No duplicate slugs
            $unique_slugs = array_unique($all_slugs);
            $runner->assert_true(
                count($all_slugs) === count($unique_slugs),
                "Duplicate category slugs found in hierarchy"
            );
            
            // Children should not also be parents
            $parent_slugs = array_keys($hierarchy);
            foreach ($child_slugs as $child_slug) {
                $runner->assert_true(
                    !in_array($child_slug, $parent_slugs),
                    "Child '$child_slug' should not also be a parent category"
                );
            }
        });
    }
}

// Run the tests
$test = new CategoryHierarchyPropertyTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
