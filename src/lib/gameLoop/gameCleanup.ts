/**
 * GameCleanup — Handles post-game cleanup and final score display.
 *
 * This file triggers the delayed cleanup of Redis state after a game ends
 * and can emit final scores to all players using Socket.IO if needed.
 *
 * Meant to be called after the final round has ended.
 */

// gameCleanup.ts handles game flow by telling players the game is over and showing final scores. 
// We will probably need to add leaderboard logic here (to send to a leaderboard)

// end of game logic (clean up lobby (redis))
// lobby reset
import { Server as SocketIOServer } from 'socket.io';
import GameState from './gameState';

// optional: delay before deleting state (so players see final scores)
const CLEANUP_DELAY_MS = 5000;

/**
 * ends the game for a given lobby:
 * - emits final scores to all players via Socket.IO
 * - waits a few seconds so players can see results
 * - deletes game state from Redis
 *
 * @param io - An instance of your Socket.IO server
 * @param lobbyId - ID of the lobby to clean up
 */
export async function endGameAndCleanup(io: SocketIOServer, lobbyId: string) {
    const state = await GameState.get(lobbyId);

    if (!state || !state.scores) return;

    // emit total and round scores to all clients in the lobby
    io.to(lobbyId).emit('game:roundEnded', {
        totalScores: state.scores,
        roundScores: state.roundScores,
    });


    // optional: delay so players see results before cleanup
    setTimeout(async () => {
        await GameState.delete(lobbyId);
        io.to(lobbyId).emit('game:ended'); // inform clients that game is over
    }, CLEANUP_DELAY_MS);
}
