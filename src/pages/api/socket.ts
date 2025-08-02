/**
 * @file src/pages/api/socket.ts
 * @description
 * This file initializes and manages the Socket.IO server endpoint for real-time
 * game interactions in the game. It handles player connections/disconnections, lobby 
 * joins, game lifecycle (start, turns, guesses, round/word flow), and Redis-backed 
 * state and canvas sharing
 * 
 * Note: round and turn have been used interchangeably in some instances which may
 * cause confusion since a round and turn are NOT the same thing. To Do: Refactor
 * these variables to reduce confusion. 
 */

// Imports
import { Server as HTTPServer } from 'http';                                    // regular web server
import { Server as IOServer } from 'socket.io';                                 // manages websocket connections
import type { NextApiRequest, NextApiResponse } from 'next';                    // types that describe what kind of req and res being dealt
import { shouldEndGame } from '@/lib/gameLoop/logic/gameManager';               // helper function to find out if game should end
import { clearTurnData } from '@/lib/gameLoop/logic/turnCleanup';               // resets temp data like canvas and timers at end of round
import type { Server as IOServerType } from 'socket.io';  // helps type-check variables
import { endGameAndCleanup } from '@/lib/gameLoop/logic/gameManager';           // ends game and removes game state from Redis+MongoDB
import { checkWordSelectionTimeout } from '@/lib/gameLoop/logic/turnManager';   // auto-picks a word if the drawer takes too long
import type { Socket as NetSocket } from 'net';

// Core Modules
import TurnManager from '@/lib/gameLoop/logic/turnManager';                     // handles whose turn it is, scoring, etc
import GameState from '@/lib/gameLoop/state/gameState';                         // talks to Redis to save/load the current game state
import redis from '@/lib/redis';                                                // redis connection 
import Lobby from '@/models/Lobby';

// ----- Helper Function -----
/**
 * Emits drawer:wordConfirmed event to all players in the lobby.
 * 
 * This function is called when a drawer selects a word (or when server aut-selects one). 
 * It makes sure that a turn timer is set, the canvas exists, and all of the relevant turn data
 * for the round is ready. It will then send this info to all connected clients in the lobby to
 * start the drawing phase of the turn.
 * 
 * @param io - Socket.IO server instance used to emit events
 * @param lobbyId - the ID of the game lobby (used for Redis keys and room targeting)
 * @param drawerId - the ID of the player who will be drawing this turn/round
 * @returns void (does not return a value, but sends data to clients using socekt)
 */
async function emitWordConfirmed(io: IOServerType, lobbyId: string, drawerId: string) { // use await to wait for promise-based operations
    // pulls latest game state from Redis for this lobby (chosen word, round #, timer, etc)
    const updated = await GameState.get(lobbyId);

    // safety check: if there is no word, timer, or round is not a number, stop. Prevents function from breaking/sending bad data
    if (!updated?.word || !updated?.timer || typeof updated.round !== 'number') return;

    // tries to grab the current drawing canvas from redis, players can refresh and join and see the current drawing
    let canvasData = await redis.get(`canvas:${lobbyId}`);

    // if redis has no canvas data yet...
    if (!canvasData) {
        const blankCanvas = JSON.stringify({ version: '4.6.0', objects: [] });  // ...create a blank canvas using Fabric.js format, 'objects: []' = empty drawing
        await redis.set(`canvas:${lobbyId}`, blankCanvas, { EX: 7200 });        // stores it in Redis with 2-hour expiration
        canvasData = blankCanvas;
    }

    // stores the timer value for how long the round should last (default: 90s)
    const duration = updated.timer;

    // saces the start time and duration of the roun din redis to help everyone calculate "time left" later (even on refresh)
    await redis.set(`timer:${lobbyId}:start`, Date.now().toString(), { EX: 7200 });     // when drawer starts drawing (now)
    await redis.set(`timer:${lobbyId}:duration`, duration.toString(), { EX: 7200 });    // how long turn should last

    // sends the drawer:wordConfirmed event to all players in the room
    io.to(lobbyId).emit('drawer:wordConfirmed', {
        drawerId,                       // who is drawing
        word: updated.word,             // the word they picked
        timer: updated.timer,           // how long the round (turn) will last
        timerStart: Date.now(),         // when it started
        round: updated.round,           // current round number
        canvas: JSON.parse(canvasData), // the current canvas so players can sync it
    });
}

// ----- Socket.IO Endpoint Config -----
export const config = {             // tells next.js how to handle this API route
    api: { bodyParser: false },     // prevents next.js from interfering with websocket data
};

type NextApiResponseWithSocketIO = NextApiResponse & {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: IOServerType;
    };
  };
};

// ----- Socket.IO Endpoint Config -----
// main function for socket API route
export default function handler(req: NextApiRequest, res: NextApiResponse) { // req: incoming request from client, res: response object used at the end
    const resAny = res as NextApiResponseWithSocketIO; // not best practice (using any) but silences typescript for now

    // checks if socket server has already been created, if not, create one (avoids multiple socket servers)
    if (!resAny.socket?.server?.io) {
        console.log('Initializing Socket.IO server...');    // log to see whats happening 

        // grabs raw HTTP server from next.js
        const httpServer = resAny.socket.server as HTTPServer; // needed since socket.io needs to hook directly into low level server

        // initializes new socket server and attaches it to HTTP server
        const ioServer = new IOServer(httpServer, {
            path: '/api/socket/io',     // defines the custom endpoint the client should use to connect
            addTrailingSlash: false,    // prevents URLs with a slash at the end to be interpreted weirdly
        });

        // ----- Helper: Emit next turn for next drawer -----
        /* This function starts the next player's turn in the game. It is called when the game starts 
            or when the one player finishes their turn.
        */
        const emitNextTurn = async (lobbyId: string) => {
            await TurnManager.startNextTurn(lobbyId);       // updates redis to set the next drawer and create new word options
            const nextState = await GameState.get(lobbyId); // pulls the updated game state (after turn has advanced)

            // validates the data (needs drawer, word options, and round number), if anything is missing, stop function and log error.
            if (!nextState?.drawerId || !nextState.wordOptions || typeof nextState.round !== 'number') {
                console.error('Invalid next state on next turn');
                return;
            }

            // Emit to all players: sends the new turn info to all clients
            ioServer.to(lobbyId).emit('game:turnStarted', {
                drawerId: nextState.drawerId,       // who is drawing
                wordOptions: nextState.wordOptions, // which words to chose from
                timer: nextState.timer,             // the timer and current round (turn)
                round: nextState.round,             // how many total round

                // Reflects "totalRounds" from host settings (used for progress UI)
                totalRounds: nextState.settings?.totalRounds,
            });

            // Clear previous word selection timeout interval, if any. Word Selection timeout monitoring
            if (turnTimeouts[lobbyId]) {
                clearInterval(turnTimeouts[lobbyId]);
                delete turnTimeouts[lobbyId];
            }

            /* Start a new inteerval to monitor word selection timeout
            
                turnTimeouts is a dictionary that stores timers for each lobby.
                A timer tuns every 1000 milliseconds or 1 second
                For each lobby, this repeatedly checks if the drawer has picked a word yet.
            */
            turnTimeouts[lobbyId] = setInterval(async () => {
                // try to auto-select word if needed
                try {
                    // await helper function that checks if the drawer took too long to choose and if they have it will pick a word automatically
                    const selectedWord = await checkWordSelectionTimeout(lobbyId);

                    // if a word was selected by either player or server...
                    if (selectedWord) {
                        const after = await GameState.get(lobbyId);     // ...get updated game state with new word

                        // if we have a drawer, 
                        if (after?.drawerId) {
                            // we log and call 'emitWordConfirmed()' to  tell players word confirmed, start drawer timer, share canvas, and begin guessing
                            console.log('[Word Timeout] Auto-selected word, emitting drawer:wordConfirmed');
                            await emitWordConfirmed(ioServer, lobbyId, after.drawerId);

                            // gets drawing timer from game state (defaults to 90 if missing)
                            const duration = after?.timer ?? 90;

                            // starts a one-time timer that runs after however long the duration is in seconds
                            setTimeout(async () => {
                                const latest = await GameState.get(lobbyId);

                                // checks if the round already ended
                                const alreadyEnded =
                                    // if we dont have a game state, assume it is over
                                    !latest ||

                                    // or have we already ended this turn and recorded the scores?, its over
                                    Object.keys(latest.roundScores ?? {}).length > 0 ||

                                    // or if all guessers have guessed correctly, its over
                                    (latest.guessedUsers?.length ?? 0) >=
                                    (latest.playerOrder?.length ?? 0) - 1;

                                // force the round to end if the drawer ran out of time
                                if (!alreadyEnded) {
                                    console.log(`[SERVER] Timeout reached — ending round for ${lobbyId}`);
                                    await handleEndOfRound(lobbyId); // to wrap up the turn, show scores, and prepare for next turn
                                }
                            }, duration * 1000);
                        }

                        clearInterval(turnTimeouts[lobbyId]);   // stops the 1s interval from running forever
                        delete turnTimeouts[lobbyId];           // removes it from memory for this lobby
                    }

                } catch (err) {
                    // error handling
                    console.error(`[Word Timeout] Failed to check/emit for ${lobbyId}:`, err);
                }
            }, 1000);
        };

        // ----- Helper: Handle round end (timeout or all guessed) -----
        const handleEndOfRound = async (lobbyId: string) => {

            // Emit round end and advance drawer like normal
            const state = await GameState.get(lobbyId);
            if (!state?.roundScores || !state.scores || !state.round || !state.playerOrder) return;

            ioServer.to(lobbyId).emit('game:roundEnded', {
                totalScores: state.scores,
                roundScores: state.roundScores,
                round: state.round,
            });

            await clearTurnData(lobbyId);

            setTimeout(async () => {
                const state = await GameState.get(lobbyId);
                if (!state) {
                    console.error('[handleEndOfRound] No state found for lobby', lobbyId);
                    return;
                }

                const shouldEnd = shouldEndGame(state);

                if (shouldEnd) {
                    const finalScores = await endGameAndCleanup(lobbyId);
                    if (finalScores) {
                        ioServer.to(lobbyId).emit('game:ended', { finalScores });
                    }
                } else {
                    await emitNextTurn(lobbyId);
                }
            }, 5000);
        };


        // Universal function to send a chat message to the correct players
        function broadcastChatMessage(
            ioServer: IOServerType,
            lobbyId: string,
            message: { playerId: string; playerName: string; text: string; isPrivate?: boolean }
        ): void {
            GameState.get(lobbyId).then((state) => {
                if (!state) return;

                const drawerId = state.drawerId;
                const correctGuessers = TurnManager.getCorrectGuessersSync(state);
                const senderIsCorrect = correctGuessers.includes(message.playerId);
                const isPrivate = senderIsCorrect;

                const fullMessage = { ...message, isPrivate };

                ioServer.in(lobbyId).fetchSockets().then((clients) => {
                    clients.forEach((socket) => {
                        const recipientId = socket.data.playerId;
                        const recipientIsDrawer = recipientId === drawerId;
                        const recipientIsCorrect = correctGuessers.includes(recipientId);

                        // Special case: always show SYSTEM messages to everyone
                        const isSystemMessage = message.playerId === '__SYSTEM__';
                        const shouldReceive =
                            isSystemMessage || // system messages go to everyone
                            recipientIsDrawer ||
                            (senderIsCorrect && recipientIsCorrect) ||
                            (!senderIsCorrect && !recipientIsCorrect);

                        if (shouldReceive) {
                            socket.emit('chat', fullMessage);
                        }
                    });
                });
            });
        }


        const turnTimeouts: Record<string, NodeJS.Timeout> = {};
        const disconnectTimeouts: Record<string, NodeJS.Timeout> = {};

        // ----- Core Socket.IO Handlers -----
        ioServer.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // --- Player joins a lobby ---
            socket.on('join', async (player) => {

                const { lobbyId, name } = player;
                const id = player.id || socket.id;

                socket.join(lobbyId);
                socket.data.lobbyId = lobbyId;
                socket.data.playerId = id;
                socket.data.name = name;

                console.log('[SERVER] player joined room:', { // debug
                    socketId: socket.id, // debug
                    playerId: id, // debug
                    name, // debug
                    lobbyId, // debug
                }); // debug

                const socketsInRoom = await ioServer.in(lobbyId).fetchSockets(); // debug
                console.log('[SERVER] Sockets currently in room after join:', socketsInRoom.map(s => s.id)); // debug

                const state = await GameState.get(lobbyId);
                const updatedPlayers = [...(state?.players ?? [])];
                const updatedOrder = [...(state?.playerOrder ?? [])];

                const existingIndex = updatedPlayers.findIndex(p => p.id === id);

                if (existingIndex !== -1) {
                    // Player is reconnecting: update name (just in case) and clear "disconnected"
                    updatedPlayers[existingIndex] = {
                        ...updatedPlayers[existingIndex],
                        name,
                        disconnected: false,
                    };
                } else {
                    // New player joining for the first time
                    updatedPlayers.push({ id, name });
                    updatedOrder.push(id);
                }

                await GameState.update(lobbyId, {
                    players: updatedPlayers,
                    playerOrder: updatedOrder,
                });

                ioServer.to(lobbyId).emit('playersUpdated', updatedPlayers);
            });

            // --- Canvas updates from drawer ---
            socket.on('canvas-update', async (data) => {  // drawer sends canvas updates to Redis + others
                const lobbyId = socket.data.lobbyId;
                if (!lobbyId) return;

                await redis.set(`canvas:${lobbyId}`, JSON.stringify(data), { EX: 7200 });
                socket.to(lobbyId).emit('canvas-update', data);
            });

            // --- Request canvas on reconnect/join ---
            socket.on('request-canvas', async () => { // when a player joins/reconnects, they request canvas (might be optional)
                const lobbyId = socket.data.lobbyId;
                if (!lobbyId) return;

                const data = await redis.get(`canvas:${lobbyId}`);
                if (data) {
                    socket.emit('canvas-update', JSON.parse(data));
                }
            });

            // --- Handle disconnection ---
            socket.on('disconnect', async () => {
                const lobbyId = socket.data.lobbyId;
                if (!lobbyId) return;

                const playerId = socket.data.playerId;
                const state = await GameState.get(lobbyId);
                if (!state) return;

                // mark player as disconnected instead of removing them
                const updatedPlayers = (state.players ?? []).map(p =>
                    p.id === playerId ? { ...p, disconnected: true } : p
                );

                await GameState.update(lobbyId, { players: updatedPlayers });

                // notify others
                ioServer.to(lobbyId).emit('playersUpdated', updatedPlayers);

                // wait 10 seconds to allow reconnection before checking player count
                if (disconnectTimeouts[lobbyId]) {
                    clearTimeout(disconnectTimeouts[lobbyId]);
                }
                disconnectTimeouts[lobbyId] = setTimeout(async () => {
                    const latest = await GameState.get(lobbyId);
                    if (!latest?.players) return;

                    const connectedPlayers = latest.players.filter(p => !p.disconnected);

                    if (connectedPlayers.length <= 1) {
                        console.log(`[SERVER] Only one player left in lobby ${lobbyId}, ending game.`);

                        const finalScores = await endGameAndCleanup(lobbyId);
                        if (finalScores) {
                            ioServer.to(lobbyId).emit('game:ended', { finalScores });
                        }

                        clearTimeout(disconnectTimeouts[lobbyId]);
                        delete disconnectTimeouts[lobbyId];
                    }
                }, 10000); // 10 seconds
            });


            // --- Start the game ---
            // To Do: Accept host-related settings, socket payload (like from lobby settings screen)
            socket.on('startGame', async ({ lobbyId/*, settings */ }) => {

                const state = await GameState.get(lobbyId);

                if (!state || !Array.isArray(state.players) || state.players.length < 2) {
                    socket.emit('error', { message: 'At least 2 players are required to start the game.' });
                    return;
                }

                // load host settings from monGODb
                const mongoLobby = await Lobby.findById(lobbyId);
                const hostSettings = mongoLobby?.settings ?? {
                    drawingTime: 90,        // how long each drawing round lasts (seconds)
                    totalRounds: 3,         // how many rounds in total
                    difficulty: 'medium',   // word difficulty lvl
                    wordCount: 3,           // number of word options to show drawer
                    wordSelectionTime: 15,
                };

                await GameState.set(lobbyId, {
                    scores: {},
                    round: 1,
                    playerOrder: state.players.map((p) => p.id),
                    currentDrawerIndex: -1,
                    usedWords: [],
                    players: state.players,
                    settings: hostSettings, // use mongo settings
                });

                // emit settings back to all players before first turn
                ioServer.to(lobbyId).emit('gameStarted', { settings: hostSettings });

                await emitNextTurn(lobbyId);

            });

            // --- Word selected by drawer ---
            /*
            Listens for the event 'drawer:wordSelected', which is sent from the drawer's browser when they clikc
            on a word. lobbyID is the game room this is for and the word is the word they selected.
            */
            socket.on('drawer:wordSelected', async ({ lobbyId, word }) => {
                console.log('[SOCKET] drawer:wordSelected called for', lobbyId, 'with word:', word); // debug (verify event was received)

                // stores the selected word in redis and makes it available for scoring guesses later
                await TurnManager.setWordForDrawer(lobbyId, word);

                /*
                Stops the word selection timeout interval if still running.
                When the server started the word selection phase, it created an internal('setInterval') to auto-
                select a word after 15 seconds and since the drawer picksed a word in time, we clear the timeout so 
                that the event does not fire later
                */
                if (turnTimeouts[lobbyId]) {
                    clearInterval(turnTimeouts[lobbyId]);
                    delete turnTimeouts[lobbyId];
                    console.log(`[turnTimeouts] Cleared for lobby ${lobbyId}`); // debug
                }

                /*
                This gets the updated game state and double checks that the game state is valid. 
                Stop early to avoid errors if data (drawerID, timer, round) is missing
                */
                const updated = await GameState.get(lobbyId);
                if (!updated?.drawerId || !updated.timer || typeof updated.round !== 'number') {
                    console.error('Invalid game state in wordSelected');
                    return;
                }

                // set timer from settings (host-configured drawing time)
                await GameState.update(lobbyId, {
                    timer: updated.settings?.drawingTime ?? 90,
                });

                /*
                Stores start time and duration in redis. It sets 2 keys in redis for when the timer started and how long
                it lasts. The values are used if a player reconnects mid-round and needs to see how much time is left.  
                */
                const duration = updated.settings?.drawingTime ?? 90;
                await redis.set(`timer:${lobbyId}:start`, Date.now().toString(), { EX: 7200 });     // expires in 2 hours
                await redis.set(`timer:${lobbyId}:duration`, duration.toString(), { EX: 7200 });    // expires in 2 hours

                console.log(`[DEBUG] Set timer for lobby ${lobbyId}`, { // debug
                    start: Date.now(), // debug
                    duration, // debug
                }); // debug

                /*
                Ensures canvas exists. This checks if there is already a saved canvas in redis and if not, it creates a blank once
                so that there are no issues when the drawing starts. 
                */
                let canvasData = await redis.get(`canvas:${lobbyId}`);
                if (!canvasData) {
                    const blankCanvas = JSON.stringify({ version: '4.6.0', objects: [] });
                    await redis.set(`canvas:${lobbyId}`, blankCanvas, { EX: 7200 });
                    canvasData = blankCanvas;
                }

                /* 
                Tell everyone that the round is starting. Sends a 'drawer:wordConfirmed' event to all clients. 
                Emits word confirmed (only to drawer) + timer + canvas
                */
                await emitWordConfirmed(ioServer, lobbyId, socket.data.playerId);

                /*
                Turn Timeout Logic: Sets a one-time timer to end the round if it runs out. 
                Runs after 'duration' seconds (default 90s). It checks if the round already ended and if not it ends it.
                Ensures that the round is only ended once (even if there are player reconnects and word is re-confirmed)
                */
                setTimeout(async () => {

                    /*
                    If we already have 'roundScores', or all guessers have guessed, we don't do anything;
                    */
                    const latest = await GameState.get(lobbyId);

                    const alreadyEnded =
                        !latest ||
                        Object.keys(latest.roundScores ?? {}).length > 0 ||
                        (latest.guessedUsers?.length ?? 0) >=
                        (latest.playerOrder?.length ?? 0) - 1;

                    /*
                    otherwise, ends the round and triggers the next one or ends the game
                    */
                    if (!alreadyEnded) {
                        console.log(`[SERVER] Timeout reached - ending round for ${lobbyId}`);
                        await handleEndOfRound(lobbyId);
                    }
                }, duration * 1000);
            });


            // --- Player makes a guess ---
            /*
            Listens for a guess event from any client. 
            lobbyID = lobby the player is in, playerID = who made the guess, guess = what they typed.
            */
            socket.on('guess', async ({ lobbyId, playerId, guess }) => {
                // when a round (turn) times out (drawer didn't finish or no one guessed), the server will emit a fake 'guess' with __TIMER__ and __TIMEOUT__.
                if (playerId === '__TIMER__' && guess === '__TIMEOUT__') {
                    await handleEndOfRound(lobbyId);
                    return;
                }

                // evaluate the player's guess, returning 1 outta 3 possible results (correct, close, incorrect)
                const result = await TurnManager.trackGuess(lobbyId, playerId, guess);

                // --- Close Guesses ---
                // Emit the actual guess publicly (like incorrect guesses)
                if (result === 'close') {   // one letter off
                    // receive latest state to know player names and redis context to display messages properly and send to the right people
                    const state = await GameState.get(lobbyId);
                    if (!state) return;

                    // find player's name, fallback to guest if not 
                    const playerName = state.players?.find(p => p.id === playerId)?.name || 'Guest';

                    // Broadcast the close guess as normal chat (this is the actual guess, not the "you're close" message)
                    broadcastChatMessage(ioServer, lobbyId, {
                        playerId,
                        playerName,
                        text: guess,
                    });

                    // Send "you're close" feedback only to that guesser
                    const socketClient = [...(await ioServer.in(lobbyId).fetchSockets())].find(
                        (s) => s.data.playerId === playerId
                    );

                    // finds the socket that matches the guessing player, other players (even drawer) do not see this
                    if (socketClient) {
                        socketClient.emit('chat', {
                            playerId: '__SYSTEM__',
                            playerName: playerId, // to enable close guesses
                            text: `You're close!`,
                            isPrivate: true,
                        });
                    }
                    // Allow the guess to still show up in chat to everyone (do not use "return;"), we want the function to keep going to check all messages sent,
                    // not just stop when a conditions matches once
                }

                // pull current game state to look up player names and determine round progress
                const state = await GameState.get(lobbyId);
                if (!state) return;

                // guessers name and fallback
                const playerName = state.players?.find(p => p.id === playerId)?.name || 'Guest';

                // Send to scoring UI / leaderboard, tells all players in the lobby what happened
                ioServer.to(lobbyId).emit('guessReceived', {
                    playerId,
                    playerName,
                    // guess,
                    result,
                });

                /*
                Ensures that correct guesses never show up as normal chat messages.
                It was a wrong guess so we send it as a public chat message so the drawer sees what was guessed and other guessers can see it too. 
                Correct guessers are never shown in chat to prevent spoilers.
                */
                if (result === 'incorrect') {
                    // Only broadcast incorrect and close guesses
                    broadcastChatMessage(ioServer, lobbyId, {
                        playerId,
                        playerName,
                        text: guess,
                    });
                }

                /*
                System message for correct guess. Everyone receives the message when someone is correct and the actual word is never shown,
                just to the person who got it right. Can be styled differently on the frontend.
                */
                if (result === 'correct') {
                    broadcastChatMessage(ioServer, lobbyId, {
                        playerId: '__SYSTEM__',
                        playerName: 'System',
                        text: `${playerName} guessed the word!`,
                        isPrivate: false,
                    });
                }

                // Checm if the round should end
                const shouldEnd = await TurnManager.checkRoundEnd(lobbyId); // checks if all non drawers have guessed correctly
                if (shouldEnd) await handleEndOfRound(lobbyId);             // stops turns, shows scores, and preps for next turn (or end)
            });

            /*
            Listens for regular chat messages, not guesses.
            Player can send message in the chat box, the message is received as a chat event, and the server can then get the player who sent it and
            determines who gets to see the chat message. 
            */
            socket.on('chat', async ({ lobbyId, text }) => {
                const senderId = socket.data.playerId;
                const senderName = socket.data.name || 'Guest';

                /* 
                This is required since not everyone can see all chat messages depending on where they are in the turn.
                For example, if someone guessed the word correctly, the people who haven't yet guessed should not be able
                to see what the correct guesser is saying in chat to prevent spoilers. 
                */
                broadcastChatMessage(ioServer, lobbyId, {
                    playerId: senderId,
                    playerName: senderName,
                    text,
                });
            });

        });

        // Attach to server: saves new socket.io server to the .io field so it won't initialize again on the next request
        resAny.socket.server.io = ioServer;
    }

    // finish HTTP response
    res.end();
}
