import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../services/api';
import { uploadProfilePhoto } from '../services/cloudinary';

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
  const [showPassword, setShowPassword] = useState(false);
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
      const res = await apiFetch('/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, email, password, role,
          preferred_causes: causes.join(', '),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Registration failed');

      if (photoFile) {
        let remotePhotoUrl = null;
        try {
          remotePhotoUrl = await uploadProfilePhoto(photoFile, username);
        } catch (uploadError) {
          console.warn('Photo upload failed; using local preview:', uploadError);
        }
        localStorage.setItem(`avatar_${username}`, remotePhotoUrl || photo);
      }

      // Auto-login: store session data exactly like Login.jsx does
      localStorage.setItem('user', JSON.stringify(data.user || { username }));
      window.dispatchEvent(new Event('auth-change'));

      addToast('Account created! Welcome to GoFundUs', 'success');
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
      <style>{`
        @media (max-width: 480px) {
          .register-card { padding: 1.75rem 1.25rem !important; }
        }
      `}</style>
      {/* Subtle background pattern */}
      <div style={s.bgDecor} />

      <div style={s.wrapper}>
        {/* Logo — top center */}
        <div style={s.logoBlock}>
          <img src="/logo.png" alt="GoFundUs Logo" style={s.logoImg} />
          <span style={s.logoFundUs}>GoFundUs</span>
        </div>

        {/* Card */}
        <div style={s.card} className="register-card">

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
                <div style={s.passwordWrap}>
                  <input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    style={{ ...s.input, paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={s.passwordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
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
      fontSize: '0.72rem', fontWeight: 700, color: '#766d63',
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
    background: 'linear-gradient(135deg, rgba(23,23,23,0.72) 0%, rgba(23,23,23,0.65) 100%), url("https://images.unsplash.com/photo-1503454537688-e6694d91d4a9?auto=format&fit=crop&w=1400&q=60")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
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
    background: 'radial-gradient(circle, rgba(220,177,122,0.15) 0%, transparent 70%)',
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
    boxShadow: '0 0 0 3px rgba(207,156,93,0.4), 0 8px 16px rgba(207,156,93,0.35)',
    border: '2px solid #cf9c5d',
    position: 'relative',
  },
  logoFundUs: {
    fontSize: '1.8rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #f7f1ea 0%, #f2c261 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.03em',
  },

  /* Card */
  card: {
    background: '#f7f1ea',
    border: '1px solid #efe5d8',
    boxShadow: '0 28px 52px rgba(0,0,0,0.32)',
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
    border: '3px dashed #d9c5a5',
    background: '#faf6f1',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    padding: 0,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    fontSize: '1.8rem',
    color: '#b8a997',
    lineHeight: 1,
    fontWeight: 300,
  },
  avatarHint: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#8d7f72',
  },

  /* Form */
  form: { display: 'flex', flexDirection: 'column', gap: '1.75rem' },
  row: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
  passwordWrap: { position: 'relative', width: '100%' },
  passwordToggle: {
    position: 'absolute',
    right: '0.7rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    color: '#8d7f72',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e6d6bf',
    background: '#fcfaf7',
    color: '#241f1d',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },

  /* Causes */
  causesBlock: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  causeLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: '#766d63',
    letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  causeHint: { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#8d7f72' },
  causeGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
  },
  causeTag: {
    padding: '0.35rem 0.85rem',
    borderRadius: '99px',
    border: '1.5px solid #e6d6bf',
    background: '#faf6f1',
    color: '#5e574f',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  causeTagActive: {
    border: '1.5px solid #cf9c5d',
    background: '#f5f0eb',
    color: '#b8804d',
    fontWeight: 600,
  },
  checkDot: { fontSize: '0.7rem' },

  /* Button */
  btn: {
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #2a5148 0%, #1f342f 100%)',
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
    boxShadow: '0 10px 20px rgba(42,81,72,0.2)',
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
    color: '#5e574f',
    textAlign: 'center',
  },
  link: { color: '#1f3d36', fontWeight: 600, textDecoration: 'none' },
};

export default Register;
