# Demo CMS NextJS + WordPress Headless

Dự án e-commerce headless sử dụng NextJS làm frontend và WordPress + WooCommerce làm backend CMS.

## 🚀 Quick Start

### Yêu cầu
- Docker & Docker Compose
- Node.js 18+
- npm hoặc yarn

### 1. Clone và khởi động

```bash
# Clone project
git clone <repo-url>
cd demo-cms-nextjs

# Khởi động WordPress + MySQL
docker compose up -d

# Đợi containers khởi động (khoảng 1-2 phút)
docker compose ps
```

### 2. Cài đặt Plugins WordPress

```bash
# Cài WooCommerce (phiên bản tương thích với WP 6.4)
docker compose exec wordpress wp plugin install woocommerce --version=8.9.3 --activate --allow-root

# Cài các plugins khác
docker compose exec wordpress wp plugin install wp-graphql --activate --allow-root
docker compose exec wordpress wp plugin install jwt-authentication-for-wp-rest-api --activate --allow-root
docker compose exec wordpress wp plugin install advanced-custom-fields --activate --allow-root
docker compose exec wordpress wp plugin install wpgraphql-acf --activate --allow-root

# Cài WooGraphQL từ GitHub
docker compose exec wordpress wp plugin install https://github.com/wp-graphql/wp-graphql-woocommerce/releases/download/v0.19.0/wp-graphql-woocommerce.zip --activate --allow-root
```

### 3. Tạo dữ liệu mẫu

```bash
docker compose exec wordpress wp eval-file /var/www/html/scripts/generate-sample-data.php --allow-root
```

Script sẽ tạo:
- 34 sản phẩm (simple + variable)
- Categories và tags
- 8 customers
- 12 orders
- 35 reviews
- 15 blog posts
- Navigation menus

### 4. Cấu hình Frontend

```bash
cd frontend

# Copy file env
cp .env.local.example .env.local

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

### 5. Truy cập

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| WordPress Admin | http://localhost:8800/wp-admin |
| GraphQL Playground | http://localhost:8800/graphql |
| phpMyAdmin | http://localhost:8081 |

**WordPress Admin mặc định:**
- Username: `admin`
- Password: (được tạo khi cài đặt WordPress lần đầu)

## ⚙️ Cấu hình

### Environment Variables (Frontend)

Tạo file `frontend/.env.local`:

```env
# WordPress GraphQL endpoint
WORDPRESS_GRAPHQL_ENDPOINT=http://localhost:8800/graphql

# WordPress REST API
WORDPRESS_API_URL=http://localhost:8800/wp-json

# WordPress URL (cho authentication)
NEXT_PUBLIC_WORDPRESS_URL=http://localhost:8800

# Secret cho revalidation webhook (tối thiểu 32 ký tự)
REVALIDATE_SECRET=your-secret-key-at-least-32-characters-long

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# WooCommerce API Keys (cho đăng ký customer)
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx
```

### Lấy WooCommerce API Keys

1. Vào WordPress Admin > WooCommerce > Settings > Advanced > REST API
2. Click "Add Key"
3. Đặt tên, chọn User và Permissions (Read/Write)
4. Click "Generate API Key"
5. Copy Consumer Key và Consumer Secret vào `.env.local`

### JWT Authentication

Plugin JWT đã được cài. Để hoạt động, cần thêm vào `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-jwt-secret-key-minimum-32-characters-long');
define('JWT_AUTH_CORS_ENABLE', true);
```

## 📁 Cấu trúc Project

```
demo-cms-nextjs/
├── docker-compose.yml      # Docker configuration
├── frontend/               # NextJS frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities & API clients
│   └── .env.local         # Environment variables
└── wordpress/              # WordPress backend
    ├── plugins/           # Custom plugins
    ├── themes/            # Headless theme
    └── scripts/           # Setup & data scripts
```

## 🔧 Commands hữu ích

```bash
# Docker
docker compose up -d          # Khởi động
docker compose down           # Dừng
docker compose logs -f        # Xem logs
docker compose restart        # Restart

# WordPress CLI
docker compose exec wordpress wp plugin list --allow-root
docker compose exec wordpress wp user list --allow-root

# Reset sample data
docker compose exec wordpress wp option delete headless_sample_data_generated --allow-root
docker compose exec wordpress wp eval-file /var/www/html/scripts/generate-sample-data.php --allow-root

# Frontend
cd frontend
npm run dev                   # Development
npm run build                 # Production build
npm run lint                  # Lint check
```

## 🛒 Features

- **Products**: Simple & Variable products với attributes (Size, Color, Material)
- **Categories**: Hierarchical product categories
- **Cart**: Session-based cart với GraphQL mutations
- **Checkout**: COD, VNPay, MoMo payment gateways
- **Authentication**: JWT-based login/register
- **Blog**: Posts với categories và product linking
- **SEO**: Meta tags, JSON-LD structured data

## 📖 Documentation

- [WordPress Setup](wordpress/README.md)
- [GraphQL Setup](wordpress/GRAPHQL_SETUP.md)
- [Webhook Setup](wordpress/WEBHOOK_SETUP.md)

## 🐛 Troubleshooting

### Lỗi "hostname not configured" với images
Thêm domain vào `frontend/next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
  ],
}
```

### Lỗi PHP Deprecated dynamic properties
Đã được fix trong `wordpress/themes/headless-theme/inc/payment-gateways.php`

### WooCommerce yêu cầu WordPress 6.8+
Cài phiên bản WooCommerce cũ hơn: `--version=8.9.3`

### GraphQL endpoint không hoạt động
1. Kiểm tra WPGraphQL plugin đã active
2. Vào Settings > Permalinks > Save Changes để flush rewrite rules
