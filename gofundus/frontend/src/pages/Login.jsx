import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token || data.key || 'session');
      localStorage.setItem('user', JSON.stringify(data.user || { username }));
      addToast('Welcome back!', 'success');
      const role = data.user?.role;
      if (role === 'admin' || role === 'system_admin') {
        navigate('/admin');
      } else if (role === 'institution_admin') {
        navigate('/orphanage-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err?.message || 'Login failed — is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.page}>
      {/* Left panel — brand */}
      <div style={styles.brand}>
        {/* Background photo with opacity */}
        <div style={styles.brandBg} />
        
        {/* Logo — top center */}
        <div style={styles.logoWrapper}>
          <img src="/logo.png" alt="GoFundUs Logo" style={styles.logo} />
        </div>

        <div style={{ ...styles.brandInner, position: 'relative', zIndex: 1 }}>
          <h1 style={styles.brandTitle}>GoFundUs</h1>
          <p style={styles.brandSub}>
            AI-powered donor matching for orphanages across Kumasi, Ghana.
          </p>
          <div style={styles.stats}>
            {[['15+', 'Orphanages'], ['350+', 'Children'], ['92%', 'Match Accuracy']].map(([val, label]) => (
              <div key={label} style={styles.stat}>
                <span style={styles.statVal}>{val}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.formPanel}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome Back!</h2>
          <p style={styles.cardSub}>Please fill the form below to get started. If you are not a member yet, please register below.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username (e.g. chris)"
                required
                style={styles.input}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? (
                <span style={styles.spinner} />
              ) : 'Sign in'}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={{ margin: '0 0 1.25rem' }}>
              Are you a new donor?{' '}
              <Link to="/register" style={styles.link}>Create a donor account</Link>
            </p>
            <p style={{ margin: 0 }}>
              Are you an orphanage administrator?{' '}
              <Link to="/register-institution" style={{ ...styles.link, color: '#0369a1' }}>Register your orphanage</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, id, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
    <label htmlFor={id} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
);

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  brand: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    overflow: 'hidden',
    // Dark gradient overlay sits on top of the photo
    background: 'linear-gradient(135deg, rgba(15,30,55,0.88) 0%, rgba(45,156,219,0.75) 100%)',
  },
  // pseudo-element effect achieved via a wrapper div (see brandBg)
  brandBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/children.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.30,          // 70% opacity on the photo = 30% visible under the dark overlay
    zIndex: 0,
  },

  brandInner: {
    maxWidth: '340px',
    color: '#fff',
  },
  logoWrapper: {
    position: 'absolute',
    top: '3rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.5)',
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: '0 0 0.75rem',
    letterSpacing: '-0.03em',
  },
  brandSub: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    opacity: 0.85,
    margin: '0 0 2.5rem',
  },
  stats: {
    display: 'flex',
    gap: '1.5rem',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  statVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '0.75rem',
    opacity: 0.75,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  formPanel: {
    width: '460px',
    minWidth: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
  },
  cardTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#38526A',
    margin: '0 0 0.5rem',
    letterSpacing: '-0.02em',
    fontFamily: "'Georgia', serif",
  },
  cardSub: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0 0 2.5rem',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '1rem 1.25rem',
    borderRadius: '16px',
    border: 'none',
    background: '#f1f5f9',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'background 0.15s, box-shadow 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#38526A',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '52px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  footer: {
    marginTop: '2rem',
    fontSize: '0.88rem',
    color: '#64748b',
    textAlign: 'center',
  },
  link: {
    color: '#2D9CDB',
    fontWeight: 600,
    textDecoration: 'none',
  },
  demoHint: {
    marginTop: '1.5rem',
    padding: '0.75rem 1rem',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: '0.75rem',
    color: '#0369a1',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  demoCode: {
    fontSize: '0.82rem',
    color: '#0369a1',
    background: '#e0f2fe',
    padding: '2px 8px',
    borderRadius: '6px',
    fontFamily: "'Source Code Pro', monospace",
  },
};

export default Login;
