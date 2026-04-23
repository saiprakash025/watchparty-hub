import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';

export default function RoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [playback, setPlayback] = useState({ isPlaying: false, position: 0 });

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit('join_room', { roomId: id, user });

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handlePlayback = (state) => setPlayback(state);

    socket.on('chat_message', handleMessage);
    socket.on('playback_update', handlePlayback);

    return () => {
      socket.off('chat_message', handleMessage);
      socket.off('playback_update', handlePlayback);
      socket.disconnect();
    };
  }, [id, user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      id: Date.now(),
      user: { username: user.username, avatarColor: user.avatarColor },
      text: input,
      createdAt: new Date().toISOString()
    };
    socket.emit('chat_message', { roomId: id, message: msg });
    setInput('');
  };

  const togglePlay = () => {
    const next = { ...playback, isPlaying: !playback.isPlaying };
    socket.emit('playback_update', { roomId: id, playback: next });
  };

  return (
    <div>
      <h2>Room</h2>
      <p>Playback: {playback.isPlaying ? 'Playing' : 'Paused'} at {playback.position}s</p>
      <button onClick={togglePlay}>
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>

      <div>
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.user.username}:</strong> {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}