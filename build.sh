#!/bin/bash

# Vercel Build Script
# This script runs during Vercel build process

echo "Starting Vercel build..."

# Install Composer dependencies
if [ -f composer.json ]; then
    echo "Installing Composer dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

# Install npm dependencies (Vercel handles this automatically)
echo "Installing npm dependencies..."
npm ci

# Build frontend assets
echo "Building frontend assets..."
npm run build

# Cache Laravel configuration (if artisan is available)
if [ -f artisan ]; then
    echo "Caching Laravel configuration..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

echo "Build completed!"

