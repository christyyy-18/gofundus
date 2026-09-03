import React, { useState } from 'react';
import PaystackPop from '@paystack/inline-js';
import { useToast } from './ToastProvider';
import { sendInstitutionContactEmail } from '../services/api';
import { CheckCircle, CreditCard, Mail, MapPin, X } from 'lucide-react';

/* ─── Public key for Paystack payments ─── */
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

/* ─── Amount presets (GHS) ─── */
const PRESETS = [50, 100, 250, 500, 1000];

export default function SupportModal({ institution, onClose }) {
  if (!institution) return null;

  const { addToast } = useToast();

  /* form state */
  const [amount, setAmount]         = useState('');
  const [anonymous, setAnonymous]   = useState(false);
  const [donorName, setDonorName]   = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage]       = useState('');
  const [issue, setIssue]           = useState('');
  const [tab, setTab]               = useState('donate'); // 'donate' | 'contact'
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [paymentInstance, setPaymentInstance] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const amountKobo = Math.round(Number(amount || 0) * 100); // Paystack uses pesewas (kobo equiv for GHS)

  /* ─ Paystack config ─ */
  const config = {
    reference: `gofundus_${Date.now()}`,
    email: donorEmail || 'anonymous@gofundus.org',
    amount: amountKobo,
    currency: 'GHS',
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      institution_id:   institution.id,
      institution_name: institution.name,
      donor_name:       anonymous ? 'Anonymous' : donorName,
      message,
    },
  };

  const onSuccess = (reference) => {
    /* Store in localStorage so the orphanage portal Funding Log can pick it up */
    const key = `orgPortal_${institution.id}_funding`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
    const entry = {
      id:          Date.now(),
      date:        new Date().toISOString().split('T')[0],
      type:        'Cash',
      amount:      Number(amount),
      source:      anonymous ? 'Anonymous donor (GoFundUs)' : `${donorName} via GoFundUs`,
      description: message || `Paystack donation — ref ${reference.reference}`,
    };
    localStorage.setItem(key, JSON.stringify([entry, ...existing]));

    addToast(`Thank you! GHS ${amount} donated to ${institution.name} ✓`, 'success');
    setDone(true);
  };

  const onPaystackClose = () => {
    setPaymentInstance(null);
    setPaymentOpen(false);
    addToast('Payment window closed. No charge was made.', 'error');
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 1) { addToast('Enter a valid donation amount.', 'error'); return; }
    if (!anonymous && !donorName.trim()) { addToast('Enter your name or choose anonymous.', 'error'); return; }
    if (!donorEmail.trim() && !anonymous) { addToast('Enter your email for the receipt.', 'error'); return; }
    if (!PAYSTACK_PUBLIC_KEY) { addToast('Payments are not configured yet. Please contact the site admin.', 'error'); return; }
    const paystack = new PaystackPop();
    setPaymentInstance(paystack);
    setPaymentOpen(true);
    paystack.newTransaction({
      ...config,
      key: PAYSTACK_PUBLIC_KEY,
      onSuccess,
      onCancel: onPaystackClose,
    });
  };

  const closePayment = () => {
    paymentInstance?.cancelTransaction();
  };

  const handleContact = async (e) => {
    e.preventDefault();
    if (!issue.trim()) return;
    setSubmitting(true);
    /* Store contact submission locally */
    const key = `orgPortal_${institution.id}_issues`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
    localStorage.setItem(key, JSON.stringify([{ id: Date.now(), date: new Date().toISOString().split('T')[0], from: donorName || 'A visitor', message: issue }, ...existing]));

    // Dispatch email to institution via backend API
    await sendInstitutionContactEmail(institution.id, {
      donor_name: donorName.trim() || 'Anonymous Donor',
      donor_email: donorEmail.trim() || 'donor@gofundus.org',
      message: issue.trim(),
    });

    setSubmitting(false);
    addToast(`Your message has been sent to ${institution.name}.`, 'success');
    setIssue('');
    setDone(true);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(15,23,42,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {paymentOpen && (
        <div style={s.paymentExit}>
          <button type="button" onClick={closePayment} aria-label="Close payment window" style={s.paymentExitButton}>
            <X size={16} /> Close payment
          </button>
        </div>
      )}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.4rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', marginBottom: '4px' }}>
              Supporting
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {institution.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}><MapPin size={13} /> {institution.district}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', color: '#475569', flexShrink: 0, marginLeft: '1rem' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', margin: '1.25rem 1.75rem 0', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
          {['donate', 'contact'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.55rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#0f172a' : '#64748b',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t === 'donate' ? <><CreditCard size={15} /> Make a Donation</> : <><Mail size={15} /> Contact / Report Issue</>}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.75rem 1.75rem' }}>

          {/* ── Success screen ── */}
          {done ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ marginBottom: '0.75rem', color: '#15803d' }}><CheckCircle size={40} /></div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {tab === 'donate' ? 'Donation Received!' : 'Message Sent!'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
                {tab === 'donate'
                  ? `Your contribution to ${institution.name} has been recorded. Thank you for your generosity.`
                  : `Your message has been forwarded to the ${institution.name} team.`
                }
              </p>
              <button onClick={onClose} style={s.btnPrimary}>Close</button>
            </div>
          ) : tab === 'donate' ? (

            /* ── DONATE TAB ── */
            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Preset amounts */}
              <div>
                <label style={s.label}>Select Amount (GHS)</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      style={{
                        padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid',
                        borderColor: amount === String(p) ? '#0284c7' : '#e2e8f0',
                        background: amount === String(p) ? '#e0f2fe' : '#f8fafc',
                        color: amount === String(p) ? '#0369a1' : '#374151',
                      }}
                    >
                      GHS {p}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Custom..."
                    value={!PRESETS.includes(Number(amount)) ? amount : ''}
                    onChange={e => setAmount(e.target.value)}
                    style={{ ...s.input, width: '90px', flexShrink: 0 }}
                  />
                </div>
              </div>

              {/* Anonymous toggle */}
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={e => setAnonymous(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#0284c7', flexShrink: 0 }}
                />
                Donate anonymously (your name will not be shown)
              </label>

              {!anonymous && (
                <>
                  <div style={s.row2}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={s.label}>Your Name *</label>
                      <input style={s.input} value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="Full name" required={!anonymous} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={s.label}>Email (for receipt) *</label>
                      <input style={s.input} type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="you@example.com" required={!anonymous} />
                    </div>
                  </div>
                </>
              )}

              {anonymous && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={s.label}>Email (for receipt only — kept private) *</label>
                  <input style={s.input} type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={s.label}>Message to the home <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  style={{ ...s.input, minHeight: '70px', resize: 'vertical' }}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Share your encouragement or a note about your donation..."
                />
              </div>

              {/* Summary */}
              {amount && Number(amount) > 0 && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#0369a1' }}>
                  <strong>GHS {Number(amount).toLocaleString()}</strong> will be donated to <strong>{institution.name}</strong>
                  {anonymous ? ' anonymously' : donorName ? ` from ${donorName}` : ''}.
                </div>
              )}

              <button type="submit" style={{ ...s.btnPrimary, background: '#16a34a' }}>
                Pay with Paystack
              </button>

              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
                Secured by Paystack · Your card details are never stored on GoFundUs
              </p>
            </form>

          ) : (

            /* ── CONTACT / ISSUE TAB ── */
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400e' }}>
                Use this form to report a concern, ask a question, or send a message directly to <strong>{institution.name}</strong>.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={s.label}>Your Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input style={s.input} value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="How should they address you?" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={s.label}>Your Message / Issue *</label>
                <textarea
                  style={{ ...s.input, minHeight: '120px', resize: 'vertical' }}
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                  placeholder="Describe your concern, question, or request in detail..."
                  required
                />
              </div>

              <button type="submit" disabled={submitting} style={s.btnPrimary}>
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─ Styles ─ */
const s = {
  label: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' },
  input: {
    padding: '0.65rem 0.9rem', borderRadius: '9px', border: '1.5px solid #e2e8f0',
    background: '#f8fafc', color: '#0f172a', fontSize: '0.88rem',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  checkRow: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    fontSize: '0.84rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
    padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: '9px',
    border: '1.5px solid #e2e8f0',
  },
  btnPrimary: {
    padding: '0.8rem', borderRadius: '10px', border: 'none',
    background: '#0284c7', color: '#fff', fontWeight: 700, fontSize: '0.92rem',
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  paymentExit: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 2147483647,
  },
  paymentExitButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    background: '#234d45',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  },
};
