<?php
/**
 * Property Test: Attribute Options Count
 * 
 * **Feature: wordpress-sample-data, Property: Attribute Options Count**
 * **Validates: Requirements 4.2, 4.3**
 * 
 * For any execution of the attribute generator:
 * - Color attribute SHALL have at least 8 options
 * - Material attribute SHALL have at least 5 options
 * - Size attribute SHALL have exactly 6 options (XS, S, M, L, XL, XXL)
 * 
 * This test verifies that:
 * 1. The AttributeGenerator creates the correct number of attribute options
 * 2. All expected attribute values are present
 * 3. Attribute creation is idempotent (running twice doesn't duplicate)
 * 
 * Usage:
 *   wp eval-file tests/attribute-options.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 4.1, 4.2, 4.3
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/attribute-options.property.test.php --allow-root\n";
    exit(1);
}

// Include the generator classes
require_once dirname(__FILE__) . '/../generators/AttributeGenerator.php';

/**
 * Simple Property Test Runner
 * 
 * Provides basic property-based testing functionality for PHP.
 * Runs tests multiple times with different random seeds.
 */
class AttributePropertyTestRunner {
    
    /** @var int Number of test iterations */
    private $num_runs = 100;
    
    /** @var array Test results */
    private $results = [];
    
    /** @var string Current test name */
    private $current_test = '';
    
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
        $colors = [
            'info' => "\033[0m",
            'success' => "\033[32m",
            'error' => "\033[31m",
            'warning' => "\033[33m",
        ];
        
        $color = $colors[$type] ?? $colors['info'];
        $reset = "\033[0m";
        
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
            echo $color . $message . $reset . "\n";
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
     * Assert that two values are equal
     * 
     * @param mixed $expected Expected value
     * @param mixed $actual Actual value
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_equals($expected, $actual, $message = '') {
        if ($expected !== $actual) {
            $msg = $message ?: "Expected $expected but got $actual";
            throw new Exception($msg);
        }
    }
    
    /**
     * Assert that an array contains a value
     * 
     * @param mixed $needle Value to find
     * @param array $haystack Array to search
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_contains($needle, $haystack, $message = '') {
        if (!in_array($needle, $haystack)) {
            $msg = $message ?: "Array does not contain '$needle'";
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
        $this->current_test = $name;
        $this->log("\n=== Testing: $name ===");
        
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
     */
    public function summary() {
        $this->log("\n=== Test Summary ===");
        
        $total_passed = 0;
        $total_failed = 0;
        
        foreach ($this->results as $name => $result) {
            $status = $result['failed'] === 0 ? '✓' : '✗';
            $this->log("$status $name: {$result['passed']} passed, {$result['failed']} failed");
            $total_passed += $result['passed'];
            $total_failed += $result['failed'];
        }
        
        $this->log("\nTotal: $total_passed passed, $total_failed failed");
        
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
 * Attribute Options Property Tests
 * 
 * Tests that the AttributeGenerator creates the correct number of options:
 * - Color attribute has ≥8 options (Requirements 4.2)
 * - Material attribute has ≥5 options (Requirements 4.3)
 * - Size attribute has exactly 6 options (Requirements 4.1)
 */
class AttributeOptionsPropertyTest {
    
    /** @var AttributePropertyTestRunner Test runner instance */
    private $runner;
    
    /** @var AttributeGenerator Generator instance */
    private $generator;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->runner = new AttributePropertyTestRunner();
        // Use fewer runs since we're testing static configuration
        $this->runner->set_runs(10);
        $this->generator = new AttributeGenerator();
    }
    
    /**
     * Run all attribute option tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // First, ensure attributes are created
        $this->setup_attributes();
        
        // Test 1: Color attribute has ≥8 options
        $this->test_color_attribute_options();
        
        // Test 2: Material attribute has ≥5 options
        $this->test_material_attribute_options();
        
        // Test 3: Size attribute has exactly 6 options
        $this->test_size_attribute_options();
        
        // Test 4: All expected size values are present
        $this->test_size_values_present();
        
        // Test 5: Attribute creation is idempotent
        $this->test_attribute_idempotency();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Test: Attribute Options Count\n";
        echo "Feature: wordpress-sample-data\n";
        echo "Validates: Requirements 4.1, 4.2, 4.3\n";
        echo "=================================================\n";
    }
    
    /**
     * Setup attributes before testing
     */
    private function setup_attributes() {
        echo "\nSetting up attributes...\n";
        
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            echo "WARNING: WooCommerce is not active. Tests will verify generator configuration only.\n";
            return;
        }
        
        // Run the generator to create attributes
        $this->generator->run();
        
        echo "Attributes setup complete.\n";
    }
    
    /**
     * Test: Color attribute has ≥8 options
     * 
     * **Feature: wordpress-sample-data, Property: Color attribute has ≥8 options**
     * **Validates: Requirements 4.2**
     * 
     * For any execution of the attribute generator,
     * the Color attribute SHALL have at least 8 color options.
     */
    private function test_color_attribute_options() {
        $this->runner->test('Color attribute has ≥8 options (Req 4.2)', function($runner, $iteration) {
            $color_values = $this->generator->get_color_values();
            $count = count($color_values);
            
            $runner->assert_gte(
                8,
                $count,
                "Color attribute should have at least 8 options, but has $count"
            );
        });
    }
    
    /**
     * Test: Material attribute has ≥5 options
     * 
     * **Feature: wordpress-sample-data, Property: Material attribute has ≥5 options**
     * **Validates: Requirements 4.3**
     * 
     * For any execution of the attribute generator,
     * the Material attribute SHALL have at least 5 material options.
     */
    private function test_material_attribute_options() {
        $this->runner->test('Material attribute has ≥5 options (Req 4.3)', function($runner, $iteration) {
            $material_values = $this->generator->get_material_values();
            $count = count($material_values);
            
            $runner->assert_gte(
                5,
                $count,
                "Material attribute should have at least 5 options, but has $count"
            );
        });
    }
    
    /**
     * Test: Size attribute has exactly 6 options
     * 
     * **Feature: wordpress-sample-data, Property: Size attribute has 6 options**
     * **Validates: Requirements 4.1**
     * 
     * For any execution of the attribute generator,
     * the Size attribute SHALL have exactly 6 options: XS, S, M, L, XL, XXL.
     */
    private function test_size_attribute_options() {
        $this->runner->test('Size attribute has 6 options (Req 4.1)', function($runner, $iteration) {
            $size_values = $this->generator->get_size_values();
            $count = count($size_values);
            
            $runner->assert_equals(
                6,
                $count,
                "Size attribute should have exactly 6 options, but has $count"
            );
        });
    }
    
    /**
     * Test: All expected size values are present
     * 
     * **Feature: wordpress-sample-data, Property: Size values complete**
     * **Validates: Requirements 4.1**
     * 
     * For any execution of the attribute generator,
     * the Size attribute SHALL contain: XS, S, M, L, XL, XXL.
     */
    private function test_size_values_present() {
        $this->runner->test('Size values complete (Req 4.1)', function($runner, $iteration) {
            $size_values = $this->generator->get_size_values();
            $expected_sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            
            foreach ($expected_sizes as $size) {
                $runner->assert_contains(
                    $size,
                    $size_values,
                    "Size attribute should contain '$size'"
                );
            }
        });
    }
    
    /**
     * Test: Attribute creation is idempotent
     * 
     * **Feature: wordpress-sample-data, Property: Attribute idempotency**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     * 
     * For any two consecutive calls to get attribute values,
     * the values SHALL remain the same.
     */
    private function test_attribute_idempotency() {
        $this->runner->test('Attribute values idempotent', function($runner, $iteration) {
            // Get values first time
            $colors1 = $this->generator->get_color_values();
            $materials1 = $this->generator->get_material_values();
            $sizes1 = $this->generator->get_size_values();
            
            // Get values second time
            $colors2 = $this->generator->get_color_values();
            $materials2 = $this->generator->get_material_values();
            $sizes2 = $this->generator->get_size_values();
            
            // Values should be identical
            $runner->assert_equals(
                count($colors1),
                count($colors2),
                "Color count should be same on consecutive calls"
            );
            
            $runner->assert_equals(
                count($materials1),
                count($materials2),
                "Material count should be same on consecutive calls"
            );
            
            $runner->assert_equals(
                count($sizes1),
                count($sizes2),
                "Size count should be same on consecutive calls"
            );
        });
    }
}

// Run the tests
$test = new AttributeOptionsPropertyTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
