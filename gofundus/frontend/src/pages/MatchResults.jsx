import React, { useState } from 'react';
import { useToast } from '../components/ToastProvider';
import { matchDonorStatement } from '../services/api';
import SupportModal from '../components/SupportModal';
import { getPlaceholderTileColor } from '../utils/placeholderTile';

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
    if (days === null || days === undefined) return { label: 'Unverified data', color: 'var(--color-text-muted)' };
    if (days <= 30) return { label: `Updated ${days}d ago`, color: 'var(--color-text-muted)' };
    if (days <= 90) return { label: `Info ${days}d old`, color: '#b45309' };
    return { label: `Stale (${days}d old)`, color: '#b45309' };
  };

  // Use the institution's own uploaded photo when it has one; otherwise show
  // the GoFundUs logo rather than an unrelated stock/AI-generated photo.
  const getHomeImage = (inst) => inst.image_url || '/logo.png';

  const handleSupport = (inst) => {
    setSelectedMatch(null);
    setSupportInst(inst);
  };

  return (
    <section style={{ maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
        Find your impact match
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.92rem' }}>
        Describe what causes you care about and we'll match you with Kumasi orphanages that need it most.
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
            borderRadius: 'var(--border-radius)',
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
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Matching…' : 'Find matches'}
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
                    borderRadius: 'var(--border-radius)',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 1px 3px rgba(36,31,29,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(36,31,29,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(36,31,29,0.06)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Thumbnail photo */}
                    <div style={{
                      width: '90px', height: '90px', borderRadius: 'var(--border-radius)', overflow: 'hidden', flexShrink: 0,
                      background: inst.image_url ? 'var(--color-border)' : getPlaceholderTileColor(inst.id || inst.name),
                      display: inst.image_url ? 'block' : 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}>
                      <img
                        src={img}
                        alt={inst.name}
                        style={inst.image_url
                          ? { width: '100%', height: '100%', objectFit: 'cover' }
                          : { width: '44px', height: '44px', objectFit: 'contain' }
                        }
                        onError={(e) => { e.target.src = '/logo.png'; }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          Rank #{match.rank}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: freshness.color }}>
                          {freshness.label}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        {inst.name}
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                        {inst.district} · {inst.children_count} children · GHS {Number(inst.funding_gap).toLocaleString()} gap
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                        {inst.cause_description.slice(0, 140)}…
                      </p>
                    </div>

                    {/* Match Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0, alignSelf: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {Math.round(match.final_score * 100)}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>match score</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 700, marginTop: '8px' }}>View profile</div>
                    </div>
                  </div>

                  {/* Match reasons */}
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {match.match_reasons.map((reason, i) => (
                      <span key={i} style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-bg)',
                        borderRadius: '6px',
                        padding: '3px 9px',
                        border: '1px solid var(--color-border)',
                      }}>
                        {reason}
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
              background: 'var(--color-surface)',
              borderRadius: 'var(--border-radius)',
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
                        Close
            </button>

            {/* Photo Header */}
            <div style={{
              position: 'relative', height: '240px', width: '100%', background: '#1e2d3d',
              display: selectedMatch.institution.image_url ? 'block' : 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={getHomeImage(selectedMatch.institution)}
                alt={selectedMatch.institution.name}
                style={selectedMatch.institution.image_url
                  ? { width: '100%', height: '100%', objectFit: 'cover' }
                  : { width: '96px', height: '96px', objectFit: 'contain', borderRadius: '16px' }
                }
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)',
              }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#fff' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Rank #{selectedMatch.rank} · {Math.round(selectedMatch.final_score * 100)}% match · {selectedMatch.institution.district}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {selectedMatch.institution.name}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Quick stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedMatch.institution.children_count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Children in care</div>
                </div>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>GHS {Number(selectedMatch.institution.funding_gap).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Funding gap</div>
                </div>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedMatch.distance_km || 2.4} km</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Distance</div>
                </div>
              </div>

              {/* Match reasons breakdown */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Why this home matched
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedMatch.match_reasons.map((r, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* About Establishment */}
              <div>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  About the mission
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.6, background: 'var(--color-bg)', padding: '1rem 1.1rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
                  {selectedMatch.institution.cause_description}
                </p>
              </div>

              {/* Address */}
              <div>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Location
                </h3>
                <div style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>
                  {selectedMatch.institution.address}
                </div>
              </div>

              {/* Contact info */}
              {(selectedMatch.institution.contact_email || selectedMatch.institution.contact_phone) && (
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius)', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: 0 }}>
                    Contact
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    {selectedMatch.institution.contact_email && (
                      <a href={`mailto:${selectedMatch.institution.contact_email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedMatch.institution.contact_email}
                      </a>
                    )}
                    {selectedMatch.institution.contact_phone && (
                      <a href={`tel:${selectedMatch.institution.contact_phone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedMatch.institution.contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedMatch(null)}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: 'var(--border-radius)', border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleSupport(selectedMatch.institution)}
                  style={{
                    flex: 2, padding: '0.8rem', borderRadius: 'var(--border-radius)', border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  Support this home
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
