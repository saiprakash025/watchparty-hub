const router = require('express').Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const genCode = () =>
  Math.random().toString(36).substring(2, 7).toUpperCase();

router.post('/', auth, async (req, res) => {
  try {
    const { name, mood, isPrivate } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const code = genCode();
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const room = await Room.create({
      code,
      name: name.trim(),
      mood: mood || 'random',
      isPrivate: isPrivate || false,
      host: userId,
      members: [userId]
    });
    res.json(room);
  } catch (err) {
    console.error('Create room error:', err.message);
    res.status(500).json({ message: 'Could not create room', error: err.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    const room = await Room.findOne({ code: code.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: 'Invalid room code. No room found.' });
    }
    const userId = new mongoose.Types.ObjectId(req.user.id);
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false }).limit(20);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch rooms' });
  }
});

module.exports = router;
