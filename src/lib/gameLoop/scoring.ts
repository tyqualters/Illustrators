/**
 * Scoring Helpers — Utility functions for calculating points and comparing guesses.
 *
 * This file contains helper functions for cleaning up player guesses,
 * calculating score bonuses, and ensuring consistent scoring logic.
 *
 * Used by "gameLogic.ts" during each guess evaluation.
 */


/**
 * Cleans up a player's guess to make it easier to compare against the correct word.
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes basic punctuation
 *
 * @param input - The player's guess
 * @returns A cleaned version of the guess
 */
export function cleanGuess(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[.,!?'"-]/g, '');
}

/**
 * Calculates the score for a correct guess, using two different strategies:
 * - First guesser: Bonus based on time left
 * - Later guessers: Flat score that drops per guesser
 *
 * @param guessesSoFar - How many players already guessed correctly
 * @param timeLeft - Seconds left on the timer
 * @param basePoints - Default point value for a correct answer
 * @param firstBonusMultiplier - How much to scale the bonus for being first
 * @returns The score to award to the player
 */
export function getPointsForCorrectGuess({
    guessesSoFar,
    timeLeft,
    basePoints = 100,
    firstBonusMultiplier = 2,
}: {
    guessesSoFar: number;
    timeLeft: number;
    basePoints?: number;
    firstBonusMultiplier?: number;
}): number {
    if (guessesSoFar === 0) {
        // First correct guesser gets base + bonus
        return Math.floor((basePoints + timeLeft) * firstBonusMultiplier);
    }

    const pointsDropPerCorrectGuess = 25;
    return Math.max(50, basePoints - pointsDropPerCorrectGuess * guessesSoFar);
}

/**
 * Calculates how many single-character edits (insertions, deletions, substitutions)
 * are required to turn string 'a' into string 'b'.
 *
 * Levenshtein distance
 * https://www.30secondsofcode.org/js/s/levenshtein-distance/ 
 * Used to detect if a guess is "close" to the correct answer.
 *
 * @param a - The player's guess (lowercased, trimmed)
 * @param b - The correct word (lowercased, trimmed)
 * @returns The number of single-character edits between 'a' and 'b'
 *
 * Example:
 *   wordDistance("apple", "appl") = 1
 *   wordDistance("apple", "apple") = 0
 *   wordDistance("apple", "banana") = 5
 */
export function wordDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[a.length][b.length];
}
