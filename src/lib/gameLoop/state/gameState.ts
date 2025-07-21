/**
 * Location: src/lib/gameLoop/state/gameState.ts
 * 
 * @file gameState.ts
 * @description
 * GameState - Redis-based data manager for multiplayer game sessions.
 * 
 * Handles all Redis interactions related to game state.
 * - Fetching the full state
 * - Updating partial state
 * - Resetting state
 * - Providing reconnect support
 * 
 * This module contains no game rule logic, it is used to handle persistence.
 */
import redis, { connectRedis } from '@/lib/redis';

// ---- Types ----

/**
 * Defines the configurable settings chosen by the host before game starts.
 */
export interface GameSettings {
    drawingTime: number;                // ex: 90 seconds
    totalRounds: number;                // ex: 3 rounds
    difficulty?: 'easy' | 'medium' | 'hard';
    wordCount?: number;                 // Number of word options shown to drawer (min 3, max 6)
    wordSelectionTime?: number; // how long the drawer has to choose a word
}

/**
 * Represents the shape of the entire game state object stored in Redis.
 */
export interface GameStateData {
    drawerId?: string;
    word?: string;
    round?: number;
    timer?: number;
    scores?: Record<string, number>;            // object that keys must be string and values must be number
    guessedUsers?: string[];
    correctGuessers?: string[];                 // tracks players that have correctly guessed word for chat usage
    playerOrder?: string[];                     // list of player ID's in draw order
    currentDrawerIndex?: number;                // index of who is drawing in current round
    wordOptions?: string[];
    settings?: GameSettings;                    // settings from host
    usedWords?: string[];
    roundScores?: Record<string, number>;       // tracks points earned each round
    players?: { id: string; name: string; disconnected?: boolean }[];
    wordSelectionStart?: number;
    wordSelectionDuration?: number;
    timerStart?: number;
    // To add more fields, add here
}

// ---- GameState Module ----

const GameState = {
    /**
     * Fetches the full game state from Redis for the given lobby.
     * 
     * @param lobbyId - THe unique ID of the lobby
     * @returns Parsed game state object or null if not found
     */
    async get(lobbyId: string): Promise<GameStateData | null> {
        await connectRedis();
        const data = await redis.get(`gamestate:${lobbyId}`);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Saves the full game state to Redis, replacing any existing state.
     * 
     * @param lobbyId - The lobby ID
     * @param state - Full game state object to save
     */
    async set(lobbyId: string, state: GameStateData): Promise<void> {
        await connectRedis();
        await redis.set(`gamestate:${lobbyId}`, JSON.stringify(state), { EX: 7200 });
    },

    /**
     * Updates part of the game state by merging fields into the existing state.
     * 
     * @param lobbyId - The lobby ID
     * @param updates - Partial state fields to merge
     */
    async update(lobbyId: string, updates: Partial<GameStateData>): Promise<void> {
        await connectRedis();
        const existing = await GameState.get(lobbyId);
        const merged = { ...existing, ...updates };
        await GameState.set(lobbyId, merged);
    },

    /**
     * Returns turn-specific data for the reconnecting player, including
     * the drawer, word options, round, and timer.
     * 
     * @param lobbyId - The lobby to fetch from
     * @returns Object with current turn metadata or null if invalid
     */
    async getCurrentTurn(lobbyId: string) {
        const state = await this.get(lobbyId);
        if (!state) return null;

        const { drawerId, wordOptions, round, timer, word } = state;

        if (
            typeof drawerId === 'string' &&
            Array.isArray(wordOptions) &&
            typeof round === 'number'
        ) {
            return { drawerId, wordOptions, round, timer, word };
        }

        return null;
    },

    /**
     * Deletes the entire game state from Redis for a lobby.
     * 
     * @param lobbyId - The lobby to delete
     */
    async delete(lobbyId: string): Promise<void> {
        await connectRedis();
        await redis.del(`gamestate:${lobbyId}`);
    },
};

export default GameState;
