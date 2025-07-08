import redis, { connectRedis } from '@/lib/redis';

// host selects settings before the game starts
export interface GameSettings {
    drawingTime: number; // ex: 90 seconds
    totalRounds: number; // ex: 3 rounds
    difficulty?: 'easy' | 'medium' | 'hard';
    wordCount?: number; // number of word options shown to drawer (min 3, max 6)
}

// defines the shape of the data we store in Redis for each lobby
export interface GameStateData {
    drawerId?: string;
    word?: string;
    round?: number;
    timer?: number;
    scores?: Record<string, number>; // object that keys must be string and values must be number
    guessedUsers?: string[];
    playerOrder?: string[]; // list of player ID's in draw order
    currentDrawerIndex?: number; // index of who is drawing in current round
    wordOptions?: string[];
    settings?: GameSettings; // settings from host
    usedWords?: string[];
    roundScores?: Record<string, number>; // tracks points earned each round
    // To add more fields, add here
    players?: { id: string; name: string }[];
}

/**
 * GameState — Redis-backed game data manager.
 *
 * This file handles all direct interactions with Redis for a specific lobby's game state.
 * It provides get, set, update, and delete functions to manage game state objects.
 *
 * shoudl not include any game rule logic.
 */
const GameState = {
    // get the full game state for a lobby
    async get(lobbyId: string): Promise<GameStateData | null> {
        await connectRedis();
        const data = await redis.get(`gamestate:${lobbyId}`);
        return data ? JSON.parse(data) : null;
    },

    // set the full game state for a lobby (overwrite)
    async set(lobbyId: string, state: GameStateData): Promise<void> {
        await connectRedis();
        await redis.set(`gamestate:${lobbyId}`, JSON.stringify(state));
    },

    // update part of the game state without overwriting the whole object
    async update(lobbyId: string, updates: Partial<GameStateData>): Promise<void> {
        await connectRedis();
        const existing = await GameState.get(lobbyId);
        const merged = { ...existing, ...updates };
        await GameState.set(lobbyId, merged);
    },

    // delete the game state for a lobby
    async delete(lobbyId: string): Promise<void> {
        await connectRedis();
        await redis.del(`gamestate:${lobbyId}`);
    },
};

export default GameState;
