import { io } from 'socket.io-client';
import { base_url } from './config';

export const socket = io(base_url, {
  withCredentials: true,
  // withCredentials: !import.meta.env.DEV,
  // reconnection: true,
  // reconnectionAttempts: 10,
  // reconnectionDelay: 1000,
});