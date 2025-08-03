// Determines if a player should see a chat message
/**
 * Determines if a player should see a chat message
 * @param param0 
 * @returns Result
 */
export function canSeeMessage({
    msg,
    youId,
    isDrawer,
    correctGuessers,
}: {
    msg: { playerId: string; playerName: string; isPrivate: boolean };
    youId: string;
    isDrawer: boolean;
    correctGuessers: string[];
}): boolean {
    const isSystem = msg.playerId === '__SYSTEM__';
    const isYou = msg.playerId === youId;
    const isSenderCorrect = correctGuessers.includes(msg.playerId);

    if (isSystem) {
        // private system messages (like “You’re close!”) are only shown to the target guesser
        return !msg.isPrivate || msg.playerName === youId;
    }

    if (isDrawer) return true;
    if (isYou) return true;
    if (!isSenderCorrect && !msg.isPrivate) return true;

    return false;
}
