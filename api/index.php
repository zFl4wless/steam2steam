<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Enable error reporting for debugging
if (getenv('APP_DEBUG') === 'true') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

define('LARAVEL_START', microtime(true));

// Determine the correct paths for Vercel serverless environment
$basePath = realpath(__DIR__ . '/..');

if (!$basePath) {
    http_response_code(500);
    die(json_encode(['error' => 'Failed to resolve base path']));
}

// Change to base directory immediately
chdir($basePath);

// Check if maintenance mode is active
if (file_exists($maintenance = $basePath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} elseif (file_exists($basePath . '/vendor/autoload.php')) {
    require $basePath . '/vendor/autoload.php';
} else {
    http_response_code(500);
    die(json_encode(['error' => 'Composer autoload not found']));
}

// Bootstrap Laravel and handle the request
try {
    // Create Application instance directly with base path
    $app = new Application($basePath);

    // Register core bindings
    $app->singleton(
        \Illuminate\Contracts\Http\Kernel::class,
        \Illuminate\Foundation\Http\Kernel::class
    );

    $app->singleton(
        \Illuminate\Contracts\Console\Kernel::class,
        \Illuminate\Foundation\Console\Kernel::class
    );

    $app->singleton(
        \Illuminate\Contracts\Debug\ExceptionHandler::class,
        \Illuminate\Foundation\Exceptions\Handler::class
    );

    // Bootstrap the application
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

    $response = $kernel->handle(
        $request = Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);

} catch (\Throwable $e) {
    http_response_code(500);
    if (getenv('APP_DEBUG') === 'true') {
        die(json_encode([
            'error' => 'Laravel bootstrap failed',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'base_path' => $basePath,
            'current_working_dir' => getcwd(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], JSON_PRETTY_PRINT));
    } else {
        die(json_encode(['error' => 'Internal server error']));
    }
}
