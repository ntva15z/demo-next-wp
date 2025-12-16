<?php
/**
 * Product Category and Tag Generator
 * 
 * Creates product categories with hierarchical structure and product tags.
 * 
 * Category Hierarchy:
 * - Thời trang nam (Men's Fashion)
 *   - Áo nam (Men's Tops)
 *   - Quần nam (Men's Bottoms)
 * - Thời trang nữ (Women's Fashion)
 *   - Áo nữ (Women's Tops)
 *   - Váy đầm (Dresses)
 * - Phụ kiện (Accessories)
 *   - Túi xách (Bags)
 *   - Giày dép (Footwear)
 * 
 * @package Headless_Theme
 * @requirements 3.1, 3.2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * CategoryGenerator Class
 * 
 * Handles creation of product categories and tags for WooCommerce.
 */
class CategoryGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var array Category hierarchy definition */
    private $category_hierarchy = [
        'thoi-trang-nam' => [
            'name' => 'Thời trang nam',
            'description' => 'Các sản phẩm thời trang dành cho nam giới',
            'children' => [
                'ao-nam' => [
                    'name' => 'Áo nam',
                    'description' => 'Áo thun, áo sơ mi, áo khoác nam',
                ],
                'quan-nam' => [
                    'name' => 'Quần nam',
                    'description' => 'Quần jeans, quần kaki, quần short nam',
                ],
            ],
        ],
        'thoi-trang-nu' => [
            'name' => 'Thời trang nữ',
            'description' => 'Các sản phẩm thời trang dành cho nữ giới',
            'children' => [
                'ao-nu' => [
                    'name' => 'Áo nữ',
                    'description' => 'Áo thun, áo sơ mi, áo kiểu nữ',
                ],
                'vay-dam' => [
                    'name' => 'Váy đầm',
                    'description' => 'Váy, đầm công sở, đầm dự tiệc',
                ],
            ],
        ],
        'phu-kien' => [
            'name' => 'Phụ kiện',
            'description' => 'Phụ kiện thời trang',
            'children' => [
                'tui-xach' => [
                    'name' => 'Túi xách',
                    'description' => 'Túi xách, balo, ví',
                ],
                'giay-dep' => [
                    'name' => 'Giày dép',
                    'description' => 'Giày, dép, sandal',
                ],
            ],
        ],
    ];

    
    /** @var array Product tags to create */
    private $product_tags = [
        'basic' => 'Basic',
        'premium' => 'Premium',
        'sale' => 'Sale',
        'new-arrival' => 'New Arrival',
        'bestseller' => 'Bestseller',
        'cotton' => 'Cotton',
        'summer' => 'Summer',
        'winter' => 'Winter',
        'casual' => 'Casual',
        'formal' => 'Formal',
    ];
    
    /** @var array Created category IDs for reference */
    private $created_categories = [];
    
    /** @var array Created tag IDs for reference */
    private $created_tags = [];

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
     * Run all category and tag creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting category and tag generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Create product categories
        $this->create_category_hierarchy();
        
        // Create product tags
        $this->create_product_tags();
        
        $this->log('Category and tag generation complete!', 'success');
        return true;
    }
    
    /**
     * Create hierarchical product categories
     * 
     * Requirements: 3.1 - Create hierarchical category structure with at least 
     * 3 parent categories and 2-3 child categories each
     * 
     * @return array Array of created category IDs
     */
    public function create_category_hierarchy() {
        $this->log('Creating product category hierarchy...');
        
        foreach ($this->category_hierarchy as $parent_slug => $parent_data) {
            // Create parent category
            $parent_id = $this->create_category(
                $parent_data['name'],
                $parent_slug,
                $parent_data['description'],
                0 // No parent
            );
            
            if ($parent_id) {
                $this->created_categories[$parent_slug] = $parent_id;
                $this->log("  - Created parent category: {$parent_data['name']} (ID: $parent_id)");
                
                // Create child categories
                if (isset($parent_data['children']) && is_array($parent_data['children'])) {
                    foreach ($parent_data['children'] as $child_slug => $child_data) {
                        $child_id = $this->create_category(
                            $child_data['name'],
                            $child_slug,
                            $child_data['description'],
                            $parent_id
                        );
                        
                        if ($child_id) {
                            $this->created_categories[$child_slug] = $child_id;
                            $this->log("    - Created child category: {$child_data['name']} (ID: $child_id)");
                        }
                    }
                }
            }
        }
        
        $total_categories = count($this->created_categories);
        $this->log("Created $total_categories categories total", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('categories', $total_categories);
        }
        
        return $this->created_categories;
    }

    
    /**
     * Create a single product category
     * 
     * @param string $name Category name
     * @param string $slug Category slug
     * @param string $description Category description
     * @param int $parent_id Parent category ID (0 for top-level)
     * @return int|false Category ID or false on failure
     */
    private function create_category($name, $slug, $description = '', $parent_id = 0) {
        // Check if category already exists
        $existing = get_term_by('slug', $slug, 'product_cat');
        
        if ($existing) {
            $this->log("    - Category '$name' already exists (ID: {$existing->term_id})");
            return $existing->term_id;
        }
        
        // Create the category
        $result = wp_insert_term(
            $name,
            'product_cat',
            [
                'slug' => $slug,
                'description' => $description,
                'parent' => $parent_id,
            ]
        );
        
        if (is_wp_error($result)) {
            $this->log("    - Failed to create category '$name': " . $result->get_error_message(), 'error');
            return false;
        }
        
        return $result['term_id'];
    }
    
    /**
     * Create product tags
     * 
     * Requirements: 3.2 - Create at least 10 product tags
     * 
     * @return array Array of created tag IDs
     */
    public function create_product_tags() {
        $this->log('Creating product tags...');
        
        foreach ($this->product_tags as $slug => $name) {
            $tag_id = $this->create_tag($name, $slug);
            
            if ($tag_id) {
                $this->created_tags[$slug] = $tag_id;
                $this->log("  - Created tag: $name (ID: $tag_id)");
            }
        }
        
        $total_tags = count($this->created_tags);
        $this->log("Created $total_tags tags total", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('tags', $total_tags);
        }
        
        return $this->created_tags;
    }
    
    /**
     * Create a single product tag
     * 
     * @param string $name Tag name
     * @param string $slug Tag slug
     * @return int|false Tag ID or false on failure
     */
    private function create_tag($name, $slug) {
        // Check if tag already exists
        $existing = get_term_by('slug', $slug, 'product_tag');
        
        if ($existing) {
            $this->log("    - Tag '$name' already exists (ID: {$existing->term_id})");
            return $existing->term_id;
        }
        
        // Create the tag
        $result = wp_insert_term(
            $name,
            'product_tag',
            [
                'slug' => $slug,
            ]
        );
        
        if (is_wp_error($result)) {
            $this->log("    - Failed to create tag '$name': " . $result->get_error_message(), 'error');
            return false;
        }
        
        return $result['term_id'];
    }
    
    /**
     * Get all created category IDs
     * 
     * @return array Array of category slug => ID
     */
    public function get_created_categories() {
        return $this->created_categories;
    }
    
    /**
     * Get all created tag IDs
     * 
     * @return array Array of tag slug => ID
     */
    public function get_created_tags() {
        return $this->created_tags;
    }
    
    /**
     * Get category hierarchy definition
     * 
     * @return array Category hierarchy
     */
    public function get_category_hierarchy() {
        return $this->category_hierarchy;
    }
    
    /**
     * Get product tags definition
     * 
     * @return array Product tags
     */
    public function get_product_tags() {
        return $this->product_tags;
    }
    
    /**
     * Get category info for verification
     * 
     * @return array Array of category data with hierarchy info
     */
    public function get_categories_info() {
        $categories = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ]);
        
        $info = [];
        
        if (!is_wp_error($categories)) {
            foreach ($categories as $category) {
                $info[$category->slug] = [
                    'id' => $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'parent_id' => $category->parent,
                    'description' => $category->description,
                    'count' => $category->count,
                ];
            }
        }
        
        return $info;
    }
    
    /**
     * Get tags info for verification
     * 
     * @return array Array of tag data
     */
    public function get_tags_info() {
        $tags = get_terms([
            'taxonomy' => 'product_tag',
            'hide_empty' => false,
        ]);
        
        $info = [];
        
        if (!is_wp_error($tags)) {
            foreach ($tags as $tag) {
                $info[$tag->slug] = [
                    'id' => $tag->term_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'count' => $tag->count,
                ];
            }
        }
        
        return $info;
    }
    
    /**
     * Verify category hierarchy integrity
     * 
     * Property 4: Category Hierarchy Integrity
     * For any child category created, it SHALL have a valid parent category reference.
     * 
     * @return array Verification results
     */
    public function verify_hierarchy_integrity() {
        $categories = $this->get_categories_info();
        $results = [
            'valid' => true,
            'total_categories' => count($categories),
            'parent_categories' => 0,
            'child_categories' => 0,
            'invalid_children' => [],
        ];
        
        foreach ($categories as $slug => $category) {
            if ($category['parent_id'] === 0) {
                $results['parent_categories']++;
            } else {
                $results['child_categories']++;
                
                // Verify parent exists
                $parent_exists = false;
                foreach ($categories as $potential_parent) {
                    if ($potential_parent['id'] === $category['parent_id']) {
                        $parent_exists = true;
                        break;
                    }
                }
                
                if (!$parent_exists) {
                    $results['valid'] = false;
                    $results['invalid_children'][] = [
                        'slug' => $slug,
                        'name' => $category['name'],
                        'invalid_parent_id' => $category['parent_id'],
                    ];
                }
            }
        }
        
        return $results;
    }
}
