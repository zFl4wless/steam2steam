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
$basePath = __DIR__ . '/..';

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
    /** @var Application $app */
    $app = require_once $basePath . '/bootstrap/app.php';

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    http_response_code(500);
    if (getenv('APP_DEBUG') === 'true') {
        die(json_encode([
            'error' => 'Laravel bootstrap failed',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]));
    } else {
        die(json_encode(['error' => 'Internal server error']));
    }
}
