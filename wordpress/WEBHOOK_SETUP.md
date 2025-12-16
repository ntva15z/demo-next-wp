# WordPress Webhook Configuration Guide

This guide explains how to configure WordPress webhooks to trigger on-demand revalidation in the NextJS frontend when content is updated.

## Overview

When content is published or updated in WordPress, a webhook is sent to the NextJS application's `/api/revalidate` endpoint. This triggers cache invalidation for the affected content, ensuring visitors see the latest content without waiting for the ISR (Incremental Static Regeneration) timer.

## Prerequisites

1. **WP Webhooks Plugin** installed and activated
   - Download: https://wordpress.org/plugins/wp-webhooks/
   - Alternative: WP Webhooks Pro for advanced features

2. **NextJS Application** running with the revalidation API route configured

3. **REVALIDATE_SECRET** environment variable set in both WordPress and NextJS

## Step 1: Install WP Webhooks Plugin

### Via WP-CLI
```bash
docker-compose exec wordpress wp plugin install wp-webhooks --activate --allow-root
```

### Via WordPress Admin
1. Go to **Plugins > Add New**
2. Search for "WP Webhooks"
3. Click **Install Now** then **Activate**

## Step 2: Configure Environment Variables

### NextJS (.env.local)
```env
REVALIDATE_SECRET=your-secure-secret-key-minimum-32-characters
```

### WordPress (wp-config.php or environment)
Store the same secret for use in webhook configuration.

## Step 3: Create Webhooks

Navigate to **WP Webhooks > Send Data** in WordPress admin.

### Webhook 1: Post Published/Updated

1. Click **Add Webhook**
2. Configure:
   - **Name**: `NextJS Revalidate Post`
   - **Webhook URL**: `http://your-nextjs-domain/api/revalidate`
   - **Trigger**: `post_update` (or `publish_post`)

3. Click **Settings** (gear icon) and configure:
   - **Request Method**: POST
   - **Content Type**: application/json

4. Add Custom Headers:
   ```
   x-revalidate-secret: your-secure-secret-key-minimum-32-characters
   ```

5. Configure Request Body (JSON):
   ```json
   {
     "type": "post",
     "slug": "{post_name}"
   }
   ```

### Webhook 2: Page Published/Updated

1. Click **Add Webhook**
2. Configure:
   - **Name**: `NextJS Revalidate Page`
   - **Webhook URL**: `http://your-nextjs-domain/api/revalidate`
   - **Trigger**: `post_update` with post type filter for `page`

3. Configure same headers as above

4. Configure Request Body (JSON):
   ```json
   {
     "type": "page",
     "slug": "{post_name}"
   }
   ```

### Webhook 3: Menu Updated

1. Click **Add Webhook**
2. Configure:
   - **Name**: `NextJS Revalidate Menu`
   - **Webhook URL**: `http://your-nextjs-domain/api/revalidate`
   - **Trigger**: `wp_update_nav_menu`

3. Configure same headers as above

4. Configure Request Body (JSON):
   ```json
   {
     "type": "menu"
   }
   ```

## Step 4: Test Webhooks

### Using WP Webhooks Test Feature

1. Go to **WP Webhooks > Send Data**
2. Find your webhook and click **Send Demo**
3. Check the response status

### Manual Testing with cURL

```bash
# Test post revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secure-secret-key-minimum-32-characters" \
  -d '{"type": "post", "slug": "hello-world"}'

# Test page revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secure-secret-key-minimum-32-characters" \
  -d '{"type": "page", "slug": "about"}'

# Test menu revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secure-secret-key-minimum-32-characters" \
  -d '{"type": "menu"}'

# Test full revalidation
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secure-secret-key-minimum-32-characters" \
  -d '{"type": "all"}'
```

### Expected Responses

**Success (200)**:
```json
{
  "revalidated": true,
  "type": "post",
  "slug": "hello-world",
  "timestamp": 1702656000000
}
```

**Invalid Secret (401)**:
```json
{
  "message": "Invalid secret"
}
```

**Invalid Content Type (400)**:
```json
{
  "message": "Invalid content type: invalid"
}
```

## API Reference

### Endpoint
```
POST /api/revalidate
```

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `x-revalidate-secret` | Yes | Secret key for authentication |
| `Content-Type` | Yes | Must be `application/json` |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Content type: `post`, `page`, `menu`, or `all` |
| `slug` | string | No | Content slug (required for specific post/page revalidation) |

### Content Type Behavior

| Type | Tags Revalidated | Paths Revalidated |
|------|------------------|-------------------|
| `post` | `posts`, `post-{slug}` | `/blog`, `/blog/{slug}` |
| `page` | `pages`, `page-{slug}` | `/{slug}` |
| `menu` | `menu` | None |
| `all` | `posts`, `pages`, `menu` | None |

## Alternative: Custom WordPress Plugin

For more control, you can create a custom WordPress plugin:

```php
<?php
/**
 * Plugin Name: NextJS Revalidation
 * Description: Triggers NextJS revalidation on content updates
 */

define('NEXTJS_REVALIDATE_URL', 'http://localhost:3000/api/revalidate');
define('NEXTJS_REVALIDATE_SECRET', 'your-secure-secret-key-minimum-32-characters');

function trigger_nextjs_revalidation($type, $slug = null) {
    $body = ['type' => $type];
    if ($slug) {
        $body['slug'] = $slug;
    }

    wp_remote_post(NEXTJS_REVALIDATE_URL, [
        'headers' => [
            'Content-Type' => 'application/json',
            'x-revalidate-secret' => NEXTJS_REVALIDATE_SECRET,
        ],
        'body' => json_encode($body),
        'timeout' => 10,
    ]);
}

// Trigger on post save
add_action('save_post', function($post_id, $post) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }

    if ($post->post_status !== 'publish') {
        return;
    }

    $type = $post->post_type === 'page' ? 'page' : 'post';
    trigger_nextjs_revalidation($type, $post->post_name);
}, 10, 2);

// Trigger on menu update
add_action('wp_update_nav_menu', function() {
    trigger_nextjs_revalidation('menu');
});
```

## Troubleshooting

### Webhook not triggering

1. **Check plugin activation**: Ensure WP Webhooks is activated
2. **Verify webhook status**: Check if webhook is enabled in WP Webhooks settings
3. **Check WordPress logs**: Enable `WP_DEBUG_LOG` to see errors

### 401 Unauthorized errors

1. **Verify secret**: Ensure the secret in WordPress matches NextJS `.env.local`
2. **Check header name**: Must be exactly `x-revalidate-secret`
3. **Check secret length**: Must be at least 32 characters

### Content not updating

1. **Check NextJS logs**: Look for revalidation messages in console
2. **Verify cache tags**: Ensure content is using correct cache tags
3. **Clear browser cache**: Hard refresh or use incognito mode

### Network errors

1. **Check URL**: Ensure NextJS URL is accessible from WordPress container
2. **Docker networking**: Use `host.docker.internal` for localhost in Docker
3. **Firewall**: Ensure port 3000 is accessible

## Production Considerations

1. **Use HTTPS**: Always use HTTPS in production for webhook URLs
2. **Strong secrets**: Generate cryptographically secure secrets
3. **Rate limiting**: Consider adding rate limiting to the revalidation endpoint
4. **Logging**: Implement proper logging for debugging
5. **Monitoring**: Set up alerts for failed revalidations
