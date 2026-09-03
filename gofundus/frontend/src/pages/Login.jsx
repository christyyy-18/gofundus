import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../services/api';
import { signInWithGoogle } from '../services/firebase';

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
      const res = await apiFetch('/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Login failed');
      localStorage.setItem('user', JSON.stringify(data.user || { username }));
      window.dispatchEvent(new Event('auth-change'));
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await apiFetch('/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Google sign-in failed');
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      addToast('Welcome to GoFundUs!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err?.message || 'Google sign-in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.brandPanel}>
          <div style={styles.brandGlow1} />
          <div style={styles.brandGlow2} />

          <div style={styles.brandHeader}>
            <div style={styles.logoBadge}>G</div>
            <div>
              <div style={styles.brandLabel}>GoFundUs</div>
              <div style={styles.brandSubLabel}>AI-powered donor matching</div>
            </div>
          </div>

          <div style={styles.heroBlock}>
            <div style={styles.heroTextWrap}>
              <div style={styles.kicker}>Precision • transparency • impact</div>
              <h1 style={styles.heroTitle}>Smart giving to Ghanaian orphanages.</h1>
              <p style={styles.heroText}>
                Our AI connects donors with verified orphanages, matching funding to real needs with complete transparency and measurable outcomes.
              </p>
              
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <div style={styles.statNumber}>15+</div>
                  <div style={styles.statLabel}>Orphanages</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statNumber}>350+</div>
                  <div style={styles.statLabel}>Children</div>
                </div>
              </div>
            </div>

            <div style={styles.heroCard}>
              <div style={styles.cardTopBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.dot} />
                  <span style={styles.miniBrand}>GoFundUs</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={styles.miniDot} />
                  <span style={styles.miniDot} />
                  <span style={styles.miniDot} />
                </div>
              </div>

              <div style={styles.cardHeroRow}>
                <div style={styles.textStack}>
                  <p style={styles.cardTitleLarge}>Smart<br />donor<br />matching<br />in Kumasi</p>
                </div>

                <div style={styles.imageStack}>
                  <div style={styles.imageBack} />
                  <div style={styles.imageFrame}>
                    <img
                      src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80"
                      alt="Orphanage support"
                      style={styles.image}
                    />
                  </div>
                  <span style={styles.orangeBlob} />
                  <span style={styles.greenBlob} />
                  <span style={styles.goldBlob} />
                </div>
              </div>

              <div style={styles.programCard}>
                <div style={styles.programHeader}>Verified Needs</div>
                <div style={styles.programGrid}>
                  {[
                    ['Education', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80'],
                    ['Healthcare', 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'],
                    ['Nutrition', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80'],
                    ['Shelter', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80'],
                    ['Clothing', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80'],
                    ['Clean Water', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80'],
                    ['Vocational Training', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'],
                    ['Mental Health', '/images/cherubs_home.png'],
                  ].map(([name, src]) => (
                    <div key={name} style={styles.programItem}>
                      <div style={{ ...styles.programImage, backgroundImage: `url(${src})` }} />
                      <div style={styles.programName}>{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.formPanel}>
          <div style={styles.card}>
            <div style={styles.cardBadge}>AI-powered matching</div>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSub}>Sign in to match with Ghanaian orphanages and fund verified community needs.</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldWrap}>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldWrap}>
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
                {loading ? <span style={styles.spinner} /> : 'Sign in'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerWord}>OR</span>
              <span style={styles.dividerLine} />
            </div>
            <button type="button" onClick={handleGoogleSignIn} disabled={loading} style={styles.googleBtn}>
              <GoogleLogo />
              Sign up with Google
            </button>

            <div style={styles.footer}>
              <p style={{ margin: '0 0 1rem' }}>
                New donor?{' '}
                <Link to="/register" style={styles.link}>Create account</Link>
              </p>
              <p style={{ margin: 0 }}>
                Orphanage admin?{' '}
                <Link to="/register-institution" style={{ ...styles.link, color: '#234d45' }}>Register charity</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '28px',
    background: '#171717',
  },
  shell: {
    width: '100%',
    maxWidth: '1200px',
    borderRadius: '36px',
    background: '#2d2d2d',
    padding: '14px',
    boxShadow: '0 42px 85px rgba(0,0,0,0.38)',
    display: 'flex',
    alignItems: 'stretch',
    minHeight: '760px',
  },
  brandPanel: {
    flex: '1.1',
    position: 'relative',
    background: '#f7f1ea',
    borderRadius: '28px',
    padding: '28px 24px 20px',
    overflow: 'hidden',
  },
  brandGlow1: {
    position: 'absolute',
    left: '-34px',
    top: '54px',
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: 'rgba(220,177,122,0.55)',
    filter: 'blur(36px)',
  },
  brandGlow2: {
    position: 'absolute',
    right: '-40px',
    top: '80px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'rgba(237,201,114,0.6)',
    filter: 'blur(40px)',
  },
  brandHeader: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '26px',
    color: '#2d2a2a',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
    background: '#cf9c5d',
    color: '#fff',
    boxShadow: '0 10px 20px rgba(160,111,53,0.2)',
  },
  brandLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#766d63',
  },
  brandSubLabel: {
    fontSize: '10px',
    fontWeight: 500,
    color: '#463f39',
  },
  heroBlock: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '26px',
    height: 'calc(100% - 80px)',
  },
  heroTextWrap: {
    maxWidth: '520px',
  },
  kicker: {
    display: 'inline-flex',
    border: '1px solid #e6d6bf',
    background: '#fffaf4',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '10px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#7d6b5a',
    marginBottom: '18px',
  },
  heroTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(3rem, 4vw, 5.1rem)',
    lineHeight: '0.88',
    letterSpacing: '-0.08em',
    color: '#241f1d',
    margin: 0,
    maxWidth: '560px',
  },
  heroText: {
    fontSize: '1.04rem',
    lineHeight: 1.7,
    color: '#5d564f',
    marginTop: '14px',
    maxWidth: '490px',
  },
  statsRow: {
    display: 'flex',
    gap: '32px',
    marginTop: '28px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statNumber: {
    fontFamily: 'Georgia, serif',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1,
    color: '#cf9c5d',
    letterSpacing: '-0.05em',
  },
  statLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#5d564f',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  heroCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '470px',
    margin: '0 auto',
    background: '#f0e5d8',
    borderRadius: '30px',
    padding: '18px 16px 14px',
    boxShadow: '0 30px 65px rgba(79,62,42,0.12)',
    animation: 'floatUp 7s ease-in-out infinite',
  },
  cardTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 6px 14px',
    color: '#766d63',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    background: '#c98c52',
  },
  miniBrand: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  miniDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    background: '#d9c5a5',
  },
  cardHeroRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '10px',
  },
  textStack: {
    flex: '1',
    paddingTop: '10px',
    color: '#2c2a2a',
  },
  cardTitleLarge: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    fontSize: '2.5rem',
    lineHeight: '0.82',
    letterSpacing: '-0.07em',
  },
  imageStack: {
    position: 'relative',
    width: '175px',
    height: '185px',
    marginRight: '4px',
  },
  imageBack: {
    position: 'absolute',
    inset: '0 0 0 0',
    borderRadius: '28px',
    background: 'rgba(220,194,158,0.6)',
    filter: 'blur(2px)',
  },
  imageFrame: {
    position: 'absolute',
    left: '16px',
    right: '16px',
    top: '22px',
    height: '138px',
    borderRadius: '26px',
    border: '6px solid #f5f0ea',
    background: '#e6c9a8',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  orangeBlob: {
    position: 'absolute',
    left: '-10px',
    top: '40px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#d26045',
    opacity: 0.9,
  },
  greenBlob: {
    position: 'absolute',
    left: '8px',
    bottom: '-2px',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#4fa8a6',
    opacity: 0.7,
  },
  goldBlob: {
    position: 'absolute',
    right: '-4px',
    top: '62px',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#f2c261',
    opacity: 0.9,
  },
  programCard: {
    background: '#f8f4f0',
    border: '2px solid #e6d6bf',
    borderRadius: '18px',
    padding: '16px 14px 12px',
    marginTop: '14px',
    boxShadow: '0 12px 28px rgba(99,79,56,0.12)',
    width: '100%',
    maxWidth: '560px',
  },
  programHeader: {
    textAlign: 'center',
    fontSize: '11px',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: '#766d63',
    marginBottom: '16px',
    fontWeight: 700,
  },
  programGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '10px',
  },
  programItem: {
    textAlign: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
  },
  programImage: {
    width: '100%',
    height: '56px',
    borderRadius: '12px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    marginBottom: '8px',
    boxShadow: '0 8px 16px rgba(128,106,74,0.12)',
    border: '1px solid rgba(230,214,191,0.5)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  programName: {
    fontSize: '9px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#241f1d',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  formPanel: {
    width: '420px',
    minWidth: '320px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '0px',
    paddingBottom: '18px',
    paddingLeft: '18px',
    paddingRight: '18px',
    background: 'linear-gradient(180deg, #f7f1ea 0%, #f3eee6 100%)',
    borderRadius: '28px',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(180,155,129,0.25)',
    borderRadius: '26px',
    padding: '20px 24px 20px',
    boxShadow: '0 18px 30px rgba(90,70,50,0.08)',
    marginTop: '28px',
  },
  cardBadge: {
    display: 'inline-flex',
    padding: '7px 10px',
    borderRadius: '999px',
    border: '1px solid #eedac0',
    background: '#fffaf3',
    color: '#7d6b5a',
    fontSize: '9px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: '18px',
  },
  cardTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: '2.5rem',
    letterSpacing: '-0.05em',
    color: '#1d1a18',
    margin: '0 0 10px',
  },
  cardSub: {
    fontSize: '0.92rem',
    lineHeight: 1.7,
    color: '#655f5a',
    marginBottom: '22px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.95rem 1rem',
    borderRadius: '14px',
    border: '1px solid #e7decf',
    background: '#fcfaf7',
    color: '#221f1d',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  btn: {
    marginTop: '8px',
    width: '100%',
    padding: '0.95rem 1.2rem',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #2a5148 0%, #1f342f 100%)',
    color: '#fff',
    border: 'none',
    fontSize: '0.86rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 14px 24px rgba(42,81,72,0.18)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '18px 0 14px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#ded5ca',
  },
  dividerWord: {
    color: '#302b27',
    fontSize: '0.8rem',
    fontWeight: 800,
    letterSpacing: '0.16em',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '0.85rem 1.2rem',
    borderRadius: '14px',
    border: '1px solid #ded5ca',
    background: '#fff',
    color: '#302b27',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  spinner: {
    width: '16px',
    height: '16px',
    margin: '0 auto',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'block',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    marginTop: '1.25rem',
    fontSize: '0.85rem',
    color: '#5d564f',
    textAlign: 'center',
  },
  link: {
    color: '#1f3d36',
    textDecoration: 'none',
    fontWeight: 700,
  },
};

export default Login;
