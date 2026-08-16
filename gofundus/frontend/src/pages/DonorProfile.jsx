import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const DonorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    const user = JSON.parse(raw);
    fetch(`${API}/profile/me/?username=${user.username}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => {
        setProfile({ user, role: 'donor', matches: [], notifications: [], donor: null });
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingScreen />;

  const { user, role, matches = [], notifications = [], donor } = profile;
  const storedAvatar = localStorage.getItem(`avatar_${user.username}`);
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';


  const freshnessInfo = (days) => {
    if (days === null || days === undefined) return { label: 'Unverified', color: '#64748b', bg: '#f1f5f9' };
    if (days <= 7) return { label: `${days}d ago`, color: '#16a34a', bg: '#dcfce7' };
    if (days <= 30) return { label: `${days}d ago`, color: '#0284c7', bg: '#e0f2fe' };
    if (days <= 90) return { label: `${days}d old`, color: '#d97706', bg: '#fef3c7' };
    return { label: `Stale (${days}d)`, color: '#dc2626', bg: '#fee2e2' };
  };

  return (
    <div style={s.page}>
      {/* Profile header card */}
      <div style={s.heroCard}>
        {storedAvatar
          ? <img src={storedAvatar} alt="avatar" style={{ ...s.avatar, objectFit: 'cover', padding: 0, border: '3px solid rgba(255,255,255,0.5)' }} />
          : <div style={s.avatar}>{initials}</div>
        }

        <div>
          <h1 style={s.heroName}>
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <Badge color="#2D9CDB" bg="#e0f2fe">{role === 'donor' ? 'Donor' : role}</Badge>
            {user.email && <span style={s.meta}>{user.email}</span>}
            {user.phone && <span style={s.meta}>{user.phone}</span>}
          </div>
          {donor?.preferred_causes && (
            <p style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>Interests:</strong> {donor.preferred_causes}
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: (role === 'donor' || user?.role === 'donor') ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
        gap: '1.5rem',
      }}>
        {/* Matched Institutions (Donors only) */}
        {(role === 'donor' || user?.role === 'donor') && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>
              Your Top Matches
              <Link to="/matches" style={s.seeAll}>Find new matches →</Link>
            </h2>
            {matches.length === 0 ? (
              <EmptyState text="No matches yet. Use the Matches page to find institutions." />
            ) : (
              <ul style={s.list}>
                {matches.map((m) => {
                  const fresh = freshnessInfo(m.institution.days_since_funding_update);
                  return (
                    <li key={m.id} style={s.matchCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <Badge color="#fff" bg="#2D9CDB">#{m.final_rank}</Badge>
                            <Badge color={fresh.color} bg={fresh.bg}>
                              {fresh.label}
                            </Badge>
                          </div>
                        <p style={s.matchName}>{m.institution.name}</p>
                        <p style={s.matchDistrict}>{m.institution.district} · {m.institution.children_count} children</p>
                      </div>
                      <div style={s.scoreBox}>
                        <span style={s.scoreVal}>{Math.round(m.similarity_score * 100)}%</span>
                        <span style={s.scoreLabel}>match</span>
                      </div>
                    </div>
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${Math.round(m.similarity_score * 100)}%` }} />
                    </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Notifications */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Notifications</h2>
          {notifications.length === 0 ? (
            <EmptyState text="No notifications." />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {notifications.map((n) => (
                <li key={n.id} style={{
                  ...s.notifCard,
                  background: n.is_read ? '#f8fafc' : '#f0f9ff',
                  borderColor: n.is_read ? '#e2e8f0' : '#bae6fd',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.is_read ? '#cbd5e1' : '#2D9CDB', flexShrink: 0, marginTop: '4px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.5 }}>{n.message}</p>
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
  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '12px' }}>
    {text}
  </div>
);

const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #2D9CDB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const s = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' },
  heroCard: {
    display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2D9CDB 100%)',
    borderRadius: '20px', padding: '2rem', marginBottom: '2rem', color: '#fff',
  },
  avatar: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
    border: '2px solid rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem', fontWeight: 800, flexShrink: 0,
  },
  heroName: { fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  meta: { fontSize: '0.82rem', opacity: 0.8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  section: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' },
  sectionTitle: {
    fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  seeAll: { fontSize: '0.78rem', color: '#2D9CDB', fontWeight: 600, textDecoration: 'none' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' },
  matchCard: { padding: '1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px' },
  matchName: { margin: '0 0 0.2rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' },
  matchDistrict: { margin: 0, fontSize: '0.78rem', color: '#64748b' },
  scoreBox: { textAlign: 'right', flexShrink: 0 },
  scoreVal: { display: 'block', fontSize: '1.3rem', fontWeight: 800, color: '#2D9CDB', fontVariantNumeric: 'tabular-nums' },
  scoreLabel: { display: 'block', fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  progressBar: { marginTop: '0.75rem', height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #1e3a5f, #2D9CDB)', borderRadius: '99px', transition: 'width 0.5s ease' },
  notifCard: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid' },
};

export default DonorProfile;
