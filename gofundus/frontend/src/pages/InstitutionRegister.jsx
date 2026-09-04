import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../services/api';
import { LockKeyhole, ShieldCheck } from 'lucide-react';




/* ── Password strength scorer ── */
const scorePassword = (pw) => {
  let score = 0;
  if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: '',          color: '#e2e8f0' },
    { label: 'Weak',      color: '#ef4444' },
    { label: 'Fair',      color: '#f97316' },
    { label: 'Good',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very Strong', color: '#16a34a' },
  ];
  return { score, ...map[Math.min(score, 5)] };
};

/* ── GHANA DISTRICTS (subset) ── */
const DISTRICTS = [
  'Kumasi Metropolitan', 'Asokwa', 'Ayigya', 'Ayigya Zongo', 'Santasi',
  'Suame', 'Oforikrom', 'Kwadaso', 'Nhyiaeso', 'Asawase', 'Manteahama',
  'Ejisu', 'Bekwai', 'Mampong', 'Kwabre East', 'Other',
];

/* ── INSTITUTION TYPES ── */
const ORG_TYPES = [
  "Government-Registered Orphanage",
  "Faith-Based Children's Home",
  "NGO-Operated Children's Shelter",
  "Community Children's Home",
  "Rehabilitation Centre for Minors",
];

export default function InstitutionRegister() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  /* form state */
  const [step, setStep]       = useState(1); // 1 = Institution details, 2 = Admin account
  const [loading, setLoading] = useState(false);

  /* Step 1 — Institution */
  const [orgName, setOrgName]         = useState('');
  const [orgType, setOrgType]         = useState('');
  const [regNumber, setRegNumber]     = useState('');
  const [district, setDistrict]       = useState('');
  const [address, setAddress]         = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [childrenCount, setChildrenCount] = useState('');
  const [agreed, setAgreed]           = useState(false);

  /* Step 2 — Admin account */
  const [adminName, setAdminName]     = useState('');
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);

  const pwStrength = scorePassword(password);
  const strongEnough = pwStrength.score >= 3;

  /* ── Step 1 validation ── */
  const step1Valid = orgName && orgType && regNumber && district && address && contactEmail && agreed;

  /* ── Step 2 submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strongEnough) { addToast('Please choose a stronger password.', 'error'); return; }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          role: 'institution_admin',
          first_name: adminName,
          institution_name: orgName,
          district,
          address,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          children_count: Number(childrenCount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Registration failed');

      // Store session
      localStorage.setItem('user', JSON.stringify(data.user || { username, role: 'institution_admin' }));
      window.dispatchEvent(new Event('auth-change'));

      // Store institution details locally (keyed by username) for the portal
      localStorage.setItem(`institution_${username}`, JSON.stringify({
        name: orgName,
        type: orgType,
        reg_number: regNumber,
        district,
        address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        children_count: Number(childrenCount) || 0,
        admin_name: adminName,
      }));

      addToast(`Welcome, ${orgName}! Your portal is ready.`, 'success');
      navigate('/orphanage-portal');
    } catch (err) {
      addToast(err?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @media (max-width: 480px) {
          .institution-register-card { padding: 1.75rem 1.25rem !important; }
          .institution-register-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Subtle background */}
      <div style={s.bgLeft} />

      <div style={s.wrapper}>

        {/* Logo + heading */}
        <div style={s.header}>
          <img src="/logo.png" alt="GoFundUs" style={s.logo}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={s.brand}>GoFundUs</div>
            <div style={s.brandSub}>Orphanage Registration Portal</div>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={s.progress}>
          <Step n={1} active={step === 1} done={step > 1} label="Institution Details" />
          <div style={s.progressLine} />
          <Step n={2} active={step === 2} done={false} label="Admin Account" />
        </div>

        {/* ─── STEP 1 — Institution ─── */}
        {step === 1 && (
          <div style={s.card} className="institution-register-card">
            <h2 style={s.cardTitle}>Tell us about your orphanage</h2>
            <p style={s.cardSub}>
              All fields are required. Only officially registered orphanages may join.
            </p>

            <div style={s.form}>

              <Field label="Registered Orphanage / Children's Home Name" required>
                <input
                  id="org-name"
                  style={s.input}
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Mampong Babies Home"
                  required
                />
              </Field>

              <div style={s.row2} className="institution-register-row2">
                <Field label="Type of Organisation" required>
                  <select id="org-type" style={s.input} value={orgType} onChange={e => setOrgType(e.target.value)} required>
                    <option value="">Select type…</option>
                    {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>

                <Field label="District / Area (Kumasi)" required>
                  <select id="district" style={s.input} value={district} onChange={e => setDistrict(e.target.value)} required>
                    <option value="">Select district…</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Full Physical Address" required>
                <input
                  id="address"
                  style={s.input}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, area, city"
                  required
                />
              </Field>

              {/* Verification row */}
              <div style={s.verifyBox}>
                <div style={s.verifyIcon}><LockKeyhole size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={s.verifyTitle}>Government Registration Number</div>
                  <div style={s.verifySub}>
                    Enter the official DSW / DSWR registration number issued to your orphanage by the Ghana Department of Social Welfare.
                  </div>
                  <input
                    id="reg-number"
                    style={{ ...s.input, marginTop: '0.6rem', background: '#fff' }}
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. DSW/KS/2019/0042"
                    required
                  />
                </div>
              </div>

              <div style={s.row2} className="institution-register-row2">
                <Field label="Institution Contact Email" required>
                  <input
                    id="contact-email"
                    style={s.input}
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="info@yourorphanage.org"
                    required
                  />
                </Field>

                <Field label="Institution Phone Number">
                  <input
                    id="contact-phone"
                    style={s.input}
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                  />
                </Field>
              </div>

              <Field label="Number of Children Currently in Care">
                <input
                  id="children-count"
                  style={{ ...s.input, maxWidth: '200px' }}
                  type="number"
                  min="0"
                  value={childrenCount}
                  onChange={e => setChildrenCount(e.target.value)}
                  placeholder="e.g. 48"
                />
              </Field>

              {/* Declaration checkbox */}
              <label style={s.declaration}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#38526A', flexShrink: 0, marginTop: '2px' }}
                />
                <span>
                  I confirm that this is a <strong>legally registered children's home</strong> in Ghana, and I am authorised to represent it on this platform. I understand that GoFundUs may verify this information with the Department of Social Welfare.
                </span>
              </label>

              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                style={{ ...s.btn, opacity: step1Valid ? 1 : 0.45, cursor: step1Valid ? 'pointer' : 'not-allowed' }}
              >
                Continue to Admin Account →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2 — Admin account ─── */}
        {step === 2 && (
          <div style={s.card} className="institution-register-card">
            <button onClick={() => setStep(1)} style={s.backBtn}>← Back</button>
            <h2 style={s.cardTitle}>Create your admin account</h2>
            <p style={s.cardSub}>
              This account will manage <strong>{orgName}</strong>'s portal on GoFundUs.
            </p>

            <form onSubmit={handleSubmit} style={s.form}>

              <div style={s.row2} className="institution-register-row2">
                <Field label="Your Full Name" required>
                  <input
                    id="admin-name"
                    style={s.input}
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Ama Boateng"
                    required
                  />
                </Field>
                <Field label="Username (used to log in)" required>
                  <input
                    id="admin-username"
                    style={s.input}
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="e.g. mampong_admin"
                    pattern="[a-z0-9_]+"
                    title="Lowercase letters, numbers, and underscores only"
                    required
                  />
                </Field>
              </div>

              <Field label="Work Email Address" required>
                <input
                  id="admin-email"
                  style={s.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourorphanage.org"
                  required
                />
              </Field>

              <Field label="Password" required>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-password"
                    style={{ ...s.input, paddingRight: '3rem' }}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={s.eyeBtn}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '99px',
                          background: i <= pwStrength.score ? pwStrength.color : '#e2e8f0',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: pwStrength.color, fontWeight: 600 }}>
                      {pwStrength.label}
                      {!strongEnough && password && ' — add uppercase, numbers or symbols'}
                    </div>
                  </div>
                )}
              </Field>

              {/* Security notice */}
              <div style={s.securityNote}>
                <ShieldCheck size={15} />
                <span>
                  Your account is protected with secure session tokens. 
                  Never share your password. GoFundUs staff will never ask for it.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !strongEnough}
                style={{ ...s.btn, opacity: (loading || !strongEnough) ? 0.55 : 1, cursor: (loading || !strongEnough) ? 'not-allowed' : 'pointer' }}
              >
                {loading
                  ? <><span style={s.spinner} /> Creating account…</>
                  : 'Register Orphanage & Activate Portal'}
              </button>
            </form>
          </div>
        )}

        <p style={s.footer}>
          Already registered?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
          {' · '}
          <Link to="/register" style={s.link}>Donor registration</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Small helpers ── */
const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{
      fontSize: '0.72rem', fontWeight: 700, color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
  </div>
);

const Step = ({ n, active, done, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '0.85rem',
      background: done ? '#16a34a' : active ? '#38526A' : '#e2e8f0',
      color: (done || active) ? '#fff' : '#94a3b8',
      transition: 'all 0.2s',
    }}>
      {done ? '✓' : n}
    </div>
    <span style={{
      fontSize: '0.68rem', fontWeight: active ? 700 : 500,
      color: active ? '#38526A' : done ? '#16a34a' : '#94a3b8',
      textAlign: 'center', maxWidth: '80px', lineHeight: 1.2,
    }}>
      {label}
    </span>
  </div>
);

/* ── Styles ── */
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
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  bgLeft: {
    position: 'absolute',
    width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220,177,122,0.15) 0%, transparent 70%)',
    top: '-120px', left: '-150px',
    pointerEvents: 'none',
  },
  wrapper: {
    width: '100%',
    maxWidth: '580px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  logo: {
    width: '42px', height: '42px',
    borderRadius: '10px',
    objectFit: 'cover',
    boxShadow: '0 0 0 2px rgba(207,156,93,0.4), 0 8px 16px rgba(207,156,93,0.35)',
    border: '2px solid #cf9c5d',
  },
  brand: {
    fontSize: '1.3rem', fontWeight: 800,
    background: 'linear-gradient(135deg, #f7f1ea 0%, #f2c261 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.03em', lineHeight: 1,
  },
  brandSub: {
    fontSize: '0.75rem', color: '#8d7f72', marginTop: '2px',
  },

  /* Progress */
  progress: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    width: '100%',
    maxWidth: '260px',
    justifyContent: 'center',
  },
  progressLine: {
    flex: 1,
    height: '2px',
    background: '#e6d6bf',
    marginTop: '15px',
    alignSelf: 'flex-start',
    marginInline: '0.4rem',
  },

  /* Card */
  card: {
    background: '#f7f1ea',
    border: '1px solid #efe5d8',
    borderRadius: '20px',
    padding: '2.5rem 2.25rem',
    width: '100%',
    boxShadow: '0 28px 52px rgba(0,0,0,0.32)',
  },
  cardTitle: {
    fontSize: '1.35rem', fontWeight: 800, color: '#241f1d',
    margin: '0 0 0.4rem', letterSpacing: '-0.02em',
  },
  cardSub: {
    fontSize: '0.875rem', color: '#5e574f',
    margin: '0 0 1.75rem', lineHeight: 1.55,
  },

  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },

  input: {
    width: '100%',
    padding: '0.75rem 0.95rem',
    borderRadius: '10px',
    border: '1.5px solid #e6d6bf',
    background: '#fcfaf7',
    color: '#241f1d',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },

  /* Verification highlight box */
  verifyBox: {
    display: 'flex',
    gap: '0.85rem',
    padding: '1rem 1.1rem',
    background: '#f5f0eb',
    border: '1.5px solid #e6d6bf',
    borderRadius: '12px',
  },
  verifyIcon: { fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' },
  verifyTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#5e574f', marginBottom: '0.2rem' },
  verifySub: { fontSize: '0.78rem', color: '#8d7f72', lineHeight: 1.55 },

  /* Declaration */
  declaration: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.9rem 1rem',
    background: '#faf6f1',
    border: '1.5px solid #e6d6bf',
    borderRadius: '10px',
    fontSize: '0.82rem',
    color: '#5e574f',
    lineHeight: 1.55,
    cursor: 'pointer',
  },

  /* Security note */
  securityNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    padding: '0.8rem 1rem',
    background: '#f5f0eb',
    border: '1.5px solid #e6d6bf',
    borderRadius: '10px',
    fontSize: '0.78rem',
    color: '#5e574f',
    lineHeight: 1.55,
  },

  btn: {
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #2a5148 0%, #1f342f 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    minHeight: '48px',
    marginTop: '0.25rem',
    transition: 'opacity 0.15s',
    boxShadow: '0 10px 20px rgba(42,81,72,0.2)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#8d7f72',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    padding: '0 0 1rem',
    fontFamily: 'inherit',
    display: 'block',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
    padding: '4px',
  },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  footer: {
    fontSize: '0.82rem', color: '#5e574f', textAlign: 'center',
  },
  link: {
    color: '#1f3d36', fontWeight: 600, textDecoration: 'none',
  },
};
