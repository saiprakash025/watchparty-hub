import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';

export default function RoomPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const room = state?.room;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const chatEndRef = useRef(null);

  const postToIframe = (func, args = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };
  
  useEffect(() => {
    if (!user) return navigate('/login');

    socket.connect();
    socket.emit('join_room', { roomId: id, user });

    // Receive current room state on join
    socket.on('room_state', ({ videoUrl, playback, messages }) => {
      if (videoUrl) setVideoUrl(videoUrl);
      if (messages?.length) setMessages(messages);
      if (playback) {
        setIsPlaying(playback.isPlaying);
        // Seek to correct position after iframe loads
        setTimeout(() => {
          if (playback.position > 0) {
            postToIframe('seekTo', [Math.floor(playback.position), true]);
          }
          if (playback.isPlaying) {
            postToIframe('playVideo');
          }
        }, 3000); // wait 3s for iframe to load
      }
    });

    socket.on('chat_message', (msg) =>
      setMessages((prev) => [...prev, msg])
    );

    socket.on('playback_update', ({ isPlaying, position }) => {
      setIsPlaying(isPlaying);
      if (position !== undefined) {
        postToIframe('seekTo', [Math.floor(position), true]);
      }
      postToIframe(isPlaying ? 'playVideo' : 'pauseVideo');
    });

    socket.on('video_update', (url) => {
      setVideoUrl(url);
      setIsPlaying(false);
    });

    socket.on('seek_update', (position) => {
      postToIframe('seekTo', [Math.floor(position), true]);
    });

    return () => {
      // Emit leave_room before disconnecting so backend resets if empty
      socket.emit('leave_room', { roomId: id });
      socket.off('room_state');
      socket.off('chat_message');
      socket.off('playback_update');
      socket.off('video_update');
      socket.off('seek_update');
      socket.disconnect();
    };
  }, [id, user]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      id: Date.now(),
      user: { username: user.username, avatarColor: user.avatarColor || '#2563eb' },
      text: input,
      createdAt: new Date().toISOString()
    };
    socket.emit('chat_message', { roomId: id, message: msg });
    setInput('');
  };

  const togglePlay = () => {
    const next = !isPlaying;
   // Get current position from iframe via YT player state
    socket.emit('playback_update', { roomId: id, playback: { isPlaying: next, position: 0 } });

    
postToIframe(next ? 'playVideo' : 'pauseVideo');
    setIsPlaying(next);
  };

  const handleSetVideo = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const embedUrl = getEmbedUrl(urlInput.trim());
    socket.emit('video_update', { roomId: id, url: embedUrl });
    setVideoUrl(embedUrl);
    setUrlInput('');
    setIsPlaying(false);
  };

 const handleLeave = () => {
    socket.emit('leave_room', { roomId: id });
    socket.disconnect();
    navigate('/');
  };

  const getEmbedUrl = (url) => {
    try {
      const u = new URL(url.trim());
      let videoId = '';
      if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v');
      } else if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1).split('?')[0];
      }
      if (videoId) {
        alert('Invalid YouTube URL. Please paste a valid YouTube link.');
      return '';
      }
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&origin=${window.location.origin}`;
  } catch {
    alert('Invalid URL format. Please paste a valid YouTube link.');
    return '';
  }
};

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={handleLeave} style={styles.backBtn}>← Leave Room</button>
          <div>
            <h2 style={styles.roomName}>{room?.name || 'Watch Room'}</h2>
            <span style={styles.roomCode}>Code: {room?.code || '—'}</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusDot,
            background: isPlaying ? '#22c55e' : '#f59e0b'
          }} />
          <span style={styles.statusText}>
            {isPlaying ? '● Playing' : '⏸ Paused'}
          </span>
        </div>
      </header>

      <div style={styles.body}>
        {/* Left — Video */}
        <div style={styles.videoSection}>
          <form onSubmit={handleSetVideo} style={styles.urlForm}>
            <input
              style={styles.urlInput}
              placeholder="Paste a YouTube URL to watch together..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button type="submit" style={styles.urlBtn}>Load</button>
          </form>

          <div style={styles.videoWrapper}>
            {videoUrl ? (
              <iframe
                ref={iframeRef}
                src={videoUrl}
                style={styles.iframe}
                allowFullScreen
                allow="autoplay; encrypted-media"
                title="Watch together"
              />
            ) : (
              <div style={styles.videoPlaceholder}>
                <p style={{ fontSize: '48px', margin: 0 }}>🎬</p>
                <p style={styles.placeholderText}>
                  Paste a YouTube link above to start watching together
                </p>
              </div>
            )}
          </div>

          <div style={styles.controls}>
            <button
              onClick={togglePlay}
              disabled={!videoUrl}
              style={{
                ...styles.playBtn,
                background: !videoUrl ? '#334155' : isPlaying ? '#dc2626' : '#16a34a',
                cursor: !videoUrl ? 'not-allowed' : 'pointer'
              }}
            >
              {isPlaying ? '⏸ Pause for Everyone' : '▶ Play for Everyone'}
            </button>
          </div>
        </div>

        {/* Right — Chat */}
        <div style={styles.chatSection}>
          <div style={styles.chatHeader}>
            <h3 style={styles.chatTitle}>💬 Live Chat</h3>
          </div>

          <div style={styles.messages}>
            {messages.length === 0 && (
              <p style={styles.noMessages}>No messages yet. Say hi! 👋</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.message,
                  flexDirection:
                    m.user.username === user.username ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  ...styles.avatar,
                  background: m.user.avatarColor || '#2563eb'
                }}>
                  {m.user.username[0].toUpperCase()}
                </div>
                <div style={styles.msgContent}>
                  <div style={styles.msgMeta}>
                    <span style={styles.msgUser}>{m.user.username}</span>
                    <span style={styles.msgTime}>{formatTime(m.createdAt)}</span>
                  </div>
                  <div style={{
                    ...styles.msgBubble,
                    background:
                      m.user.username === user.username ? '#2563eb' : '#1e293b'
                  }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} style={styles.chatForm}>
            <input
              style={styles.chatInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" style={styles.sendBtn}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
const styles = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1e293b', background: '#0f172a' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { background: '#1e293b', border: 'none', color: '#94a3b8', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  roomName: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
  roomCode: { fontSize: '13px', color: '#64748b' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  statusText: { fontSize: '14px', color: '#94a3b8' },
  body: { display: 'flex', flex: 1, height: 'calc(100vh - 65px)' },
  videoSection: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' },
  urlForm: { display: 'flex', gap: '8px' },
  urlInput: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' },
  urlBtn: { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  videoWrapper: { flex: 1, background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
  iframe: { width: '100%', height: '100%', minHeight: '400px', border: 'none' },
  videoPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' },
  placeholderText: { color: '#475569', textAlign: 'center', maxWidth: '300px' },
  controls: { display: 'flex', gap: '12px', justifyContent: 'center' },
  playBtn: { padding: '12px 28px', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', opacity: 1 },
  chatSection: { width: '320px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1e293b', background: '#0f1a2b' },
  chatHeader: { padding: '14px 16px', borderBottom: '1px solid #1e293b' },
  chatTitle: { margin: 0, fontSize: '15px', color: '#e2e8f0' },
  messages: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  noMessages: { color: '#475569', textAlign: 'center', marginTop: '40px', fontSize: '14px' },
  message: { display: 'flex', gap: '8px', alignItems: 'flex-start' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 },
  msgContent: { display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '200px' },
  msgMeta: { display: 'flex', gap: '6px', alignItems: 'center' },
  msgUser: { fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' },
  msgTime: { fontSize: '11px', color: '#475569' },
  msgBubble: { padding: '8px 12px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word' },
  chatForm: { display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #1e293b' },
  chatInput: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '14px' },
  sendBtn: { padding: '10px 14px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }
};
