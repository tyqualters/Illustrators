// This is the server-side logic for socket.io

import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Socket } from 'net';

import GameLogic from '@/lib/gameLoop/gameLogic';
import GameState from '@/lib/gameLoop/gameState';

type NextApiResponseWithSocket = Omit<NextApiResponse, 'socket'> & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

// disable body parsing because socket.io manages the raw request
export const config = {
    api: { bodyParser: false },
};

// main handler for api route
export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    // only initializes the socket server once
    if (!res.socket?.server?.io) {
        console.log('Initializing Socket.IO server...');

        const httpServer = res.socket.server as HTTPServer;

        // create a new socket.io server instance
        const ioServer = new IOServer(httpServer, {
            path: '/api/socket/io', // custom path to avoid conflicts
            addTrailingSlash: false,
        });

        // handle a new socket connect
        ioServer.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // logic for player joining lobby
            socket.on('join', async (player) => {
                const { lobbyId, name } = player;
                const id = player.id || socket.id;

                // join the lobby room
                socket.join(lobbyId);
                socket.data.lobbyId = lobbyId;
                socket.data.playerId = id;
                socket.data.name = name;

                const state = await GameState.get(lobbyId);
                const updatedPlayers = [...(state?.players ?? [])];
                const updatedOrder = [...(state?.playerOrder ?? [])];

                // add player if not already present
                if (!updatedPlayers.some(p => p.id === id)) {
                    updatedPlayers.push({ id, name });
                    updatedOrder.push(id);
                    await GameState.update(lobbyId, { players: updatedPlayers, playerOrder: updatedOrder });
                }

                // notify all clients in the lobby of the updated player list
                ioServer.to(lobbyId).emit('playersUpdated', updatedPlayers);
            });

            // handle player disconnecting
            socket.on('disconnect', async () => {
                const lobbyId = socket.data.lobbyId;
                if (!lobbyId) return;

                const state = await GameState.get(lobbyId);
                if (!state) return;

                // remove player from lobby state
                const updatedPlayers = (state.players ?? []).filter(p => p.id !== socket.data.playerId);
                const updatedOrder = (state.playerOrder ?? []).filter(id => id !== socket.data.playerId);

                await GameState.update(lobbyId, { players: updatedPlayers, playerOrder: updatedOrder });

                ioServer.to(lobbyId).emit('playersUpdated', updatedPlayers);

                // end the game if fewer than 2 players remain
                if (updatedOrder.length < 2) {
                    ioServer.to(lobbyId).emit('game:ended');
                }
            });

            // host starts the game
            socket.on('startGame', async ({ lobbyId }) => {
                const state = await GameState.get(lobbyId);
                if (!state || !Array.isArray(state.players) || state.players.length < 2) {
                    socket.emit('error', { message: 'At least 2 players are required to start the game.' });
                    return;
                }

                // initialize game state
                await GameState.set(lobbyId, {
                    scores: {},
                    round: 0,
                    playerOrder: state.players.map(p => p.id),
                    currentDrawerIndex: -1,
                    usedWords: [],
                    settings: {
                        drawingTime: 90,
                        totalRounds: 3,
                        difficulty: 'medium',
                        wordCount: 3,
                    },
                    players: state.players,
                });

                // start the first turn
                await GameLogic.startNextTurn(lobbyId);

                const updated = await GameState.get(lobbyId);
                if (!updated?.drawerId || !updated.wordOptions || typeof updated.round !== 'number') {
                    console.error('Invalid game state on startGame');
                    return;
                }

                ioServer.to(lobbyId).emit('game:turnStarted', {
                    drawerId: updated.drawerId,
                    wordOptions: updated.wordOptions,
                    timer: updated.timer,
                    round: updated.round,
                });
            });

            // drawer slects a word
            socket.on('drawer:wordSelected', async ({ lobbyId, word }) => {
                await GameLogic.setWordForDrawer(lobbyId, word);
                ioServer.to(lobbyId).emit('drawer:wordConfirmed');
            });

            // player submits guess
            socket.on('guess', async ({ lobbyId, playerId, guess }) => {
                const result = await GameLogic.trackGuess(lobbyId, playerId, guess);

                // notify all players of the guess result
                ioServer.to(lobbyId).emit('guessReceived', { playerId, guess, result });

                // if the round should end (all players guessed), process it
                const shouldEnd = await GameLogic.checkRoundEnd(lobbyId);
                if (shouldEnd) {
                    const state = await GameState.get(lobbyId);
                    if (!state?.roundScores || !state.scores || !state.round || !state.playerOrder) return;

                    ioServer.to(lobbyId).emit('game:roundEnded', {
                        totalScores: state.scores,
                        roundScores: state.roundScores,
                    });

                    // start next turn after a delay or end the game
                    setTimeout(async () => {
                        const nextDrawerIndex = (state.currentDrawerIndex ?? 0) + 1;
                        const roundLimit = state.settings?.totalRounds ?? 3;

                        if (
                            Array.isArray(state.playerOrder) &&
                            typeof state.round === 'number' &&
                            nextDrawerIndex < state.playerOrder.length &&
                            state.round < roundLimit
                        ) {
                            await GameLogic.startNextTurn(lobbyId);
                            const nextState = await GameState.get(lobbyId);
                            if (!nextState?.drawerId || !nextState.wordOptions || typeof nextState.round !== 'number') {
                                console.error('Invalid next state on next turn');
                                return;
                            }

                            ioServer.to(lobbyId).emit('game:turnStarted', {
                                drawerId: nextState.drawerId,
                                wordOptions: nextState.wordOptions,
                                timer: nextState.timer,
                                round: nextState.round,
                            });
                        } else {
                            ioServer.to(lobbyId).emit('game:ended');
                        }
                    }, 5000); // 5 second delay before next round or end
                }
            });

            // when player sends a chat message
            socket.on('chat', async ({ lobbyId, text }) => {
                const state = await GameState.get(lobbyId);
                if (!state) return;

                const isDrawer = socket.id === state.drawerId;
                if (isDrawer) return; // prevent drawer from sending messages

                const correctGuessers = await GameLogic.getCorrectGuessers(lobbyId);
                const isCorrectGuesser = correctGuessers.includes(socket.id);

                const message = { from: socket.data.name || 'Guest', text };

                if (isCorrectGuesser) {
                    // send chat only to other correct guessers and the drawer (private chat)
                    ioServer.to(lobbyId).fetchSockets().then((sockets) => {
                        sockets.forEach((s) => {
                            if (s.id === state.drawerId || correctGuessers.includes(s.id)) {
                                s.emit('chat', message);
                            }
                        });
                    });
                } else {
                    // public chat for everyone else
                    ioServer.to(lobbyId).emit('chat', message);
                }
            });
        });
        // save socket.io server instance to avoid duplicating the setup
        res.socket.server.io = ioServer;
    }

    res.end(); // end of API response
}
