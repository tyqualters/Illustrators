import redis from '@/lib/redis';
import GameState from '@/lib/gameLoop/state/gameState';

/**
 * Clears all temporary turn-related Redis keys for a given lobby.
 * Prevents stale canvas or timer data from leaking into the next round.
 * 
 * @param lobbyId - The ID of game lobby whose turn data should be cleared.
 */
export async function clearTurnData(lobbyId: string): Promise<void> {
    // Clear Redis keys for canvas and timer
    await redis.del(`canvas:${lobbyId}`);
    await redis.del(`timer:${lobbyId}:start`);
    await redis.del(`timer:${lobbyId}:duration`);

    // Also clear per-round game state fields in Redis
    await GameState.update(lobbyId, {
        roundScores: {},
        guessedUsers: [],
    });
}
