/**
 * Location: src/lib/gameLoop/logic/turnCleanup.ts
 * @file turnCleanup.ts
 * @description
 * Handles clearing temporary Redis state between turns in the game.
 * 
 * This includes removing:
 * - Canvas data
 * - Timer start timestamp
 * - Timer duration
 * 
 * Should be called after a round ends (thru timeout or all players guess) 
 * and/or before the next drawer begins
 */
import redis from '@/lib/redis';

/**
 * Clears all temporary turn-related Redis keys for a given lobby.
 * 
 * Prevents stale canvas or timer data from leaking into the next round.
 * 
 * @param lobbyId - The ID of game lobby whose turn data should be cleared.
 */
export async function clearTurnData(lobbyId: string): Promise<void> {
    const keysToDelete = [
        `canvas:${lobbyId}`,
        `timer:${lobbyId}:start`,
        `timer:${lobbyId}:duration`,
    ];

    // Delete turn-specific Redis keys to reset canvas and timers
    await redis.del(`canvas:${lobbyId}`);
    await redis.del(`timer:${lobbyId}:start`);
    await redis.del(`timer:${lobbyId}:duration`);

}
