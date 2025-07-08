import GameState from './gameState';
import wordPool from './wordPool';
import { cleanGuess, getPointsForCorrectGuess, wordDistance } from './scoring';

/**
 * GameLogic — Controls the turn-based flow of the game.
 *
 * This file contains core game behavior: starting turns, assigning words,
 * tracking guesses, determining round endings, and rotating drawers.
 *
 * It uses "gameState.ts" to persist data and "scoring.ts" for point calculations.
 */
const GameLogic = {
    // start a new turn for the next player
    async startNextTurn(lobbyId: string): Promise<void> {
        const state = await GameState.get(lobbyId);

        if (!state || !state.playerOrder || state.playerOrder.length === 0) {
            throw new Error(`Cannot start turn — invalid player list for lobby ${lobbyId}`);
        }

        // determine who's drawing next
        const nextIndex = (state.currentDrawerIndex ?? -1) + 1;
        const wrappedIndex = nextIndex % state.playerOrder.length;
        const nextDrawerId = state.playerOrder[wrappedIndex];

        // word settings
        const difficulty = state.settings?.difficulty ?? 'medium';
        const wordCount = Math.max(3, Math.min(state.settings?.wordCount ?? 3, 6));
        const usedWords = state.usedWords ?? [];
        const wordOptions = wordPool.getRandomWords(wordCount, difficulty, usedWords);

        // update game state for new turn
        await GameState.update(lobbyId, {
            drawerId: nextDrawerId,
            currentDrawerIndex: wrappedIndex,
            round: (state.round ?? 0) + 1,
            timer: state.settings?.drawingTime ?? 90, // host sets timer, default value 90
            word: undefined, // word will be set after this
            guessedUsers: [], // reset guesses
            wordOptions,
            roundScores: {}, // reset for the new round
        });
    },

    // used to auto-assign a word if the drawer doesn’t choose
    async autoSelectWord(lobbyId: string, options: string[]): Promise<void> {
        const randomWord = options[Math.floor(Math.random() * options.length)];
        await GameLogic.setWordForDrawer(lobbyId, randomWord);
    },

    // set the chosen word for the drawer
    async setWordForDrawer(lobbyId: string, word: string): Promise<void> {
        const state = await GameState.get(lobbyId);
        if (!state) throw new Error(`No game state found for lobby ${lobbyId}`);

        const updatedUsedWords = [...(state.usedWords ?? []), word];

        await GameState.update(lobbyId, {
            word,
            timer: state.settings?.drawingTime ?? 90, // host sets timer, default value 90
            usedWords: updatedUsedWords,
        });
    },

    // track a player's guess and maybe give them points
    async trackGuess(lobbyId: string, playerId: string, guess: string): Promise<'correct' | 'close' | 'incorrect'> {
        const state = await GameState.get(lobbyId);
        if (!state || !state.word || !state.scores || !state.drawerId || state.timer === undefined) {
            return 'incorrect';
        }

        const cleanedGuess = cleanGuess(guess);
        const cleanedWord = cleanGuess(state.word);

        if (state.guessedUsers?.includes(playerId)) {
            return 'incorrect';
        }

        // correct guess
        if (cleanedGuess === cleanedWord) {
            const updatedScores = { ...state.scores };
            const currentRoundScores = { ...(state.roundScores ?? {}) };
            const guessesSoFar = state.guessedUsers?.length ?? 0;

            // use scoring function to calculate points
            const guesserPoints = getPointsForCorrectGuess({
                guessesSoFar,
                timeLeft: state.timer,
            });

            updatedScores[playerId] = (updatedScores[playerId] ?? 0) + guesserPoints;
            updatedScores[state.drawerId] = (updatedScores[state.drawerId] ?? 0) + 50;

            currentRoundScores[playerId] = (currentRoundScores[playerId] ?? 0) + guesserPoints;

            await GameState.update(lobbyId, {
                guessedUsers: [...(state.guessedUsers ?? []), playerId],
                scores: updatedScores,
                roundScores: currentRoundScores,
            });

            return 'correct';
        }

        // close guess (1 letter off)
        const distance = wordDistance(cleanedGuess, cleanedWord);
        if (distance === 1) {
            return 'close';
        }

        return 'incorrect';
    },

    // check if round should end (either timer expired or all guessed)
    // round ends when all non-drawers have guessed correctly
    // note: later combine this with timer-based logic on the server
    async checkRoundEnd(lobbyId: string): Promise<boolean> {
        const state = await GameState.get(lobbyId);
        if (!state || !state.guessedUsers || !state.playerOrder || !state.drawerId) return false;

        const nonDrawers = state.playerOrder.filter((id) => id !== state.drawerId);
        const everyoneGuessed = nonDrawers.every((id) => state.guessedUsers!.includes(id));

        return everyoneGuessed;
    },

    // rotate to the next drawer/player
    // this is used between rounds if the game is continuing and not ending
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

    // get all correct guessers for the round
    async getCorrectGuessers(lobbyId: string): Promise<string[]> {
        const state = await GameState.get(lobbyId);
        return state?.guessedUsers ?? [];
    },
};

export default GameLogic;
