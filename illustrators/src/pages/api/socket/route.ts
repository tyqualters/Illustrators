
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextRequest } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: SocketIOServer | null = null;

export async function GET(_: NextRequest, res: any) {
  if (!res.socket?.server?.io) {
    const httpServer: NetServer = res.socket.server as any;
    const ioServer = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    ioServer.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data); // broadcast to others
      });

      socket.on('startGame', () => {
        socket.broadcast.emit('gameStarted');
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });

    res.socket.server.io = ioServer;
  }

  res.end();
}
