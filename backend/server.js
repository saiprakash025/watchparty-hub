require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');

const app = express();
const server = http.createServer(app);
const corsOptions = {
origin: [
    'https://watchparty-hub-i5ba.vercel.app',
    'https://watchparty-hub-i5ba-git-main-saiprakash025s-projects.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

connectDB();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const io = new Server(server, { cors: corsOptions });

const liveRooms = new Map();

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, user }) => {
    socket.join(roomId);
    if (!liveRooms.has(roomId)) {
      liveRooms.set(roomId, {
        users: new Set(),
        messages: [],
        playback: { isPlaying: false, position: 0 }
      });
    }
    liveRooms.get(roomId).users.add(socket.id);
  });

  socket.on('chat_message', ({ roomId, message }) => {
    const info = liveRooms.get(roomId);
    if (info) info.messages.push(message);
    io.to(roomId).emit('chat_message', message);
  });

  socket.on('playback_update', ({ roomId, playback }) => {
    const info = liveRooms.get(roomId);
    if (info) info.playback = playback;
    io.to(roomId).emit('playback_update', playback);
  });

  socket.on('disconnect', () => {
    liveRooms.forEach((info) => info.users.delete(socket.id));
  });
});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('WatchParty Hub backend is running'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
