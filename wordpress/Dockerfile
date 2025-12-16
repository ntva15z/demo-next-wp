FROM wordpress:6.4-php8.2-apache

# Install system dependencies for PHP extensions
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions required for WooCommerce
# - gd: Image processing for product images
# - zip: Required for plugin/theme uploads
# - intl: Internationalization for currency/locale formatting
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    mysqli \
    pdo \
    pdo_mysql \
    gd \
    zip \
    intl

# Install WP-CLI for plugin management
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Create directory for WP-CLI cache
RUN mkdir -p /var/www/.wp-cli/cache \
    && chown -R www-data:www-data /var/www/.wp-cli

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Copy plugin installation script
COPY install-plugins.sh /usr/local/bin/install-plugins.sh
RUN chmod +x /usr/local/bin/install-plugins.sh

EXPOSE 80
