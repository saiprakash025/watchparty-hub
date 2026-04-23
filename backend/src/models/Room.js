const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', RoomSchema);