// could eventually add helpers and make /lib/socket location if file becomes too long

import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextRequest } from 'next/server';

// allows raw socket communication
export const config = {
  api: {
    bodyParser: false,
  },
};

// main API route handler (GET request only, used by fetch('/api/socket'))
export async function GET(_: NextRequest, res: any) {
    // if a socket.io server isnt already attached to the http server...
    if (!res.socket?.server?.io) {
    const httpServer: NetServer = res.socket.server as any;

    // create a new socket.io server, listening on custom path
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    console.log('Socket.IO server initialized');

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Player joins lobby
      socket.on('join', (player) => {
        console.log('Player joined:', player);
        // broadcast to everyone except sender
        socket.broadcast.emit('playerJoined', player);
      });

      // Game start (when host starts a game)
      socket.on('startGame', () => {
        console.log('Game started by', socket.id);
        socket.broadcast.emit('gameStarted');
      });

      // Drawing sync (when a player draws something on the canvas)
      socket.on('draw', (data) => {
        console.log('Drawing data from', socket.id, data);
        // send to all other clients to sync canvas
        socket.broadcast.emit('draw', data);
      });

      // Guessing (when player submits a guess)
      socket.on('guess', (guess) => {
        console.log('Guess received:', guess);
        socket.broadcast.emit('guessReceived', guess);
      });

      // Disconnect (when player disconnects)
      socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
      });
    });

    // attach socket.io server to HTTP server so it is reused on future requests
    res.socket.server.io = io;
  }

  // finish GET request (used to trigger setup, not return data)
  res.end();
}
