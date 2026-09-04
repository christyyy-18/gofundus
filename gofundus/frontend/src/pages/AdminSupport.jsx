import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { AlertTriangle, BarChart3, CheckCircle, Database, Inbox, Search, ShieldCheck, X } from 'lucide-react';

/* ─── Help categories for platform admins ─── */
const CATEGORIES = [
  {
    icon: Database,
    title: 'Managing Institutions',
    desc: 'Add, edit, or verify institution records — funding gaps, needs, and contact details.',
  },
  {
    icon: BarChart3,
    title: 'Equity & Freshness Monitor',
    desc: 'Understand how the funding-gap freshness score and equity indicators are calculated.',
  },
  {
    icon: Inbox,
    title: 'Support Inbox',
    desc: 'Respond to donor and institution inquiries submitted through the platform.',
  },
  {
    icon: ShieldCheck,
    title: 'Platform Access & Roles',
    desc: 'Manage donor, institution admin, and system admin accounts and permissions.',
  },
];

/* ─── FAQ items for platform admins ─── */
const FAQS = [
  {
    q: 'How do I update an institution\'s funding gap?',
    a: 'Open the institution\'s row in the Equity & Freshness Monitoring table and edit its funding gap and most-lacking-need fields directly. The "days since update" figure resets automatically once saved.',
  },
  {
    q: 'What does the freshness score mean?',
    a: 'It tracks how many days have passed since an institution\'s funding data was last confirmed. Records left stale for too long are flagged so donor capital keeps flowing to institutions with accurate, up-to-date needs.',
  },
  {
    q: 'Where do donor and institution support requests go?',
    a: 'Every message submitted through the donor Support page, the institution Help & Support tab, or this admin page lands in the System Inquiries & Support Inbox on this dashboard, along with an email notification.',
  },
  {
    q: 'How do I verify a new institution registration?',
    a: 'New institution admin sign-ups appear in the platform\'s user records. Cross-check the submitted details against public sources before treating the listing as verified, and update its profile once confirmed.',
  },
  {
    q: 'Who can see funding-gap and children-count figures?',
    a: 'These fields are shown publicly on donor-facing institution cards. Only enter numbers that have been confirmed by the institution — unconfirmed figures should stay at 0 with "Needs confirmation" until verified.',
  },
  {
    q: 'How do I escalate something I can\'t resolve myself?',
    a: 'Use the contact form on this page. It reaches the GoFundUs engineering/support team directly via email, separate from the donor-facing inbox.',
  },
];

export default function AdminSupport() {
  const [query, setQuery]   = useState('');
  const [openFaq, setOpen]  = useState(null);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [msg, setMsg]       = useState('');
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        setName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '');
        setEmail(user.email || '');
      }
    } catch { /* ignore */ }
  }, []);

  const filtered = FAQS.filter(f =>
    !query.trim() ||
    f.q.toLowerCase().includes(query.toLowerCase()) ||
    f.a.toLowerCase().includes(query.toLowerCase())
  );

  const handleSend = async (e) => {
    e.preventDefault();
    setSent(false);
    setError('');
    setSending(true);

    // Always save to localStorage so it appears in the admin inbox
    const newInquiry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      fromName: name,
      fromEmail: email,
      source: 'Admin Support Page',
      message: msg,
      status: 'Pending',
    };
    const existing = JSON.parse(localStorage.getItem('gofundus_system_inquiries') || '[]');
    localStorage.setItem('gofundus_system_inquiries', JSON.stringify([newInquiry, ...existing]));

    // Post to backend to trigger real emails
    try {
      const res = await apiFetch('/support/inquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: msg,
          source: 'Admin Support Page',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Server error — your inquiry was saved but email delivery may be delayed.');
      }
    } catch {
      // Network offline or server down — ticket is still saved locally
      setError('Could not reach the server. Your inquiry has been saved and will be processed when connectivity is restored.');
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  return (
    <div style={p.page}>

      {/* ── Header ── */}
      <div style={p.hero}>
        <h1 style={p.heroTitle}>Admin Help & Support</h1>
        <p style={p.heroSub}>
          Answers for managing institutions, funding data, and platform inquiries.<br />
          Need something else? Reach the support team directly below.
        </p>
        <div style={p.searchBox}>
          <input
            style={p.searchInput}
            placeholder="Ask a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} style={p.clearBtn} aria-label="Clear search"><X size={16} /></button>
          )}
          <button style={p.searchBtn}><Search size={16} /> Search</button>
        </div>
      </div>

      {/* ── Category cards (4-column wide grid) ── */}
      <div style={p.catGrid}>
        {CATEGORIES.map(c => (
          <div key={c.title} style={p.catCard}>
            <div style={p.catIconWrap}><c.icon size={20} strokeWidth={1.8} /></div>
            <h3 style={p.catTitle}>{c.title}</h3>
            <p style={p.catDesc}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* ── 2-Column Main Section: FAQ (Left) & Contact Support (Right) ── */}
      <div style={p.mainLayout}>

        {/* Left Column: FAQ */}
        <div style={p.cardContainer}>
          <h2 style={p.sectionTitle}>FAQ's</h2>
          <p style={p.sectionSub}>Common questions about administering the GoFundUs platform.</p>

          {filtered.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>No FAQs match your search.</p>
          )}
          <div style={p.faqList}>
            {filtered.map((f, i) => (
              <div key={i} style={p.faqItem}>
                <button
                  style={p.faqQ}
                  onClick={() => setOpen(openFaq === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <span style={p.faqToggleIcon}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={p.faqA}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Direct Contact Form */}
        <div style={p.cardContainer}>
          <h2 style={p.sectionTitle}>Contact Support</h2>
          <p style={p.sectionSub}>Can't find the answer you're looking for? Submit a ticket — enter the email you'd like us to reply to.</p>

          {sent ? (
            <div style={p.successBox}>
              <CheckCircle size={22} color="#15803d" aria-hidden="true" />
              <div>
                <strong style={{ color: '#0f172a' }}>Message received</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#475569' }}>
                  Our team will follow up via email within 24 hours.
                </p>
                {error && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#b45309' }}>
                    <AlertTriangle size={14} aria-hidden="true" /> {error}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} style={p.form}>
              <div style={p.fieldWrap}>
                <label style={p.label}>Your Name</label>
                <input style={p.input} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
              </div>
              <div style={p.fieldWrap}>
                <label style={p.label}>Email Address</label>
                <input style={p.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div style={p.fieldWrap}>
                <label style={p.label}>Message / Question</label>
                <textarea style={{ ...p.input, minHeight: '120px', resize: 'vertical' }} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Describe the issue or question..." required />
              </div>
              <button type="submit" disabled={sending} style={{ ...p.btnPrimary, opacity: sending ? 0.6 : 1, cursor: sending ? 'wait' : 'pointer' }}>
                {sending ? 'Sending…' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const p = {
  page: {
    maxWidth: '1140px',
    margin: '0 auto',
    padding: '2.5rem 2rem 5rem',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#0f172a',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  heroTitle: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 0.6rem',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: '0 0 1.75rem',
    lineHeight: 1.6,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.35rem 0.35rem 0.35rem 1rem',
    maxWidth: '520px',
    margin: '0 auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.9rem',
    color: '#0f172a',
    background: 'transparent',
    width: '100%',
    fontFamily: 'inherit',
  },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '0.85rem',
    padding: '0 0.5rem',
  },
  searchBtn: {
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '1.25rem',
    marginBottom: '3rem',
  },
  catCard: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  catIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    marginBottom: '1rem',
  },
  catTitle: { margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
  catDesc: { margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 },

  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  cardContainer: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '14px',
    padding: '1.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' },
  sectionSub: { fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem', lineHeight: 1.5 },

  faqList: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  faqItem: {
    border: '1.5px solid #f1f5f9',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#f8fafc',
  },
  faqQ: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '1rem', padding: '0.9rem 1.1rem', background: 'transparent',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', fontFamily: 'inherit',
  },
  faqToggleIcon: {
    width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', color: '#475569', flexShrink: 0, fontWeight: 700,
  },
  faqA: {
    padding: '0 1.1rem 0.95rem',
    fontSize: '0.85rem',
    color: '#475569',
    lineHeight: 1.65,
    borderTop: '1px solid #e2e8f0',
    paddingTop: '0.75rem',
  },
  successBox: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1rem 1.25rem',
    background: '#f0fdf4',
    border: '1.5px solid #bbf7d0',
    borderRadius: '10px',
    fontSize: '0.88rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  btnPrimary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
  },
};
