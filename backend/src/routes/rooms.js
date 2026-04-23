const router = require('express').Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const genCode = () =>
  Math.random().toString(36).substring(2, 7).toUpperCase();

router.post('/', auth, async (req, res) => {
  try {
    const { name, mood, isPrivate } = req.body;
    const code = genCode();
    const room = await Room.create({
      code,
      name,
      mood: mood || 'random',
      isPrivate: isPrivate || false,
      host: req.userId,
      members: [req.userId]
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Could not create room' });
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
