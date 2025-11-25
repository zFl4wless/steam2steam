#!/bin/bash

# Vercel Build Script
set -e  # Exit on error

echo "==> Starting Vercel build..."

# Install Composer if not available
if ! command -v composer &> /dev/null; then
    echo "==> Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    COMPOSER_BIN="php composer.phar"
    echo "==> Composer installed successfully"
else
    COMPOSER_BIN="composer"
    echo "==> Composer already available"
fi

# Install Composer dependencies
echo "==> Installing Composer dependencies..."
$COMPOSER_BIN install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-reqs

# Install npm dependencies
echo "==> Installing npm dependencies..."
npm ci

# Build frontend assets
echo "==> Building frontend assets..."
npm run build

# Cache Laravel configuration (if artisan is available)
if [ -f artisan ]; then
    echo "==> Caching Laravel configuration..."
    php artisan config:cache || echo "Config cache failed (non-fatal)"
    php artisan route:cache || echo "Route cache failed (non-fatal)"
    php artisan view:cache || echo "View cache failed (non-fatal)"
fi

echo "==> Build completed successfully!"

