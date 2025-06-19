import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { Server as HTTPServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const httpServer: HTTPServer = res.socket.server as any;
    const io = new Server(httpServer, {
      path: '/api/socket/io',
    });

    console.log('Socket.IO server initialized');

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Game Start
      socket.on('startGame', () => {
        console.log('Game started by', socket.id);
        socket.broadcast.emit('gameStarted');
      });

      // Drawing sync
      socket.on('draw', (data) => {
        console.log('Drawing data from', socket.id, data);
        socket.broadcast.emit('draw', data);
      });

      // Player joining
      socket.on('join', (player) => {
        console.log('Player joined:', player);
        socket.broadcast.emit('playerJoined', player);
      });

      // Guessing
      socket.on('guess', (guess) => {
        console.log('Guess received:', guess);
        socket.broadcast.emit('guessReceived', guess);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
