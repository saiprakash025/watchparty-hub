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
    'https://watchparty-hub.vercel.app'
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
        playback: { isPlaying: false, position: 0, updatedAt: null },
        videoUrl: ''
      });
    }
    const info = liveRooms.get(roomId);
    info.users.add(socket.id);

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
      messages: info.messages
    });
  });

  socket.on('chat_message', ({ roomId, message }) => {
    const info = liveRooms.get(roomId);
    if (info) info.messages.push(message);
    io.to(roomId).emit('chat_message', message);
  });

  socket.on('playback_update', ({ roomId, playback }) => {
    const info = liveRooms.get(roomId);
   if (info) {
      info.playback = {
        ...playback,
        updatedAt: Date.now()
      };
    }
    io.to(roomId).emit('playback_update', playback);
  });

    socket.on('video_update', ({ roomId, url }) => {
  const info = liveRooms.get(roomId);
  if (info) {
      info.videoUrl = url;
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
    liveRooms.forEach((info) => {
        if (info.users.has(socket.id)) {
        info.users.delete(socket.id);
        // If room is empty reset it
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
  });

});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('WatchParty Hub backend is running'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
