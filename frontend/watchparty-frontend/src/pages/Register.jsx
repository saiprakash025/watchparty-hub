import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>WatchParty Hub</h1>
        <p style={styles.subtitle}>Create your account and start hosting watch rooms.</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Create Account
          </button>
        </form>

        <p style={styles.bottomText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f172a',
    color: '#fff',
    padding: '20px'
  },
  card: {
    width: '380px',
    background: '#1e293b',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },
  title: {
    marginBottom: '8px'
  },
  subtitle: {
    marginBottom: '20px',
    color: '#cbd5e1'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#fff'
  },
  button: {
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  error: {
    color: '#f87171',
    marginBottom: '10px'
  },
  bottomText: {
    marginTop: '18px',
    fontSize: '14px',
    color: '#cbd5e1'
  }
};