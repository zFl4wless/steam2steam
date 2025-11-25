<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Enable error reporting for debugging
if (getenv('APP_DEBUG') === 'true') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

define('LARAVEL_START', microtime(true));

// Determine the correct paths for Vercel serverless environment
// On Vercel, the structure is: /var/task/user/api/index.php
// So we need to go up one level to reach the app root
$basePath = realpath(__DIR__ . '/..');

// Debug output if path resolution fails
if (!$basePath || !file_exists($basePath . '/bootstrap/app.php')) {
    http_response_code(500);
    die(json_encode([
        'error' => 'Base path resolution failed',
        'attempted_base_path' => __DIR__ . '/..',
        'resolved_base_path' => $basePath,
        'current_dir' => __DIR__,
        'dir_exists' => is_dir(__DIR__ . '/..'),
        'bootstrap_exists' => file_exists(__DIR__ . '/../bootstrap/app.php'),
        'files_in_parent' => is_dir(__DIR__ . '/..') ? scandir(__DIR__ . '/..') : [],
    ]));
}

// Check if maintenance mode is active
if (file_exists($maintenance = $basePath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader
// Try api/vendor first (Vercel), then root vendor (fallback)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} elseif (file_exists($basePath . '/vendor/autoload.php')) {
    require $basePath . '/vendor/autoload.php';
} else {
    http_response_code(500);
    die(json_encode([
        'error' => 'Composer autoload not found',
        'checked_paths' => [
            __DIR__ . '/vendor/autoload.php',
            $basePath . '/vendor/autoload.php',
        ]
    ]));
}

// Bootstrap Laravel and handle the request
try {
    $bootstrapPath = $basePath . '/bootstrap/app.php';

    if (!file_exists($bootstrapPath)) {
        throw new \Exception("Bootstrap file not found at: $bootstrapPath");
    }

    // Set base path for Laravel before loading
    // This is critical for Vercel where the execution path differs from app structure
    $_ENV['APP_BASE_PATH'] = $basePath;

    /** @var Application $app */
    $app = require_once $bootstrapPath;

    // Ensure base path is set correctly
    $app->useBasePath($basePath);

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    http_response_code(500);
    if (getenv('APP_DEBUG') === 'true') {
        die(json_encode([
            'error' => 'Laravel bootstrap failed',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'base_path' => $basePath,
            'bootstrap_path' => $basePath . '/bootstrap/app.php',
            'bootstrap_exists' => file_exists($basePath . '/bootstrap/app.php'),
            'trace' => explode("\n", $e->getTraceAsString())
        ]));
    } else {
        die(json_encode(['error' => 'Internal server error']));
    }
}
