/**
 * Location: src/lib/gameLoop/wordPool.ts
 * 
 * WordPool — Manages word selection for each game round.
 *
 * Generates a list of non-repeating, difficulty-based word options
 * for the drawer to choose from. Also tracks previously used words.
 *
 * Called by 'gameLogic.ts' during 'startNextTurn()'.
 */


/**
 * Location: src/lib/gameLoop/state/wordPool.ts
 * @file wordPool.ts
 * @description
 * WordPool - Manages difficulty-based word selection for each game round.
 * 
 * Provides a method for generating a set of random, non-repeating words for
 * the drawer to choose from, based on the difficulty level and any previously
 * used words.
 * 
 * Used by TurnManager during each new round ("startNextTurn()")
 */

// Currently: internal word bank group by difficulty
// Future: use external data
const wordList = {
    easy: ['Shoe','Door','Trash Can','Christmas Tree','Television','Moon','Eyes','Spider','Snow','Drum','Shirt','Sad','Doll','Cup','Fish','Sandwich','Cookie','Socks','Book','Pants','Happy','Roof','Candy','Skateboard','Sun','Water','Bed','Hat','Rooster','Dress','Airplane','Bubbles','Ocean','Ball','Banana','Butterfly','Cupcake','Rainbow','Grapes','Pizza','House','Sleep','Egg','Bird','Octopus','Star','Coffee','Apple','Mailbox','Nose','Tree','Cat','Leg','Lips','Cloud','Orange'],
    medium: ['List','Firefighter','Sunglasses','Pancakes','Wing','Gummy Bears','Storm','Garbage','Vacation','Pillowcase','Police','Sleeping Bag','Elbow','Desk','Winter','Rice','Laptop','Turkey','Flag','Bookshelf','Hair Tie','Farm','Sand','Watch','Toaster','Recess','Braces','Internet','Subway','Teacher','Jack-O-Lantern','Heaven','Tent','Clock','Student','Mermaid','Hamburger','City','Chef'],
    hard: ['Detention','Comfy','Peace','Sleepover','Laugh','Boring','Morning','Calendar','Panda','Afraid','Far','Ice Skating','Homerun','Team Captain','Communication','Eraser','Imagination','	Panic','Gum Under The Desk','Sunscreen','Dictionary','Alarm','Parents','Closet','Falling','Street Sweeper','Dripping','Pain','Glue','Hibernation','Hot','Hair','Famished','Toilet Paper','Drinking Fountain','Magic','Shrimp','Group','Dark','Homeless','Exhausted','Bake Sale'],
};


/**
 * Generates a list of unique random words based on difficulty and excluding
 * previously used ones. Falls back to reusing the full pool if not enough unused words 
 * are available.
 * 
 * @param count - Number of word options to return (min 3, max 6)
 * @param difficulty - Difficulty level: 'easy' | 'medium' | 'hard'
 * @param usedWords - Words already used in the game (to avoid repeating them)
 * @returns An array of random word options
 */
export default function getRandomWords(
    count: number = 3,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    usedWords: string[] = []
): string[] {
    const pool = wordList[difficulty] || wordList['medium'];
    const safeCount = Math.max(3, Math.min(count, 6));

    // remove any words already used in this game
    const available = pool.filter(word => !usedWords.includes(word));

    // if too few remain, allow reuse of the full list (fallback)
    const finalPool = available.length >= safeCount ? available : pool;

    // shuffle and select the desired count
    const shuffled = [...finalPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, safeCount);
}