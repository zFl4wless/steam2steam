<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SteamController;

Route::get('/', function () {
    return Inertia::render('compare', []);
})->name('home');

// Debug route to test if Laravel is working
Route::get('api/test', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Laravel is working on Vercel!',
        'timestamp' => now()->toIso8601String(),
        'request_uri' => request()->getRequestUri(),
        'request_path' => request()->path(),
    ]);
});

// Steam API routes - use full path including 'api/'
Route::prefix('api/steam')->group(function () {
    Route::post('/resolve', [SteamController::class, 'resolveSteamId']);
    Route::get('/player', [SteamController::class, 'getPlayerData']);
    Route::get('/summary', [SteamController::class, 'getPlayerSummary']);
    Route::get('/games', [SteamController::class, 'getOwnedGames']);
    Route::get('/stats', [SteamController::class, 'getPlayerStats']);
    Route::get('/recent', [SteamController::class, 'getRecentlyPlayedGames']);
    Route::get('/game-stats', [SteamController::class, 'getGameStats']);

    Route::get('/cs2-stats', [SteamController::class, 'getCS2Stats']);
    Route::get('/dota2-stats', [SteamController::class, 'getDota2Stats']);
    Route::get('/tf2-stats', [SteamController::class, 'getTF2Stats']);
    Route::get('/l4d2-stats', [SteamController::class, 'getL4D2Stats']);
    Route::get('/portal2-stats', [SteamController::class, 'getPortal2Stats']);
});

