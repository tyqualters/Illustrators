// This is a reusable client-side socket file.

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(undefined, {
      path: '/api/socket/io',
    });
  }
  return socket;
};
