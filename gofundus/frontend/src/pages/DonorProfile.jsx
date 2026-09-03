import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../services/api';
import { uploadProfilePhoto } from '../services/cloudinary';

const CAUSES = [
  'Education', 'Healthcare', 'Nutrition', 'Shelter', 'Infant Care',
  'Special Needs', 'Vocational Training', 'Mental Health', 'Sports & Play',
  'Clean Water', 'Emergency Relief', 'Family Reunification',
];

const DonorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCauses, setSelectedCauses] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadProfile = async () => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/login');
      return;
    }

    let localUser = null;
    try {
      localUser = JSON.parse(raw);
    } catch {
      navigate('/login');
      return;
    }

    try {
      const usernameParam = localUser.username ? `?username=${encodeURIComponent(localUser.username)}` : '';
      const res = await apiFetch(`/profile/me/${usernameParam}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        syncEditForm(data);
      } else {
        throw new Error('Profile fetch failed');
      }
    } catch (err) {
      console.warn('Using local fallback profile:', err);
      const fallback = {
        user: localUser,
        role: localUser.role || 'donor',
        donor: { preferred_causes: 'Education, Nutrition, Infant Care' },
        matches: [],
        notifications: [
          { id: '1', message: 'Welcome to your GoFundUs account portal!', is_read: true, created_at: new Date().toISOString() }
        ]
      };
      setProfile(fallback);
      syncEditForm(fallback);
    } finally {
      setLoading(false);
    }
  };

  const syncEditForm = (data) => {
    const u = data?.user || {};
    setFirstName(u.first_name || '');
    setLastName(u.last_name || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');

    const causesStr = data?.donor?.preferred_causes || '';
    if (causesStr) {
      setSelectedCauses(causesStr.split(',').map(c => c.trim()).filter(Boolean));
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const toggleCause = (cause) => {
    setSelectedCauses(prev =>
      prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    const username = profile?.user?.username || JSON.parse(localStorage.getItem('user') || '{}').username;

    // Handle avatar photo upload if changed
    if (avatarFile && username) {
      try {
        const remoteUrl = await uploadProfilePhoto(avatarFile, username);
        if (remoteUrl) {
          localStorage.setItem(`avatar_${username}`, remoteUrl);
        } else if (avatarPreview) {
          localStorage.setItem(`avatar_${username}`, avatarPreview);
        }
      } catch (uploadErr) {
        console.warn('Avatar upload fallback:', uploadErr);
        if (avatarPreview) {
          localStorage.setItem(`avatar_${username}`, avatarPreview);
        }
      }
    }

    try {
      const usernameParam = username ? `?username=${encodeURIComponent(username)}` : '';
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        preferred_causes: selectedCauses.join(', '),
      };

      const res = await apiFetch(`/profile/me/${usernameParam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);

        // Update local session
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        }));
        window.dispatchEvent(new Event('auth-change'));

        addToast('Profile updated successfully!', 'success');
        setEditing(false);
      } else {
        throw new Error('Update failed');
      }
    } catch {
      // Local update fallback
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(prev => ({
        ...prev,
        user: updatedUser,
        donor: { ...prev?.donor, preferred_causes: selectedCauses.join(', ') },
      }));
      window.dispatchEvent(new Event('auth-change'));
      addToast('Profile changes saved locally.', 'success');
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const user = profile?.user || JSON.parse(localStorage.getItem('user') || '{}');
  const role = profile?.role || user?.role || 'donor';
  const matches = profile?.matches || [];
  const notifications = profile?.notifications || [];
  const donor = profile?.donor || null;
  const institution = profile?.institution || null;

  const storedAvatar = user?.username ? localStorage.getItem(`avatar_${user.username}`) : null;
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() || '?';

  const freshnessInfo = (days) => {
    if (days === null || days === undefined) return { label: 'Unverified', color: '#64748b', bg: '#f1f5f9' };
    if (days <= 7) return { label: `${days}d ago`, color: '#16a34a', bg: '#dcfce7' };
    if (days <= 30) return { label: `${days}d ago`, color: '#0284c7', bg: '#e0f2fe' };
    if (days <= 90) return { label: `${days}d old`, color: '#d97706', bg: '#fef3c7' };
    return { label: `Stale (${days}d)`, color: '#dc2626', bg: '#fee2e2' };
  };

  const roleLabel = role === 'institution_admin'
    ? 'Institution Administrator'
    : role === 'admin' || role === 'system_admin'
    ? 'System Administrator'
    : 'Registered Donor';

  return (
    <div style={s.page}>
      
      {/* Profile Header Hero Card */}
      <div style={s.heroCard}>
        <div style={{ position: 'relative' }}>
          {storedAvatar || avatarPreview ? (
            <img
              src={avatarPreview || storedAvatar}
              alt="avatar"
              style={{ ...s.avatar, objectFit: 'cover', padding: 0 }}
            />
          ) : (
            <div style={s.avatar}>{initials}</div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={s.heroName}>
                {user.first_name || user.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user.username}
              </h1>
              <p style={{ margin: '0.2rem 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
                @{user.username}
              </p>
            </div>

            <button
              onClick={() => { setEditing(!editing); syncEditForm(profile); }}
              style={s.editBtn}
            >
              {editing ? 'Cancel' : '✎ Edit Profile'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <Badge color="#0369a1" bg="#e0f2fe">{roleLabel}</Badge>
            {user.email && <span style={s.meta}>{user.email}</span>}
            {user.phone && <span style={s.meta}>📞 {user.phone}</span>}
          </div>

          {donor?.preferred_causes && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#e0f2fe' }}>
              <strong>Causes Supported:</strong> {donor.preferred_causes}
            </p>
          )}
        </div>
      </div>

      {/* Edit Profile Panel */}
      {editing && (
        <div style={s.editCard}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            Update Profile Information
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  border: '2px dashed #0284c7', background: '#f0f9ff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}
              >
                {avatarPreview || storedAvatar ? (
                  <img src={avatarPreview || storedAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem', color: '#0284c7' }}>+</span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
                >
                  Change Profile Photo
                </button>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>PNG, JPG or WEBP up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={s.formLabel}>First Name</label>
                <input
                  style={s.input}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Chris"
                />
              </div>
              <div>
                <label style={s.formLabel}>Last Name</label>
                <input
                  style={s.input}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Mensah"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={s.formLabel}>Email Address</label>
                <input
                  style={s.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label style={s.formLabel}>Phone Number</label>
                <input
                  style={s.input}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                />
              </div>
            </div>

            {role === 'donor' && (
              <div>
                <label style={s.formLabel}>Preferred Causes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {CAUSES.map(c => {
                    const active = selectedCauses.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCause(c)}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: '99px',
                          border: `1.5px solid ${active ? '#0284c7' : '#e2e8f0'}`,
                          background: active ? '#e0f2fe' : '#f8fafc',
                          color: active ? '#0369a1' : '#475569',
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {active && '✓ '} {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role-Specific Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (role === 'donor') ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
        gap: '1.5rem',
      }}>
        
        {/* Donor View: Matched Institutions */}
        {role === 'donor' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>
              <span>Your Top Matches</span>
              <Link to="/matches" style={s.seeAll}>Find new matches →</Link>
            </h2>

            {matches.length === 0 ? (
              <EmptyState text="No matches yet. Use the Matches page to find institutions aligned with your cause." />
            ) : (
              <ul style={s.list}>
                {matches.map((m) => {
                  const fresh = freshnessInfo(m.institution?.days_since_funding_update);
                  const simPct = Math.round((m.similarity_score || 0) * 100);
                  return (
                    <li key={m.id} style={s.matchCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <Badge color="#fff" bg="#0284c7">#{m.final_rank || 1}</Badge>
                            <Badge color={fresh.color} bg={fresh.bg}>{fresh.label}</Badge>
                          </div>
                          <p style={s.matchName}>{m.institution?.name || 'Institution'}</p>
                          <p style={s.matchDistrict}>
                            {m.institution?.district || 'Kumasi'} · {m.institution?.children_count || 0} children
                          </p>
                        </div>
                        <div style={s.scoreBox}>
                          <span style={s.scoreVal}>{simPct}%</span>
                          <span style={s.scoreLabel}>match</span>
                        </div>
                      </div>
                      <div style={s.progressBar}>
                        <div style={{ ...s.progressFill, width: `${simPct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Institution Admin View: Quick Access & Status */}
        {role === 'institution_admin' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Institution Management Portal</h2>
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 700, color: '#166534' }}>
                {institution?.name || 'Your Registered Orphanage'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#15803d', lineHeight: 1.5 }}>
                Your institution is registered and actively discoverable by Kumasi donors on GoFundUs.
              </p>
            </div>
            <Link to="/orphanage-portal" style={s.actionBtnPrimary}>
              Go to Orphanage Operations Portal →
            </Link>
          </div>
        )}

        {/* System Admin View: Quick Access */}
        {(role === 'admin' || role === 'system_admin') && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>System Administration Center</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              You have full administrative privileges to monitor platform equity, send data freshness update prompts, and resolve support tickets.
            </p>
            <Link to="/admin" style={s.actionBtnPrimary}>
              Open Admin Control Panel →
            </Link>
          </div>
        )}

        {/* Notifications Column */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>
            <span>Notifications & Alerts</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {notifications.length} Total
            </span>
          </h2>

          {notifications.length === 0 ? (
            <EmptyState text="You have no notifications at this time." />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  style={{
                    ...s.notifCard,
                    background: n.is_read ? '#f8fafc' : '#eff6ff',
                    borderColor: n.is_read ? '#e2e8f0' : '#bfdbfe',
                  }}
                >
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: n.is_read ? '#94a3b8' : '#0284c7',
                    flexShrink: 0, marginTop: '5px'
                  }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#0f172a', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

const Badge = ({ children, color, bg }) => (
  <span style={{
    fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px',
    borderRadius: '99px', color, background: bg, display: 'inline-flex', alignItems: 'center',
  }}>
    {children}
  </span>
);

const EmptyState = ({ text }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #e2e8f0' }}>
    {text}
  </div>
);

const LoadingScreen = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Loading profile...</span>
  </div>
);

const s = {
  page: { maxWidth: '1020px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: "'Inter', sans-serif" },
  heroCard: {
    display: 'flex', gap: '1.75rem', alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0284c7 100%)',
    borderRadius: '20px', padding: '2.25rem', marginBottom: '2rem', color: '#fff',
    boxShadow: '0 8px 30px rgba(2, 132, 199, 0.18)',
    flexWrap: 'wrap',
  },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
    border: '3px solid rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.9rem', fontWeight: 800, flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  heroName: { fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  meta: { fontSize: '0.82rem', opacity: 0.9, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px' },
  editBtn: {
    padding: '0.45rem 1rem', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.78rem',
    cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(4px)',
    transition: 'background 0.15s',
  },
  editCard: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px',
    padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },
  formLabel: {
    display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem',
  },
  input: {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a',
    fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  section: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  sectionTitle: {
    fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  seeAll: { fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  matchCard: { padding: '1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px' },
  matchName: { margin: '0 0 0.2rem', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' },
  matchDistrict: { margin: 0, fontSize: '0.78rem', color: '#64748b' },
  scoreBox: { textAlign: 'right', flexShrink: 0 },
  scoreVal: { display: 'block', fontSize: '1.3rem', fontWeight: 800, color: '#0284c7', fontVariantNumeric: 'tabular-nums' },
  scoreLabel: { display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  progressBar: { marginTop: '0.75rem', height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #1e3a5f, #0284c7)', borderRadius: '99px', transition: 'width 0.5s ease' },
  notifCard: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid' },
  actionBtnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '0.75rem 1.5rem', background: '#0284c7', color: '#fff',
    borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
  },
};

export default DonorProfile;
