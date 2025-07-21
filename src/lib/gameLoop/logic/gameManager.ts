/**
 * Location: src/lib/gameLoop/logic/gameManager.ts
 * @file gameManager.ts
 * @description
 * Contains high-level game lifecycle logic including determining when the game should end
 * and performing cleanup of Redis keys and game state at the end of the game.
 */
import GameState from '@/lib/gameLoop/state/gameState';
import redis from '@/lib/redis';
import type { GameStateData } from '@/lib/gameLoop/state/gameState';
import connectDB from '@/lib/mongo';
import Lobby from '@/models/Lobby';
import { clearTurnData } from './turnCleanup';


/**
 * Performs end-of-game cleanup and returns final scores.
 * 
 * Deletes all Redis state associated with the lobby, including game state, 
 * drawing canvas, nd tiimer metadata. Also deletes the corresponding lobby from MongoDB.
 * 
 * @param lobbyId - The unique identifier for the lobby
 * @returns  Final scores for all players, or null if no valid game state.
 */
export async function endGameAndCleanup(lobbyId: string): Promise<Record<string, number> | null> {
    const state = await GameState.get(lobbyId);
    if (!state || !state.scores) return null;

    const finalScores = state.scores;

    // Clean up Redis or any other state
    await redis.del(`game:${lobbyId}`);
    await clearTurnData(lobbyId);

    await GameState.delete(lobbyId);

    // Clean up MongoDB lobby document
    try {
        await connectDB();
        await Lobby.findByIdAndDelete(lobbyId);
        console.log(`[Cleanup] Deleted MongoDB lobby ${lobbyId}`);
    } catch (err) {
        console.warn(`[Cleanup] Failed to delete MongoDB lobby ${lobbyId}:`, err);
    }

    return finalScores;
}

/**
 * Determines whether the game should end based on the current turn state.
 * 
 * The game ends when the number of completed turns equals
 * (totalPlayers * totalRounds), meaning everyone has drawn once per round.
 * 
 * @param state - The current Redis-backed game state
 * @returns True if the game has completed all rounds; false otherwise
 */
export function shouldEndGame(state: GameStateData): boolean {
    if (
        !state.playerOrder ||
        typeof state.round !== 'number' ||
        typeof state.currentDrawerIndex !== 'number' ||
        typeof state.settings?.totalRounds !== 'number'
    ) return false;

    const totalRounds = state.settings.totalRounds;
    const totalPlayers = state.playerOrder.length;
    const turnsPlayed = (state.round - 1) * totalPlayers + state.currentDrawerIndex + 1;
    return turnsPlayed >= totalPlayers * totalRounds;
}

/**
 * Grouped export for game ending logic functions. 
 */
export const GameManager = { endGameAndCleanup, shouldEndGame };
