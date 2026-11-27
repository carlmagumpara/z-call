/**
 * The one and only server for z-call.
 *
 * On Vercel this file is a single Node.js Function. Exporting the http.Server
 * lets Fluid Compute accept WebSocket upgrades directly (no long-polling, no
 * Redis adapter, no separate backend deployment).
 *
 * Locally: `npm run server` runs this same file on PORT (default 4000).
 */
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT) || 4000;
const SOCKET_PATH = process.env.SOCKET_PATH || '/api/socket-io';

const server = createServer();

const io = new Server(server, {
  // The function is mounted at /api/socket-io; Vercel passes that full path
  // through to the handler, so Socket.IO must listen on it.
  path: SOCKET_PATH,
  // Vercel Functions cannot keep HTTP long-polling requests alive.
  transports: ['websocket'],
  cors: {
    // Same-origin by default; override with a comma-separated list if needed.
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'POST'],
  },
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

/** Keep ids/labels bounded so a malicious client cannot grow state forever. */
const clean = (value, max = 100) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const onlineUsers = new Map();

const publishUsers = () => io.emit('update_users', [...onlineUsers.values()]);

io.on('connection', (socket) => {
  socket.on('user_online', ({ user_id, username } = {}) => {
    const id = clean(user_id);
    if (!id) return;

    socket.data.user_id = id;
    socket.data.username = clean(username) || 'Guest';

    onlineUsers.set(id, {
      user_id: id,
      socket_id: socket.id,
      username: socket.data.username,
    });

    publishUsers();
  });

  socket.on('join', ({ room_id, user_id, username } = {}) => {
    const room = clean(room_id);
    if (!room) return;

    // A socket can only be in one call at a time.
    const previousRoom = socket.data.room_id;
    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('leaving', { socket_id: socket.id });
    }

    if (user_id) socket.data.user_id = clean(user_id);
    if (username) socket.data.username = clean(username);
    socket.data.room_id = room;

    socket.join(room);

    socket.to(room).emit('joining', {
      user_id: socket.data.user_id,
      username: socket.data.username,
      socket_id: socket.id,
    });

    const clients = io.sockets.adapter.rooms.get(room);
    const users = clients
      ? [...clients].map((id) => ({
          socket_id: id,
          ...(io.sockets.sockets.get(id)?.data ?? {}),
        }))
      : [];

    socket.emit('here', users);
    socket.emit('joined');
  });

  socket.on('leave', ({ room_id } = {}) => {
    const room = clean(room_id) || socket.data.room_id;
    if (!room) return;

    socket.leave(room);
    socket.to(room).emit('leaving', { socket_id: socket.id });

    if (socket.data.room_id === room) delete socket.data.room_id;
  });

  socket.on('media-status', ({ room_id, data } = {}) => {
    const room = clean(room_id);
    if (!room) return;

    io.to(room).emit('media-status', { socket_id: socket.id, data });
  });

  // WebRTC signalling: forward only to the intended peer in the same instance.
  const relay = (event) => ({ to, ...rest } = {}) => {
    const target = clean(to);
    if (!target) return;
    socket.to(target).emit(event, { from: socket.id, ...rest });
  };

  socket.on('offer', relay('offer'));
  socket.on('answer', relay('answer'));
  socket.on('ice-candidate', relay('ice-candidate'));

  socket.on('disconnect', () => {
    const id = socket.data.user_id;
    if (id && onlineUsers.get(id)?.socket_id === socket.id) {
      onlineUsers.delete(id);
      publishUsers();
    }

    const room = socket.data.room_id;
    if (room) socket.to(room).emit('leaving', { socket_id: socket.id });
  });
});

// On Vercel the exported server is driven by the platform: calling listen()
// there puts the function on the "captured server" path, which breaks HTTP
// handling and upgrades. Locally we bind the port ourselves.
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`z-call socket server listening on http://localhost:${PORT}`);
  });
}

export default server;
