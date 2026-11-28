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
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT) || 4000;
const SOCKET_PATH = process.env.SOCKET_PATH || '/api/socket-io';
const MAX_MESSAGE_LENGTH = 4000;

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
// Last known media state per socket, so a late joiner learns who is muted
// instead of falling back to the "muted / camera off" defaults.
const roomMediaStatus = new Map();

const publishUsers = () => io.emit('update_users', [...onlineUsers.values()]);
const userRoom = (id) => `user:${id}`;
// Stable id for a one-to-one conversation, independent of who starts it.
const conversationId = (a, b) => `conv:${[a, b].sort().join('::')}`;

io.on('connection', (socket) => {
  socket.on('user_online', ({ user_id, username } = {}) => {
    const id = clean(user_id);
    if (!id) return;

    // Private messages go to a per-identity room. Only the latest socket for
    // an identity stays in it, so stale tabs cannot receive duplicates.
    const previous = onlineUsers.get(id);
    if (previous && previous.socket_id !== socket.id) {
      io.sockets.sockets.get(previous.socket_id)?.leave(userRoom(id));
    }

    socket.data.user_id = id;
    socket.data.username = clean(username) || 'Guest';
    socket.join(userRoom(id));

    onlineUsers.set(id, {
      user_id: id,
      socket_id: socket.id,
      username: socket.data.username,
    });

    publishUsers();
    io.emit('presence:update', {
      user_id: id,
      username: socket.data.username,
      online: true,
    });
  });

  socket.on('join', ({ room_id, user_id, username } = {}) => {
    const room = clean(room_id);
    if (!room) return;

    // A socket can only be in one call at a time.
    const previousRoom = socket.data.room_id;
    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('leaving', { socket_id: socket.id });
      roomMediaStatus.delete(socket.id);
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

    // Send the joiner the latest status of everyone already in the room.
    // Live `media-status` events only reach sockets that are connected when
    // they fire, so without this the new peer sees everyone as muted.
    const statuses = {};
    for (const id of clients || []) {
      const entry = roomMediaStatus.get(id);
      if (entry && entry.room === room) statuses[id] = entry.data;
    }
    socket.emit('media-statuses', statuses);

    socket.emit('here', users);
    socket.emit('joined');
  });

  socket.on('leave', ({ room_id } = {}) => {
    const room = clean(room_id) || socket.data.room_id;
    if (!room) return;

    socket.leave(room);
    socket.to(room).emit('leaving', { socket_id: socket.id });

    if (socket.data.room_id === room) {
      delete socket.data.room_id;
      roomMediaStatus.delete(socket.id);
    }
  });

  socket.on('media-status', ({ room_id, data } = {}) => {
    const room = clean(room_id) || socket.data.room_id;
    if (!room) return;

    roomMediaStatus.set(socket.id, { room, data });
    io.to(room).emit('media-status', { socket_id: socket.id, data });
  });

  // ---- Ephemeral one-to-one chat -----------------------------------------
  // Nothing here is stored. A message is relayed to the participants who are
  // online at that instant and then forgotten; an offline recipient gets no
  // queue and a reconnecting client gets no history.

  socket.on('users:list', () => {
    socket.emit('users:list', [...onlineUsers.values()]);
  });

  socket.on('conversation:join', ({ peer_id } = {}) => {
    const me = socket.data.user_id;
    const peerId = clean(peer_id);
    if (!me || !peerId || peerId === me) return;

    const peer = onlineUsers.get(peerId);
    if (!peer) return;

    const nextId = conversationId(me, peerId);
    if (socket.data.conversation_id && socket.data.conversation_id !== nextId) {
      socket.leave(socket.data.conversation_id);
    }

    socket.join(nextId);
    socket.data.conversation_id = nextId;
    socket.data.peer_id = peerId;
    socket.emit('conversation:join', {
      conversation_id: nextId,
      peer: {
        user_id: peerId,
        username: peer.username,
        socket_id: peer.socket_id,
        online: true,
      },
    });
  });

  socket.on('conversation:leave', ({ peer_id } = {}) => {
    const current = socket.data.conversation_id;
    if (!current) return;

    const requested = clean(peer_id);
    if (requested && socket.data.user_id && current !== conversationId(socket.data.user_id, requested)) {
      return;
    }

    socket.leave(current);
    delete socket.data.conversation_id;
    delete socket.data.peer_id;

    if (socket.data.typing_to) {
      io.to(userRoom(socket.data.typing_to)).emit('typing:stop', { from: socket.data.user_id });
      delete socket.data.typing_to;
    }
  });

  socket.on('message:send', ({ to, text } = {}) => {
    // Identity always comes from the socket that was registered with
    // `user_online`, never from a client-supplied `from` field.
    const from = socket.data.user_id;
    const target = clean(to);
    if (!from || !target || target === from) return;
    if (!onlineUsers.has(target)) return; // offline recipient: drop, don't queue

    const body = typeof text === 'string' ? text.trim() : '';
    if (!body || body.length > MAX_MESSAGE_LENGTH) return;

    const message = {
      id: randomUUID(),
      conversation_id: conversationId(from, target),
      from,
      to: target,
      text: body,
      created_at: Date.now(),
    };

    io.to(userRoom(from)).emit('message:new', message);
    io.to(userRoom(target)).emit('message:new', message);
  });

  const relayTyping = (event) => ({ to } = {}) => {
    const from = socket.data.user_id;
    const target = clean(to);
    if (!from || !target || target === from || !onlineUsers.has(target)) return;

    if (event === 'typing:start') {
      socket.data.typing_to = target;
    } else if (socket.data.typing_to === target) {
      delete socket.data.typing_to;
    }

    io.to(userRoom(target)).emit(event, {
      from,
      conversation_id: conversationId(from, target),
    });
  };

  socket.on('typing:start', relayTyping('typing:start'));
  socket.on('typing:stop', relayTyping('typing:stop'));

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

    if (socket.data.typing_to) {
      io.to(userRoom(socket.data.typing_to)).emit('typing:stop', { from: id });
    }

    if (id && onlineUsers.get(id)?.socket_id === socket.id) {
      onlineUsers.delete(id);
      publishUsers();
      io.emit('presence:update', {
        user_id: id,
        username: socket.data.username,
        online: false,
      });
    }

    const room = socket.data.room_id;
    if (room) socket.to(room).emit('leaving', { socket_id: socket.id });
    roomMediaStatus.delete(socket.id);
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
