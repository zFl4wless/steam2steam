import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import axios from '../lib/axios';
import { GenericGameTab } from './GenericGameTab';

export interface PlayerStats {
    level: number;
    totalGames: number;
    totalPlaytime: number;
    totalBadges: number;
    perfectGames: number;
}

interface PlayerProfile {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    timecreated?: number;
}

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url?: string;
}

export interface PlayerData {
    steamId: string;
    profile: PlayerProfile;
    stats: PlayerStats;
    topGames: Game[];
    recentGames: Game[];
}

interface CS2Stats {
    owns_game: boolean;
    playtime: number;
    stats_private?: boolean;
    privacy_issue?: boolean;
    error?: string;
    achievements: {
        total: number;
        achieved: number;
        percentage: number;
    };
    stats: {
        total_kills: number;
        total_deaths: number;
        total_wins: number;
        total_matches_played: number;
        total_rounds_played: number;
        total_mvps: number;
        total_damage_done: number;
        total_headshots: number;
        total_shots_fired: number;
        total_shots_hit: number;
        kd_ratio: number;
        headshot_percentage: number;
        accuracy: number;
    };
}

export interface GenericGameStats {
    owns_game: boolean;
    playtime: number;
    stats_private?: boolean;
    privacy_issue?: boolean;
    error?: string;
    game_name: string;
    app_id: number;
    achievements: {
        total: number;
        achieved: number;
        percentage: number;
    };
    stats: Record<string, number>;
    stat_definitions: Record<string, { label: string; format: string }>;
}

type TabType = 'overview' | 'cs2' | 'dota2' | 'tf2' | 'l4d2' | 'portal2';

export default function Compare() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [leftPlayer, setLeftPlayer] = useState<PlayerData | null>(null);
    const [rightPlayer, setRightPlayer] = useState<PlayerData | null>(null);
    const [leftCS2, setLeftCS2] = useState<CS2Stats | null>(null);
    const [rightCS2, setRightCS2] = useState<CS2Stats | null>(null);
    const [leftDota2, setLeftDota2] = useState<GenericGameStats | null>(null);
    const [rightDota2, setRightDota2] = useState<GenericGameStats | null>(null);
    const [leftTF2, setLeftTF2] = useState<GenericGameStats | null>(null);
    const [rightTF2, setRightTF2] = useState<GenericGameStats | null>(null);
    const [leftL4D2, setLeftL4D2] = useState<GenericGameStats | null>(null);
    const [rightL4D2, setRightL4D2] = useState<GenericGameStats | null>(null);
    const [leftPortal2, setLeftPortal2] = useState<GenericGameStats | null>(null);
    const [rightPortal2, setRightPortal2] = useState<GenericGameStats | null>(null);
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');
    const [leftLoading, setLeftLoading] = useState(false);
    const [rightLoading, setRightLoading] = useState(false);
    const [leftError, setLeftError] = useState('');
    const [rightError, setRightError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchCS2Stats = async (steamId: string, side: 'left' | 'right') => {
        const setCS2 = side === 'left' ? setLeftCS2 : setRightCS2;

        try {
            const cs2Response = await axios.get('/api/steam/cs2-stats', {
                params: { steamId },
            });

            // Always set the response data, even if it contains an error
            // This way the UI can show proper error messages instead of infinite loading
            setCS2(cs2Response.data);
        } catch (error) {
            // On network error, set a generic error response
            setCS2({
                owns_game: false,
                playtime: 0,
                error: 'Failed to fetch CS2 stats. Please try again.',
                achievements: { total: 0, achieved: 0, percentage: 0 },
                stats: {
                    total_kills: 0,
                    total_deaths: 0,
                    total_wins: 0,
                    total_matches_played: 0,
                    total_rounds_played: 0,
                    total_mvps: 0,
                    total_damage_done: 0,
                    total_headshots: 0,
                    total_shots_fired: 0,
                    total_shots_hit: 0,
                    kd_ratio: 0,
                    headshot_percentage: 0,
                    accuracy: 0,
                },
            });
        }
    };

    const fetchGameStats = async (steamId: string, side: 'left' | 'right', game: 'dota2' | 'tf2' | 'l4d2' | 'portal2') => {
        const setters = {
            dota2: { left: setLeftDota2, right: setRightDota2 },
            tf2: { left: setLeftTF2, right: setRightTF2 },
            l4d2: { left: setLeftL4D2, right: setRightL4D2 },
            portal2: { left: setLeftPortal2, right: setRightPortal2 },
        };

        const setStat = side === 'left' ? setters[game].left : setters[game].right;

        try {
            const response = await axios.get(`/api/steam/${game}-stats`, {
                params: { steamId },
            });

            // Always set the response data, even if it contains an error
            setStat(response.data);
        } catch (error) {
            // On network error, set a generic error response
            setStat({
                owns_game: false,
                playtime: 0,
                error: `Failed to fetch ${game.toUpperCase()} stats. Please try again.`,
                game_name: game,
                app_id: 0,
                achievements: { total: 0, achieved: 0, percentage: 0 },
                stats: {},
                stat_definitions: {},
            });
        }
    };

    const fetchPlayerData = useCallback(async (identifier: string, side: 'left' | 'right') => {
        const setLoading = side === 'left' ? setLeftLoading : setRightLoading;
        const setPlayer = side === 'left' ? setLeftPlayer : setRightPlayer;
        const setError = side === 'left' ? setLeftError : setRightError;
        const setCS2 = side === 'left' ? setLeftCS2 : setRightCS2;

        setLoading(true);
        setError('');

        try {
            // First resolve the Steam ID if needed
            const resolveResponse = await axios.post('/api/steam/resolve', {
                identifier: identifier,
            });

            const steamId = resolveResponse.data.steamId;

            // Then fetch all player data
            const playerResponse = await axios.get('/api/steam/player', {
                params: { steamId },
            });

            setPlayer(playerResponse.data);

            // Fetch game stats in background
            fetchCS2Stats(steamId, side);
            fetchGameStats(steamId, side, 'dota2');
            fetchGameStats(steamId, side, 'tf2');
            fetchGameStats(steamId, side, 'l4d2');
            fetchGameStats(steamId, side, 'portal2');
        } catch (error) {
            const errorMessage = error instanceof Error && 'response' in error
                ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to fetch player data')
                : 'Failed to fetch player data';
            setError(errorMessage);
            setPlayer(null);
            setCS2(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load players from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const player1 = params.get('player1');
        const player2 = params.get('player2');

        if (player1) {
            setLeftInput(player1);
            fetchPlayerData(player1, 'left');
        }
        if (player2) {
            setRightInput(player2);
            fetchPlayerData(player2, 'right');
        }
    }, [fetchPlayerData]);

    // Update URL when players change
    useEffect(() => {
        if (leftPlayer || rightPlayer) {
            const params = new URLSearchParams();
            if (leftPlayer) params.set('player1', leftPlayer.steamId);
            if (rightPlayer) params.set('player2', rightPlayer.steamId);

            const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
        }
    }, [leftPlayer, rightPlayer]);

    const handleLeftSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (leftInput.trim()) {
            fetchPlayerData(leftInput.trim(), 'left');
        }
    };

    const handleRightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rightInput.trim()) {
            fetchPlayerData(rightInput.trim(), 'right');
        }
    };

    const handleShare = async () => {
        const url = window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (e) {
                console.error('Failed to copy:', e);
            }
            document.body.removeChild(textArea);
        }
    };

    const formatPlaytime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        if (hours < 1) return `${minutes}m`;
        return `${hours.toLocaleString()}h`;
    };

    return (
        <>
            <Head title="Steam2Steam - Compare Players" />
            <div className="min-h-screen bg-gradient-to-br from-[#1b2838] via-[#2a475e] to-[#1b2838] text-white">
                {/* Header */}
                <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1" />
                            <div className="text-center">
                                <h1 className="text-4xl font-bold">
                                    <span className="bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] bg-clip-text text-transparent">
                                        Steam2Steam
                                    </span>
                                </h1>
                                <p className="mt-2 text-sm text-gray-400">
                                    Compare Steam profiles side by side
                                </p>
                            </div>
                            <div className="flex flex-1 justify-end">
                                {(leftPlayer || rightPlayer) && (
                                    <button
                                        onClick={handleShare}
                                        className="group relative rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        <span className="flex items-center gap-2">
                                            {copySuccess ? (
                                                <>
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
                                                    Share
                                                </>
                                            )}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    {/* Tab Navigation */}
                    <div className="mb-8 flex justify-center">
                        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-black/30 p-1 backdrop-blur-sm max-w-full">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'overview'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('cs2')}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'cs2'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                disabled={!leftPlayer && !rightPlayer}
                            >
                                <img
                                    src="https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_231x87.jpg"
                                    alt="CS2"
                                    className="w-8 h-3 object-cover rounded"
                                />
                                CS2
                            </button>
                            <button
                                onClick={() => setActiveTab('dota2')}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'dota2'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                disabled={!leftPlayer && !rightPlayer}
                            >
                                <img
                                    src="https://cdn.cloudflare.steamstatic.com/steam/apps/570/capsule_231x87.jpg"
                                    alt="Dota 2"
                                    className="w-8 h-3 object-cover rounded"
                                />
                                Dota 2
                            </button>
                            <button
                                onClick={() => setActiveTab('tf2')}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'tf2'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                disabled={!leftPlayer && !rightPlayer}
                            >
                                <img
                                    src="https://cdn.cloudflare.steamstatic.com/steam/apps/440/capsule_231x87.jpg"
                                    alt="TF2"
                                    className="w-8 h-3 object-cover rounded"
                                />
                                TF2
                            </button>
                            <button
                                onClick={() => setActiveTab('l4d2')}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'l4d2'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                disabled={!leftPlayer && !rightPlayer}
                            >
                                <img
                                    src="https://cdn.cloudflare.steamstatic.com/steam/apps/550/capsule_231x87.jpg"
                                    alt="L4D2"
                                    className="w-8 h-3 object-cover rounded"
                                />
                                L4D2
                            </button>
                            <button
                                onClick={() => setActiveTab('portal2')}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                                    activeTab === 'portal2'
                                        ? 'bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                disabled={!leftPlayer && !rightPlayer}
                            >
                                <img
                                    src="https://cdn.cloudflare.steamstatic.com/steam/apps/620/capsule_231x87.jpg"
                                    alt="Portal 2"
                                    className="w-8 h-3 object-cover rounded"
                                />
                                Portal 2
                            </button>
                        </div>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left Player */}
                                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    <div className="mb-6">
                                        <form onSubmit={handleLeftSubmit} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={leftInput}
                                                onChange={(e) => setLeftInput(e.target.value)}
                                                placeholder="Enter Steam ID or profile URL..."
                                                className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none ring-2 ring-transparent transition focus:ring-[#66c0f4]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={leftLoading}
                                                className="rounded-lg bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                            >
                                                {leftLoading ? 'Loading...' : 'Compare'}
                                            </button>
                                        </form>
                                        {leftError && (
                                            <p className="mt-2 text-sm text-red-400">{leftError}</p>
                                        )}
                                    </div>

                                    {leftPlayer && (
                                        <PlayerCard player={leftPlayer} color="blue" />
                                    )}
                                </div>

                                {/* Right Player */}
                                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    <div className="mb-6">
                                        <form onSubmit={handleRightSubmit} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rightInput}
                                                onChange={(e) => setRightInput(e.target.value)}
                                                placeholder="Enter Steam ID or profile URL..."
                                                className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none ring-2 ring-transparent transition focus:ring-[#a4d007]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={rightLoading}
                                                className="rounded-lg bg-gradient-to-r from-[#a4d007] to-[#7cb305] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                            >
                                                {rightLoading ? 'Loading...' : 'Compare'}
                                            </button>
                                        </form>
                                        {rightError && (
                                            <p className="mt-2 text-sm text-red-400">{rightError}</p>
                                        )}
                                    </div>

                                    {rightPlayer && (
                                        <PlayerCard player={rightPlayer} color="green" />
                                    )}
                                </div>
                            </div>

                            {/* Comparison Stats */}
                            {leftPlayer && rightPlayer && (
                                <div className="mt-8 rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    <h2 className="mb-6 text-2xl font-bold text-center">Head to Head Comparison</h2>

                                    <div className="space-y-6">
                                        {/* Level Comparison */}
                                        <ComparisonBar
                                            label="Steam Level"
                                            leftValue={leftPlayer.stats.level}
                                            rightValue={rightPlayer.stats.level}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />

                                        {/* Total Games Comparison */}
                                        <ComparisonBar
                                            label="Total Games"
                                            leftValue={leftPlayer.stats.totalGames}
                                            rightValue={rightPlayer.stats.totalGames}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />

                                        {/* Total Playtime Comparison */}
                                        <ComparisonBar
                                            label="Total Playtime"
                                            leftValue={leftPlayer.stats.totalPlaytime}
                                            rightValue={rightPlayer.stats.totalPlaytime}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => formatPlaytime(val)}
                                        />

                                        {/* Total Badges Comparison */}
                                        <ComparisonBar
                                            label="Total Badges"
                                            leftValue={leftPlayer.stats.totalBadges}
                                            rightValue={rightPlayer.stats.totalBadges}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* CS2 Tab */}
                    {activeTab === 'cs2' && (
                        <div className="space-y-8">
                            {/* CS2 Input Section */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left Player CS2 */}
                                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    {leftPlayer ? (
                                        leftCS2 && leftCS2.owns_game ? (
                                            leftCS2.stats_private ? (
                                                <div className="text-center py-8 space-y-4">
                                                    <div className="flex items-center gap-4 justify-center">
                                                        <img
                                                            src={leftPlayer.profile.avatarfull}
                                                            alt={leftPlayer.profile.personaname}
                                                            className="h-16 w-16 rounded-lg ring-2 ring-[#66c0f4]"
                                                        />
                                                        <div>
                                                            <h2 className="text-xl font-bold">{leftPlayer.profile.personaname}</h2>
                                                            <p className="text-sm text-gray-400">CS2 Playtime: {Math.floor(leftCS2.playtime / 60)}h</p>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                                                        <p className="text-yellow-400 font-semibold mb-2">🔒 Stats Private</p>
                                                        <p className="text-gray-400 text-sm">
                                                            This player's game statistics are set to private.
                                                            They need to set their profile and game details to public.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <CS2PlayerCard player={leftPlayer} cs2Stats={leftCS2} color="blue" />
                                            )
                                        ) : (
                                            <div className="text-center py-8 space-y-4">
                                                {leftCS2 === null ? (
                                                    // Still loading
                                                    <>
                                                        {leftPlayer && (
                                                            <div className="flex items-center gap-4 justify-center">
                                                                <img
                                                                    src={leftPlayer.profile.avatarfull}
                                                                    alt={leftPlayer.profile.personaname}
                                                                    className="h-16 w-16 rounded-lg ring-2 ring-[#66c0f4]"
                                                                />
                                                                <div>
                                                                    <h2 className="text-xl font-bold">{leftPlayer.profile.personaname}</h2>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500"></div>
                                                            <p className="text-gray-400">Loading CS2 stats...</p>
                                                        </div>
                                                    </>
                                                ) : leftCS2?.privacy_issue ? (
                                                    // Privacy issue
                                                    <>
                                                        <div className="flex items-center gap-4 justify-center">
                                                            {leftPlayer && (
                                                                <>
                                                                    <img
                                                                        src={leftPlayer.profile.avatarfull}
                                                                        alt={leftPlayer.profile.personaname}
                                                                        className="h-16 w-16 rounded-lg ring-2 ring-[#66c0f4]"
                                                                    />
                                                                    <div>
                                                                        <h2 className="text-xl font-bold">{leftPlayer.profile.personaname}</h2>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4 max-w-md mx-auto">
                                                            <p className="text-orange-400 font-semibold mb-2">🔒 Privacy Settings Issue</p>
                                                            <p className="text-gray-300 text-sm mb-3">
                                                                {leftCS2?.error}
                                                            </p>
                                                            <div className="text-left text-xs text-gray-400 space-y-1">
                                                                <p className="font-semibold text-gray-300">How to fix:</p>
                                                                <p>1. Go to Steam Profile → Edit Profile</p>
                                                                <p>2. Click "Privacy Settings"</p>
                                                                <p>3. Set "Game details" to <span className="text-orange-400">Public</span></p>
                                                                <p>4. Refresh this page</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // No game owned
                                                    <>
                                                        {leftPlayer && (
                                                            <div className="flex items-center gap-4 justify-center">
                                                                <img
                                                                    src={leftPlayer.profile.avatarfull}
                                                                    alt={leftPlayer.profile.personaname}
                                                                    className="h-16 w-16 rounded-lg ring-2 ring-[#66c0f4] opacity-50"
                                                                />
                                                                <div>
                                                                    <h2 className="text-xl font-bold">{leftPlayer.profile.personaname}</h2>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="rounded-lg bg-gray-500/10 border border-gray-500/30 p-4 max-w-md mx-auto">
                                                            <p className="text-gray-400 font-semibold mb-2">📊 No Data Available</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {leftCS2?.error || 'This player does not own Counter-Strike 2 or hasn\'t played it yet.'}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">Load a player first in Overview tab</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Player CS2 */}
                                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    {rightPlayer ? (
                                        rightCS2 && rightCS2.owns_game ? (
                                            rightCS2.stats_private ? (
                                                <div className="text-center py-8 space-y-4">
                                                    <div className="flex items-center gap-4 justify-center">
                                                        <img
                                                            src={rightPlayer.profile.avatarfull}
                                                            alt={rightPlayer.profile.personaname}
                                                            className="h-16 w-16 rounded-lg ring-2 ring-[#a4d007]"
                                                        />
                                                        <div>
                                                            <h2 className="text-xl font-bold">{rightPlayer.profile.personaname}</h2>
                                                            <p className="text-sm text-gray-400">CS2 Playtime: {Math.floor(rightCS2.playtime / 60)}h</p>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                                                        <p className="text-yellow-400 font-semibold mb-2">🔒 Stats Private</p>
                                                        <p className="text-gray-400 text-sm">
                                                            This player's game statistics are set to private.
                                                            They need to set their profile and game details to public.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <CS2PlayerCard player={rightPlayer} cs2Stats={rightCS2} color="green" />
                                            )
                                        ) : (
                                            <div className="text-center py-8 space-y-4">
                                                {rightCS2 === null ? (
                                                    // Still loading
                                                    <>
                                                        {rightPlayer && (
                                                            <div className="flex items-center gap-4 justify-center">
                                                                <img
                                                                    src={rightPlayer.profile.avatarfull}
                                                                    alt={rightPlayer.profile.personaname}
                                                                    className="h-16 w-16 rounded-lg ring-2 ring-[#a4d007]"
                                                                />
                                                                <div>
                                                                    <h2 className="text-xl font-bold">{rightPlayer.profile.personaname}</h2>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-green-500"></div>
                                                            <p className="text-gray-400">Loading CS2 stats...</p>
                                                        </div>
                                                    </>
                                                ) : rightCS2?.privacy_issue ? (
                                                    // Privacy issue
                                                    <>
                                                        <div className="flex items-center gap-4 justify-center">
                                                            {rightPlayer && (
                                                                <>
                                                                    <img
                                                                        src={rightPlayer.profile.avatarfull}
                                                                        alt={rightPlayer.profile.personaname}
                                                                        className="h-16 w-16 rounded-lg ring-2 ring-[#a4d007]"
                                                                    />
                                                                    <div>
                                                                        <h2 className="text-xl font-bold">{rightPlayer.profile.personaname}</h2>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4 max-w-md mx-auto">
                                                            <p className="text-orange-400 font-semibold mb-2">🔒 Privacy Settings Issue</p>
                                                            <p className="text-gray-300 text-sm mb-3">
                                                                {rightCS2?.error}
                                                            </p>
                                                            <div className="text-left text-xs text-gray-400 space-y-1">
                                                                <p className="font-semibold text-gray-300">How to fix:</p>
                                                                <p>1. Go to Steam Profile → Edit Profile</p>
                                                                <p>2. Click "Privacy Settings"</p>
                                                                <p>3. Set "Game details" to <span className="text-orange-400">Public</span></p>
                                                                <p>4. Refresh this page</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // No game owned
                                                    <>
                                                        {rightPlayer && (
                                                            <div className="flex items-center gap-4 justify-center">
                                                                <img
                                                                    src={rightPlayer.profile.avatarfull}
                                                                    alt={rightPlayer.profile.personaname}
                                                                    className="h-16 w-16 rounded-lg ring-2 ring-[#a4d007] opacity-50"
                                                                />
                                                                <div>
                                                                    <h2 className="text-xl font-bold">{rightPlayer.profile.personaname}</h2>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="rounded-lg bg-gray-500/10 border border-gray-500/30 p-4 max-w-md mx-auto">
                                                            <p className="text-gray-400 font-semibold mb-2">📊 No Data Available</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {rightCS2?.error || 'This player does not own Counter-Strike 2 or hasn\'t played it yet.'}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">Load a player first in Overview tab</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CS2 Comparison Stats */}
                            {leftCS2 && rightCS2 && leftCS2.owns_game && rightCS2.owns_game && !leftCS2.stats_private && !rightCS2.stats_private && leftPlayer && rightPlayer && (
                                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                                    <h2 className="mb-6 text-2xl font-bold text-center">CS2 Head to Head</h2>

                                    <div className="space-y-6">
                                        {/* K/D Ratio */}
                                        <ComparisonBar
                                            label="K/D Ratio"
                                            leftValue={leftCS2.stats.kd_ratio}
                                            rightValue={rightCS2.stats.kd_ratio}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => val.toFixed(2)}
                                        />

                                        {/* Total Kills */}
                                        <ComparisonBar
                                            label="Total Kills"
                                            leftValue={leftCS2.stats.total_kills}
                                            rightValue={rightCS2.stats.total_kills}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />

                                        {/* Total Wins */}
                                        <ComparisonBar
                                            label="Total Wins"
                                            leftValue={leftCS2.stats.total_wins}
                                            rightValue={rightCS2.stats.total_wins}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />

                                        {/* Headshot Percentage */}
                                        <ComparisonBar
                                            label="Headshot %"
                                            leftValue={leftCS2.stats.headshot_percentage}
                                            rightValue={rightCS2.stats.headshot_percentage}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => `${val.toFixed(1)}%`}
                                        />

                                        {/* Accuracy */}
                                        <ComparisonBar
                                            label="Accuracy"
                                            leftValue={leftCS2.stats.accuracy}
                                            rightValue={rightCS2.stats.accuracy}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => `${val.toFixed(1)}%`}
                                        />

                                        {/* Total MVPs */}
                                        <ComparisonBar
                                            label="Total MVPs"
                                            leftValue={leftCS2.stats.total_mvps}
                                            rightValue={rightCS2.stats.total_mvps}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                        />

                                        {/* Playtime */}
                                        <ComparisonBar
                                            label="CS2 Playtime"
                                            leftValue={leftCS2.playtime}
                                            rightValue={rightCS2.playtime}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => formatPlaytime(val)}
                                        />

                                        {/* Achievements */}
                                        <ComparisonBar
                                            label="Achievements"
                                            leftValue={leftCS2.achievements.percentage}
                                            rightValue={rightCS2.achievements.percentage}
                                            leftLabel={leftPlayer.profile.personaname}
                                            rightLabel={rightPlayer.profile.personaname}
                                            formatter={(val) => `${val.toFixed(1)}%`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dota 2 Tab */}
                    {activeTab === 'dota2' && (
                        <GenericGameTab
                            leftPlayer={leftPlayer}
                            rightPlayer={rightPlayer}
                            leftStats={leftDota2}
                            rightStats={rightDota2}
                            gameName="Dota 2"
                            appId={570}
                        />
                    )}

                    {/* TF2 Tab */}
                    {activeTab === 'tf2' && (
                        <GenericGameTab
                            leftPlayer={leftPlayer}
                            rightPlayer={rightPlayer}
                            leftStats={leftTF2}
                            rightStats={rightTF2}
                            gameName="Team Fortress 2"
                            appId={440}
                        />
                    )}

                    {/* L4D2 Tab */}
                    {activeTab === 'l4d2' && (
                        <GenericGameTab
                            leftPlayer={leftPlayer}
                            rightPlayer={rightPlayer}
                            leftStats={leftL4D2}
                            rightStats={rightL4D2}
                            gameName="Left 4 Dead 2"
                            appId={550}
                        />
                    )}

                    {/* Portal 2 Tab */}
                    {activeTab === 'portal2' && (
                        <GenericGameTab
                            leftPlayer={leftPlayer}
                            rightPlayer={rightPlayer}
                            leftStats={leftPortal2}
                            rightStats={rightPortal2}
                            gameName="Portal 2"
                            appId={620}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

function CS2PlayerCard({ player, cs2Stats, color }: { player: PlayerData; cs2Stats: CS2Stats; color: 'blue' | 'green' }) {
    const colorClasses = {
        blue: {
            gradient: 'from-[#66c0f4] to-[#2a90d8]',
            ring: 'ring-[#66c0f4]',
            bg: 'bg-[#66c0f4]/10',
        },
        green: {
            gradient: 'from-[#a4d007] to-[#7cb305]',
            ring: 'ring-[#a4d007]',
            bg: 'bg-[#a4d007]/10',
        },
    };

    const colors = colorClasses[color];

    const formatPlaytime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        if (hours < 1) return `${minutes}m`;
        return `${hours.toLocaleString()}h`;
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
                <img
                    src={player.profile.avatarfull}
                    alt={player.profile.personaname}
                    className={`h-16 w-16 rounded-lg ring-2 ${colors.ring}`}
                />
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{player.profile.personaname}</h2>
                    <p className="text-sm text-gray-400">Counter-Strike 2 Stats</p>
                </div>
            </div>

            {/* CS2 Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    label="K/D Ratio"
                    value={cs2Stats.stats.kd_ratio.toFixed(2)}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Playtime"
                    value={formatPlaytime(cs2Stats.playtime)}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Total Kills"
                    value={cs2Stats.stats.total_kills.toLocaleString()}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Total Wins"
                    value={cs2Stats.stats.total_wins.toLocaleString()}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Headshot %"
                    value={`${cs2Stats.stats.headshot_percentage.toFixed(1)}%`}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Accuracy"
                    value={`${cs2Stats.stats.accuracy.toFixed(1)}%`}
                    gradient={colors.gradient}
                />
            </div>

            {/* Detailed Stats */}
            <div>
                <h3 className="mb-3 text-lg font-semibold">Detailed Stats</h3>
                <div className={`space-y-2 rounded-lg ${colors.bg} p-4`}>
                    <StatRow label="Total Deaths" value={cs2Stats.stats.total_deaths.toLocaleString()} />
                    <StatRow label="MVPs" value={cs2Stats.stats.total_mvps.toLocaleString()} />
                    <StatRow label="Matches Played" value={cs2Stats.stats.total_matches_played.toLocaleString()} />
                    <StatRow label="Rounds Played" value={cs2Stats.stats.total_rounds_played.toLocaleString()} />
                    <StatRow label="Total Headshots" value={cs2Stats.stats.total_headshots.toLocaleString()} />
                    <StatRow label="Shots Fired" value={cs2Stats.stats.total_shots_fired.toLocaleString()} />
                    <StatRow label="Shots Hit" value={cs2Stats.stats.total_shots_hit.toLocaleString()} />
                    <StatRow label="Damage Done" value={cs2Stats.stats.total_damage_done.toLocaleString()} />
                </div>
            </div>

            {/* Achievements */}
            <div>
                <h3 className="mb-3 text-lg font-semibold">Achievements</h3>
                <div className={`rounded-lg ${colors.bg} p-4`}>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            {cs2Stats.achievements.achieved} / {cs2Stats.achievements.total}
                        </span>
                        <span className={`font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                            {cs2Stats.achievements.percentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                            style={{ width: `${cs2Stats.achievements.percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function PlayerCard({ player, color }: { player: PlayerData; color: 'blue' | 'green' }) {
    const colorClasses = {
        blue: {
            gradient: 'from-[#66c0f4] to-[#2a90d8]',
            ring: 'ring-[#66c0f4]',
            bg: 'bg-[#66c0f4]/10',
        },
        green: {
            gradient: 'from-[#a4d007] to-[#7cb305]',
            ring: 'ring-[#a4d007]',
            bg: 'bg-[#a4d007]/10',
        },
    };

    const colors = colorClasses[color];

    const formatPlaytime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        if (hours < 1) return `${minutes}m`;
        return `${hours.toLocaleString()}h`;
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
                <img
                    src={player.profile.avatarfull}
                    alt={player.profile.personaname}
                    className={`h-20 w-20 rounded-lg ring-2 ${colors.ring}`}
                />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">{player.profile.personaname}</h2>
                    <a
                        href={player.profile.profileurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        View Steam Profile →
                    </a>
                    <p className="mt-1 text-xs text-gray-500">
                        Member since: {formatDate(player.profile.timecreated)}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    label="Level"
                    value={player.stats.level.toString()}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Games"
                    value={player.stats.totalGames.toLocaleString()}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Playtime"
                    value={formatPlaytime(player.stats.totalPlaytime)}
                    gradient={colors.gradient}
                />
                <StatCard
                    label="Badges"
                    value={player.stats.totalBadges.toLocaleString()}
                    gradient={colors.gradient}
                />
            </div>

            {/* Top Games */}
            {player.topGames.length > 0 && (
                <div>
                    <h3 className="mb-3 text-lg font-semibold">Most Played Games</h3>
                    <div className="space-y-2">
                        {player.topGames.map((game, index) => (
                            <div
                                key={game.appid}
                                className={`flex items-center justify-between rounded-lg ${colors.bg} p-3`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium">{game.name}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold">
                                    {formatPlaytime(game.playtime_forever)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, gradient }: { label: string; value: string; gradient: string }) {
    return (
        <div className="rounded-lg bg-white/5 p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {value}
            </p>
        </div>
    );
}

function ComparisonBar({
    label,
    leftValue,
    rightValue,
    leftLabel,
    rightLabel,
    formatter = (val) => val.toLocaleString(),
}: {
    label: string;
    leftValue: number;
    rightValue: number;
    leftLabel: string;
    rightLabel: string;
    formatter?: (val: number) => string;
}) {
    const maxValue = Math.max(leftValue, rightValue) || 1;
    const leftPercentage = (leftValue / maxValue) * 100;
    const rightPercentage = (rightValue / maxValue) * 100;

    return (
        <div>
            <h3 className="mb-3 text-center text-lg font-semibold">{label}</h3>
            <div className="flex items-center gap-4">
                {/* Left Side */}
                <div className="flex-1 text-right">
                    <div className="mb-2 flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-400">{leftLabel}</span>
                        <span className="font-bold text-[#66c0f4]">{formatter(leftValue)}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-[#66c0f4] to-[#2a90d8] transition-all duration-500"
                            style={{ width: `${leftPercentage}%`, marginLeft: 'auto' }}
                        />
                    </div>
                </div>

                {/* VS Divider */}
                <div className="text-xl font-bold text-gray-500">VS</div>

                {/* Right Side */}
                <div className="flex-1 text-left">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-bold text-[#a4d007]">{formatter(rightValue)}</span>
                        <span className="text-sm text-gray-400">{rightLabel}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-[#a4d007] to-[#7cb305] transition-all duration-500"
                            style={{ width: `${rightPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

