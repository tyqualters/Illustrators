/**
 * Location: src/app/api/lobby/[id]/turn/route.ts
 * @file route.ts
 * @description 
 * API route to retrieve the current turn state for a specific game lobby.
 * 
 * This is used when a player joins or refreshes the game page to restore
 * the client with the current drawer, word (if selected), word options,
 * round number, and round timer.
 *
 * Responds with:
 * - 200: Current turn data (drawerId, word, wordOptions, round, timer, canvas)
 * - 404: If no active turn is found for the lobby
 * 
 * Called on reconnect/refresh to restore the client with:
 * - Current drawer
 * - Word + wordOptions
 * - Timer (with timeLeft)
 * - Canvas state
 */

import { NextRequest, NextResponse } from 'next/server';
import GameState from '@/lib/gameLoop/state/gameState';
import redis from '@/lib/redis';
import PrintError from '@/lib/printErr';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {

  const { id: lobbyId } = await params // this is correct PARAMS ERROR syntax
  const state = await GameState.get(lobbyId);

  // turn succeeds when ther game has started, the drawer has selected a word, and a timer has been set
  if (!state || typeof state.round !== 'number' || !state.wordOptions) {
    console.warn(`[API] No active turn for lobby ${lobbyId}`);
    return NextResponse.json({ error: 'No active turn' }, { status: 404 });
  }

  // Load canvas from Redis (if canvas exists)
  let canvasData: object | null = null;
  try {
    const canvasJSON = await redis.get(`canvas:${lobbyId}`);
    canvasData = canvasJSON ? JSON.parse(canvasJSON) : null;
  } catch (err: unknown) {
    PrintError(err);
    console.warn(`[API] Failed to load canvas for ${lobbyId}`);
  }

  // Calculate "timeLeft" from Redis (if timer started)
  let timeLeft: number | null = null;
  let rawStart: string | null = null;

  try {
    rawStart = await redis.get(`timer:${lobbyId}:start`);
    const rawDuration = await redis.get(`timer:${lobbyId}:duration`);

    const start = Number(rawStart);
    const duration = Number(rawDuration);

    if (!isNaN(start) && !isNaN(duration)) {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      timeLeft = Math.max(duration - elapsed, 0);
    }

    console.log(`[API] Calculated timeLeft:`, { start, duration, timeLeft });

  } catch (err) {
    console.warn(`[API] Failed to calculate timeLeft for ${lobbyId}:`, err);
  }

  // Return current turn state to client
  return NextResponse.json({
    drawerId: state.drawerId,
    word: state.word ?? null,
    wordOptions: state.wordOptions ?? [],
    round: state.round,
    timer: state.timer ?? null,
    timeLeft,
    timerStart: rawStart ?? null, // frontend can calculate accurate countdown
    totalRounds: state.settings?.totalRounds ?? null,
    canvas: canvasData,
  });
}
