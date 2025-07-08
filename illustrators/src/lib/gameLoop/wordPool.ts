/**
 * WordPool — Manages word selection for each game round.
 *
 * Generates a list of non-repeating, difficulty-based word options
 * for the drawer to choose from. Also tracks previously used words.
 *
 * Called by "gameLogic.ts" during "startNextTurn()"".
 */


const wordList = {
    easy: ['apple', 'dog', 'car', 'book', 'star', 'sun', 'tree', 'hat', 'fish', 'cake'],
    medium: ['guitar', 'rocket', 'pirate', 'castle', 'camera', 'dragon', 'jungle', 'candle', 'planet', 'bridge'],
    hard: ['microscope', 'telescope', 'revolution', 'algorithm', 'architecture', 'constellation', 'philosophy', 'laboratory'],
};

/**
 * returns a set of unique random words, excluding words previously used in the game.
 *
 * @param count - number of words to return (min 3, max 6)
 * @param difficulty - word difficulty level
 * @param usedWords - words already used in this game (to avoid duplicates)
 */
export function getRandomWords(
    count: number = 3,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    usedWords: string[] = []
): string[] {
    const pool = wordList[difficulty] || wordList['medium'];
    const safeCount = Math.max(3, Math.min(count, 6));

    // filter out already used words
    const available = pool.filter(word => !usedWords.includes(word));

    // fallback: if not enough unique words, allow reuse
    const finalPool = available.length >= safeCount ? available : pool;

    const shuffled = [...finalPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, safeCount);
}

export default {
    getRandomWords,
};
