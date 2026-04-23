import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ emailOrUsername, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>WatchParty Hub</h1>
        <p style={styles.subtitle}>Sign in to your account.</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email or username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>

        <p style={styles.bottomText}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff', padding: '20px' },
  card: { width: '380px', background: '#1e293b', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  title: { marginBottom: '8px' },
  subtitle: { marginBottom: '20px', color: '#cbd5e1' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' },
  button: { padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#f87171', marginBottom: '10px' },
  bottomText: { marginTop: '18px', fontSize: '14px', color: '#cbd5e1' }
};
