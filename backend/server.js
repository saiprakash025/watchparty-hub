require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');
const RoomState = require('./src/models/RoomState');
const { canSendChat } = require('./src/middleware/rateLimiter');
const { apiLimiter } = require('./src/middleware/rateLimiter');


const app = express();
const server = http.createServer(app);
const corsOptions = {
origin: [
    'https://watchparty-hub.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

connectDB();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const io = new Server(server, { cors: corsOptions });

const liveRooms = new Map();

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, user }) => {
    socket.join(roomId);
    if (!liveRooms.has(roomId)) {
      liveRooms.set(roomId, {
        users: new Map(), 
host: null,
lastPlayEmit: 0,
        messages: [],
        playback: { isPlaying: false, position: 0, updatedAt: null },
        videoUrl: ''
      });
    }
    const info = liveRooms.get(roomId);
    info.users.set(socket.id, { username: user.username });
socket.roomId = roomId;
socket.username = user.username;

      // Assign host if none exists
if (!info.host || !info.users.has(info.host)) {
  info.host = socket.id;
}

// Load persisted state from DB
try {
  const saved = await RoomState.findOne({ roomId });
  if (saved && !info.videoUrl) {
    info.videoUrl = saved.videoUrl;
    info.playback.position = saved.position || 0;
  }
} catch (e) {}

      // Calculate current position based on time elapsed since last update
    let currentPosition = info.playback.position;
    if (info.playback.isPlaying && info.playback.updatedAt) {
      const elapsed = (Date.now() - info.playback.updatedAt) / 1000;
      currentPosition = info.playback.position + elapsed;
    }

      
    // Send current state to the newly joined user
    socket.emit('room_state', {
      videoUrl: info.videoUrl,
      playback: {
        isPlaying: info.playback.isPlaying,
        position: currentPosition
      },
      messages: info.messages,
        isHost: info.host === socket.id
    });
  });

  socket.on('chat_message', ({ roomId, message }) => {
       if (!canSendChat(socket.id)) {
    socket.emit('chat_error', { error: 'You are sending messages too fast' });
    return;
  }
    const info = liveRooms.get(roomId);
    if (info) info.messages.push(message);
    io.to(roomId).emit('chat_message', message);
  });

  socket.on('playback_update', ({ roomId, playback }) => {
    const info = liveRooms.get(roomId);
   if (!info) return;

  // ADD conflict check:
  const now = Date.now();
  if (now - info.lastPlayEmit < 500) return;
  info.lastPlayEmit = now;

  info.playback = { ...playback, updatedAt: now };

  // ADD DB persist:
  RoomState.findOneAndUpdate(
    { roomId },
    { roomId, videoUrl: info.videoUrl, position: playback.position, isPlaying: playback.isPlaying, updatedAt: new Date() },
    { upsert: true }
  ).catch(() => {});

  io.to(roomId).emit('playback_update', playback);
});

    socket.on('video_update', ({ roomId, url }) => {
  const info = liveRooms.get(roomId);
  if (info) {
      info.videoUrl = url;
      RoomState.findOneAndUpdate(
  { roomId },
  { roomId, videoUrl: url, position: 0, isPlaying: false, updatedAt: new Date() },
  { upsert: true }
).catch(() => {});
      // Reset playback when new video is loaded
      info.playback = { isPlaying: false, position: 0, updatedAt: null };
    }
    io.to(roomId).emit('video_update', url);
    // Tell everyone to reset playback state
    io.to(roomId).emit('playback_update', { isPlaying: false, position: 0 });
  });

  socket.on('seek_update', ({ roomId, position }) => {
    const info = liveRooms.get(roomId);
    if (info) {
      info.playback.position = position;
      info.playback.updatedAt = Date.now();
    }
    // Broadcast seek to all OTHER users in room
    socket.to(roomId).emit('seek_update', position);
  });

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    const info = liveRooms.get(roomId);
    if (info) {
      info.users.delete(socket.id);
      // If room is empty, reset everything
      if (info.users.size === 0) {
        liveRooms.set(roomId, {
          users: new Set(),
          messages: [],
          playback: { isPlaying: false, position: 0, updatedAt: null },
          videoUrl: ''
        });
      }
    }
  });


    
  socket.on('disconnect', () => {
  const roomId = socket.roomId;
  if (!roomId) return;
  const info = liveRooms.get(roomId);
  if (!info) return;

  info.users.delete(socket.id);

  // Host reassignment
  if (info.host === socket.id) {
    const nextHost = info.users.keys().next().value;
    info.host = nextHost || null;
    if (info.host) {
      io.to(info.host).emit('host_assigned', { message: 'You are now the host! 👑' });
    }
  }

  if (info.users.size === 0) {
    liveRooms.delete(roomId);
  } else {
    io.to(roomId).emit('members_update', {
      members: Array.from(info.users.values()),
      host: info.users.get(info.host)?.username
    });
  }
});
    
socket.on('request_sync', ({ roomId }) => {
  const info = liveRooms.get(roomId);
  if (!info) return;
  let currentPosition = info.playback.position;
  if (info.playback.isPlaying && info.playback.updatedAt) {
    const elapsed = (Date.now() - info.playback.updatedAt) / 1000;
    currentPosition = info.playback.position + elapsed;
  }
  socket.emit('room_state', {
    videoUrl: info.videoUrl,
    playback: { isPlaying: info.playback.isPlaying, position: currentPosition },
    messages: info.messages,
    isHost: info.host === socket.id
  });
});
    
});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('WatchParty Hub backend is running'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
