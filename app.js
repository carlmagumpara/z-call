import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const corsConfig = {
  origin: ["http://localhost:5173", "http://localhost:4000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsConfig
});

const port = process.env.PORT || 4000;

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

  socket.on("user_online", async ({ user_id }) => {
    onlineUsers.set(user_id, socket.id);
    console.log(`${user_id} is online`);
    io.emit("update_users", onlineUsers);
  });

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

    for (let [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        userId = uid;
        onlineUsers.delete(uid);
        break;
      }
    }

    if (userId) {
      console.log(`${userId} went offline`);
      io.emit("update_users", onlineUsers);
    }
  });
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));