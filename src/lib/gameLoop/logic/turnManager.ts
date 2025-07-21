/**
 * Location: src/lib/gameLoop/logic/turnManager.ts
 * @file turnManager.ts
 * @description
 * Controls all turn-related game logic, including: 
 * - Selecting the next drawer
 * - Providing word options
 * - Handling guesses
 * - Rotating players
 * - Checking for round-end conditions
 * 
 * All logic here interacts with Redis-backed game state.
 */
import GameState from '../state/gameState';
import wordPool from '../state/wordPool';
import { cleanGuess, getPointsForCorrectGuess, wordDistance } from '../utils/scoring';
import type { GameStateData } from '../state/gameState';

export const TurnManager = {
    /**
     * Starts a new turn by rotating to the next drawer and providing word options.
     * 
     * @param lobbyId - The ID of the game lobby
     * @returns Promise that resolves when state is updated
     */
    async startNextTurn(lobbyId: string): Promise<void> {
        const state = await GameState.get(lobbyId);

        if (!state || !state.playerOrder || state.playerOrder.length === 0) {
            throw new Error(`Cannot start turn — invalid player list for lobby ${lobbyId}`);
        }

        // Determine who's drawing next
        const nextIndex = (state.currentDrawerIndex ?? -1) + 1;
        const wrappedIndex = nextIndex % state.playerOrder.length;
        const nextDrawerId = state.playerOrder[wrappedIndex];

        // Only increment round if we wrapped around AND it's not the first turn
        const isFirstTurn = (state.currentDrawerIndex ?? -1) === -1;
        const isNewRound = wrappedIndex === 0 && !isFirstTurn;
        const newRound = (state.round ?? 1) + (isNewRound ? 1 : 0);


        // -- Word settings --
        // Pull turn settings from host-provided settings (set at game start)
        // These will reflect the custom values chosen by the host (see "socket.ts" startGame)
        const difficulty = state.settings?.difficulty ?? 'medium';
        const wordCount = Math.max(3, Math.min(state.settings?.wordCount ?? 3, 6));
        const usedWords = state.usedWords ?? [];
        const wordOptions = wordPool.getRandomWords(wordCount, difficulty, usedWords);

        // Update game state for new turn
        await GameState.update(lobbyId, {
            drawerId: nextDrawerId,
            currentDrawerIndex: wrappedIndex,
            round: newRound,
            timer: state.settings?.drawingTime ?? 90, // host sets timer, default value 90
            word: undefined, // word will be set after this
            guessedUsers: [], // reset guesses
            wordOptions,
            roundScores: {}, // Reset for the new round
            wordSelectionStart: Date.now(),
            wordSelectionDuration: state.settings?.wordSelectionTime ?? 15,
        });
    },



    /**
     * Fallback: Auto-selects word for the drawer if none is chosen in time. 
     * 
     * @param lobbyId - The lobby in which the word is being set
     * @param options - The available word options to choose from
     * @returns Promise that resolves after the word is set
     */
    async autoSelectWord(lobbyId: string, options: string[]): Promise<void> {
        const randomWord = options[Math.floor(Math.random() * options.length)];
        await TurnManager.setWordForDrawer(lobbyId, randomWord);
    },

    /**
     * Saves the drawer's selected word and updates used word history.
     * 
     * @param lobbyId - The ID of the lobby
     * @param word - The selected word
     * @returns Promise that resolves after state update
     */
    async setWordForDrawer(lobbyId: string, word: string): Promise<void> {
        const state = await GameState.get(lobbyId);
        if (!state) throw new Error(`No game state found for lobby ${lobbyId}`);

        const updatedUsedWords = [...(state.usedWords ?? []), word];

        // without drawerId, turn/route.ts rejects the state as incomplete
        // without clearing wordOptions, the drawer might not get asked again
        // without confirming round, any late joins won't know what round they are on
        await GameState.update(lobbyId, {
            word,
            timer: state.settings?.drawingTime ?? 90,
            usedWords: updatedUsedWords,
            // re-confirm current drawer
            drawerId: state.drawerId,
            // clear after confirming
            wordOptions: [],
            // for consistent round visibility
            round: state.round ?? 1,
        });
    },

    /**
     * Evaluates a guess and updates score if correct.
     * 
     * @param lobbyId - The game lobby ID
     * @param playerId - The ID of the player making the guess
     * @param guess - The guess text input by the player
     * @returns 'correct', 'close', or 'incorrect'
     */
    async trackGuess(
        lobbyId: string,
        playerId: string,
        guess: string
    ): Promise<'correct' | 'close' | 'incorrect'> {
        const state = await GameState.get(lobbyId);
        if (!state || !state.word || !state.scores || !state.drawerId || state.timer === undefined) {
            return 'incorrect';
        }

        const cleanedGuess = cleanGuess(guess);
        const cleanedWord = cleanGuess(state.word);

        console.log('[trackGuess]', { //debug
            lobbyId, // debug
            playerId, // debug
            guess, // debug
            cleanedGuess, // debug
            cleanedWord, // debug
            alreadyGuessed: state.guessedUsers?.includes(playerId), // debug
            alreadyCorrect: state.correctGuessers?.includes(playerId), // debug
        }); // debug

        // Correct guess
        if (cleanedGuess === cleanedWord) {
            const updatedScores = { ...(state.scores ?? {}) };
            const updatedRoundScores = { ...(state.roundScores ?? {}) };

            const guessesSoFar = state.guessedUsers?.length ?? 0;
            if (!state.guessedUsers) state.guessedUsers = [];
            if (!state.correctGuessers) state.correctGuessers = [];

            const guesserPoints = getPointsForCorrectGuess({
                guessesSoFar: state.guessedUsers.length,
                timeLeft: state.timer,
            });

            // Update roundScores
            updatedRoundScores[playerId] = (updatedRoundScores[playerId] ?? 0) + guesserPoints;

            // Update total scores
            updatedScores[playerId] = (updatedScores[playerId] ?? 0) + guesserPoints;

            // Award drawer bonus
            updatedScores[state.drawerId] = (updatedScores[state.drawerId] ?? 0) + 50;

            // Update tracking arrays
            const updatedGuessedUsers = [...state.guessedUsers, playerId];
            const updatedCorrectGuessers = [...state.correctGuessers, playerId];

            // Save everything to Redis as new objects
            await GameState.update(lobbyId, {
                scores: updatedScores,
                roundScores: updatedRoundScores,
                guessedUsers: updatedGuessedUsers,
                correctGuessers: updatedCorrectGuessers,
            });

            console.log('[trackGuess] Final scores after update:', updatedScores);
            return 'correct';
        }

        // Close guess (1 letter off)
        const distance = wordDistance(cleanedGuess, cleanedWord);
        if (distance === 1) {
            return 'close';
        }

        return 'incorrect';
    },

    /**
     * Checks whether the round should end based on guesses,
     * Ends the round when all non-drawers have guessed correctly.
     * 
     * Note: later combine this with timer-based logic on the server?
     * 
     * @param lobbyId - The lobby ID to check
     * @returns True if round should end, false otherwise
     */
    async checkRoundEnd(lobbyId: string): Promise<boolean> {
        const state = await GameState.get(lobbyId);
        if (!state || !state.guessedUsers || !state.playerOrder || !state.drawerId) return false;

        const nonDrawers = state.playerOrder.filter((id) => id !== state.drawerId);
        const everyoneGuessed = nonDrawers.every((id) => state.guessedUsers!.includes(id));

        return everyoneGuessed;
    },

    /**
     * Advances to the next player in the draw order (used between turns).
     * 
     * @param lobbyId - The lobby ID
     * @returns Promise that resolves after state update
     */
    async advanceDrawer(lobbyId: string): Promise<void> {
        const state = await GameState.get(lobbyId);
        if (!state || !state.playerOrder || state.playerOrder.length === 0) return;

        const nextIndex = ((state.currentDrawerIndex ?? -1) + 1) % state.playerOrder.length;
        const nextDrawer = state.playerOrder[nextIndex];

        await GameState.update(lobbyId, {
            drawerId: nextDrawer,
            currentDrawerIndex: nextIndex,
            word: undefined,
            guessedUsers: [],
            timer: state.settings?.drawingTime ?? 90,
        });
    },

    /**
     * Gets the list of users who have guessed correctly during the current round.
     * 
     * Note: Returns the list of correct guessers from Redis.
     * 
     * @param lobbyId - The game lobby ID
     * @returns List of user IDs who guessed correctly
     */
    async getCorrectGuessers(lobbyId: string): Promise<string[]> {
        const state = await GameState.get(lobbyId);
        return state?.guessedUsers ?? [];
    },

    /**
     * Synchronous helper to get correct guessers from an in-memory state object.
     * Used for filtering chat visibility.
     * 
     * Note: If we do not have this, players will no longer be marked as a correct guesser and will get
     * access to a public chat which allows the correct guessers to expose the answer. 
     * 
     * Note: 'correctGuessers' is in Redis so we can have it persist across socket reconnexts, page refreshes, and multiple users.
     * 
     * @param state - A snapshot of the current game state
     * @returns Array of player IDs who guessed correctly
     */
    getCorrectGuessersSync(state: GameStateData | null): string[] {
        return state?.correctGuessers ?? [];
    },


};

/**
 * Checks if the drawer failed to pick a word in time, and selects one automatically.
 * 
 * If the selection time has expired and the word has not been chosen yet, this
 * function will automatically select a random word from the available options
 * by calling "TurnManager.autoSelectWord()".
 * 
 * This function is inteded to be run periodically (e.g., in a server loop or interval)
 * during the word selection phas to ensure the game continues smoothly if the drawer
 * becomes inactive or takes too long.
 * 
 * Relies on: 
 * - "wordSelectionStart": timestamp of when the drawer was prompted to choose
 * - "wordSelectionDuration": allowed time (in seconds) for word selection
 * - "wordOptions": the list of valid word choices
 * 
 * Safe to call multiple times because it will only act if the conditions are met.
 */
export async function checkWordSelectionTimeout(lobbyId: string): Promise<string | null> {
  const state = await GameState.get(lobbyId);
  if (!state || state.word || !state.wordOptions?.length) return null;

  const start = state.wordSelectionStart;
  const duration = state.wordSelectionDuration ?? 15;

  if (!start || Date.now() < start + duration * 1000) return null;

  console.log('[TurnManager] Word selection timed out — auto-picking');

  const randomWord = state.wordOptions[Math.floor(Math.random() * state.wordOptions.length)];
  await TurnManager.setWordForDrawer(lobbyId, randomWord);

  return randomWord; // let socket.ts handle timer + emit
}

export default TurnManager;
