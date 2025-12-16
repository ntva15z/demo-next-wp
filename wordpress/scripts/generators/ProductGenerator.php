<?php
/**
 * Product Generator
 * 
 * Creates WooCommerce products including:
 * - Simple products (20+) with Vietnamese names
 * - Variable products (10+) with size and color variations
 * - Stock quantities and sale prices
 * - Product images from placeholder service
 * 
 * @package Headless_Theme
 * @requirements 2.1, 2.2, 2.3, 2.4, 3.3
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ProductGenerator Class
 * 
 * Handles creation of WooCommerce products with variations.
 */
class ProductGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Simple product definitions */
    private $simple_products = [
        // Áo nam (Men's tops)
        ['name' => 'Áo thun nam basic cotton', 'category' => 'ao-nam', 'tags' => ['basic', 'cotton', 'casual'], 'price_range' => [199000, 299000]],
        ['name' => 'Áo thun nam cổ tròn', 'category' => 'ao-nam', 'tags' => ['basic', 'casual'], 'price_range' => [179000, 249000]],
        ['name' => 'Áo polo nam cao cấp', 'category' => 'ao-nam', 'tags' => ['premium', 'formal'], 'price_range' => [399000, 599000]],
        ['name' => 'Áo sơ mi nam trắng', 'category' => 'ao-nam', 'tags' => ['formal', 'cotton'], 'price_range' => [449000, 699000]],
        ['name' => 'Áo sơ mi nam xanh navy', 'category' => 'ao-nam', 'tags' => ['formal', 'premium'], 'price_range' => [499000, 799000]],
        ['name' => 'Áo khoác bomber nam', 'category' => 'ao-nam', 'tags' => ['premium', 'winter'], 'price_range' => [799000, 1299000]],
        ['name' => 'Áo hoodie nam basic', 'category' => 'ao-nam', 'tags' => ['basic', 'casual', 'winter'], 'price_range' => [399000, 599000]],
        
        // Quần nam (Men's bottoms)
        ['name' => 'Quần jeans nam slim fit', 'category' => 'quan-nam', 'tags' => ['casual', 'bestseller'], 'price_range' => [499000, 799000]],
        ['name' => 'Quần kaki nam công sở', 'category' => 'quan-nam', 'tags' => ['formal', 'cotton'], 'price_range' => [399000, 599000]],
        ['name' => 'Quần short nam thể thao', 'category' => 'quan-nam', 'tags' => ['casual', 'summer'], 'price_range' => [249000, 399000]],
        
        // Áo nữ (Women's tops)
        ['name' => 'Áo thun nữ basic', 'category' => 'ao-nu', 'tags' => ['basic', 'cotton', 'casual'], 'price_range' => [179000, 279000]],
        ['name' => 'Áo kiểu nữ công sở', 'category' => 'ao-nu', 'tags' => ['formal', 'premium'], 'price_range' => [399000, 699000]],
        ['name' => 'Áo sơ mi nữ trắng', 'category' => 'ao-nu', 'tags' => ['formal', 'cotton'], 'price_range' => [399000, 599000]],
        ['name' => 'Áo croptop nữ', 'category' => 'ao-nu', 'tags' => ['casual', 'summer', 'new-arrival'], 'price_range' => [199000, 349000]],
        
        // Váy đầm (Dresses)
        ['name' => 'Váy liền công sở', 'category' => 'vay-dam', 'tags' => ['formal', 'premium'], 'price_range' => [599000, 999000]],
        ['name' => 'Đầm maxi dự tiệc', 'category' => 'vay-dam', 'tags' => ['premium', 'formal'], 'price_range' => [899000, 1499000]],
        ['name' => 'Váy ngắn casual', 'category' => 'vay-dam', 'tags' => ['casual', 'summer'], 'price_range' => [349000, 549000]],
        
        // Phụ kiện (Accessories)
        ['name' => 'Túi xách nữ da PU', 'category' => 'tui-xach', 'tags' => ['premium', 'bestseller'], 'price_range' => [499000, 899000]],
        ['name' => 'Balo laptop nam', 'category' => 'tui-xach', 'tags' => ['casual', 'basic'], 'price_range' => [399000, 699000]],
        ['name' => 'Ví da nam cao cấp', 'category' => 'tui-xach', 'tags' => ['premium', 'formal'], 'price_range' => [299000, 599000]],
        ['name' => 'Giày sneaker nam trắng', 'category' => 'giay-dep', 'tags' => ['casual', 'bestseller'], 'price_range' => [699000, 1199000]],
        ['name' => 'Giày cao gót nữ', 'category' => 'giay-dep', 'tags' => ['formal', 'premium'], 'price_range' => [499000, 899000]],
        ['name' => 'Dép sandal nữ', 'category' => 'giay-dep', 'tags' => ['casual', 'summer'], 'price_range' => [249000, 449000]],
    ];

    
    /** @var array Variable product definitions */
    private $variable_products = [
        ['name' => 'Áo thun nam phối màu', 'category' => 'ao-nam', 'tags' => ['casual', 'new-arrival'], 'base_price' => 299000, 'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['Đen', 'Trắng', 'Xám']],
        ['name' => 'Áo polo nam thể thao', 'category' => 'ao-nam', 'tags' => ['casual', 'summer'], 'base_price' => 399000, 'sizes' => ['M', 'L', 'XL', 'XXL'], 'colors' => ['Xanh navy', 'Đen', 'Trắng']],
        ['name' => 'Áo sơ mi nam Oxford', 'category' => 'ao-nam', 'tags' => ['formal', 'premium'], 'base_price' => 599000, 'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['Trắng', 'Xanh navy', 'Hồng']],
        ['name' => 'Quần jeans nam regular', 'category' => 'quan-nam', 'tags' => ['casual', 'bestseller'], 'base_price' => 599000, 'sizes' => ['29', '30', '31', '32', '33', '34'], 'colors' => ['Xanh navy', 'Đen']],
        ['name' => 'Quần kaki nam slim', 'category' => 'quan-nam', 'tags' => ['formal', 'cotton'], 'base_price' => 499000, 'sizes' => ['29', '30', '31', '32'], 'colors' => ['Be', 'Nâu', 'Xám']],
        ['name' => 'Áo thun nữ oversize', 'category' => 'ao-nu', 'tags' => ['casual', 'new-arrival'], 'base_price' => 249000, 'sizes' => ['S', 'M', 'L'], 'colors' => ['Đen', 'Trắng', 'Hồng', 'Vàng']],
        ['name' => 'Áo kiểu nữ tay phồng', 'category' => 'ao-nu', 'tags' => ['formal', 'premium'], 'base_price' => 449000, 'sizes' => ['S', 'M', 'L'], 'colors' => ['Trắng', 'Hồng', 'Xanh lá']],
        ['name' => 'Váy midi nữ xếp ly', 'category' => 'vay-dam', 'tags' => ['formal', 'new-arrival'], 'base_price' => 549000, 'sizes' => ['S', 'M', 'L'], 'colors' => ['Đen', 'Be', 'Nâu']],
        ['name' => 'Đầm suông công sở', 'category' => 'vay-dam', 'tags' => ['formal', 'premium'], 'base_price' => 699000, 'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['Đen', 'Xanh navy', 'Đỏ']],
        ['name' => 'Giày thể thao unisex', 'category' => 'giay-dep', 'tags' => ['casual', 'bestseller'], 'base_price' => 899000, 'sizes' => ['38', '39', '40', '41', '42', '43'], 'colors' => ['Đen', 'Trắng']],
        ['name' => 'Túi đeo chéo unisex', 'category' => 'tui-xach', 'tags' => ['casual', 'new-arrival'], 'base_price' => 349000, 'sizes' => ['One Size'], 'colors' => ['Đen', 'Nâu', 'Xám', 'Xanh navy']],
    ];
    
    /** @var array Vietnamese product descriptions */
    private $descriptions = [
        'ao' => 'Sản phẩm được làm từ chất liệu cao cấp, thoáng mát và thấm hút mồ hôi tốt. Thiết kế hiện đại, phù hợp với nhiều phong cách khác nhau. Dễ dàng phối đồ cho cả đi làm và đi chơi.',
        'quan' => 'Quần được may từ vải cao cấp, co giãn tốt và thoải mái khi vận động. Form dáng chuẩn, tôn lên vóc dáng người mặc. Phù hợp cho nhiều dịp khác nhau.',
        'vay' => 'Váy đầm thiết kế tinh tế, nữ tính và sang trọng. Chất liệu mềm mại, không nhăn và giữ form tốt. Phù hợp cho các buổi tiệc, đi làm hoặc dạo phố.',
        'phu_kien' => 'Phụ kiện thời trang cao cấp, thiết kế tinh xảo và bền đẹp. Chất liệu tốt, đường may tỉ mỉ. Phù hợp làm quà tặng hoặc sử dụng cá nhân.',
    ];
    
    /** @var array Short descriptions */
    private $short_descriptions = [
        'Chất liệu cao cấp, thoáng mát',
        'Thiết kế hiện đại, dễ phối đồ',
        'Form dáng chuẩn, tôn dáng',
        'Sản phẩm bán chạy nhất',
        'Mẫu mới nhất 2024',
        'Chất lượng đảm bảo',
    ];
    
    /** @var array Created product IDs */
    private $created_products = [];
    
    /** @var array Category cache */
    private $category_cache = [];
    
    /** @var array Tag cache */
    private $tag_cache = [];

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
     * Run all product creation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting product generation...');
        
        // Check WooCommerce is active
        if (!class_exists('WooCommerce')) {
            $this->log('WooCommerce is not active', 'error');
            return false;
        }
        
        // Cache categories and tags
        $this->cache_taxonomies();
        
        // Create simple products
        $this->create_simple_products();
        
        // Create variable products
        $this->create_variable_products();
        
        // Apply sale prices to 30%+ of products
        $this->apply_sale_prices();
        
        $this->log('Product generation complete!', 'success');
        return true;
    }

    
    /**
     * Cache categories and tags for faster lookup
     */
    private function cache_taxonomies() {
        // Cache categories
        $categories = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ]);
        
        if (!is_wp_error($categories)) {
            foreach ($categories as $category) {
                $this->category_cache[$category->slug] = $category->term_id;
            }
        }
        
        // Cache tags
        $tags = get_terms([
            'taxonomy' => 'product_tag',
            'hide_empty' => false,
        ]);
        
        if (!is_wp_error($tags)) {
            foreach ($tags as $tag) {
                $this->tag_cache[$tag->slug] = $tag->term_id;
            }
        }
        
        $this->log('Cached ' . count($this->category_cache) . ' categories and ' . count($this->tag_cache) . ' tags');
    }
    
    /**
     * Create simple products
     * 
     * Requirements: 2.1 - Create at least 20 simple products
     * Requirements: 3.3 - Assign each product to at least one category and one tag
     * 
     * @return array Array of created product IDs
     */
    public function create_simple_products() {
        $this->log('Creating simple products...');
        $created = [];
        
        foreach ($this->simple_products as $index => $product_data) {
            $product_id = $this->create_simple_product($product_data, $index);
            
            if ($product_id) {
                $created[] = $product_id;
                $this->created_products[] = $product_id;
                $this->log("  - Created simple product: {$product_data['name']} (ID: $product_id)");
            }
        }
        
        $count = count($created);
        $this->log("Created $count simple products", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('products_simple', $count);
        }
        
        return $created;
    }
    
    /**
     * Create a single simple product
     * 
     * @param array $data Product data
     * @param int $index Product index for SKU generation
     * @return int|false Product ID or false on failure
     */
    private function create_simple_product($data, $index) {
        // Check if product already exists by SKU
        $sku = 'SP-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
        $existing_id = wc_get_product_id_by_sku($sku);
        
        if ($existing_id) {
            $this->log("    - Product with SKU '$sku' already exists (ID: $existing_id)");
            return $existing_id;
        }
        
        // Create product
        $product = new WC_Product_Simple();
        
        // Basic info
        $product->set_name($data['name']);
        $product->set_sku($sku);
        $product->set_status('publish');
        $product->set_catalog_visibility('visible');
        
        // Price - random within range
        $price = rand($data['price_range'][0], $data['price_range'][1]);
        // Round to nearest 10000 VND
        $price = round($price / 10000) * 10000;
        $product->set_regular_price($price);
        
        // Stock - random between 0 and 100
        // Requirements: 2.3 - Assign random stock quantities between 0 and 100
        $stock = rand(0, 100);
        $product->set_manage_stock(true);
        $product->set_stock_quantity($stock);
        $product->set_stock_status($stock > 0 ? 'instock' : 'outofstock');
        
        // Description
        $description_key = $this->get_description_key($data['category']);
        $product->set_description($this->descriptions[$description_key]);
        $product->set_short_description($this->short_descriptions[array_rand($this->short_descriptions)]);
        
        // Save product first to get ID
        $product_id = $product->save();
        
        if (!$product_id) {
            $this->log("    - Failed to create product: {$data['name']}", 'error');
            return false;
        }
        
        // Mark as sample data
        update_post_meta($product_id, self::SAMPLE_DATA_META_KEY, '1');
        
        // Assign category
        if (isset($this->category_cache[$data['category']])) {
            wp_set_object_terms($product_id, [$this->category_cache[$data['category']]], 'product_cat');
        }
        
        // Assign tags
        $tag_ids = [];
        foreach ($data['tags'] as $tag_slug) {
            if (isset($this->tag_cache[$tag_slug])) {
                $tag_ids[] = $this->tag_cache[$tag_slug];
            }
        }
        if (!empty($tag_ids)) {
            wp_set_object_terms($product_id, $tag_ids, 'product_tag');
        }
        
        // Add product image
        $this->add_product_image($product_id, $data['name']);
        
        return $product_id;
    }
    
    /**
     * Get description key based on category
     * 
     * @param string $category Category slug
     * @return string Description key
     */
    private function get_description_key($category) {
        if (strpos($category, 'ao') !== false) {
            return 'ao';
        } elseif (strpos($category, 'quan') !== false) {
            return 'quan';
        } elseif (strpos($category, 'vay') !== false || strpos($category, 'dam') !== false) {
            return 'vay';
        } else {
            return 'phu_kien';
        }
    }

    
    /**
     * Create variable products with variations
     * 
     * Requirements: 2.2 - Create at least 10 variable products with size and color variations
     * 
     * @return array Array of created product IDs
     */
    public function create_variable_products() {
        $this->log('Creating variable products...');
        $created = [];
        
        foreach ($this->variable_products as $index => $product_data) {
            $product_id = $this->create_variable_product($product_data, $index);
            
            if ($product_id) {
                $created[] = $product_id;
                $this->created_products[] = $product_id;
                $this->log("  - Created variable product: {$product_data['name']} (ID: $product_id)");
            }
        }
        
        $count = count($created);
        $this->log("Created $count variable products", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('products_variable', $count);
        }
        
        return $created;
    }
    
    /**
     * Create a single variable product with variations
     * 
     * @param array $data Product data
     * @param int $index Product index for SKU generation
     * @return int|false Product ID or false on failure
     */
    private function create_variable_product($data, $index) {
        // Check if product already exists by SKU
        $sku = 'VP-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
        $existing_id = wc_get_product_id_by_sku($sku);
        
        if ($existing_id) {
            $this->log("    - Product with SKU '$sku' already exists (ID: $existing_id)");
            return $existing_id;
        }
        
        // Create variable product
        $product = new WC_Product_Variable();
        
        // Basic info
        $product->set_name($data['name']);
        $product->set_sku($sku);
        $product->set_status('publish');
        $product->set_catalog_visibility('visible');
        
        // Description
        $description_key = $this->get_description_key($data['category']);
        $product->set_description($this->descriptions[$description_key]);
        $product->set_short_description($this->short_descriptions[array_rand($this->short_descriptions)]);
        
        // Set up attributes for variations
        $attributes = [];
        
        // Size attribute
        if (!empty($data['sizes']) && $data['sizes'][0] !== 'One Size') {
            $size_attribute = new WC_Product_Attribute();
            $size_attribute->set_id(wc_attribute_taxonomy_id_by_name('size'));
            $size_attribute->set_name('pa_size');
            $size_attribute->set_options($data['sizes']);
            $size_attribute->set_position(0);
            $size_attribute->set_visible(true);
            $size_attribute->set_variation(true);
            $attributes[] = $size_attribute;
        }
        
        // Color attribute
        if (!empty($data['colors'])) {
            $color_attribute = new WC_Product_Attribute();
            $color_attribute->set_id(wc_attribute_taxonomy_id_by_name('color'));
            $color_attribute->set_name('pa_color');
            $color_attribute->set_options($data['colors']);
            $color_attribute->set_position(1);
            $color_attribute->set_visible(true);
            $color_attribute->set_variation(true);
            $attributes[] = $color_attribute;
        }
        
        $product->set_attributes($attributes);
        
        // Save product first to get ID
        $product_id = $product->save();
        
        if (!$product_id) {
            $this->log("    - Failed to create variable product: {$data['name']}", 'error');
            return false;
        }
        
        // Mark as sample data
        update_post_meta($product_id, self::SAMPLE_DATA_META_KEY, '1');
        
        // Assign category
        if (isset($this->category_cache[$data['category']])) {
            wp_set_object_terms($product_id, [$this->category_cache[$data['category']]], 'product_cat');
        }
        
        // Assign tags
        $tag_ids = [];
        foreach ($data['tags'] as $tag_slug) {
            if (isset($this->tag_cache[$tag_slug])) {
                $tag_ids[] = $this->tag_cache[$tag_slug];
            }
        }
        if (!empty($tag_ids)) {
            wp_set_object_terms($product_id, $tag_ids, 'product_tag');
        }
        
        // Create variations
        $variation_count = $this->create_product_variations($product_id, $data);
        
        if ($this->generator) {
            $this->generator->increment_summary('variations', $variation_count);
        }
        
        // Add product image
        $this->add_product_image($product_id, $data['name']);
        
        // Sync variable product data
        WC_Product_Variable::sync($product_id);
        
        return $product_id;
    }
    
    /**
     * Create variations for a variable product
     * 
     * @param int $product_id Parent product ID
     * @param array $data Product data with sizes and colors
     * @return int Number of variations created
     */
    private function create_product_variations($product_id, $data) {
        $variation_count = 0;
        $base_price = $data['base_price'];
        
        $sizes = $data['sizes'];
        $colors = $data['colors'];
        
        // Handle "One Size" products
        if (count($sizes) === 1 && $sizes[0] === 'One Size') {
            $sizes = [null]; // No size variation
        }
        
        foreach ($colors as $color) {
            foreach ($sizes as $size) {
                $variation = new WC_Product_Variation();
                $variation->set_parent_id($product_id);
                
                // Set attributes
                $attributes = [];
                if ($size !== null) {
                    $attributes['pa_size'] = sanitize_title($size);
                }
                $attributes['pa_color'] = sanitize_title($color);
                $variation->set_attributes($attributes);
                
                // Price with slight variation (+/- 10%)
                $price_variation = rand(-10, 10) / 100;
                $price = round($base_price * (1 + $price_variation) / 10000) * 10000;
                $variation->set_regular_price($price);
                
                // Stock - random between 0 and 100
                $stock = rand(0, 100);
                $variation->set_manage_stock(true);
                $variation->set_stock_quantity($stock);
                $variation->set_stock_status($stock > 0 ? 'instock' : 'outofstock');
                
                // SKU for variation
                $var_sku = wc_get_product($product_id)->get_sku() . '-' . sanitize_title($color);
                if ($size !== null) {
                    $var_sku .= '-' . sanitize_title($size);
                }
                $variation->set_sku($var_sku);
                
                $variation->save();
                $variation_count++;
            }
        }
        
        $this->log("    - Created $variation_count variations");
        return $variation_count;
    }

    
    /**
     * Apply sale prices to at least 30% of products
     * 
     * Requirements: 2.4 - Set sale prices for at least 30% of products
     * 
     * @return int Number of products with sale prices
     */
    public function apply_sale_prices() {
        $this->log('Applying sale prices...');
        
        // Get all products (both simple and variable)
        $all_products = wc_get_products([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        
        $total_products = count($all_products);
        $target_sale_count = ceil($total_products * 0.35); // 35% to ensure we meet 30% minimum
        
        // Shuffle and pick products for sale
        shuffle($all_products);
        $sale_products = array_slice($all_products, 0, $target_sale_count);
        
        $sale_count = 0;
        foreach ($sale_products as $product_id) {
            $product = wc_get_product($product_id);
            
            if (!$product) {
                continue;
            }
            
            if ($product->is_type('variable')) {
                // Apply sale to all variations
                $variations = $product->get_children();
                foreach ($variations as $variation_id) {
                    $variation = wc_get_product($variation_id);
                    if ($variation) {
                        $regular_price = $variation->get_regular_price();
                        if ($regular_price) {
                            // 10-30% discount
                            $discount = rand(10, 30) / 100;
                            $sale_price = round($regular_price * (1 - $discount) / 10000) * 10000;
                            $variation->set_sale_price($sale_price);
                            $variation->save();
                        }
                    }
                }
                // Sync variable product
                WC_Product_Variable::sync($product_id);
            } else {
                // Simple product
                $regular_price = $product->get_regular_price();
                if ($regular_price) {
                    // 10-30% discount
                    $discount = rand(10, 30) / 100;
                    $sale_price = round($regular_price * (1 - $discount) / 10000) * 10000;
                    $product->set_sale_price($sale_price);
                    $product->save();
                }
            }
            
            $sale_count++;
            $this->log("  - Applied sale price to: " . $product->get_name());
        }
        
        $percentage = round(($sale_count / $total_products) * 100);
        $this->log("Applied sale prices to $sale_count products ($percentage%)", 'success');
        
        return $sale_count;
    }
    
    /**
     * Add product image from placeholder service
     * 
     * Requirements: 2.1 - Products with images
     * 
     * @param int $product_id Product ID
     * @param string $product_name Product name for alt text
     * @return int|false Attachment ID or false on failure
     */
    private function add_product_image($product_id, $product_name) {
        // Use picsum.photos for placeholder images
        // Each product gets a unique image based on product ID
        $image_seed = $product_id + 100; // Offset to get different images
        $image_url = "https://picsum.photos/seed/{$image_seed}/800/800";
        
        // Download and attach image
        $attachment_id = $this->upload_image_from_url($image_url, $product_name);
        
        if ($attachment_id) {
            set_post_thumbnail($product_id, $attachment_id);
            
            // Add gallery images for variable products
            $product = wc_get_product($product_id);
            if ($product && $product->is_type('variable')) {
                $gallery_ids = [];
                for ($i = 1; $i <= 3; $i++) {
                    $gallery_seed = $product_id + 100 + ($i * 10);
                    $gallery_url = "https://picsum.photos/seed/{$gallery_seed}/800/800";
                    $gallery_id = $this->upload_image_from_url($gallery_url, $product_name . " - Image $i");
                    if ($gallery_id) {
                        $gallery_ids[] = $gallery_id;
                    }
                }
                if (!empty($gallery_ids)) {
                    $product->set_gallery_image_ids($gallery_ids);
                    $product->save();
                }
            }
            
            return $attachment_id;
        }
        
        return false;
    }
    
    /**
     * Upload image from URL to WordPress media library
     * 
     * @param string $url Image URL
     * @param string $title Image title
     * @return int|false Attachment ID or false on failure
     */
    private function upload_image_from_url($url, $title) {
        // Include required files
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        // Download file to temp location
        $tmp = download_url($url);
        
        if (is_wp_error($tmp)) {
            $this->log("    - Failed to download image: " . $tmp->get_error_message(), 'warning');
            return false;
        }
        
        // Prepare file array
        $file_array = [
            'name' => sanitize_file_name($title) . '.jpg',
            'tmp_name' => $tmp,
        ];
        
        // Upload to media library
        $attachment_id = media_handle_sideload($file_array, 0, $title);
        
        // Clean up temp file
        if (file_exists($tmp)) {
            @unlink($tmp);
        }
        
        if (is_wp_error($attachment_id)) {
            $this->log("    - Failed to upload image: " . $attachment_id->get_error_message(), 'warning');
            return false;
        }
        
        // Mark as sample data
        update_post_meta($attachment_id, self::SAMPLE_DATA_META_KEY, '1');
        
        return $attachment_id;
    }

    
    /**
     * Get all created product IDs
     * 
     * @return array Array of product IDs
     */
    public function get_created_products() {
        return $this->created_products;
    }
    
    /**
     * Get simple product definitions
     * 
     * @return array Simple product data
     */
    public function get_simple_product_definitions() {
        return $this->simple_products;
    }
    
    /**
     * Get variable product definitions
     * 
     * @return array Variable product data
     */
    public function get_variable_product_definitions() {
        return $this->variable_products;
    }
    
    /**
     * Get product statistics for verification
     * 
     * @return array Product statistics
     */
    public function get_product_stats() {
        $stats = [
            'simple_count' => 0,
            'variable_count' => 0,
            'total_count' => 0,
            'with_sale_price' => 0,
            'with_category' => 0,
            'with_tag' => 0,
            'stock_quantities' => [],
        ];
        
        // Get all sample products
        $products = wc_get_products([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($products as $product) {
            $stats['total_count']++;
            
            if ($product->is_type('simple')) {
                $stats['simple_count']++;
                $stats['stock_quantities'][] = $product->get_stock_quantity();
            } elseif ($product->is_type('variable')) {
                $stats['variable_count']++;
            }
            
            // Check for sale price
            if ($product->is_on_sale()) {
                $stats['with_sale_price']++;
            }
            
            // Check for category
            $categories = wp_get_object_terms($product->get_id(), 'product_cat');
            if (!empty($categories) && !is_wp_error($categories)) {
                $stats['with_category']++;
            }
            
            // Check for tags
            $tags = wp_get_object_terms($product->get_id(), 'product_tag');
            if (!empty($tags) && !is_wp_error($tags)) {
                $stats['with_tag']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Verify product properties
     * 
     * Property 1: Product Count Minimums (≥20 simple, ≥10 variable)
     * Property 2: Stock Quantity Range [0-100]
     * Property 3: Sale Price Distribution (≥30%)
     * Property 5: Product Category Assignment
     * 
     * @return array Verification results
     */
    public function verify_properties() {
        $stats = $this->get_product_stats();
        $results = [
            'property_1_product_counts' => [
                'valid' => $stats['simple_count'] >= 20 && $stats['variable_count'] >= 10,
                'simple_count' => $stats['simple_count'],
                'variable_count' => $stats['variable_count'],
                'simple_required' => 20,
                'variable_required' => 10,
            ],
            'property_2_stock_range' => [
                'valid' => true,
                'out_of_range' => [],
            ],
            'property_3_sale_distribution' => [
                'valid' => false,
                'sale_count' => $stats['with_sale_price'],
                'total_count' => $stats['total_count'],
                'percentage' => 0,
                'required_percentage' => 30,
            ],
            'property_5_category_assignment' => [
                'valid' => $stats['with_category'] === $stats['total_count'] && $stats['with_tag'] === $stats['total_count'],
                'with_category' => $stats['with_category'],
                'with_tag' => $stats['with_tag'],
                'total_count' => $stats['total_count'],
            ],
        ];
        
        // Check stock quantities
        foreach ($stats['stock_quantities'] as $stock) {
            if ($stock < 0 || $stock > 100) {
                $results['property_2_stock_range']['valid'] = false;
                $results['property_2_stock_range']['out_of_range'][] = $stock;
            }
        }
        
        // Calculate sale percentage
        if ($stats['total_count'] > 0) {
            $percentage = ($stats['with_sale_price'] / $stats['total_count']) * 100;
            $results['property_3_sale_distribution']['percentage'] = round($percentage, 2);
            $results['property_3_sale_distribution']['valid'] = $percentage >= 30;
        }
        
        return $results;
    }
}
