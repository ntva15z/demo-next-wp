<?php
/**
 * Menu Generator
 * 
 * Creates WordPress navigation menus:
 * - Primary Menu with links to main categories and blog
 * - Footer Menu with links to policy pages and contact
 * 
 * @package Headless_Theme
 * @requirements 10.1, 10.2, 10.3
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * MenuGenerator Class
 * 
 * Handles creation of WordPress navigation menus.
 */
class MenuGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Created menu IDs */
    private $created_menus = [];
    
    /** @var array Menu definitions */
    private $menu_definitions = [
        'primary' => [
            'name' => 'Primary Menu',
            'location' => 'primary',
            'description' => 'Main navigation menu with categories and blog link',
        ],
        'footer' => [
            'name' => 'Footer Menu',
            'location' => 'footer',
            'description' => 'Footer navigation with policy pages and contact',
        ],
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
     * Run all menu generation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting menu generation...');
        
        // Create Primary Menu
        $this->create_primary_menu();
        
        // Create Footer Menu
        $this->create_footer_menu();
        
        $this->log('Menu generation complete!', 'success');
        return true;
    }
    
    /**
     * Create Primary Menu
     * 
     * Requirements: 10.1 - Create a Primary Menu with links to main categories and pages
     * 
     * @return int|false Menu ID or false on failure
     */
    public function create_primary_menu() {
        $this->log('Creating Primary Menu...');
        
        $menu_name = $this->menu_definitions['primary']['name'];
        $menu_location = $this->menu_definitions['primary']['location'];
        
        // Check if menu already exists
        $existing_menu = wp_get_nav_menu_object($menu_name);
        
        if ($existing_menu) {
            $menu_id = $existing_menu->term_id;
            $this->log("  - Primary Menu already exists (ID: $menu_id)");
        } else {
            // Create the menu
            $menu_id = wp_create_nav_menu($menu_name);
            
            if (is_wp_error($menu_id)) {
                $this->log("  - Failed to create Primary Menu: " . $menu_id->get_error_message(), 'error');
                return false;
            }
            
            $this->log("  - Created Primary Menu (ID: $menu_id)");
        }
        
        $this->created_menus['primary'] = $menu_id;
        
        // Clear existing menu items if menu existed
        if ($existing_menu) {
            $this->clear_menu_items($menu_id);
        }
        
        // Add menu items
        $this->add_primary_menu_items($menu_id);
        
        // Assign menu to location
        $this->assign_menu_to_location($menu_id, $menu_location);
        
        if ($this->generator) {
            $this->generator->increment_summary('menus', 1);
        }
        
        return $menu_id;
    }
    
    /**
     * Add items to Primary Menu
     * 
     * @param int $menu_id Menu ID
     */
    private function add_primary_menu_items($menu_id) {
        $position = 0;
        
        // Add Home link
        $position++;
        $this->add_custom_link_item($menu_id, home_url('/'), 'Trang chủ', $position);
        
        // Add main product categories
        $main_categories = [
            'thoi-trang-nam' => 'Thời trang nam',
            'thoi-trang-nu' => 'Thời trang nữ',
            'phu-kien' => 'Phụ kiện',
        ];
        
        foreach ($main_categories as $slug => $name) {
            $position++;
            $category = get_term_by('slug', $slug, 'product_cat');
            
            if ($category) {
                $this->add_taxonomy_item($menu_id, $category->term_id, 'product_cat', $position);
                $this->log("    - Added category: $name");
            } else {
                // Add as custom link if category doesn't exist
                $this->add_custom_link_item($menu_id, home_url("/category/$slug"), $name, $position);
                $this->log("    - Added custom link for: $name (category not found)");
            }
        }
        
        // Add Shop link
        $position++;
        $shop_page_id = wc_get_page_id('shop');
        if ($shop_page_id > 0) {
            $this->add_page_item($menu_id, $shop_page_id, $position);
            $this->log("    - Added Shop page");
        } else {
            $this->add_custom_link_item($menu_id, home_url('/shop'), 'Cửa hàng', $position);
            $this->log("    - Added custom Shop link");
        }
        
        // Add Blog/Tin tức link
        $position++;
        $blog_category = get_term_by('slug', 'tin-tuc', 'category');
        if ($blog_category) {
            $this->add_taxonomy_item($menu_id, $blog_category->term_id, 'category', $position);
            $this->log("    - Added blog category: Tin tức");
        } else {
            $this->add_custom_link_item($menu_id, home_url('/blog'), 'Tin tức', $position);
            $this->log("    - Added custom Blog link");
        }
        
        $this->log("  - Added " . $position . " items to Primary Menu", 'success');
    }

    
    /**
     * Create Footer Menu
     * 
     * Requirements: 10.2 - Create a Footer Menu with links to policy pages and contact
     * 
     * @return int|false Menu ID or false on failure
     */
    public function create_footer_menu() {
        $this->log('Creating Footer Menu...');
        
        $menu_name = $this->menu_definitions['footer']['name'];
        $menu_location = $this->menu_definitions['footer']['location'];
        
        // Check if menu already exists
        $existing_menu = wp_get_nav_menu_object($menu_name);
        
        if ($existing_menu) {
            $menu_id = $existing_menu->term_id;
            $this->log("  - Footer Menu already exists (ID: $menu_id)");
        } else {
            // Create the menu
            $menu_id = wp_create_nav_menu($menu_name);
            
            if (is_wp_error($menu_id)) {
                $this->log("  - Failed to create Footer Menu: " . $menu_id->get_error_message(), 'error');
                return false;
            }
            
            $this->log("  - Created Footer Menu (ID: $menu_id)");
        }
        
        $this->created_menus['footer'] = $menu_id;
        
        // Clear existing menu items if menu existed
        if ($existing_menu) {
            $this->clear_menu_items($menu_id);
        }
        
        // Add menu items
        $this->add_footer_menu_items($menu_id);
        
        // Assign menu to location
        $this->assign_menu_to_location($menu_id, $menu_location);
        
        if ($this->generator) {
            $this->generator->increment_summary('menus', 1);
        }
        
        return $menu_id;
    }
    
    /**
     * Add items to Footer Menu
     * 
     * @param int $menu_id Menu ID
     */
    private function add_footer_menu_items($menu_id) {
        $position = 0;
        
        // Policy pages to look for
        $policy_pages = [
            'chinh-sach-bao-mat' => 'Chính sách bảo mật',
            'dieu-khoan-su-dung' => 'Điều khoản sử dụng',
            'chinh-sach-doi-tra' => 'Chính sách đổi trả',
            'chinh-sach-van-chuyen' => 'Chính sách vận chuyển',
        ];
        
        foreach ($policy_pages as $slug => $title) {
            $position++;
            $page = get_page_by_path($slug);
            
            if ($page) {
                $this->add_page_item($menu_id, $page->ID, $position);
                $this->log("    - Added page: $title");
            } else {
                // Add as custom link placeholder
                $this->add_custom_link_item($menu_id, home_url("/$slug"), $title, $position);
                $this->log("    - Added custom link for: $title (page not found)");
            }
        }
        
        // Add Contact link
        $position++;
        $contact_page = get_page_by_path('lien-he');
        if (!$contact_page) {
            $contact_page = get_page_by_path('contact');
        }
        
        if ($contact_page) {
            $this->add_page_item($menu_id, $contact_page->ID, $position);
            $this->log("    - Added Contact page");
        } else {
            $this->add_custom_link_item($menu_id, home_url('/lien-he'), 'Liên hệ', $position);
            $this->log("    - Added custom Contact link");
        }
        
        $this->log("  - Added " . $position . " items to Footer Menu", 'success');
    }
    
    /**
     * Clear all items from a menu
     * 
     * @param int $menu_id Menu ID
     */
    private function clear_menu_items($menu_id) {
        $menu_items = wp_get_nav_menu_items($menu_id);
        
        if ($menu_items) {
            foreach ($menu_items as $item) {
                wp_delete_post($item->ID, true);
            }
            $this->log("    - Cleared existing menu items");
        }
    }
    
    /**
     * Add a custom link item to menu
     * 
     * @param int $menu_id Menu ID
     * @param string $url Link URL
     * @param string $title Link title
     * @param int $position Menu position
     * @param int $parent_id Parent menu item ID (0 for top-level)
     * @return int|false Menu item ID or false on failure
     */
    private function add_custom_link_item($menu_id, $url, $title, $position, $parent_id = 0) {
        $item_id = wp_update_nav_menu_item($menu_id, 0, [
            'menu-item-title' => $title,
            'menu-item-url' => $url,
            'menu-item-status' => 'publish',
            'menu-item-type' => 'custom',
            'menu-item-position' => $position,
            'menu-item-parent-id' => $parent_id,
        ]);
        
        if (is_wp_error($item_id)) {
            $this->log("      - Failed to add menu item '$title': " . $item_id->get_error_message(), 'error');
            return false;
        }
        
        return $item_id;
    }
    
    /**
     * Add a taxonomy term item to menu
     * 
     * @param int $menu_id Menu ID
     * @param int $term_id Term ID
     * @param string $taxonomy Taxonomy name
     * @param int $position Menu position
     * @param int $parent_id Parent menu item ID (0 for top-level)
     * @return int|false Menu item ID or false on failure
     */
    private function add_taxonomy_item($menu_id, $term_id, $taxonomy, $position, $parent_id = 0) {
        $term = get_term($term_id, $taxonomy);
        
        if (!$term || is_wp_error($term)) {
            return false;
        }
        
        $item_id = wp_update_nav_menu_item($menu_id, 0, [
            'menu-item-title' => $term->name,
            'menu-item-object' => $taxonomy,
            'menu-item-object-id' => $term_id,
            'menu-item-type' => 'taxonomy',
            'menu-item-status' => 'publish',
            'menu-item-position' => $position,
            'menu-item-parent-id' => $parent_id,
        ]);
        
        if (is_wp_error($item_id)) {
            $this->log("      - Failed to add taxonomy item: " . $item_id->get_error_message(), 'error');
            return false;
        }
        
        return $item_id;
    }
    
    /**
     * Add a page item to menu
     * 
     * @param int $menu_id Menu ID
     * @param int $page_id Page ID
     * @param int $position Menu position
     * @param int $parent_id Parent menu item ID (0 for top-level)
     * @return int|false Menu item ID or false on failure
     */
    private function add_page_item($menu_id, $page_id, $position, $parent_id = 0) {
        $page = get_post($page_id);
        
        if (!$page) {
            return false;
        }
        
        $item_id = wp_update_nav_menu_item($menu_id, 0, [
            'menu-item-title' => $page->post_title,
            'menu-item-object' => 'page',
            'menu-item-object-id' => $page_id,
            'menu-item-type' => 'post_type',
            'menu-item-status' => 'publish',
            'menu-item-position' => $position,
            'menu-item-parent-id' => $parent_id,
        ]);
        
        if (is_wp_error($item_id)) {
            $this->log("      - Failed to add page item: " . $item_id->get_error_message(), 'error');
            return false;
        }
        
        return $item_id;
    }

    
    /**
     * Assign menu to a theme location
     * 
     * Requirements: 10.3 - Register menus in the correct WordPress menu locations
     * 
     * @param int $menu_id Menu ID
     * @param string $location Theme location name
     * @return bool True on success
     */
    private function assign_menu_to_location($menu_id, $location) {
        // Get current menu locations
        $locations = get_theme_mod('nav_menu_locations', []);
        
        // Assign menu to location
        $locations[$location] = $menu_id;
        
        // Save the updated locations
        set_theme_mod('nav_menu_locations', $locations);
        
        $this->log("    - Assigned menu to location: $location");
        
        return true;
    }
    
    /**
     * Get all created menu IDs
     * 
     * @return array Array of menu key => ID
     */
    public function get_created_menus() {
        return $this->created_menus;
    }
    
    /**
     * Get menu definitions
     * 
     * @return array Menu definitions
     */
    public function get_menu_definitions() {
        return $this->menu_definitions;
    }
    
    /**
     * Get registered menu locations
     * 
     * @return array Registered menu locations
     */
    public function get_registered_locations() {
        return get_registered_nav_menus();
    }
    
    /**
     * Get current menu location assignments
     * 
     * @return array Menu location assignments
     */
    public function get_menu_location_assignments() {
        return get_theme_mod('nav_menu_locations', []);
    }
    
    /**
     * Verify menu location assignments
     * 
     * Property 10: Menu Location Assignment
     * For any menu created, it SHALL be assigned to a valid registered menu location.
     * 
     * @return array Verification results
     */
    public function verify_menu_locations() {
        $registered_locations = $this->get_registered_locations();
        $assigned_locations = $this->get_menu_location_assignments();
        
        $results = [
            'valid' => true,
            'registered_locations' => array_keys($registered_locations),
            'menus_checked' => [],
            'invalid_assignments' => [],
        ];
        
        // Check each menu we created
        foreach ($this->menu_definitions as $key => $definition) {
            $location = $definition['location'];
            $menu_name = $definition['name'];
            
            // Check if location is registered
            $location_registered = isset($registered_locations[$location]);
            
            // Check if menu is assigned to this location
            $menu_assigned = isset($assigned_locations[$location]) && $assigned_locations[$location] > 0;
            
            // Get the actual menu object if assigned
            $assigned_menu = null;
            if ($menu_assigned) {
                $assigned_menu = wp_get_nav_menu_object($assigned_locations[$location]);
            }
            
            $menu_check = [
                'menu_name' => $menu_name,
                'location' => $location,
                'location_registered' => $location_registered,
                'menu_assigned' => $menu_assigned,
                'assigned_menu_id' => $menu_assigned ? $assigned_locations[$location] : null,
                'assigned_menu_name' => $assigned_menu ? $assigned_menu->name : null,
            ];
            
            $results['menus_checked'][] = $menu_check;
            
            // Mark as invalid if location not registered or menu not assigned
            if (!$location_registered) {
                $results['valid'] = false;
                $results['invalid_assignments'][] = [
                    'menu' => $menu_name,
                    'location' => $location,
                    'reason' => 'Location not registered in theme',
                ];
            } elseif (!$menu_assigned) {
                $results['valid'] = false;
                $results['invalid_assignments'][] = [
                    'menu' => $menu_name,
                    'location' => $location,
                    'reason' => 'Menu not assigned to location',
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Get menu statistics for verification
     * 
     * @return array Menu statistics
     */
    public function get_menu_stats() {
        $stats = [
            'total_menus' => 0,
            'menus_with_items' => 0,
            'menus_assigned_to_locations' => 0,
            'menu_details' => [],
        ];
        
        $assigned_locations = $this->get_menu_location_assignments();
        
        foreach ($this->menu_definitions as $key => $definition) {
            $menu = wp_get_nav_menu_object($definition['name']);
            
            if ($menu) {
                $stats['total_menus']++;
                
                $items = wp_get_nav_menu_items($menu->term_id);
                $item_count = $items ? count($items) : 0;
                
                if ($item_count > 0) {
                    $stats['menus_with_items']++;
                }
                
                $is_assigned = isset($assigned_locations[$definition['location']]) 
                    && $assigned_locations[$definition['location']] == $menu->term_id;
                
                if ($is_assigned) {
                    $stats['menus_assigned_to_locations']++;
                }
                
                $stats['menu_details'][$key] = [
                    'id' => $menu->term_id,
                    'name' => $menu->name,
                    'item_count' => $item_count,
                    'location' => $definition['location'],
                    'is_assigned' => $is_assigned,
                ];
            }
        }
        
        return $stats;
    }
    
    /**
     * Get all menus with their items for testing
     * 
     * @return array Array of menus with items
     */
    public function get_all_menus_with_items() {
        $menus_data = [];
        
        foreach ($this->menu_definitions as $key => $definition) {
            $menu = wp_get_nav_menu_object($definition['name']);
            
            if ($menu) {
                $items = wp_get_nav_menu_items($menu->term_id);
                
                $menus_data[$key] = [
                    'id' => $menu->term_id,
                    'name' => $menu->name,
                    'location' => $definition['location'],
                    'items' => [],
                ];
                
                if ($items) {
                    foreach ($items as $item) {
                        $menus_data[$key]['items'][] = [
                            'id' => $item->ID,
                            'title' => $item->title,
                            'url' => $item->url,
                            'type' => $item->type,
                            'object' => $item->object,
                            'object_id' => $item->object_id,
                            'parent_id' => $item->menu_item_parent,
                        ];
                    }
                }
            }
        }
        
        return $menus_data;
    }
}
