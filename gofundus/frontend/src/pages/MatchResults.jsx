import React, { useState } from 'react';
import { useToast } from '../components/ToastProvider';
import { matchDonorStatement } from '../services/api';
import SupportModal from '../components/SupportModal';

const MatchResults = () => {
  const [statement, setStatement] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [supportInst, setSupportInst] = useState(null);
  const { addToast } = useToast();

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!statement.trim()) return;
    setLoading(true);
    try {
      const data = await matchDonorStatement(statement);
      setResults(data);
    } catch (err) {
      addToast('Could not fetch matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFreshnessLabel = (days) => {
    if (days === null || days === undefined) return { label: 'Unverified Data', color: '#64748b' };
    if (days <= 7) return { label: `Updated ${days}d ago`, color: '#16a34a' };
    if (days <= 30) return { label: `Updated ${days}d ago`, color: '#0284c7' };
    if (days <= 90) return { label: `Info ${days}d old`, color: '#d97706' };
    return { label: `Stale (${days}d old)`, color: '#dc2626' };
  };

  const getHomeImage = (inst) => {
    if (inst.image_url) return inst.image_url;
    if (Number(inst.gps_lat) >= 20) return '/images/hong_kong_home.svg';
    if (inst.name?.includes('Mampong')) return '/images/mampong_home.png';
    if (inst.name?.includes('King Jesus')) return '/images/king_jesus_home.png';
    if (inst.name?.includes('Cherubs')) return '/images/cherubs_home.png';
    if (inst.name?.includes('Suame') || inst.name?.includes('Nations')) return '/images/youth_home.png';
    return '/children.png';
  };

  const handleSupport = (inst) => {
    setSelectedMatch(null);
    setSupportInst(inst);
  };

  return (
    <section style={{ maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
        Find Your Impact Match
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.92rem' }}>
        Describe what causes you care about and our AI engine will match you with the relevant Kumasi orphanages. Tap any card to view full profile & photo.
      </p>

      <form onSubmit={handleMatch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="e.g. I want to help orphaned infants get access to quality education, healthcare, and nutritious meals..."
          rows={3}
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '0.85rem 1.1rem',
            borderRadius: '12px',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            alignSelf: 'flex-start',
            padding: '0.85rem 1.6rem',
            background: 'linear-gradient(135deg, #2D9CDB 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s',
            boxShadow: '0 4px 14px rgba(45,156,219,0.3)',
          }}
        >
          {loading ? 'Matching…' : '✨ Find Matches'}
        </button>
      </form>

      {results && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontWeight: 600 }}>
            {results.total_matched} result{results.total_matched !== 1 ? 's' : ''} for "{results.query}"
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {results.matches.map((match) => {
              const inst = match.institution;
              const freshness = getFreshnessLabel(inst.days_since_funding_update);
              const img = getHomeImage(inst);

              return (
                <li
                  key={inst.id}
                  onClick={() => setSelectedMatch(match)}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '18px',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#2D9CDB';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(45,156,219,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Thumbnail photo */}
                    <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                      <img src={img} alt={inst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/children.png'; }} />
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: '#2D9CDB',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '2px 8px',
                        }}>
                          #{match.rank} Match
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: freshness.color,
                          border: `1px solid ${freshness.color}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                        }}>
                          {freshness.label}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        {inst.name}
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                        📍 {inst.district} · 👶 {inst.children_count} children · 💳 GHS {Number(inst.funding_gap).toLocaleString()} gap
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                        {inst.cause_description.slice(0, 140)}…
                      </p>
                    </div>

                    {/* Match Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0, alignSelf: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2D9CDB', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {Math.round(match.final_score * 100)}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>AI Match Score</div>
                      <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, marginTop: '8px' }}>Tap for Profile ➔</div>
                    </div>
                  </div>

                  {/* Match reasons */}
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {match.match_reasons.map((reason, i) => (
                      <span key={i} style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        padding: '3px 9px',
                      }}>
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── PROFILE MODAL FOR MATCHED INSTITUTION ── */}
      {selectedMatch && (
        <div
          onClick={() => setSelectedMatch(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              onClick={() => setSelectedMatch(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* Photo Header */}
            <div style={{ position: 'relative', height: '240px', width: '100%', background: '#1e2d3d' }}>
              <img
                src={getHomeImage(selectedMatch.institution)}
                alt={selectedMatch.institution.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/children.png'; }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)',
              }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#2D9CDB', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800 }}>
                    #{selectedMatch.rank} Match ({Math.round(selectedMatch.final_score * 100)}% Score)
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
                    📍 {selectedMatch.institution.district}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedMatch.institution.name}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Quick stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>{selectedMatch.institution.children_count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Children in Care</div>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>GHS {Number(selectedMatch.institution.funding_gap).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Funding Gap</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{selectedMatch.distance_km || 2.4} km</div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Distance</div>
                </div>
              </div>

              {/* Match reasons breakdown */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  ✨ Why AI Matched You With This Home
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedMatch.match_reasons.map((r, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Establishment */}
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem' }}>
                  About the Establishment & Mission
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {selectedMatch.institution.cause_description}
                </p>
              </div>

              {/* Address */}
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem' }}>
                  Location & Address
                </h3>
                <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏢</span>
                  <span>{selectedMatch.institution.address}</span>
                </div>
              </div>

              {/* Contact info */}
              <div style={{ background: '#f1f5f9', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
                  Establishment Contact Details
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  {selectedMatch.institution.contact_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✉️</span>
                      <a href={`mailto:${selectedMatch.institution.contact_email}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedMatch.institution.contact_email}
                      </a>
                    </div>
                  )}
                  {selectedMatch.institution.contact_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📞</span>
                      <a href={`tel:${selectedMatch.institution.contact_phone}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedMatch.institution.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedMatch(null)}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #cbd5e1',
                    background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleSupport(selectedMatch.institution)}
                  style={{
                    flex: 2, padding: '0.8rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #2D9CDB 0%, #1d4ed8 100%)',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(45,156,219,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                >
                  <span>🤝 Connect & Support Home</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {supportInst && (
        <SupportModal institution={supportInst} onClose={() => setSupportInst(null)} />
      )}
    </section>
  );
};

export default MatchResults;
