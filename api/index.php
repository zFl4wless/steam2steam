<?php

// Vercel Serverless Function Entry Point
// This file is the entry point for all HTTP requests on Vercel

// Include Composer autoloader - check api/vendor first, then root vendor
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} else {
    require __DIR__ . '/../vendor/autoload.php';
}

// Bootstrap Laravel application
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Handle the request
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);

