<?php
/**
 * Product Attribute Generator
 * 
 * Creates global product attributes for WooCommerce including:
 * - Size attribute with values: XS, S, M, L, XL, XXL
 * - Color attribute with 8+ colors
 * - Material attribute with 5+ materials
 * 
 * @package Headless_Theme
 * @requirements 4.1, 4.2, 4.3
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * AttributeGenerator Class
 * 
 * Handles creation of global product attributes for WooCommerce.
 */
class AttributeGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var array Size attribute values */
    private $size_values = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    /** @var array Color attribute values (Vietnamese) - 8+ colors */
    private $color_values = [
        'Đen',        // Black
        'Trắng',      // White
        'Xám',        // Gray
        'Đỏ',         // Red
        'Xanh navy',  // Navy blue
        'Xanh lá',    // Green
        'Vàng',       // Yellow
        'Hồng',       // Pink
        'Nâu',        // Brown
        'Be',         // Beige
    ];
    
    /** @var array Material attribute values - 5+ materials */
    private $material_values = [
        'Cotton',
        'Polyester',
        'Linen',
        'Denim',
        'Kaki',
        'Len',        // Wool
        'Lụa',        // Silk
    ];

    
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
     * Run all attribute creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting product attribute generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Create Size attribute
        $this->create_size_attribute();
        
        // Create Color attribute
        $this->create_color_attribute();
        
        // Create Material attribute
        $this->create_material_attribute();
        
        $this->log('Product attribute generation complete!', 'success');
        return true;
    }
    
    /**
     * Create Size attribute with values: XS, S, M, L, XL, XXL
     * 
     * Requirements: 4.1
     * 
     * @return int|false Attribute ID or false on failure
     */
    public function create_size_attribute() {
        $this->log('Creating Size attribute...');
        
        $attribute_id = $this->create_attribute('size', 'Kích thước', $this->size_values);
        
        if ($attribute_id) {
            $this->log('  - Size attribute created with ' . count($this->size_values) . ' values: ' . implode(', ', $this->size_values));
            if ($this->generator) {
                $this->generator->increment_summary('attributes', 1);
            }
            return $attribute_id;
        }
        
        return false;
    }
    
    /**
     * Create Color attribute with 8+ colors
     * 
     * Requirements: 4.2
     * 
     * @return int|false Attribute ID or false on failure
     */
    public function create_color_attribute() {
        $this->log('Creating Color attribute...');
        
        $attribute_id = $this->create_attribute('color', 'Màu sắc', $this->color_values);
        
        if ($attribute_id) {
            $this->log('  - Color attribute created with ' . count($this->color_values) . ' values: ' . implode(', ', $this->color_values));
            if ($this->generator) {
                $this->generator->increment_summary('attributes', 1);
            }
            return $attribute_id;
        }
        
        return false;
    }
    
    /**
     * Create Material attribute with 5+ materials
     * 
     * Requirements: 4.3
     * 
     * @return int|false Attribute ID or false on failure
     */
    public function create_material_attribute() {
        $this->log('Creating Material attribute...');
        
        $attribute_id = $this->create_attribute('material', 'Chất liệu', $this->material_values);
        
        if ($attribute_id) {
            $this->log('  - Material attribute created with ' . count($this->material_values) . ' values: ' . implode(', ', $this->material_values));
            if ($this->generator) {
                $this->generator->increment_summary('attributes', 1);
            }
            return $attribute_id;
        }
        
        return false;
    }

    
    /**
     * Create a global product attribute with terms
     * 
     * @param string $slug Attribute slug (e.g., 'size', 'color')
     * @param string $name Attribute display name
     * @param array $terms Array of term values to create
     * @return int|false Attribute ID or false on failure
     */
    private function create_attribute($slug, $name, $terms) {
        global $wpdb;
        
        // Check if attribute already exists
        $existing_id = wc_attribute_taxonomy_id_by_name($slug);
        
        if ($existing_id) {
            $this->log("  - Attribute '$name' already exists (ID: $existing_id)");
            // Still ensure all terms exist
            $this->create_attribute_terms($slug, $terms);
            return $existing_id;
        }
        
        // Create the attribute
        $attribute_data = array(
            'attribute_name'    => $slug,
            'attribute_label'   => $name,
            'attribute_type'    => 'select',
            'attribute_orderby' => 'menu_order',
            'attribute_public'  => 1,
        );
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'woocommerce_attribute_taxonomies',
            $attribute_data
        );
        
        if ($result === false) {
            $this->log("  - Failed to create attribute '$name'", 'error');
            return false;
        }
        
        $attribute_id = $wpdb->insert_id;
        
        // Clear attribute cache
        delete_transient('wc_attribute_taxonomies');
        
        // Register the taxonomy for this attribute
        $taxonomy_name = wc_attribute_taxonomy_name($slug);
        
        // Register taxonomy if not already registered
        if (!taxonomy_exists($taxonomy_name)) {
            register_taxonomy(
                $taxonomy_name,
                array('product'),
                array(
                    'labels' => array(
                        'name' => $name,
                    ),
                    'hierarchical' => false,
                    'show_ui' => true,
                    'query_var' => true,
                    'rewrite' => array('slug' => $slug),
                )
            );
        }
        
        // Create attribute terms
        $this->create_attribute_terms($slug, $terms);
        
        return $attribute_id;
    }
    
    /**
     * Create terms for an attribute taxonomy
     * 
     * @param string $attribute_slug Attribute slug
     * @param array $terms Array of term values
     * @return array Array of created term IDs
     */
    private function create_attribute_terms($attribute_slug, $terms) {
        $taxonomy_name = wc_attribute_taxonomy_name($attribute_slug);
        $created_terms = [];
        
        // Ensure taxonomy is registered
        if (!taxonomy_exists($taxonomy_name)) {
            // Get attribute label for registration
            $attribute_taxonomies = wc_get_attribute_taxonomies();
            $label = $attribute_slug;
            foreach ($attribute_taxonomies as $tax) {
                if ($tax->attribute_name === $attribute_slug) {
                    $label = $tax->attribute_label;
                    break;
                }
            }
            
            register_taxonomy(
                $taxonomy_name,
                array('product'),
                array(
                    'labels' => array('name' => $label),
                    'hierarchical' => false,
                    'show_ui' => true,
                    'query_var' => true,
                    'rewrite' => array('slug' => $attribute_slug),
                )
            );
        }
        
        foreach ($terms as $index => $term_name) {
            // Check if term already exists
            $existing_term = get_term_by('name', $term_name, $taxonomy_name);
            
            if ($existing_term) {
                $created_terms[] = $existing_term->term_id;
                continue;
            }
            
            // Create the term
            $term_slug = sanitize_title($term_name);
            $result = wp_insert_term(
                $term_name,
                $taxonomy_name,
                array(
                    'slug' => $term_slug,
                )
            );
            
            if (!is_wp_error($result)) {
                $created_terms[] = $result['term_id'];
                
                // Set term order
                update_term_meta($result['term_id'], 'order', $index);
            }
        }
        
        return $created_terms;
    }
    
    /**
     * Get all attribute data for verification
     * 
     * @return array Array of attribute data
     */
    public function get_attributes_info() {
        $attributes = wc_get_attribute_taxonomies();
        $info = [];
        
        foreach ($attributes as $attribute) {
            $taxonomy_name = wc_attribute_taxonomy_name($attribute->attribute_name);
            $terms = get_terms(array(
                'taxonomy' => $taxonomy_name,
                'hide_empty' => false,
            ));
            
            $term_names = [];
            if (!is_wp_error($terms)) {
                foreach ($terms as $term) {
                    $term_names[] = $term->name;
                }
            }
            
            $info[$attribute->attribute_name] = array(
                'id' => $attribute->attribute_id,
                'name' => $attribute->attribute_label,
                'slug' => $attribute->attribute_name,
                'type' => $attribute->attribute_type,
                'terms' => $term_names,
                'term_count' => count($term_names),
            );
        }
        
        return $info;
    }
    
    /**
     * Get size attribute values
     * 
     * @return array Size values
     */
    public function get_size_values() {
        return $this->size_values;
    }
    
    /**
     * Get color attribute values
     * 
     * @return array Color values
     */
    public function get_color_values() {
        return $this->color_values;
    }
    
    /**
     * Get material attribute values
     * 
     * @return array Material values
     */
    public function get_material_values() {
        return $this->material_values;
    }
}
