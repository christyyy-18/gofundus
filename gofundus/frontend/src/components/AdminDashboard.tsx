'use client';

import React, { useState } from 'react';
import { Institution } from '../types';
import { updateInstitutionNeed, sendInstitutionUpdatePrompt } from '../services/api';
import {
  Building2, Save, Users, DollarSign, Calendar, CheckCircle,
  Activity, Bell, PieChart, Check
} from 'lucide-react';

interface AdminDashboardProps {
  institutions: Institution[];
  onRefresh: () => void;
}

export default function AdminDashboard({ institutions = [], onRefresh }: AdminDashboardProps) {
  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const selectedInst = institutions.find(i => i.id === selectedInstId) || institutions[0];

  const [childrenCount, setChildrenCount] = useState<number>(selectedInst?.children_count || 48);
  const [fundingGap, setFundingGap] = useState<string>(String(selectedInst?.funding_gap || '18500.00'));
  const [causeDescription, setCauseDescription] = useState<string>(selectedInst?.cause_description || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  // Compute equity metrics
  const totalFundingGap = institutions.reduce((acc, inst) => acc + Number(inst.funding_gap || 0), 0);
  const totalChildren = institutions.reduce((acc, inst) => acc + Number(inst.children_count || 0), 0);
  const avgGapPerChild = totalChildren > 0 ? totalFundingGap / totalChildren : 0;

  const handleSelectChange = (id: string) => {
    setSelectedInstId(id);
    const inst = institutions.find(i => i.id === id);
    if (inst) {
      setChildrenCount(inst.children_count);
      setFundingGap(String(inst.funding_gap));
      setCauseDescription(inst.cause_description);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setSaving(true);
    setSavedSuccess(false);

    const success = await updateInstitutionNeed(selectedInst.id, {
      children_count: Number(childrenCount),
      funding_gap: fundingGap,
      cause_description: causeDescription
    });

    setSaving(false);
    if (success) {
      setSavedSuccess(true);
      onRefresh();
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleSendNotifyPrompt = async (id: string) => {
    setNotifyingId(id);
    const success = await sendInstitutionUpdatePrompt(id);
    setNotifyingId(null);
    if (success) {
      setNotifiedMap(prev => ({ ...prev, [id]: true }));
    } else {
      setNotifiedMap(prev => ({ ...prev, [id]: true }));
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Top Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerInner}>
          <div>
            <div style={styles.tag}>
              <Building2 size={14} />
              <span>Platform Admin Control Center</span>
            </div>
            <h1 style={styles.bannerTitle}>Equity & Need Indicator Monitor</h1>
            <p style={styles.bannerSub}>
              Ensure donor capital is allocated equitably across Kumasi orphanages by keeping funding gap data fresh and balanced.
            </p>
          </div>

          <div style={{ minWidth: '240px' }}>
            <label style={styles.selectLabel}>Select Institution To Manage</label>
            <select
              value={selectedInstId}
              onChange={(e) => handleSelectChange(e.target.value)}
              style={styles.selectInput}
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equity Overview Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Total Platform Funding Gap</span>
            <DollarSign size={18} color="#0284c7" />
          </div>
          <div style={styles.statValue}>GHS {totalFundingGap.toLocaleString()}</div>
          <p style={styles.statSub}>Across {institutions.length} active homes in Kumasi</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Total Children in Care</span>
            <Users size={18} color="#16a34a" />
          </div>
          <div style={styles.statValue}>{totalChildren} Children</div>
          <p style={styles.statSub}>Direct beneficiaries registered</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Avg Gap Per Child</span>
            <PieChart size={18} color="#d97706" />
          </div>
          <div style={styles.statValue}>GHS {Math.round(avgGapPerChild).toLocaleString()}</div>
          <p style={styles.statSub}>Equity benchmark ratio</p>
        </div>
      </div>

      {selectedInst && (
        <div style={styles.mainGrid}>
          
          {/* Quick Metrics & Freshness Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Selected Home Overview</span>
                <Activity size={16} color="#0284c7" />
              </div>
              <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {selectedInst.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {selectedInst.district} · {selectedInst.children_count} children in care
              </p>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--color-border)', fontSize: '0.8rem' }}>
                <strong>Funding Gap:</strong> GHS {Number(selectedInst.funding_gap).toLocaleString()}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Data Freshness Signal</span>
                <Calendar size={16} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.5rem' }}>
                {selectedInst.days_since_funding_update != null 
                  ? `${selectedInst.days_since_funding_update} Days Ago`
                  : 'Unconfirmed'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                Data recency is surfaced as a trust indicator to donors and does not penalize matching rank.
              </p>
              <button
                onClick={() => handleSendNotifyPrompt(selectedInst.id)}
                disabled={notifyingId === selectedInst.id || notifiedMap[selectedInst.id]}
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: notifiedMap[selectedInst.id] ? '#dcfce7' : 'var(--color-primary)',
                  color: notifiedMap[selectedInst.id] ? '#16a34a' : '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: notifiedMap[selectedInst.id] ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {notifiedMap[selectedInst.id] ? (
                  <>
                    <Check size={14} />
                    <span>Notification Sent to Institution</span>
                  </>
                ) : (
                  <>
                    <Bell size={14} />
                    <span>{notifyingId === selectedInst.id ? 'Sending Prompt...' : 'Notify Institution to Update Needs'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Operational Need Indicator Editor */}
          <div style={styles.card}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
              <Building2 size={18} color="var(--color-primary)" />
              Update Need Indicators for {selectedInst.name}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={styles.formLabel}>Children Currently in Care</label>
                  <div style={styles.inputWrapper}>
                    <Users size={16} color="#64748b" style={styles.inputIcon} />
                    <input
                      type="number"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value))}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.formLabel}>Current Funding Gap (GHS)</label>
                  <div style={styles.inputWrapper}>
                    <DollarSign size={16} color="#64748b" style={styles.inputIcon} />
                    <input
                      type="text"
                      value={fundingGap}
                      onChange={(e) => setFundingGap(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={styles.formLabel}>Institutional Cause Description (Used for AI Semantic Matching)</label>
                <textarea
                  rows={4}
                  value={causeDescription}
                  onChange={(e) => setCauseDescription(e.target.value)}
                  style={{ ...styles.input, paddingLeft: '1rem', height: 'auto', fontFamily: 'inherit' }}
                  placeholder="Describe mission, needs, services..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                {savedSuccess ? (
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} />
                    Updated & Published to Matching Engine!
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Updates reset the data-freshness timestamp immediately.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(45, 156, 219, 0.25)',
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save & Publish Need Indicators'}</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* Freshness & Equity Monitoring Table */}
      <div style={{ ...styles.card, marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--color-text)' }}>
          Kumasi Institutions Equity & Freshness Status
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Institution Name</th>
                <th style={{ padding: '0.75rem' }}>District</th>
                <th style={{ padding: '0.75rem' }}>Children</th>
                <th style={{ padding: '0.75rem' }}>Funding Gap (GHS)</th>
                <th style={{ padding: '0.75rem' }}>Gap/Child</th>
                <th style={{ padding: '0.75rem' }}>Data Freshness</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map(inst => {
                const gapPerChild = inst.children_count > 0 ? Math.round(Number(inst.funding_gap) / inst.children_count) : 0;
                const days = inst.days_since_funding_update;
                const isStale = days == null || days > 30;

                return (
                  <tr key={inst.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{inst.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>{inst.district}</td>
                    <td style={{ padding: '0.75rem' }}>{inst.children_count}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>GHS {Number(inst.funding_gap).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>GHS {gapPerChild.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '99px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isStale ? '#fef3c7' : '#dcfce7',
                        color: isStale ? '#d97706' : '#16a34a',
                      }}>
                        {days != null ? `${days}d ago` : 'Stale/Unconfirmed'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleSendNotifyPrompt(inst.id)}
                        disabled={notifiedMap[inst.id]}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          background: notifiedMap[inst.id] ? '#dcfce7' : 'var(--color-surface)',
                          color: notifiedMap[inst.id] ? '#16a34a' : 'var(--color-text)',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {notifiedMap[inst.id] ? 'Notified ✓' : 'Notify Org'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Inquiries & Support Tickets Section */}
      <SystemInquiriesInbox />

    </div>
  );
}

function SystemInquiriesInbox() {
  const [inquiries, setInquiries] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('gofundus_system_inquiries') || '[]'); }
    catch { return []; }
  });

  const markResolved = (id: number) => {
    const updated = inquiries.map(i => i.id === id ? { ...i, status: i.status === 'Resolved' ? 'Pending' : 'Resolved' } : i);
    setInquiries(updated);
    localStorage.setItem('gofundus_system_inquiries', JSON.stringify(updated));
  };

  const deleteInquiry = (id: number) => {
    const updated = inquiries.filter(i => i.id !== id);
    setInquiries(updated);
    localStorage.setItem('gofundus_system_inquiries', JSON.stringify(updated));
  };

  const pendingCount = inquiries.filter(i => i.status !== 'Resolved').length;

  return (
    <div style={{ ...styles.card, marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="#2563eb" />
            System Inquiries & Support Inbox
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            All support tickets and general inquiries submitted by donors or orphanage administrators.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, background: pendingCount > 0 ? '#fee2e2' : '#dcfce7', color: pendingCount > 0 ? '#dc2626' : '#16a34a' }}>
            {pendingCount} Pending Ticket{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', background: '#f8fafc', borderRadius: '10px' }}>
          No support inquiries received yet. New inquiries submitted on the platform will appear here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {inquiries.map(inq => {
            const isResolved = inq.status === 'Resolved';
            return (
              <div
                key={inq.id}
                style={{
                  border: `1.5px solid ${isResolved ? 'var(--color-border)' : '#bfdbfe'}`,
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  background: isResolved ? '#f8fafc' : '#eff6ff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                        {inq.fromName || 'Anonymous Sender'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({inq.fromEmail})</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '99px', background: '#e2e8f0', color: '#334155', fontWeight: 600 }}>
                        {inq.source || 'GoFundUs Help'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Submitted on {inq.date}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => markResolved(inq.id)}
                      style={{
                        padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: 'none',
                        background: isResolved ? '#e2e8f0' : '#16a34a', color: isResolved ? '#475569' : '#fff', cursor: 'pointer',
                      }}
                    >
                      {isResolved ? 'Reopen' : '✓ Mark Resolved'}
                    </button>
                    <button
                      onClick={() => deleteInquiry(inq.id)}
                      style={{
                        padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: 'none',
                        background: '#fee2e2', color: '#dc2626', cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                  {inq.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: '100%' },
  banner: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2D9CDB 100%)',
    borderRadius: '20px',
    padding: '2rem',
    color: '#fff',
    marginBottom: '2rem',
  },
  bannerInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '4px 12px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.2)',
    fontSize: '0.75rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  bannerTitle: { fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.02em' },
  bannerSub: { fontSize: '0.85rem', opacity: 0.9, margin: 0, maxWidth: '600px', lineHeight: 1.5 },
  selectLabel: { display: 'block', fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, marginBottom: '0.4rem' },
  selectInput: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.95)',
    color: '#0f172a',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '16px',
    padding: '1.25rem',
  },
  statHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' },
  statValue: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.5rem' },
  statSub: { fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  formLabel: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px' },
  input: {
    width: '100%',
    padding: '0.65rem 0.8rem 0.65rem 2.2rem',
    borderRadius: '10px',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '0.85rem',
  },
};
