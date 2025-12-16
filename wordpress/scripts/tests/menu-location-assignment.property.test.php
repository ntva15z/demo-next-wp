<?php
/**
 * Property Test: Menu Location Assignment
 * 
 * **Feature: wordpress-sample-data, Property 10: Menu Location Assignment**
 * **Validates: Requirements 10.3**
 * 
 * For any menu created, it SHALL be assigned to a valid registered menu location.
 * 
 * This test verifies that:
 * 1. All menus are assigned to registered theme locations
 * 2. Primary menu is assigned to 'primary' location
 * 3. Footer menu is assigned to 'footer' location
 * 4. Menu locations are valid and registered in the theme
 * 
 * Usage:
 *   wp eval-file tests/menu-location-assignment.property.test.php --allow-root
 * 
 * @package Headless_Theme
 * @requirements 10.3
 */

// Prevent direct access - must be run via WP-CLI
if (!defined('ABSPATH')) {
    echo "This test must be run via WP-CLI: wp eval-file tests/menu-location-assignment.property.test.php --allow-root\n";
    exit(1);
}

// Include the generator classes
$generators_dir = dirname(__FILE__) . '/../generators/';
if (file_exists($generators_dir . 'MenuGenerator.php')) {
    require_once $generators_dir . 'MenuGenerator.php';
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
     * Assert that two values are equal
     * 
     * @param mixed $expected Expected value
     * @param mixed $actual Actual value
     * @param string $message Error message if assertion fails
     * @throws Exception If assertion fails
     */
    public function assert_equals($expected, $actual, $message = '') {
        if ($expected !== $actual) {
            $msg = $message ?: "Expected '$expected' but got '$actual'";
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
 * Menu Location Assignment Property Tests
 * 
 * Tests that the menu generator assigns menus to valid registered locations:
 * - All menus are assigned to registered theme locations
 * - Primary menu is assigned to 'primary' location
 * - Footer menu is assigned to 'footer' location
 */
class MenuLocationAssignmentPropertyTest {
    
    /** @var PropertyTestRunner Test runner instance */
    private $runner;
    
    /** @var MenuGenerator Menu generator instance */
    private $generator;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->runner = new PropertyTestRunner();
        // Use fewer runs since we're testing static data structure
        $this->runner->set_runs(100);
        $this->generator = new MenuGenerator();
    }
    
    /**
     * Run all menu location tests
     * 
     * @return bool True if all tests passed
     */
    public function run() {
        $this->log_header();
        
        // Test 1: Menu definitions specify valid locations
        $this->test_menu_definitions_have_valid_locations();
        
        // Test 2: All defined locations are registered in theme
        $this->test_locations_are_registered();
        
        // Test 3: Primary menu location is 'primary'
        $this->test_primary_menu_location();
        
        // Test 4: Footer menu location is 'footer'
        $this->test_footer_menu_location();
        
        return $this->runner->summary();
    }
    
    /**
     * Log test header
     */
    private function log_header() {
        echo "\n";
        echo "=================================================\n";
        echo "Property Test: Menu Location Assignment\n";
        echo "Feature: wordpress-sample-data, Property 10\n";
        echo "Validates: Requirements 10.3\n";
        echo "=================================================\n";
    }
    
    /**
     * Test: Menu definitions specify valid locations
     * 
     * Property 10: Menu Location Assignment
     * For any menu created, it SHALL be assigned to a valid registered menu location.
     */
    private function test_menu_definitions_have_valid_locations() {
        $this->runner->test('Menu definitions specify valid locations', function($runner, $iteration) {
            $definitions = $this->generator->get_menu_definitions();
            
            // Each menu definition must have a location
            foreach ($definitions as $key => $definition) {
                $runner->assert_true(
                    isset($definition['location']) && !empty($definition['location']),
                    "Menu '$key' must have a location defined"
                );
                
                $runner->assert_true(
                    isset($definition['name']) && !empty($definition['name']),
                    "Menu '$key' must have a name defined"
                );
            }
            
            // Must have at least 2 menus defined (primary and footer)
            $runner->assert_gte(
                2,
                count($definitions),
                "Expected at least 2 menu definitions"
            );
        });
    }
    
    /**
     * Test: All defined locations are registered in theme
     * 
     * Verifies that the locations specified in menu definitions
     * are actually registered in the WordPress theme.
     */
    private function test_locations_are_registered() {
        $this->runner->test('All defined locations are registered in theme', function($runner, $iteration) {
            $definitions = $this->generator->get_menu_definitions();
            $registered_locations = $this->generator->get_registered_locations();
            
            foreach ($definitions as $key => $definition) {
                $location = $definition['location'];
                
                $runner->assert_true(
                    isset($registered_locations[$location]),
                    "Location '$location' for menu '$key' is not registered in theme"
                );
            }
        });
    }
    
    /**
     * Test: Primary menu location is 'primary'
     * 
     * Requirements 10.1: Create a Primary Menu with links to main categories and pages
     */
    private function test_primary_menu_location() {
        $this->runner->test('Primary menu is assigned to primary location', function($runner, $iteration) {
            $definitions = $this->generator->get_menu_definitions();
            
            // Primary menu must exist
            $runner->assert_true(
                isset($definitions['primary']),
                "Primary menu definition must exist"
            );
            
            // Primary menu must be assigned to 'primary' location
            $runner->assert_equals(
                'primary',
                $definitions['primary']['location'],
                "Primary menu must be assigned to 'primary' location"
            );
        });
    }
    
    /**
     * Test: Footer menu location is 'footer'
     * 
     * Requirements 10.2: Create a Footer Menu with links to policy pages and contact
     */
    private function test_footer_menu_location() {
        $this->runner->test('Footer menu is assigned to footer location', function($runner, $iteration) {
            $definitions = $this->generator->get_menu_definitions();
            
            // Footer menu must exist
            $runner->assert_true(
                isset($definitions['footer']),
                "Footer menu definition must exist"
            );
            
            // Footer menu must be assigned to 'footer' location
            $runner->assert_equals(
                'footer',
                $definitions['footer']['location'],
                "Footer menu must be assigned to 'footer' location"
            );
        });
    }
}

// Run the tests
$test = new MenuLocationAssignmentPropertyTest();
$passed = $test->run();

// Exit with appropriate code
exit($passed ? 0 : 1);
