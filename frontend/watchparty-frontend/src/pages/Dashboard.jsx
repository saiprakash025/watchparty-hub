import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newRoom, setNewRoom] = useState({
    name: '',
    mood: 'random',
    isPrivate: false
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to load rooms', err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/rooms', newRoom);
      navigate(`/rooms/${res.data._id}`, { state: { room: res.data } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not create room');
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/rooms/join', { code: joinCode });
      navigate(`/rooms/${res.data._id}`, { state: { room: res.data } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not join room');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div>
          <h2 style={{ margin: 0 }}>WatchParty Hub</h2>
          <p style={styles.navSub}>Welcome {user?.username || 'Guest'}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h1 style={styles.heroTitle}>Create or join a watch room</h1>
          <p style={styles.heroText}>
            Host a movie night, invite friends, and chat in real-time while watching together.
          </p>
        </section>

        <section style={styles.grid}>
          <div style={styles.card}>
            <h3>Create Room</h3>
            <form onSubmit={handleCreateRoom} style={styles.form}>
              <input
                type="text"
                placeholder="Room name"
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom((prev) => ({ ...prev, name: e.target.value }))
                }
                style={styles.input}
              />

              <select
                value={newRoom.mood}
                onChange={(e) =>
                  setNewRoom((prev) => ({ ...prev, mood: e.target.value }))
                }
                style={styles.input}
              >
                <option value="random">Random Picks</option>
                <option value="comedy">Comedy Night</option>
                <option value="horror">Horror Friday</option>
                <option value="chill">Chill Watch</option>
              </select>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={newRoom.isPrivate}
                  onChange={(e) =>
                    setNewRoom((prev) => ({
                      ...prev,
                      isPrivate: e.target.checked
                    }))
                  }
                />
                Private Room
              </label>

              <button type="submit" style={styles.primaryBtn}>
                Create Watch Room
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>Join by Code</h3>
            <form onSubmit={handleJoinByCode} style={styles.form}>
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={styles.input}
              />
              <button type="submit" style={styles.primaryBtn}>
                Join Room
              </button>
            </form>
          </div>
        </section>

        <section style={styles.roomSection}>
          <h3>Public Rooms</h3>

          {rooms.length === 0 ? (
            <p style={styles.emptyText}>No public rooms yet. Create the first one.</p>
          ) : (
            <div style={styles.roomList}>
              {rooms.map((room) => (
                <div key={room._id} style={styles.roomCard}>
                  <div>
                    <h4 style={{ marginBottom: '6px' }}>{room.name}</h4>
                    <p style={styles.roomMeta}>
                      Code: {room.code} · Mood: {room.mood || 'random'}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/rooms/${room._id}`, { state: { room } })
                    }
                    style={styles.secondaryBtn}
                  >
                    Open Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#fff'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid #334155'
  },
  navSub: {
    margin: '4px 0 0',
    color: '#cbd5e1',
    fontSize: '14px'
  },
  logoutBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: '#ef4444',
    color: '#fff',
    cursor: 'pointer'
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '30px 20px 50px'
  },
  hero: {
    marginBottom: '28px'
  },
  heroTitle: {
    fontSize: '36px',
    marginBottom: '10px'
  },
  heroText: {
    color: '#cbd5e1',
    maxWidth: '700px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '14px'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#fff'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#cbd5e1'
  },
  primaryBtn: {
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  secondaryBtn: {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '8px',
    background: '#334155',
    color: '#fff',
    cursor: 'pointer'
  },
  roomSection: {
    marginTop: '20px'
  },
  emptyText: {
    color: '#94a3b8'
  },
  roomList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '14px'
  },
  roomCard: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px'
  },
  roomMeta: {
    color: '#cbd5e1',
    fontSize: '14px',
    margin: 0
  }
};