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

router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.members.includes(req.userId)) {
      room.members.push(req.userId);
      await room.save();
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Could not join room' });
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
