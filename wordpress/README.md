# WordPress Headless CMS Setup

This directory contains the WordPress Docker configuration for headless CMS usage with NextJS frontend.

## Quick Start

1. Start the Docker containers:
   ```bash
   docker-compose up -d
   ```

2. Access WordPress admin at: http://localhost:8800/wp-admin

3. Access phpMyAdmin at: http://localhost:8081

## Required Plugins

The following plugins must be installed and activated for the headless setup to work properly:

### 1. WPGraphQL (Required)
- **Purpose**: Provides GraphQL API endpoint for NextJS to fetch content
- **Download**: https://wordpress.org/plugins/wp-graphql/
- **Documentation**: https://www.wpgraphql.com/docs/introduction
- **GraphQL Endpoint**: `http://localhost:8800/graphql`

### 2. WPGraphQL for ACF (Required if using ACF)
- **Purpose**: Exposes Advanced Custom Fields data through GraphQL
- **Download**: https://github.com/wp-graphql/wpgraphql-acf
- **Documentation**: https://acf.wpgraphql.com/

### 3. Advanced Custom Fields (ACF) Pro (Recommended)
- **Purpose**: Create custom fields for posts and pages
- **Download**: https://www.advancedcustomfields.com/pro/
- **Note**: ACF Pro is a paid plugin. Free version available at wordpress.org

### 4. Yoast SEO (Recommended)
- **Purpose**: SEO optimization and meta tag management
- **Download**: https://wordpress.org/plugins/wordpress-seo/
- **Documentation**: https://yoast.com/help/

### 5. WPGraphQL Yoast SEO Addon (Required if using Yoast)
- **Purpose**: Exposes Yoast SEO data through GraphQL
- **Download**: https://github.com/developer-developer/wp-graphql-yoast-seo
- **Note**: Enables SEO fields in GraphQL queries

### 6. WP Webhooks (Recommended)
- **Purpose**: Trigger webhooks when content is published/updated
- **Download**: https://wordpress.org/plugins/wp-webhooks/
- **Configuration**: See "Webhook Setup" section below

## Plugin Installation

### Via WP-CLI (Recommended)

After starting Docker containers, run:

```bash
# Enter WordPress container
docker-compose exec wordpress bash

# Install and activate plugins
wp plugin install wp-graphql --activate --allow-root
wp plugin install wordpress-seo --activate --allow-root
wp plugin install wp-webhooks --activate --allow-root

# For WPGraphQL Yoast SEO (install from GitHub)
# Download and upload manually or use composer
```

### Via WordPress Admin

1. Go to **Plugins > Add New**
2. Search for each plugin
3. Click **Install Now** then **Activate**

## Headless Theme

The `headless-theme` is a minimal WordPress theme designed for headless usage:

- Redirects all frontend requests to NextJS application
- Enables CORS for GraphQL and REST API
- Registers navigation menus (Primary, Footer)
- Adds custom image sizes for responsive images
- Disables unnecessary frontend features

### Activating the Theme

```bash
docker-compose exec wordpress wp theme activate headless-theme --allow-root
```

Or via WordPress Admin: **Appearance > Themes > Headless Theme > Activate**

## Webhook Setup

To enable real-time content updates in NextJS, configure webhooks to trigger cache revalidation when content is published or updated.

> **📖 For detailed setup instructions, see [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md)**

### Quick Setup

1. Install and activate **WP Webhooks** plugin
2. Go to **WP Webhooks > Send Data**
3. Create webhooks for post, page, and menu updates

### Webhook Configuration Summary

| Event | Type | Endpoint |
|-------|------|----------|
| Post Published/Updated | `post` | `/api/revalidate` |
| Page Published/Updated | `page` | `/api/revalidate` |
| Menu Updated | `menu` | `/api/revalidate` |

### Required Headers
```
Content-Type: application/json
x-revalidate-secret: your-secret-key-minimum-32-characters
```

### Request Body Format
```json
{
  "type": "post",
  "slug": "{post_name}"
}
```

### Testing Webhooks
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secret-key" \
  -d '{"type": "post", "slug": "hello-world"}'
```

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| WORDPRESS_DB_HOST | db | MySQL host |
| WORDPRESS_DB_USER | wordpress | Database user |
| WORDPRESS_DB_PASSWORD | wordpress | Database password |
| WORDPRESS_DB_NAME | wordpress | Database name |
| WORDPRESS_DEBUG | 1 | Enable debug mode |

## Persistent Data

- **WordPress files**: Stored in `wordpress_data` Docker volume
- **Database**: Stored in `db_data` Docker volume
- **Plugins**: Mounted from `./wordpress/plugins`
- **Themes**: Mounted from `./wordpress/themes`

## Useful Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f wordpress

# Access WordPress container
docker-compose exec wordpress bash

# Run WP-CLI commands
docker-compose exec wordpress wp --allow-root <command>

# Reset database (WARNING: destroys all data)
docker-compose down -v
docker-compose up -d
```

## GraphQL Queries

Test GraphQL queries at: http://localhost:8800/graphql

### Example: Get Posts
```graphql
query GetPosts {
  posts(first: 10) {
    nodes {
      id
      title
      slug
      excerpt
      date
    }
  }
}
```

### Example: Get Menus
```graphql
query GetMenu {
  menuItems(where: { location: PRIMARY }) {
    nodes {
      id
      label
      url
      path
    }
  }
}
```

## Troubleshooting

### GraphQL endpoint not working
1. Ensure WPGraphQL plugin is activated
2. Check permalink settings: **Settings > Permalinks > Post name**
3. Flush rewrite rules: **Settings > Permalinks > Save Changes**

### CORS errors
1. Verify headless theme is activated
2. Check `HEADLESS_MODE_CLIENT_URL` in wp-config.php
3. Clear browser cache

### Database connection errors
1. Ensure MySQL container is running: `docker-compose ps`
2. Check database credentials in docker-compose.yml
3. Wait for MySQL to fully initialize (may take 30-60 seconds on first start)
