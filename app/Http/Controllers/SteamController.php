<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SteamController extends Controller
{
    private string $apiKey;
    private string $baseUrl = 'https://api.steampowered.com';

    public function __construct()
    {
        $this->apiKey = env('STEAM_API_KEY');
    }

    /**
     * Resolve Steam ID from vanity URL or Steam ID
     */
    public function resolveSteamId(Request $request): JsonResponse
    {
        $identifier = $request->input('identifier');

        if (is_numeric($identifier) && strlen($identifier) === 17) {
            return response()->json(['steamId' => $identifier]);
        }

        $response = Http::get("$this->baseUrl/ISteamUser/ResolveVanityURL/v1/", [
            'key' => $this->apiKey,
            'vanityurl' => $identifier,
        ]);

        $data = $response->json();

        if ($data['response']['success'] === 1) {
            return response()->json(['steamId' => $data['response']['steamid']]);
        }

        return response()->json(['error' => 'Steam ID not found'], 404);
    }

    /**
     * Get player summary (profile information)
     */
    public function getPlayerSummary(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        $cacheKey = "steam_player_$steamId";

        $data = Cache::remember($cacheKey, 300, function () use ($steamId) {
            $response = Http::get("$this->baseUrl/ISteamUser/GetPlayerSummaries/v2/", [
                'key' => $this->apiKey,
                'steamids' => $steamId,
            ]);

            return $response->json();
        });

        if (empty($data['response']['players'])) {
            return response()->json(['error' => 'Player not found'], 404);
        }

        return response()->json($data['response']['players'][0]);
    }

    /**
     * Get owned games count and playtime
     */
    public function getOwnedGames(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        $cacheKey = "steam_games_$steamId";

        $data = Cache::remember($cacheKey, 300, function () use ($steamId) {
            $response = Http::get("$this->baseUrl/IPlayerService/GetOwnedGames/v1/", [
                'key' => $this->apiKey,
                'steamid' => $steamId,
                'include_appinfo' => 1,
                'include_played_free_games' => 1,
            ]);

            return $response->json();
        });

        if (!isset($data['response'])) {
            return response()->json(['error' => 'Games data not available'], 404);
        }

        return response()->json($data['response']);
    }

    /**
     * Get player achievements stats
     */
    public function getPlayerStats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        $cacheKey = "steam_stats_$steamId";

        $data = Cache::remember($cacheKey, 300, function () use ($steamId) {
            $badgesResponse = Http::get("$this->baseUrl/IPlayerService/GetBadges/v1/", [
                'key' => $this->apiKey,
                'steamid' => $steamId,
            ]);

            $badgesData = $badgesResponse->json();

            $levelResponse = Http::get("$this->baseUrl/IPlayerService/GetSteamLevel/v1/", [
                'key' => $this->apiKey,
                'steamid' => $steamId,
            ]);

            $levelData = $levelResponse->json();

            return [
                'badges' => $badgesData['response'] ?? [],
                'level' => $levelData['response']['player_level'] ?? 0,
            ];
        });

        return response()->json($data);
    }

    /**
     * Get recently played games
     */
    public function getRecentlyPlayedGames(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        $cacheKey = "steam_recent_$steamId";

        $data = Cache::remember($cacheKey, 300, function () use ($steamId) {
            $response = Http::get("$this->baseUrl/IPlayerService/GetRecentlyPlayedGames/v1/", [
                'key' => $this->apiKey,
                'steamid' => $steamId,
                'count' => 5,
            ]);

            return $response->json();
        });

        return response()->json($data['response'] ?? []);
    }

    /**
     * Get all player data for comparison
     */
    public function getPlayerData(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        if (!$steamId) {
            return response()->json(['error' => 'Steam ID required'], 400);
        }

        try {
            $summary = $this->getPlayerSummaryData($steamId);
            $games = $this->getOwnedGamesData($steamId);
            $stats = $this->getPlayerStatsData($steamId);
            $recent = $this->getRecentlyPlayedGamesData($steamId);

            $totalPlaytime = 0;
            if (isset($games['games'])) {
                foreach ($games['games'] as $game) {
                    $totalPlaytime += $game['playtime_forever'] ?? 0;
                }
            }

            $topGames = [];
            if (isset($games['games'])) {
                $sortedGames = $games['games'];
                usort($sortedGames, function ($a, $b) {
                    return ($b['playtime_forever'] ?? 0) - ($a['playtime_forever'] ?? 0);
                });
                $topGames = array_slice($sortedGames, 0, 5);
            }

            return response()->json([
                'steamId' => $steamId,
                'profile' => $summary,
                'stats' => [
                    'level' => $stats['level'] ?? 0,
                    'totalGames' => $games['game_count'] ?? 0,
                    'totalPlaytime' => $totalPlaytime,
                    'totalBadges' => count($stats['badges']['badges'] ?? []),
                    'perfectGames' => $this->countPerfectGames($stats['badges']['badges'] ?? []),
                ],
                'topGames' => $topGames,
                'recentGames' => $recent['games'] ?? [],
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => 'Failed to fetch player data: ' . $e->getMessage()], 500);
        }
    }

    private function getPlayerSummaryData($steamId)
    {
        $response = Http::get("$this->baseUrl/ISteamUser/GetPlayerSummaries/v2/", [
            'key' => $this->apiKey,
            'steamids' => $steamId,
        ]);

        $data = $response->json();
        return $data['response']['players'][0] ?? null;
    }

    private function getOwnedGamesData($steamId)
    {
        $response = Http::get("$this->baseUrl/IPlayerService/GetOwnedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'include_appinfo' => 1,
            'include_played_free_games' => 1,
        ]);

        return $response->json()['response'] ?? [];
    }

    private function getPlayerStatsData($steamId): array
    {
        $badgesResponse = Http::get("$this->baseUrl/IPlayerService/GetBadges/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
        ]);

        $levelResponse = Http::get("$this->baseUrl/IPlayerService/GetSteamLevel/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
        ]);

        return [
            'badges' => $badgesResponse->json()['response'] ?? [],
            'level' => $levelResponse->json()['response']['player_level'] ?? 0,
        ];
    }

    private function getRecentlyPlayedGamesData($steamId)
    {
        $response = Http::get("$this->baseUrl/IPlayerService/GetRecentlyPlayedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'count' => 5,
        ]);

        return $response->json()['response'] ?? [];
    }

    private function countPerfectGames($badges): int
    {
        $perfectGames = 0;
        foreach ($badges as $badge) {
            if (isset($badge['appid']) && $badge['appid'] > 0) {
                $perfectGames++;
            }
        }
        return $perfectGames;
    }

    /**
     * Get game-specific stats for a player
     */
    public function getGameStats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');
        $appId = $request->input('appId');

        if (!$steamId || !$appId) {
            return response()->json(['error' => 'Steam ID and App ID required'], 400);
        }

        $cacheKey = "steam_game_stats_{$steamId}_$appId";

        try {
            $data = Cache::remember($cacheKey, 300, function () use ($steamId, $appId) {
                $statsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetUserStatsForGame/v2/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                if ($statsResponse->failed()) {
                    return ['error' => 'Stats not available'];
                }

                $statsData = $statsResponse->json();

                $achievementsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetPlayerAchievements/v1/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                $achievementsData = $achievementsResponse->json();

                return [
                    'stats' => $statsData['playerstats'] ?? [],
                    'achievements' => $achievementsData['playerstats'] ?? [],
                ];
            });

            return response()->json($data);
        } catch (Exception) {
            return response()->json(['error' => 'Failed to fetch game stats'], 500);
        }
    }

    /**
     * Get CS2 specific stats
     */
    public function getCS2Stats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');

        if (!$steamId) {
            return response()->json(['error' => 'Steam ID required'], 400);
        }

        $cacheKey = "steam_cs2_stats_$steamId";

        try {
            $data = Cache::remember($cacheKey, 300, function () use ($steamId) {
                $appId = 730;

                $ownedGamesResponse = Http::get("$this->baseUrl/IPlayerService/GetOwnedGames/v1/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'include_appinfo' => 1,
                    'include_played_free_games' => 1,
                    'appids_filter' => [$appId],
                ]);

                $ownedGames = $ownedGamesResponse->json();

                if (!isset($ownedGames['response'])) {
                    return [
                        'error' => 'Game library is private. Please set "Game details" to Public in Steam Privacy Settings.',
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                if (empty($ownedGames['response']) ||
                    (is_array($ownedGames['response']) && count($ownedGames['response']) === 0)) {
                    return [
                        'error' => 'Game library is private. Your profile may be public, but "Game details" must also be set to Public in Privacy Settings.',
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                if (empty($ownedGames['response']['games'])) {
                    return [
                        'error' => 'Unable to access game library. Either CS2 is not owned or "Game details" are set to private.',
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                $gameInfo = $ownedGames['response']['games'][0];
                $playtime = $gameInfo['playtime_forever'] ?? 0;

                $statsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetUserStatsForGame/v2/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                $stats = [];
                $statsAvailable = false;

                if ($statsResponse->successful()) {
                    $statsData = $statsResponse->json();
                    if (isset($statsData['playerstats']['stats'])) {
                        $statsAvailable = true;
                        foreach ($statsData['playerstats']['stats'] as $stat) {
                            $stats[$stat['name']] = $stat['value'];
                        }
                    }
                }

                if (!$statsAvailable) {
                    return [
                        'error' => 'Game stats are private or not available',
                        'owns_game' => true,
                        'stats_private' => true,
                        'playtime' => $playtime,
                    ];
                }

                $achievementsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetPlayerAchievements/v1/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                $achievedCount = 0;
                $totalAchievements = 0;

                if ($achievementsResponse->successful()) {
                    $achievementsData = $achievementsResponse->json();
                    if (isset($achievementsData['playerstats']['achievements'])) {
                        $achievements = $achievementsData['playerstats']['achievements'];
                        $totalAchievements = count($achievements);
                        $achievedCount = count(array_filter($achievements, fn($a) => $a['achieved'] == 1));
                    }
                }

                return [
                    'owns_game' => true,
                    'playtime' => $playtime,
                    'achievements' => [
                        'total' => $totalAchievements,
                        'achieved' => $achievedCount,
                        'percentage' => $totalAchievements > 0 ? round(($achievedCount / $totalAchievements) * 100, 1) : 0,
                    ],
                    'stats' => [
                        'total_kills' => $stats['total_kills'] ?? 0,
                        'total_deaths' => $stats['total_deaths'] ?? 0,
                        'total_wins' => $stats['total_wins_comp'] ?? $stats['total_wins'] ?? 0,
                        'total_matches_played' => $stats['total_matches_played'] ?? 0,
                        'total_rounds_played' => $stats['total_rounds_played'] ?? 0,
                        'total_mvps' => $stats['total_mvps'] ?? 0,
                        'total_damage_done' => $stats['total_damage_done'] ?? 0,
                        'total_headshots' => $stats['total_kills_headshot'] ?? 0,
                        'total_shots_fired' => $stats['total_shots_fired'] ?? 0,
                        'total_shots_hit' => $stats['total_shots_hit'] ?? 0,
                        'kd_ratio' => ($stats['total_deaths'] ?? 0) > 0
                            ? round(($stats['total_kills'] ?? 0) / $stats['total_deaths'], 2)
                            : ($stats['total_kills'] ?? 0),
                        'headshot_percentage' => ($stats['total_kills'] ?? 0) > 0
                            ? round((($stats['total_kills_headshot'] ?? 0) / $stats['total_kills']) * 100, 1)
                            : 0,
                        'accuracy' => ($stats['total_shots_fired'] ?? 0) > 0
                            ? round((($stats['total_shots_hit'] ?? 0) / $stats['total_shots_fired']) * 100, 1)
                            : 0,
                    ],
                ];
            });

            return response()->json($data);
        } catch (Exception $e) {
            return response()->json(['error' => 'Failed to fetch CS2 stats: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get Dota 2 specific stats
     */
    public function getDota2Stats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');
        $appId = 570; // Dota 2 App ID

        return $this->getGenericGameStats($steamId, $appId, 'Dota 2', [
            'total_kills' => ['label' => 'Total Kills', 'format' => 'number'],
            'total_deaths' => ['label' => 'Total Deaths', 'format' => 'number'],
            'total_assists' => ['label' => 'Total Assists', 'format' => 'number'],
            'total_wins' => ['label' => 'Total Wins', 'format' => 'number'],
            'total_matches_played' => ['label' => 'Matches Played', 'format' => 'number'],
        ]);
    }

    /**
     * Get Team Fortress 2 specific stats
     */
    public function getTF2Stats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');
        $appId = 440; // TF2 App ID

        return $this->getGenericGameStats($steamId, $appId, 'Team Fortress 2', [
            'iNumberOfKills' => ['label' => 'Total Kills', 'format' => 'number'],
            'iNumberOfDeaths' => ['label' => 'Total Deaths', 'format' => 'number'],
            'iDamageDealt' => ['label' => 'Damage Dealt', 'format' => 'number'],
            'iPlayTime' => ['label' => 'Play Time (seconds)', 'format' => 'time'],
            'iPointsScored' => ['label' => 'Points Scored', 'format' => 'number'],
            'iDominationsCount' => ['label' => 'Dominations', 'format' => 'number'],
        ]);
    }

    /**
     * Get Left 4 Dead 2 specific stats
     */
    public function getL4D2Stats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');
        $appId = 550;

        return $this->getGenericGameStats($steamId, $appId, 'Left 4 Dead 2', [
            'NumKills' => ['label' => 'Total Kills', 'format' => 'number'],
            'NumHeadshots' => ['label' => 'Headshots', 'format' => 'number'],
            'NumMeleeKills' => ['label' => 'Melee Kills', 'format' => 'number'],
            'NumRevives' => ['label' => 'Revives', 'format' => 'number'],
            'NumCampaignsCompleted' => ['label' => 'Campaigns Completed', 'format' => 'number'],
        ]);
    }

    /**
     * Get Portal 2 specific stats
     */
    public function getPortal2Stats(Request $request): JsonResponse
    {
        $steamId = $request->input('steamId');
        $appId = 620;

        return $this->getGenericGameStats($steamId, $appId, 'Portal 2', [
            'NumPortalsPlaced' => ['label' => 'Portals Placed', 'format' => 'number'],
            'NumStepsTaken' => ['label' => 'Steps Taken', 'format' => 'number'],
            'NumSecondsToCompleteGame' => ['label' => 'Time to Complete', 'format' => 'time'],
            'NumGamesCompleted' => ['label' => 'Games Completed', 'format' => 'number'],
        ]);
    }

    /**
     * Generic method to get game stats
     */
    private function getGenericGameStats($steamId, $appId, $gameName, $statDefinitions): JsonResponse
    {
        if (!$steamId) {
            return response()->json(['error' => 'Steam ID required'], 400);
        }

        $cacheKey = "steam_game_{$appId}_stats_$steamId";

        try {
            $data = Cache::remember($cacheKey, 300, function () use ($steamId, $appId, $gameName, $statDefinitions) {
                $ownedGamesResponse = Http::get("$this->baseUrl/IPlayerService/GetOwnedGames/v1/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'include_appinfo' => 1,
                    'appids_filter' => [$appId],
                ]);

                $ownedGames = $ownedGamesResponse->json();

                if (!isset($ownedGames['response'])) {
                    return [
                        'error' => 'Game library is private. Please set "Game details" to Public in Steam Privacy Settings.',
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                if (empty($ownedGames['response']) ||
                    (is_array($ownedGames['response']) && count($ownedGames['response']) === 0)) {
                    return [
                        'error' => "Game library is private. Your profile may be public, but \"Game details\" must also be set to Public in Privacy Settings.",
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                if (empty($ownedGames['response']['games'])) {
                    return [
                        'error' => "Unable to access game library. Either $gameName is not owned or \"Game details\" are set to private.",
                        'owns_game' => false,
                        'privacy_issue' => true,
                    ];
                }

                $gameInfo = $ownedGames['response']['games'][0];
                $playtime = $gameInfo['playtime_forever'] ?? 0;

                $statsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetUserStatsForGame/v2/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                $stats = [];
                $statsAvailable = false;

                if ($statsResponse->successful()) {
                    $statsData = $statsResponse->json();
                    if (isset($statsData['playerstats']['stats'])) {
                        $statsAvailable = true;
                        foreach ($statsData['playerstats']['stats'] as $stat) {
                            $stats[$stat['name']] = $stat['value'];
                        }
                    }
                }

                if (!$statsAvailable) {
                    return [
                        'error' => 'Game stats are private or not available',
                        'owns_game' => true,
                        'stats_private' => true,
                        'playtime' => $playtime,
                    ];
                }

                $achievementsResponse = Http::get("$this->baseUrl/ISteamUserStats/GetPlayerAchievements/v1/", [
                    'key' => $this->apiKey,
                    'steamid' => $steamId,
                    'appid' => $appId,
                ]);

                $achievedCount = 0;
                $totalAchievements = 0;

                if ($achievementsResponse->successful()) {
                    $achievementsData = $achievementsResponse->json();
                    if (isset($achievementsData['playerstats']['achievements'])) {
                        $achievements = $achievementsData['playerstats']['achievements'];
                        $totalAchievements = count($achievements);
                        $achievedCount = count(array_filter($achievements, fn($a) => $a['achieved'] == 1));
                    }
                }

                $extractedStats = [];
                foreach ($statDefinitions as $statKey => $statInfo) {
                    $value = $stats[$statKey] ?? 0;
                    $extractedStats[$statKey] = $value;
                }

                return [
                    'owns_game' => true,
                    'playtime' => $playtime,
                    'game_name' => $gameName,
                    'app_id' => $appId,
                    'achievements' => [
                        'total' => $totalAchievements,
                        'achieved' => $achievedCount,
                        'percentage' => $totalAchievements > 0 ? round(($achievedCount / $totalAchievements) * 100, 1) : 0,
                    ],
                    'stats' => $extractedStats,
                    'stat_definitions' => $statDefinitions,
                ];
            });

            return response()->json($data);
        } catch (Exception $e) {
            return response()->json(['error' => "Failed to fetch $gameName stats: " . $e->getMessage()], 500);
        }
    }
}
