import { PlayerData } from './compare';

interface GenericGameStats {
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

interface GenericGameTabProps {
    leftPlayer: PlayerData | null;
    rightPlayer: PlayerData | null;
    leftStats: GenericGameStats | null;
    rightStats: GenericGameStats | null;
    gameName: string;
    appId: number;
}

export function GenericGameTab({ leftPlayer, rightPlayer, leftStats, rightStats, gameName, appId }: GenericGameTabProps) {
    const formatValue = (value: number, format: string) => {
        if (format === 'time') {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        }
        return value.toLocaleString();
    };

    const formatPlaytime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        if (hours < 1) return `${minutes}m`;
        return `${hours.toLocaleString()}h`;
    };

    return (
        <div className="space-y-8">
            {/* Player Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Player */}
                <GamePlayerCard
                    player={leftPlayer}
                    stats={leftStats}
                    gameName={gameName}
                    appId={appId}
                    color="blue"
                    formatValue={formatValue}
                    formatPlaytime={formatPlaytime}
                />

                {/* Right Player */}
                <GamePlayerCard
                    player={rightPlayer}
                    stats={rightStats}
                    gameName={gameName}
                    appId={appId}
                    color="green"
                    formatValue={formatValue}
                    formatPlaytime={formatPlaytime}
                />
            </div>

            {/* Head to Head Comparison */}
            {leftStats && rightStats && leftStats.owns_game && rightStats.owns_game &&
             !leftStats.stats_private && !rightStats.stats_private && leftPlayer && rightPlayer && (
                <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-2xl font-bold text-center flex items-center justify-center gap-3">
                        <img
                            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`}
                            alt={gameName}
                            className="w-16 h-6 object-cover rounded"
                        />
                        {gameName} Head to Head
                    </h2>

                    <div className="space-y-6">
                        {Object.entries(leftStats.stat_definitions).map(([key, definition]) => {
                            const leftValue = leftStats.stats[key] || 0;
                            const rightValue = rightStats.stats[key] || 0;

                            return (
                                <ComparisonBar
                                    key={key}
                                    label={definition.label}
                                    leftValue={leftValue}
                                    rightValue={rightValue}
                                    leftLabel={leftPlayer.profile.personaname}
                                    rightLabel={rightPlayer.profile.personaname}
                                    formatter={(val) => formatValue(val, definition.format)}
                                />
                            );
                        })}

                        {/* Achievements Comparison */}
                        <ComparisonBar
                            label="Achievements"
                            leftValue={leftStats.achievements.percentage}
                            rightValue={rightStats.achievements.percentage}
                            leftLabel={leftPlayer.profile.personaname}
                            rightLabel={rightPlayer.profile.personaname}
                            formatter={(val) => `${val.toFixed(1)}%`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function GamePlayerCard({
    player,
    stats,
    gameName,
    appId,
    color,
    formatValue,
    formatPlaytime
}: {
    player: PlayerData | null;
    stats: GenericGameStats | null;
    gameName: string;
    appId: number;
    color: 'blue' | 'green';
    formatValue: (value: number, format: string) => string;
    formatPlaytime: (minutes: number) => string;
}) {
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

    if (!player) {
        return (
            <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                <div className="text-center py-8">
                    <p className="text-gray-400">Load a player first in Overview tab</p>
                </div>
            </div>
        );
    }

    if (!stats || !stats.owns_game) {
        return (
            <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                <div className="text-center py-8 space-y-4">
                    {stats === null ? (
                        // Still loading
                        <>
                            <div className="flex items-center gap-4 justify-center">
                                <img
                                    src={player.profile.avatarfull}
                                    alt={player.profile.personaname}
                                    className={`h-16 w-16 rounded-lg ring-2 ${colors.ring}`}
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{player.profile.personaname}</h2>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500"></div>
                                <p className="text-gray-400">Loading {gameName} stats...</p>
                            </div>
                        </>
                    ) : stats?.privacy_issue ? (
                        // Privacy issue
                        <>
                            <div className="flex items-center gap-4 justify-center">
                                <img
                                    src={player.profile.avatarfull}
                                    alt={player.profile.personaname}
                                    className={`h-16 w-16 rounded-lg ring-2 ${colors.ring}`}
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{player.profile.personaname}</h2>
                                </div>
                            </div>
                            <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4 max-w-md mx-auto">
                                <p className="text-orange-400 font-semibold mb-2">🔒 Privacy Settings Issue</p>
                                <p className="text-gray-300 text-sm mb-3">
                                    {stats?.error}
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
                        // Game not owned
                        <>
                            <div className="flex items-center gap-4 justify-center">
                                <img
                                    src={player.profile.avatarfull}
                                    alt={player.profile.personaname}
                                    className={`h-16 w-16 rounded-lg ring-2 ${colors.ring} opacity-50`}
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{player.profile.personaname}</h2>
                                </div>
                            </div>
                            <div className="rounded-lg bg-gray-500/10 border border-gray-500/30 p-4 max-w-md mx-auto">
                                <p className="text-gray-400 font-semibold mb-2">📊 No Data Available</p>
                                <p className="text-gray-400 text-sm">
                                    {stats?.error || `This player does not own ${gameName} or hasn't played it yet.`}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (stats.stats_private) {
        return (
            <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                <div className="text-center py-8 space-y-4">
                    <div className="flex items-center gap-4 justify-center">
                        <img
                            src={player.profile.avatarfull}
                            alt={player.profile.personaname}
                            className={`h-16 w-16 rounded-lg ring-2 ${colors.ring}`}
                        />
                        <div>
                            <h2 className="text-xl font-bold">{player.profile.personaname}</h2>
                            <p className="text-sm text-gray-400">{gameName} Playtime: {formatPlaytime(stats.playtime)}</p>
                        </div>
                    </div>
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                        <p className="text-yellow-400 font-semibold mb-2">🔒 Stats Private</p>
                        <p className="text-gray-400 text-sm">
                            This player's game statistics are set to private.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-black/30 p-6 backdrop-blur-sm">
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
                        <div className="flex items-center gap-2 mt-1">
                            <img
                                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`}
                                alt={gameName}
                                className="w-12 h-[18px] object-cover rounded"
                            />
                            <p className="text-sm text-gray-400">{gameName} Stats</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label="Playtime"
                        value={formatPlaytime(stats.playtime)}
                        gradient={colors.gradient}
                    />
                    {Object.entries(stats.stat_definitions).slice(0, 5).map(([key, definition]) => (
                        <StatCard
                            key={key}
                            label={definition.label}
                            value={formatValue(stats.stats[key] || 0, definition.format)}
                            gradient={colors.gradient}
                        />
                    ))}
                </div>

                {/* Achievements */}
                {stats.achievements.total > 0 && (
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">Achievements</h3>
                        <div className={`rounded-lg ${colors.bg} p-4`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    {stats.achievements.achieved} / {stats.achievements.total}
                                </span>
                                <span className={`font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                                    {stats.achievements.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                                    style={{ width: `${stats.achievements.percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
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

