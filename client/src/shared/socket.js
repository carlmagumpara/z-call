import { io } from 'socket.io-client';
import { base_url, socket_path } from './config';

export const socket = io(base_url, {
  path: socket_path,
  // Long-polling is not supported by serverless functions.
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 10000,
});
