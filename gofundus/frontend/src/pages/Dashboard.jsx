import React, { useState, useEffect } from 'react';
import { fetchInstitutions, FALLBACK_INSTITUTIONS } from '../services/api';
import { useToast } from '../components/ToastProvider';
import SupportModal from '../components/SupportModal';

const Dashboard = () => {
  const [institutions, setInstitutions] = useState(FALLBACK_INSTITUTIONS);
  const [district, setDistrict] = useState('All Districts');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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

  const getUrgencyColor = (days) => {
    if (days > 90) return '#ef4444';
    if (days > 45) return '#f97316';
    if (days > 14) return '#eab308';
    return '#22c55e';
  };

  const getHomeImage = (inst) => {
    if (inst.image_url) return inst.image_url;
    if (inst.name?.includes('Mampong')) return '/images/mampong_home.png';
    if (inst.name?.includes('King Jesus')) return '/images/king_jesus_home.png';
    if (inst.name?.includes('Cherubs')) return '/images/cherubs_home.png';
    if (inst.name?.includes('Suame') || inst.name?.includes('Nations')) return '/images/youth_home.png';
    return '/children.png';
  };

  const districts = ['All Districts', ...Array.from(new Set(FALLBACK_INSTITUTIONS.map(i => i.district)))];

  const handleSupport = (inst) => {
    setSelectedInst(null);
    setSupportInst(inst);
  };

  return (
    <section style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
          Registered Orphanage Homes
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', margin: 0 }}>
          Tap on any orphanage card to view its establishment profile, facility photo, mission, and direct contact info.
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
            borderRadius: '12px',
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
            borderRadius: '12px',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {institutions.map((inst) => {
          const img = getHomeImage(inst);
          const urgencyColor = getUrgencyColor(inst.urgency_days_since_donation);

          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInst(inst)}
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '18px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(45,156,219,0.15)';
                e.currentTarget.style.borderColor = '#2D9CDB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              {/* Home Photo */}
              <div style={{ position: 'relative', height: '160px', width: '100%', overflow: 'hidden', background: '#e2e8f0' }}>
                <img
                  src={img}
                  alt={inst.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/children.png'; }}
                />
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  padding: '4px 10px', borderRadius: '99px',
                }}>
                  📍 {inst.district}
                </div>
                <div style={{
                  position: 'absolute', bottom: '10px', left: '10px',
                  background: urgencyColor, color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                  padding: '3px 8px', borderRadius: '6px',
                }}>
                  {inst.days_since_funding_update ?? inst.urgency_days_since_donation ?? 0}d since update
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
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
                    padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: '10px',
                    fontSize: '0.78rem', marginBottom: '0.85rem', border: '1px solid #e2e8f0',
                  }}>
                    <span><strong>👶 {inst.children_count}</strong> children</span>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>GHS {Number(inst.funding_gap).toLocaleString()} gap</span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    color: '#2D9CDB', fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    <span>View Home Profile & Photos</span>
                    <span>➔</span>
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
              ✕
            </button>

            {/* Modal Hero Image */}
            <div style={{ position: 'relative', height: '240px', width: '100%', background: '#1e2d3d' }}>
              <img
                src={getHomeImage(selectedInst)}
                alt={selectedInst.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/children.png'; }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)',
              }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#2D9CDB', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
                    📍 {selectedInst.district}
                  </span>
                  {selectedInst.established_year && (
                    <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
                      Est. {selectedInst.established_year}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedInst.name}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Quick stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>{selectedInst.children_count}</div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Children in Care</div>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>GHS {Number(selectedInst.funding_gap).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Funding Gap</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '0.9rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{selectedInst.days_since_funding_update ?? selectedInst.urgency_days_since_donation ?? 0}d</div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Days Since Update</div>
                </div>
              </div>

              {/* Mission & About */}
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem' }}>
                  About the Establishment & Mission
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '1rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {selectedInst.cause_description}
                </p>
              </div>

              {/* Location & Address */}
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem' }}>
                  Physical Location
                </h3>
                <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏢</span>
                  <span>{selectedInst.address}</span>
                </div>
                {selectedInst.gps_lat && (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    GPS Coordinates: {selectedInst.gps_lat}, {selectedInst.gps_lng} (Kumasi region)
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div style={{ background: '#f1f5f9', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
                  Establishment Contact Details
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  {selectedInst.contact_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✉️</span>
                      <a href={`mailto:${selectedInst.contact_email}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedInst.contact_email}
                      </a>
                    </div>
                  )}
                  {selectedInst.contact_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📞</span>
                      <a href={`tel:${selectedInst.contact_phone}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedInst.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedInst(null)}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #cbd5e1',
                    background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleSupport(selectedInst)}
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

export default Dashboard;
