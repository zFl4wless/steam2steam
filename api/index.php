<?php

use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Http\Kernel as KernelContract;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Exceptions\Handler;
use Illuminate\Foundation\Http\Kernel as KernelFoundation;
use Illuminate\Http\Request;

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
    // Create Laravel Application instance with explicit base path
    $app = new Application($basePath);

    // Bind important paths explicitly
    $app->useStoragePath($basePath . '/storage');
    $app->useBootstrapPath($basePath . '/bootstrap');
    $app->useDatabasePath($basePath . '/database');
    $app->useConfigPath($basePath . '/config');
    $app->useAppPath($basePath . '/app');
    $app->usePublicPath($basePath . '/public');

    // Register the kernel bindings (using Laravel's default kernels)
    $app->singleton(
        KernelContract::class,
        KernelFoundation::class
    );

    $app->singleton(
        KernelContract::class,
        KernelFoundation::class
    );

    $app->singleton(
        ExceptionHandler::class,
        Handler::class
    );

    // Load service providers from bootstrap/providers.php
    if (file_exists($basePath . '/bootstrap/providers.php')) {
        $providers = require $basePath . '/bootstrap/providers.php';
        foreach ($providers as $provider) {
            $app->register($provider);
        }
    }

    // Manually load routes since we're not using bootstrap/app.php
    $app->booted(function () use ($basePath) {
        require $basePath . '/routes/web.php';
    });

    // Get the kernel and handle the request
    $kernel = $app->make(KernelContract::class);

    $response = $kernel->handle(
        $request = Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);

} catch (Throwable $e) {
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
