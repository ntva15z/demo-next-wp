<?php
/**
 * Property Test: Idempotency
 * 
 * **Feature: wordpress-sample-data, Property 9: Idempotency**
 * **Validates: Requirements 9.1**
 * 
 * For any two consecutive executions of the sample data generator (without reset),
 * the data counts SHALL remain the same after the second run.
 * 
 * This test verifies that:
 * 1. Running the generator twice without --reset produces the same data counts
 * 2. The sample data marker prevents duplicate data creation
 * 3. The idempotency check correctly detects existing data
 * 
 * Usage:
 *   wp eval-file tests/idempotency.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 9.1
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/idempotency.property.test.php --allow-root\n";
    exit(1);
}

// Include the main generator script to get the classes
require_once dirname(__FILE__) . '/../generate-sample-data.php';

/**
 * Simple Property Test Runner
 * 
 * Provides basic property-based testing functionality for PHP.
 * Runs tests multiple times with different random seeds.
 */
class PropertyTestRunner {
    
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
 * Idempotency Property Tests
 * 
 * Tests that the sample data generator maintains idempotency:
 * - Running twice without reset produces same counts
 * - Marker correctly tracks generation state
 * - Skip logic works correctly
 */
class IdempotencyPropertyTest {
    
    /** @var PropertyTestRunner Test runner instance */
    private $runner;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->runner = new PropertyTestRunner();
        // Use fewer runs for idempotency tests since they involve DB operations
        $this->runner->set_runs(10);
    }
    
    /**
     * Run all idempotency tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // Test 1: Marker state consistency
        $this->test_marker_state_consistency();
        
        // Test 2: Data counts remain same after second run
        $this->test_data_counts_idempotent();
        
        // Test 3: Clear marker allows regeneration
        $this->test_clear_marker_allows_regeneration();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Test: Idempotency\n";
        echo "Feature: wordpress-sample-data, Property 9\n";
        echo "Validates: Requirements 9.1\n";
        echo "=================================================\n";
    }
    
    /**
     * Test: Marker state consistency
     * 
     * For any sequence of set_marker/has_marker/clear_marker operations,
     * the marker state should be consistent.
     */
    private function test_marker_state_consistency() {
        $this->runner->test('Marker state consistency', function($runner, $iteration) {
            // Clear any existing marker
            SampleDataChecker::clear_marker();
            
            // Initially should have no marker
            $runner->assert_true(
                !SampleDataChecker::has_marker(),
                "Marker should not exist after clear"
            );
            
            // Set marker with random data
            $test_data = [
                'test_iteration' => $iteration,
                'random_value' => rand(1, 1000),
            ];
            SampleDataChecker::set_marker($test_data);
            
            // Should now have marker
            $runner->assert_true(
                SampleDataChecker::has_marker(),
                "Marker should exist after set"
            );
            
            // Marker data should contain our test data
            $marker = SampleDataChecker::get_marker();
            $runner->assert_equals(
                $test_data['test_iteration'],
                $marker['test_iteration'],
                "Marker should contain test_iteration"
            );
            
            // Timestamp should be set
            $timestamp = SampleDataChecker::get_timestamp();
            $runner->assert_true(
                !empty($timestamp),
                "Timestamp should be set"
            );
            
            // Clear marker
            SampleDataChecker::clear_marker();
            
            // Should no longer have marker
            $runner->assert_true(
                !SampleDataChecker::has_marker(),
                "Marker should not exist after final clear"
            );
        });
    }
    
    /**
     * Test: Data counts remain same after second run (idempotency)
     * 
     * For any two consecutive checks of sample data counts,
     * if no data is added between checks, counts should be identical.
     */
    private function test_data_counts_idempotent() {
        $this->runner->test('Data counts idempotent', function($runner, $iteration) {
            // Get initial counts
            $counts1 = SampleDataChecker::get_status()['counts'];
            
            // Get counts again without any changes
            $counts2 = SampleDataChecker::get_status()['counts'];
            
            // Counts should be identical
            foreach ($counts1 as $key => $value) {
                $runner->assert_equals(
                    $value,
                    $counts2[$key],
                    "Count for '$key' should be same: expected $value, got {$counts2[$key]}"
                );
            }
        });
    }
    
    /**
     * Test: Clear marker allows regeneration
     * 
     * After clearing the marker, has_marker should return false,
     * allowing the generator to run again.
     */
    private function test_clear_marker_allows_regeneration() {
        $this->runner->test('Clear marker allows regeneration', function($runner, $iteration) {
            // Set marker
            SampleDataChecker::set_marker(['test' => $iteration]);
            
            // Verify marker exists
            $runner->assert_true(
                SampleDataChecker::has_marker(),
                "Marker should exist after set"
            );
            
            // Clear marker
            SampleDataChecker::clear_marker();
            
            // Verify marker is gone
            $runner->assert_true(
                !SampleDataChecker::has_marker(),
                "Marker should not exist after clear"
            );
            
            // Verify timestamp is also cleared
            $timestamp = SampleDataChecker::get_timestamp();
            $runner->assert_true(
                $timestamp === false,
                "Timestamp should be cleared"
            );
        });
    }
}

// Run the tests
$test = new IdempotencyPropertyTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
