const mongoose = require('mongoose');

const roomStateSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, unique: true },
  videoUrl:  { type: String, default: '' },
  position:  { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomState', roomStateSchema);
