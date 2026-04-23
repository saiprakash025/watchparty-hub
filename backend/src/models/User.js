const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarColor: { type: String, default: '#ff7b72' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);