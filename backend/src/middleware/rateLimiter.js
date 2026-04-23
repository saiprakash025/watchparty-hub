const rateLimit = require('express-rate-limit');

// REST API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});


const socketChatLimit = new Map();

const canSendChat = (socketId) => {
  const now = Date.now();
  const record = socketChatLimit.get(socketId) || { count: 0, windowStart: now };

  // Reset window every 5 seconds
  if (now - record.windowStart > 5000) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count++;
  socketChatLimit.set(socketId, record);


  return record.count <= 5;
};

module.exports = { apiLimiter, canSendChat };
