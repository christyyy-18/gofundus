import React, { useState, useEffect } from 'react';
import { fetchInstitutions } from '../services/api';
import { useToast } from '../components/ToastProvider';
import SupportModal from '../components/SupportModal';
import { getPlaceholderTileColor } from '../utils/placeholderTile';

const Dashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [district, setDistrict] = useState('All Districts');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInst, setSelectedInst] = useState(null);
  const [supportInst, setSupportInst] = useState(null);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await fetchInstitutions(district, search);
    setInstitutions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [district]);

  const getUrgencyLabel = (days) => {
    if (days == null) return null;
    if (days > 90) return { text: `Updated ${days}d ago`, color: '#b45309' };
    return { text: `Updated ${days}d ago`, color: 'var(--color-text-muted)' };
  };

  // Use the institution's own uploaded photo when it has one; otherwise show
  // the GoFundUs logo rather than an unrelated stock/AI-generated photo.
  const getHomeImage = (inst) => inst.image_url || '/logo.png';

  const districts = ['All Districts', ...Array.from(new Set(institutions.map(i => i.district)))];

  const handleSupport = (inst) => {
    setSelectedInst(null);
    setSupportInst(inst);
  };

  return (
    <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .orphanage-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .orphanage-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1100px) {
          .orphanage-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 480px) {
          .orphanage-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.4rem' }}>
          Registered orphanage homes
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', margin: 0 }}>
          Select a home to view its profile, mission, and contact details.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, district, or cause..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '0.75rem 1.1rem',
            borderRadius: 'var(--border-radius)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{
            padding: '0.75rem 1.1rem',
            borderRadius: 'var(--border-radius)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {districts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading orphanages...</p>
      )}

      {/* Institution Cards Grid */}
      <div className="orphanage-grid">
        {institutions.map((inst) => {
          const img = getHomeImage(inst);
          const urgency = getUrgencyLabel(inst.days_since_funding_update ?? inst.urgency_days_since_donation);

          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInst(inst)}
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
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
              {/* Home Photo */}
              <div style={{
                position: 'relative', height: '160px', width: '100%', overflow: 'hidden',
                background: inst.image_url ? 'var(--color-border)' : getPlaceholderTileColor(inst.id || inst.name),
                display: inst.image_url ? 'block' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <img
                  src={img}
                  alt={inst.name}
                  style={inst.image_url
                    ? { width: '100%', height: '100%', objectFit: 'cover' }
                    : { width: '56px', height: '56px', objectFit: 'contain' }
                  }
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>{inst.district}</span>
                    {urgency && <span style={{ fontSize: '0.7rem', color: urgency.color }}>{urgency.text}</span>}
                  </div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                    {inst.name}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 0.85rem' }}>
                    {inst.cause_description.slice(0, 110)}…
                  </p>
                </div>

                {/* Key indicators footer */}
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.6rem 0.8rem', background: 'var(--color-bg)', borderRadius: 'var(--border-radius)',
                    fontSize: '0.78rem', marginBottom: '0.85rem', border: '1px solid var(--color-border)',
                  }}>
                    <span><strong>{inst.children_count}</strong> children</span>
                    <span style={{ color: '#b45309', fontWeight: 700 }}>GHS {Number(inst.funding_gap).toLocaleString()} gap</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                    View home profile
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── INSTITUTION PROFILE MODAL ── */}
      {selectedInst && (
        <div
          onClick={() => setSelectedInst(null)}
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
            {/* Close button */}
            <button
              onClick={() => setSelectedInst(null)}
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

            {/* Modal Hero Image */}
            <div style={{
              position: 'relative', height: '240px', width: '100%', background: '#1e2d3d',
              display: selectedInst.image_url ? 'block' : 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={getHomeImage(selectedInst)}
                alt={selectedInst.name}
                style={selectedInst.image_url
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
                  {selectedInst.district}
                  {selectedInst.established_year && ` · Est. ${selectedInst.established_year}`}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {selectedInst.name}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Quick stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedInst.children_count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Children in care</div>
                </div>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>GHS {Number(selectedInst.funding_gap).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Funding gap</div>
                </div>
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedInst.days_since_funding_update ?? selectedInst.urgency_days_since_donation ?? 0}d</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Since update</div>
                </div>
              </div>

              {/* Mission & About */}
              <div>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  About the mission
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.6, background: 'var(--color-bg)', padding: '1rem 1.1rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
                  {selectedInst.cause_description}
                </p>
              </div>

              {/* Location & Address */}
              <div>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Location
                </h3>
                <div style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>
                  {selectedInst.address}
                </div>
                {selectedInst.gps_lat && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {selectedInst.gps_lat}, {selectedInst.gps_lng}
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(selectedInst.contact_email || selectedInst.contact_phone) && (
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius)', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: 0 }}>
                    Contact
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    {selectedInst.contact_email && (
                      <a href={`mailto:${selectedInst.contact_email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedInst.contact_email}
                      </a>
                    )}
                    {selectedInst.contact_phone && (
                      <a href={`tel:${selectedInst.contact_phone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedInst.contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedInst(null)}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: 'var(--border-radius)', border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleSupport(selectedInst)}
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

export default Dashboard;
