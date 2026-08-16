import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const CAUSES = [
  'Education', 'Healthcare', 'Nutrition', 'Shelter', 'Infant Care',
  'Special Needs', 'Vocational Training', 'Mental Health', 'Sports & Play',
  'Clean Water', 'Emergency Relief', 'Family Reunification',
];

const Register = () => {
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [role, setRole]             = useState('donor');
  const [causes, setCauses]         = useState([]);
  const [photo, setPhoto]           = useState(null);   // base64 preview
  const [photoFile, setPhotoFile]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const fileRef                     = useRef();
  const navigate                    = useNavigate();
  const { addToast }                = useToast();

  const toggleCause = (c) =>
    setCauses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, email, password, role,
          preferred_causes: causes.join(', '),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Registration failed');

      // Persist photo locally keyed by username
      if (photo) localStorage.setItem(`avatar_${username}`, photo);

      // Auto-login: store session data exactly like Login.jsx does
      localStorage.setItem('token', data.token || data.key || 'session');
      localStorage.setItem('user', JSON.stringify(data.user || { username }));

      addToast('Account created! Welcome to GoFundUs 🎉', 'success');
      if (role === 'institution_admin') {
        navigate('/orphanage-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Subtle background pattern */}
      <div style={s.bgDecor} />

      <div style={s.wrapper}>
        {/* Logo — top center */}
        <div style={s.logoBlock}>
          <img src="/logo.png" alt="GoFundUs Logo" style={s.logoImg} />
          <span style={s.logoFundUs}>GoFundUs</span>
        </div>

        {/* Card */}
        <div style={s.card}>

          {/* Photo upload */}
          <div style={s.avatarSection}>
            <button
              type="button"
              style={s.avatarBtn}
              onClick={() => fileRef.current.click()}
              title="Upload profile photo"
            >
              {photo
                ? <img src={photo} alt="avatar" style={s.avatarImg} />
                : <span style={s.avatarPlaceholder}>+</span>
              }
            </button>
            <p style={s.avatarHint}>
              {photo ? 'Tap to change photo' : 'Add profile photo'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />
          </div>

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Username + Email row */}
            <div style={s.row}>
              <Field label="Username" id="reg-username">
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your_name"
                  required
                  style={s.input}
                />
              </Field>
              <Field label="Email" id="reg-email">
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={s.input}
                />
              </Field>
            </div>

            {/* Password + Role row */}
            <div style={s.row}>
              <Field label="Password" id="reg-pass">
                <input
                  id="reg-pass"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  style={s.input}
                />
              </Field>
              <Field label="I am a…" id="reg-role">
                <select
                  id="reg-role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ ...s.input, cursor: 'pointer' }}
                >
                  <option value="donor">Donor</option>
                </select>
              </Field>
            </div>

            {/* Cause interests — only shown for donors */}
            {role === 'donor' && (
              <div style={s.causesBlock}>
                <label style={s.causeLabel}>
                  What causes do you care about?
                  <span style={s.causeHint}> (pick any)</span>
                </label>
                <div style={s.causeGrid}>
                  {CAUSES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCause(c)}
                      style={{
                        ...s.causeTag,
                        ...(causes.includes(c) ? s.causeTagActive : {}),
                      }}
                    >
                      {causes.includes(c) && <span style={s.checkDot}>✓ </span>}
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={s.btn}>
              {loading
                ? <span style={s.spinner} />
                : 'Create account'}
            </button>
          </form>

          <p style={s.footer}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
          <p style={{ ...s.footer, marginTop: '0.5rem' }}>
            Registering an orphanage?{' '}
            <Link to="/register-institution" style={{ ...s.link, color: '#0284c7' }}>Institution portal →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── tiny helper ── */
const Field = ({ label, id, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
    <label htmlFor={id} style={{
      fontSize: '0.72rem', fontWeight: 700, color: '#475569',
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {label}
    </label>
    {children}
  </div>
);

/* ── styles ── */
const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f0f6ff 0%, #e8f4fd 50%, #f7f8fa 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor: {
    position: 'absolute',
    width: '600px', height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,82,106,0.08) 0%, transparent 70%)',
    top: '-100px', right: '-150px',
    pointerEvents: 'none',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '720px',
    position: 'relative',
    zIndex: 1,
  },

  /* Logo */
  logoBlock: {
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    userSelect: 'none',
  },
  logoImg: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  logoFundUs: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#38526A',
    letterSpacing: '-0.03em',
  },

  /* Card */
  card: {
    background: '#ffffff',
    border: '3px solid #ffffff',
    boxShadow: '0 8px 48px rgba(30,58,95,0.14), 0 0 0 1px rgba(45,156,219,0.12)',
    borderRadius: '24px',
    padding: '3.5rem 3rem',
    width: '100%',
  },

  /* Photo */
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.75rem',
  },
  avatarBtn: {
    width: '80px', height: '80px',
    borderRadius: '50%',
    border: '3px dashed #cbd5e1',
    background: '#f8fafc',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    padding: 0,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    fontSize: '1.8rem',
    color: '#94a3b8',
    lineHeight: 1,
    fontWeight: 300,
  },
  avatarHint: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },

  /* Form */
  form: { display: 'flex', flexDirection: 'column', gap: '1.75rem' },
  row: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },

  /* Causes */
  causesBlock: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  causeLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: '#475569',
    letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  causeHint: { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' },
  causeGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
  },
  causeTag: {
    padding: '0.35rem 0.85rem',
    borderRadius: '99px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  causeTagActive: {
    border: '1.5px solid #38526A',
    background: '#f1f5f9',
    color: '#38526A',
    fontWeight: 600,
  },
  checkDot: { fontSize: '0.7rem' },

  /* Button */
  btn: {
    padding: '0.8rem',
    background: '#38526A',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '46px',
    marginTop: '0.25rem',
  },
  spinner: {
    width: '18px', height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    marginTop: '1.25rem',
    fontSize: '0.85rem',
    color: '#64748b',
    textAlign: 'center',
  },
  link: { color: '#38526A', fontWeight: 600, textDecoration: 'none' },
};

export default Register;
