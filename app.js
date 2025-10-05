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

let online_users = new Map();

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "client", "dist")));

app.get(/(.*)/, (req, res, next) => {
  res.sendFile(join(__dirname, "client", "dist", "index.html"));
});

io.on('connection', (socket) => {
  // console.log("User connected:", socket.id);

  // global presence
  socket.on("user_online", async ({ user_id, username }) => {
    online_users.set(user_id, {
      user_id,
      socket_id: socket.id, 
      username: username 
    });
    console.log(`${username} is online`);
    io.emit("update_users", Array.from(online_users.values()));
  });

  // room presence
  socket.on("join", async ({ room_id, user_id, username }) => {
    console.log(`${username} join room: ${room_id}`);
    socket.join(room_id);
    socket.to(room_id).emit("joining", {
      user_id,
      username,
      socket_id: socket.id
    });
    socket.data.username = username;
    socket.data.user_id = user_id;
    
    const clients = io.sockets.adapter.rooms.get(room_id);
    const users = [];

    if (clients) {
      for (const socket_id of clients) {
        const client_socket = io.sockets.sockets.get(socket_id);
        users.push({
          socket_id: socket_id,
          ...client_socket.data
        });
      }
    }

    socket.emit("here", users);
    socket.emit("joined");
  });

  socket.on("leave", ({ room_id }) => {
    socket.leave(room_id);
    socket.to(room_id).emit("leaving", {
      socket_id: socket.id
    });
  });

  socket.on("message", async ({ room_id, type, data }) => {
    switch (type) {
      case 'message':
        io.to(room_id).emit("message", {
          type,
          data,
        });
        break;
      case 'typing':
        socket.broadcast.to(room_id).emit("message", {
          type,
          data,
        });
        break;
      default:
    }
  });

  // conference
  socket.on("media-status", ({ room_id, data }) => {
    io.to(room_id).emit("media-status", {
      socket_id: socket.id,
      data,
    });
  });

  // peer connection
  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", { 
      from: socket.id, 
      sdp: data.sdp,
      type: data.type,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", { 
      from: socket.id, 
      sdp: data.sdp,
      type: data.type,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", { 
      from: socket.id, 
      candidate: data.candidate,
      type: data.type,
    });
  });

  socket.on("disconnect", () => {
    let user_id = null;
    let username = null;

    for (let [uid, info] of online_users.entries()) {
      if (info.socket_id === socket.id) {
        user_id = uid;
        username = info.username;
        online_users.delete(uid);
        break;
      }
    }

    if (user_id) {
      console.log(`${username} went offline`);
      io.emit("update_users", Array.from(online_users.values()));
    }
  });
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));