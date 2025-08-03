// This is a reusable client-side socket file.

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get current socket
 * @returns Socket.io socket
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(undefined, {
      path: '/api/socket/io',
    });
  }
  return socket;
};
