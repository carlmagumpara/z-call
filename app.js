import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || "development";
const port = process.env.PORT || 4000;

const corsConfig = {
  origin: ["http://localhost:5173", "http://localhost:4000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: env !== 'development',
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsConfig
});

let onlineUsers = new Map();

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "client", "dist")));

app.get(/(.*)/, (req, res, next) => {
  res.sendFile(join(__dirname, "client", "dist", "index.html"));
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  // global presence
  socket.on("user_online", async ({ user_id, username }) => {
    onlineUsers.set(user_id, { 
      socket_id: socket.id, 
      username: username 
    });
    console.log(`${user_id} is online`);
    io.emit("update_users", Array.from(onlineUsers.entries()));
  });

  // room presence
  socket.on("join", async ({ room_id, user_id, username }) => {
    console.log(`${user_id} join room: ${room_id}`);
    socket.join(room_id);
    socket.to(room_id).emit("joining", {
      user_id,
      socket_id: socket.id
    });
    socket.data.username = username;
    socket.data.user_id = user_id;
    
    const clients = io.sockets.adapter.rooms.get(room_id);
    const users = [];

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        users.push([
          clientSocket.data.user_id, 
          clientId, 
          clientSocket.data.username
        ]);
      }
    }

    socket.emit("here", users);
    socket.emit("joined");
  });

  socket.on("leave", ({ room_id, user_id }) => {
    console.log(`${user_id} left room: ${room_id}`);
    socket.leave(room_id);
    socket.to(room_id).emit("leaving", { user_id });
  });

  // conference
  socket.on("audio-status", ({ room_id, user_id, data }) => {
    socket.to(room_id).emit("audio-status", { user_id, data });
  });

  socket.on("video-status", ({ room_id, user_id, data }) => {
    socket.to(room_id).emit("video-status", { user_id, data });
  });

  // peer connection
  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", { 
      from: socket.id, 
      sdp: data.sdp 
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", { 
      from: socket.id, 
      sdp: data.sdp 
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", { 
      from: socket.id, 
      candidate: data.candidate 
    });
  });

  socket.on("disconnect", () => {
    console.log('a user disconnect');

    let userId = null;

    for (let [uid, info] of onlineUsers.entries()) {
      if (info.socketId === socket.id) {
        userId = uid;
        onlineUsers.delete(uid);
        break;
      }
    }

    if (userId) {
      console.log(`${userId} went offline`);
      io.emit("update_users", Array.from(onlineUsers.entries()));
    }
  });
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));