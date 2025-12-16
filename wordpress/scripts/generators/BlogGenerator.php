<?php
/**
 * Blog Generator
 * 
 * Creates WordPress blog posts with:
 * - Blog categories (Tin tức, Hướng dẫn, Đánh giá sản phẩm)
 * - 15+ blog posts distributed across categories
 * - Vietnamese content with headings and paragraphs
 * - Featured images
 * - Links to related products using ACF fields
 * 
 * @package Headless_Theme
 * @requirements 8.1, 8.2, 8.3, 8.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BlogGenerator Class
 * 
 * Handles creation of WordPress blog posts and categories.
 */
class BlogGenerator {
    
    /** @var SampleDataGenerator Reference to main generator for logging */
    private $generator;
    
    /** @var string Meta key used to mark sample data items */
    const SAMPLE_DATA_META_KEY = '_sample_data';
    
    /** @var array Blog category definitions */
    private $blog_categories = [
        'tin-tuc' => [
            'name' => 'Tin tức',
            'description' => 'Tin tức mới nhất về thời trang và xu hướng',
        ],
        'huong-dan' => [
            'name' => 'Hướng dẫn',
            'description' => 'Hướng dẫn chọn size, phối đồ và bảo quản quần áo',
        ],
        'danh-gia-san-pham' => [
            'name' => 'Đánh giá sản phẩm',
            'description' => 'Đánh giá chi tiết các sản phẩm thời trang',
        ],
    ];

    
    /** @var array Blog post definitions - Tin tức (News) */
    private $news_posts = [
        [
            'title' => 'Xu hướng thời trang mùa hè 2024 không thể bỏ qua',
            'content' => '<h2>Những xu hướng nổi bật nhất mùa hè năm nay</h2>
<p>Mùa hè 2024 đánh dấu sự trở lại của nhiều xu hướng thời trang độc đáo và mới mẻ. Từ những gam màu pastel nhẹ nhàng đến các thiết kế táo bạo, năm nay hứa hẹn sẽ là một mùa hè đầy màu sắc cho các tín đồ thời trang.</p>
<h3>1. Màu sắc chủ đạo</h3>
<p>Các gam màu như xanh mint, hồng coral và vàng chanh đang được ưa chuộng. Những màu sắc này không chỉ tươi mát mà còn dễ dàng phối hợp với nhiều trang phục khác nhau.</p>
<h3>2. Chất liệu thoáng mát</h3>
<p>Cotton và linen tiếp tục là lựa chọn hàng đầu cho mùa hè. Các chất liệu này giúp cơ thể thoáng mát và thoải mái trong những ngày nắng nóng.</p>
<h3>3. Phụ kiện nổi bật</h3>
<p>Túi xách cỡ lớn, kính mát oversized và sandal đế bệt là những phụ kiện không thể thiếu trong tủ đồ mùa hè của bạn.</p>',
        ],
        [
            'title' => 'Top 10 thương hiệu thời trang Việt Nam được yêu thích nhất',
            'content' => '<h2>Khám phá các thương hiệu thời trang Việt đang làm mưa làm gió</h2>
<p>Thời trang Việt Nam đang ngày càng khẳng định vị thế trên thị trường với nhiều thương hiệu chất lượng cao và thiết kế độc đáo.</p>
<h3>Sự phát triển của thời trang nội địa</h3>
<p>Trong những năm gần đây, người tiêu dùng Việt Nam ngày càng ưa chuộng các sản phẩm thời trang trong nước. Điều này không chỉ vì giá cả hợp lý mà còn vì chất lượng và thiết kế phù hợp với vóc dáng người Việt.</p>
<h3>Tiêu chí đánh giá</h3>
<p>Các thương hiệu được đánh giá dựa trên chất lượng sản phẩm, thiết kế, giá cả và dịch vụ khách hàng. Mỗi thương hiệu đều có những điểm mạnh riêng biệt.</p>',
        ],
        [
            'title' => 'Cập nhật: Các chương trình khuyến mãi tháng này',
            'content' => '<h2>Tổng hợp các chương trình ưu đãi hấp dẫn</h2>
<p>Tháng này, chúng tôi mang đến cho bạn nhiều chương trình khuyến mãi đặc biệt với mức giảm giá lên đến 50% cho các sản phẩm thời trang.</p>
<h3>Ưu đãi đặc biệt</h3>
<p>Giảm 30% cho tất cả sản phẩm áo thun nam nữ. Mua 2 tặng 1 cho các sản phẩm phụ kiện. Freeship cho đơn hàng từ 500.000đ.</p>
<h3>Thời gian áp dụng</h3>
<p>Chương trình khuyến mãi áp dụng từ ngày 1 đến ngày 30 trong tháng. Số lượng có hạn, nhanh tay đặt hàng ngay!</p>',
        ],
        [
            'title' => 'Thời trang công sở: Những quy tắc cần biết',
            'content' => '<h2>Hướng dẫn ăn mặc chuyên nghiệp nơi công sở</h2>
<p>Trang phục công sở không chỉ thể hiện sự chuyên nghiệp mà còn ảnh hưởng đến cách người khác nhìn nhận về bạn. Hãy cùng tìm hiểu những quy tắc cơ bản.</p>
<h3>Nguyên tắc cơ bản</h3>
<p>Luôn chọn trang phục gọn gàng, lịch sự. Tránh các màu sắc quá sặc sỡ hoặc họa tiết quá nổi bật. Ưu tiên các gam màu trung tính như đen, trắng, xám, navy.</p>
<h3>Phối đồ thông minh</h3>
<p>Một bộ suit đơn giản có thể biến hóa thành nhiều outfit khác nhau khi kết hợp với các phụ kiện phù hợp.</p>',
        ],
        [
            'title' => 'Bí quyết mua sắm online thông minh',
            'content' => '<h2>Làm sao để mua sắm online hiệu quả và tiết kiệm</h2>
<p>Mua sắm online ngày càng phổ biến, nhưng không phải ai cũng biết cách mua sắm thông minh. Dưới đây là một số bí quyết giúp bạn có trải nghiệm mua sắm tốt nhất.</p>
<h3>Kiểm tra kỹ thông tin sản phẩm</h3>
<p>Luôn đọc kỹ mô tả sản phẩm, xem bảng size và đọc đánh giá từ người mua trước. Điều này giúp bạn tránh mua phải sản phẩm không phù hợp.</p>
<h3>So sánh giá cả</h3>
<p>Đừng vội mua ngay khi thấy sản phẩm ưng ý. Hãy so sánh giá ở nhiều nơi để tìm được mức giá tốt nhất.</p>',
        ],
    ];

    
    /** @var array Blog post definitions - Hướng dẫn (Guides) */
    private $guide_posts = [
        [
            'title' => 'Hướng dẫn chọn size quần áo chuẩn nhất',
            'content' => '<h2>Cách đo và chọn size quần áo phù hợp với vóc dáng</h2>
<p>Việc chọn đúng size quần áo là yếu tố quan trọng để bạn luôn tự tin và thoải mái. Bài viết này sẽ hướng dẫn bạn cách đo và chọn size chuẩn nhất.</p>
<h3>Cách đo các số đo cơ thể</h3>
<p>Để có số đo chính xác, bạn cần một thước dây mềm. Đo vòng ngực ở phần đầy nhất, vòng eo ở phần nhỏ nhất, và vòng hông ở phần rộng nhất.</p>
<h3>Bảng quy đổi size</h3>
<p>Mỗi thương hiệu có thể có bảng size khác nhau. Luôn tham khảo bảng size của từng sản phẩm trước khi đặt hàng để đảm bảo chọn đúng size.</p>
<h3>Mẹo chọn size</h3>
<p>Nếu số đo của bạn nằm giữa hai size, hãy chọn size lớn hơn để thoải mái hơn khi mặc.</p>',
        ],
        [
            'title' => 'Cách bảo quản quần áo đúng cách',
            'content' => '<h2>Bí quyết giữ quần áo luôn như mới</h2>
<p>Bảo quản quần áo đúng cách không chỉ giúp quần áo bền đẹp hơn mà còn tiết kiệm chi phí mua sắm. Hãy cùng tìm hiểu những cách bảo quản hiệu quả.</p>
<h3>Giặt đúng cách</h3>
<p>Luôn đọc nhãn hướng dẫn giặt trên quần áo. Phân loại quần áo theo màu sắc và chất liệu trước khi giặt. Sử dụng nước lạnh hoặc ấm thay vì nước nóng.</p>
<h3>Phơi và sấy</h3>
<p>Tránh phơi quần áo dưới ánh nắng trực tiếp quá lâu để tránh phai màu. Với quần áo dễ nhăn, nên phơi trên móc áo.</p>
<h3>Cất giữ</h3>
<p>Gấp hoặc treo quần áo gọn gàng trong tủ. Sử dụng túi chống ẩm cho những vùng có độ ẩm cao.</p>',
        ],
        [
            'title' => 'Hướng dẫn phối đồ cho người mới bắt đầu',
            'content' => '<h2>Những nguyên tắc phối đồ cơ bản ai cũng nên biết</h2>
<p>Phối đồ là một nghệ thuật, nhưng với những nguyên tắc cơ bản, ai cũng có thể tạo ra những outfit đẹp mắt và phù hợp.</p>
<h3>Quy tắc màu sắc</h3>
<p>Bắt đầu với các màu trung tính như đen, trắng, xám, be. Sau đó thêm một điểm nhấn màu sắc để outfit thêm sinh động.</p>
<h3>Cân bằng tỷ lệ</h3>
<p>Nếu mặc áo rộng, hãy chọn quần ôm và ngược lại. Điều này giúp tạo sự cân đối cho tổng thể.</p>
<h3>Phụ kiện là chìa khóa</h3>
<p>Một chiếc túi xách, đồng hồ hay dây chuyền đơn giản có thể nâng tầm cả bộ outfit của bạn.</p>',
        ],
        [
            'title' => 'Cách chọn giày phù hợp với từng loại trang phục',
            'content' => '<h2>Hướng dẫn kết hợp giày dép với quần áo</h2>
<p>Giày dép là phụ kiện quan trọng có thể làm thay đổi hoàn toàn một bộ outfit. Hãy cùng tìm hiểu cách chọn giày phù hợp.</p>
<h3>Giày cho trang phục công sở</h3>
<p>Giày oxford, loafer hoặc giày cao gót mũi nhọn là lựa chọn hoàn hảo cho môi trường công sở. Ưu tiên các màu đen, nâu hoặc nude.</p>
<h3>Giày cho trang phục casual</h3>
<p>Sneaker, giày slip-on hoặc sandal là những lựa chọn thoải mái cho các hoạt động hàng ngày.</p>
<h3>Giày cho dịp đặc biệt</h3>
<p>Giày cao gót, giày da bóng hoặc giày có đính đá là lựa chọn phù hợp cho các buổi tiệc và sự kiện.</p>',
        ],
        [
            'title' => 'Mẹo mix đồ với quần jeans',
            'content' => '<h2>Biến hóa đa dạng với chiếc quần jeans yêu thích</h2>
<p>Quần jeans là item không thể thiếu trong tủ đồ của mọi người. Với một chiếc quần jeans, bạn có thể tạo ra vô số outfit khác nhau.</p>
<h3>Jeans với áo thun</h3>
<p>Sự kết hợp kinh điển và không bao giờ lỗi mốt. Thêm một chiếc áo khoác để hoàn thiện look.</p>
<h3>Jeans với áo sơ mi</h3>
<p>Tạo phong cách smart casual hoàn hảo. Có thể bỏ áo trong quần hoặc để ngoài tùy theo sở thích.</p>
<h3>Jeans với blazer</h3>
<p>Nâng tầm chiếc quần jeans lên một level mới với blazer. Phù hợp cho các buổi họp không quá formal.</p>',
        ],
    ];

    
    /** @var array Blog post definitions - Đánh giá sản phẩm (Product Reviews) */
    private $review_posts = [
        [
            'title' => 'Review: Áo thun nam basic cotton - Có đáng mua?',
            'content' => '<h2>Đánh giá chi tiết áo thun nam basic cotton</h2>
<p>Áo thun basic là item không thể thiếu trong tủ đồ của các chàng trai. Hôm nay chúng tôi sẽ review chi tiết sản phẩm áo thun nam basic cotton.</p>
<h3>Chất liệu</h3>
<p>Áo được làm từ 100% cotton, mềm mại và thoáng mát. Chất vải dày dặn vừa phải, không quá mỏng cũng không quá dày.</p>
<h3>Form dáng</h3>
<p>Form regular fit, không quá ôm cũng không quá rộng. Phù hợp với nhiều vóc dáng khác nhau.</p>
<h3>Đánh giá tổng thể</h3>
<p>Với mức giá hợp lý và chất lượng tốt, đây là sản phẩm đáng để đầu tư. Điểm: 4.5/5 sao.</p>',
            'link_products' => true,
        ],
        [
            'title' => 'So sánh: Quần jeans slim fit vs regular fit',
            'content' => '<h2>Nên chọn quần jeans slim fit hay regular fit?</h2>
<p>Hai kiểu dáng quần jeans phổ biến nhất hiện nay là slim fit và regular fit. Mỗi loại có những ưu nhược điểm riêng.</p>
<h3>Slim fit</h3>
<p>Ôm sát cơ thể, tôn dáng và trẻ trung. Phù hợp với người có vóc dáng thon gọn. Tuy nhiên có thể hơi bí khi ngồi lâu.</p>
<h3>Regular fit</h3>
<p>Thoải mái hơn, phù hợp với nhiều vóc dáng. Dễ phối đồ và phù hợp cho cả đi làm lẫn đi chơi.</p>
<h3>Kết luận</h3>
<p>Lựa chọn phụ thuộc vào sở thích cá nhân và mục đích sử dụng. Nên có cả hai loại trong tủ đồ để linh hoạt phối đồ.</p>',
            'link_products' => true,
        ],
        [
            'title' => 'Review: Túi xách nữ da PU cao cấp',
            'content' => '<h2>Đánh giá túi xách nữ da PU - Lựa chọn hoàn hảo cho phái đẹp</h2>
<p>Túi xách là phụ kiện không thể thiếu của phái đẹp. Hôm nay chúng tôi sẽ review chi tiết sản phẩm túi xách nữ da PU cao cấp.</p>
<h3>Chất liệu</h3>
<p>Da PU cao cấp, mềm mại và bền đẹp. Không bị bong tróc sau thời gian sử dụng. Dễ vệ sinh và bảo quản.</p>
<h3>Thiết kế</h3>
<p>Thiết kế thanh lịch, nhiều ngăn tiện dụng. Quai đeo chắc chắn, có thể đeo vai hoặc xách tay.</p>
<h3>Đánh giá tổng thể</h3>
<p>Sản phẩm chất lượng tốt với giá cả phải chăng. Phù hợp cho cả đi làm và đi chơi. Điểm: 4/5 sao.</p>',
            'link_products' => true,
        ],
        [
            'title' => 'Top 5 sản phẩm bán chạy nhất tháng này',
            'content' => '<h2>Những sản phẩm được yêu thích nhất trong tháng</h2>
<p>Dựa trên số liệu bán hàng và đánh giá của khách hàng, chúng tôi tổng hợp top 5 sản phẩm bán chạy nhất tháng này.</p>
<h3>1. Áo thun nam basic</h3>
<p>Sản phẩm luôn nằm trong top bán chạy nhờ chất lượng tốt và giá cả hợp lý.</p>
<h3>2. Quần jeans nam slim fit</h3>
<p>Form dáng đẹp, dễ phối đồ là lý do sản phẩm này được nhiều người lựa chọn.</p>
<h3>3. Váy liền công sở</h3>
<p>Thiết kế thanh lịch, phù hợp cho môi trường công sở chuyên nghiệp.</p>
<h3>4. Giày sneaker nam trắng</h3>
<p>Item must-have cho các chàng trai yêu thích phong cách năng động.</p>
<h3>5. Túi xách nữ da PU</h3>
<p>Phụ kiện được các chị em săn đón nhờ thiết kế đẹp và giá cả phải chăng.</p>',
            'link_products' => true,
        ],
        [
            'title' => 'Review: Giày sneaker nam trắng - Đáng đồng tiền bát gạo',
            'content' => '<h2>Đánh giá chi tiết giày sneaker nam trắng</h2>
<p>Giày sneaker trắng là item không thể thiếu trong tủ giày của các chàng trai. Hãy cùng xem sản phẩm này có đáng mua không.</p>
<h3>Chất liệu</h3>
<p>Upper làm từ da tổng hợp cao cấp, đế cao su bền bỉ. Lót giày êm ái, thoáng khí.</p>
<h3>Thiết kế</h3>
<p>Thiết kế tối giản, dễ phối với nhiều loại trang phục. Màu trắng clean, dễ vệ sinh.</p>
<h3>Độ thoải mái</h3>
<p>Đế giày êm, đi cả ngày không mỏi chân. Form giày vừa vặn, không quá chật cũng không quá rộng.</p>
<h3>Đánh giá tổng thể</h3>
<p>Sản phẩm chất lượng tốt, đáng để đầu tư. Điểm: 4.5/5 sao.</p>',
            'link_products' => true,
        ],
    ];
    
    /** @var array Created category IDs */
    private $created_categories = [];
    
    /** @var array Created post IDs */
    private $created_posts = [];
    
    /** @var array Available product IDs for linking */
    private $product_ids = [];


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
     * Run all blog generation tasks
     * 
     * @return bool True on success
     */
    public function run() {
        $this->log('Starting blog generation...');
        
        // Load available products for linking
        $this->load_products();
        
        // Create blog categories
        $this->create_blog_categories();
        
        // Create blog posts
        $this->create_blog_posts();
        
        $this->log('Blog generation complete!', 'success');
        return true;
    }
    
    /**
     * Load available product IDs for linking
     */
    private function load_products() {
        if (!function_exists('wc_get_products')) {
            $this->log('WooCommerce not active, skipping product loading', 'warning');
            return;
        }
        
        // Get all sample products
        $products = wc_get_products([
            'limit' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
            'return' => 'ids',
        ]);
        
        $this->product_ids = $products;
        $this->log('Found ' . count($this->product_ids) . ' sample products for linking');
    }
    
    /**
     * Create blog categories
     * 
     * Requirements: 8.1 - Create at least 3 blog categories
     * 
     * @return array Array of created category IDs
     */
    public function create_blog_categories() {
        $this->log('Creating blog categories...');
        
        foreach ($this->blog_categories as $slug => $category_data) {
            $category_id = $this->create_category(
                $category_data['name'],
                $slug,
                $category_data['description']
            );
            
            if ($category_id) {
                $this->created_categories[$slug] = $category_id;
                $this->log("  - Created category: {$category_data['name']} (ID: $category_id)");
            }
        }
        
        $total_categories = count($this->created_categories);
        $this->log("Created $total_categories blog categories", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('blog_categories', $total_categories);
        }
        
        return $this->created_categories;
    }
    
    /**
     * Create a single blog category
     * 
     * @param string $name Category name
     * @param string $slug Category slug
     * @param string $description Category description
     * @return int|false Category ID or false on failure
     */
    private function create_category($name, $slug, $description = '') {
        // Check if category already exists
        $existing = get_term_by('slug', $slug, 'category');
        
        if ($existing) {
            $this->log("    - Category '$name' already exists (ID: {$existing->term_id})");
            return $existing->term_id;
        }
        
        // Create the category
        $result = wp_insert_term(
            $name,
            'category',
            [
                'slug' => $slug,
                'description' => $description,
            ]
        );
        
        if (is_wp_error($result)) {
            $this->log("    - Failed to create category '$name': " . $result->get_error_message(), 'error');
            return false;
        }
        
        return $result['term_id'];
    }

    
    /**
     * Create blog posts
     * 
     * Requirements: 8.2 - Create at least 15 blog posts distributed across categories
     * Requirements: 8.3 - Include featured images and formatted content with headings and paragraphs
     * 
     * @return array Array of created post IDs
     */
    public function create_blog_posts() {
        $this->log('Creating blog posts...');
        $created = [];
        
        // Create news posts (Tin tức)
        $news_category_id = isset($this->created_categories['tin-tuc']) 
            ? $this->created_categories['tin-tuc'] 
            : $this->get_or_create_category('tin-tuc');
        
        foreach ($this->news_posts as $index => $post_data) {
            $post_id = $this->create_post($post_data, $news_category_id, 'news', $index);
            if ($post_id) {
                $created[] = $post_id;
                $this->created_posts[] = $post_id;
            }
        }
        
        // Create guide posts (Hướng dẫn)
        $guide_category_id = isset($this->created_categories['huong-dan']) 
            ? $this->created_categories['huong-dan'] 
            : $this->get_or_create_category('huong-dan');
        
        foreach ($this->guide_posts as $index => $post_data) {
            $post_id = $this->create_post($post_data, $guide_category_id, 'guide', $index);
            if ($post_id) {
                $created[] = $post_id;
                $this->created_posts[] = $post_id;
            }
        }
        
        // Create review posts (Đánh giá sản phẩm)
        $review_category_id = isset($this->created_categories['danh-gia-san-pham']) 
            ? $this->created_categories['danh-gia-san-pham'] 
            : $this->get_or_create_category('danh-gia-san-pham');
        
        foreach ($this->review_posts as $index => $post_data) {
            $post_id = $this->create_post($post_data, $review_category_id, 'review', $index);
            if ($post_id) {
                $created[] = $post_id;
                $this->created_posts[] = $post_id;
                
                // Link to products if specified
                if (!empty($post_data['link_products']) && !empty($this->product_ids)) {
                    $this->link_post_to_products($post_id);
                }
            }
        }
        
        $count = count($created);
        $this->log("Created $count blog posts", 'success');
        
        if ($this->generator) {
            $this->generator->increment_summary('blog_posts', $count);
        }
        
        return $created;
    }
    
    /**
     * Get or create a category by slug
     * 
     * @param string $slug Category slug
     * @return int Category ID
     */
    private function get_or_create_category($slug) {
        $existing = get_term_by('slug', $slug, 'category');
        if ($existing) {
            return $existing->term_id;
        }
        
        // Create if not exists
        if (isset($this->blog_categories[$slug])) {
            return $this->create_category(
                $this->blog_categories[$slug]['name'],
                $slug,
                $this->blog_categories[$slug]['description']
            );
        }
        
        return 0;
    }
    
    /**
     * Create a single blog post
     * 
     * @param array $post_data Post data (title, content)
     * @param int $category_id Category ID
     * @param string $type Post type (news, guide, review)
     * @param int $index Post index for unique slug
     * @return int|false Post ID or false on failure
     */
    private function create_post($post_data, $category_id, $type, $index) {
        // Generate unique slug
        $slug = sanitize_title($post_data['title']);
        
        // Check if post already exists
        $existing = get_page_by_path($slug, OBJECT, 'post');
        if ($existing) {
            $this->log("    - Post '{$post_data['title']}' already exists (ID: {$existing->ID})");
            return $existing->ID;
        }
        
        // Create the post
        $post_args = [
            'post_title' => $post_data['title'],
            'post_content' => $post_data['content'],
            'post_status' => 'publish',
            'post_type' => 'post',
            'post_author' => 1, // Admin user
            'post_date' => $this->generate_random_date(),
            'post_category' => [$category_id],
        ];
        
        $post_id = wp_insert_post($post_args);
        
        if (is_wp_error($post_id)) {
            $this->log("    - Failed to create post '{$post_data['title']}': " . $post_id->get_error_message(), 'error');
            return false;
        }
        
        // Mark as sample data
        update_post_meta($post_id, self::SAMPLE_DATA_META_KEY, '1');
        
        // Add featured image
        $this->add_featured_image($post_id, $post_data['title'], $type, $index);
        
        $this->log("  - Created post: {$post_data['title']} (ID: $post_id)");
        
        return $post_id;
    }
    
    /**
     * Generate a random date within the last 90 days
     * 
     * @return string Date in MySQL format
     */
    private function generate_random_date() {
        $days_ago = rand(0, 90);
        $hours_ago = rand(0, 23);
        $minutes_ago = rand(0, 59);
        
        return date('Y-m-d H:i:s', strtotime("-$days_ago days -$hours_ago hours -$minutes_ago minutes"));
    }
    
    /**
     * Add featured image to post
     * 
     * Requirements: 8.3 - Include featured images
     * 
     * @param int $post_id Post ID
     * @param string $title Post title for alt text
     * @param string $type Post type for image seed
     * @param int $index Post index for unique image
     * @return int|false Attachment ID or false on failure
     */
    private function add_featured_image($post_id, $title, $type, $index) {
        // Use picsum.photos for placeholder images
        // Different seed based on type and index for variety
        $type_offset = [
            'news' => 1000,
            'guide' => 2000,
            'review' => 3000,
        ];
        $offset = isset($type_offset[$type]) ? $type_offset[$type] : 0;
        $image_seed = $offset + $index;
        $image_url = "https://picsum.photos/seed/blog{$image_seed}/1200/630";
        
        // Download and attach image
        $attachment_id = $this->upload_image_from_url($image_url, $title);
        
        if ($attachment_id) {
            set_post_thumbnail($post_id, $attachment_id);
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
     * Link post to related products using ACF field
     * 
     * Requirements: 8.4 - Link relevant posts to related products using custom fields
     * 
     * @param int $post_id Post ID
     * @return bool True on success
     */
    private function link_post_to_products($post_id) {
        if (empty($this->product_ids)) {
            return false;
        }
        
        // Select 2-4 random products to link
        $num_products = rand(2, min(4, count($this->product_ids)));
        $random_keys = array_rand($this->product_ids, $num_products);
        
        if (!is_array($random_keys)) {
            $random_keys = [$random_keys];
        }
        
        $linked_products = [];
        foreach ($random_keys as $key) {
            $linked_products[] = $this->product_ids[$key];
        }
        
        // Try to use ACF if available
        if (function_exists('update_field')) {
            // ACF is available - use the related_products field
            update_field('related_products', $linked_products, $post_id);
            $this->log("    - Linked post #$post_id to " . count($linked_products) . " products via ACF");
        } else {
            // Fallback to post meta
            update_post_meta($post_id, 'related_products', $linked_products);
            $this->log("    - Linked post #$post_id to " . count($linked_products) . " products via post meta");
        }
        
        return true;
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
     * Get all created post IDs
     * 
     * @return array Array of post IDs
     */
    public function get_created_posts() {
        return $this->created_posts;
    }
    
    /**
     * Get blog category definitions
     * 
     * @return array Blog category definitions
     */
    public function get_blog_category_definitions() {
        return $this->blog_categories;
    }
    
    /**
     * Get all post definitions
     * 
     * @return array All post definitions
     */
    public function get_all_post_definitions() {
        return array_merge(
            $this->news_posts,
            $this->guide_posts,
            $this->review_posts
        );
    }
    
    /**
     * Get blog post statistics for verification
     * 
     * @return array Blog post statistics
     */
    public function get_blog_stats() {
        $stats = [
            'total_posts' => 0,
            'posts_with_featured_image' => 0,
            'posts_with_headings' => 0,
            'posts_by_category' => [],
            'posts_with_related_products' => 0,
        ];
        
        // Get all sample blog posts
        $posts = get_posts([
            'post_type' => 'post',
            'numberposts' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($posts as $post) {
            $stats['total_posts']++;
            
            // Check for featured image
            if (has_post_thumbnail($post->ID)) {
                $stats['posts_with_featured_image']++;
            }
            
            // Check for headings in content
            if (preg_match('/<h[1-6][^>]*>/i', $post->post_content)) {
                $stats['posts_with_headings']++;
            }
            
            // Count by category
            $categories = wp_get_post_categories($post->ID, ['fields' => 'slugs']);
            foreach ($categories as $cat_slug) {
                if (!isset($stats['posts_by_category'][$cat_slug])) {
                    $stats['posts_by_category'][$cat_slug] = 0;
                }
                $stats['posts_by_category'][$cat_slug]++;
            }
            
            // Check for related products
            $related = get_post_meta($post->ID, 'related_products', true);
            if (!empty($related)) {
                $stats['posts_with_related_products']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Get all sample blog posts with details
     * 
     * @return array Array of post data
     */
    public function get_sample_posts() {
        $posts_data = [];
        
        $posts = get_posts([
            'post_type' => 'post',
            'numberposts' => -1,
            'meta_key' => self::SAMPLE_DATA_META_KEY,
            'meta_value' => '1',
        ]);
        
        foreach ($posts as $post) {
            $categories = wp_get_post_categories($post->ID, ['fields' => 'all']);
            $category_names = array_map(function($cat) {
                return $cat->name;
            }, $categories);
            
            $posts_data[] = [
                'id' => $post->ID,
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'content' => $post->post_content,
                'has_featured_image' => has_post_thumbnail($post->ID),
                'has_headings' => (bool) preg_match('/<h[1-6][^>]*>/i', $post->post_content),
                'categories' => $category_names,
                'related_products' => get_post_meta($post->ID, 'related_products', true),
                'date' => $post->post_date,
            ];
        }
        
        return $posts_data;
    }
    
    /**
     * Verify blog data integrity
     * 
     * Property 8: Blog Post Content Structure
     * For any blog post created, it SHALL have a featured image AND content with at least one heading.
     * 
     * @return array Verification results
     */
    public function verify_blog_data() {
        $stats = $this->get_blog_stats();
        
        $results = [
            'valid' => true,
            'total_posts' => $stats['total_posts'],
            'meets_minimum' => $stats['total_posts'] >= 15,
            'all_have_featured_images' => $stats['posts_with_featured_image'] === $stats['total_posts'],
            'all_have_headings' => $stats['posts_with_headings'] === $stats['total_posts'],
            'has_all_categories' => count($stats['posts_by_category']) >= 3,
            'posts_by_category' => $stats['posts_by_category'],
            'issues' => [],
        ];
        
        if (!$results['meets_minimum']) {
            $results['valid'] = false;
            $results['issues'][] = "Only {$stats['total_posts']} posts created, minimum is 15";
        }
        
        if (!$results['all_have_featured_images']) {
            $results['valid'] = false;
            $missing = $stats['total_posts'] - $stats['posts_with_featured_image'];
            $results['issues'][] = "$missing posts are missing featured images";
        }
        
        if (!$results['all_have_headings']) {
            $results['valid'] = false;
            $missing = $stats['total_posts'] - $stats['posts_with_headings'];
            $results['issues'][] = "$missing posts are missing headings in content";
        }
        
        if (!$results['has_all_categories']) {
            $results['valid'] = false;
            $results['issues'][] = "Not all 3 required categories have posts";
        }
        
        return $results;
    }
}
