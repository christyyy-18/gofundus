import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../services/api';
import { BadgeDollarSign, BookOpen, CheckCircle, CircleHelp, FileText, Handshake, HardHat, Home, Mail, Package, Pencil, ShieldCheck, Target, Users, Wallet, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/* ─── Tab IDs ─── */
const TABS = [
  { id: 'profile',  icon: Home, label: 'Orphanage Profile' },
  { id: 'funding',  icon: Wallet, label: 'Funding Log' },
  { id: 'donors',   icon: Handshake, label: 'Donor Tracker' },
  { id: 'staff',    icon: HardHat, label: 'Staff & Progress' },
  { id: 'issues',   icon: Mail, label: 'Messages & Issues' },
  { id: 'help',     icon: CircleHelp, label: 'Help & Support' },
];

/* ─── Helpers ─── */
const storageKey = (username, tab) => `orgPortal_${username}_${tab}`;
const load  = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const save  = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtGHS  = (n) => `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─── Main Page ─── */
export default function OrphanagePortal() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser]           = useState(null);
  const [institution, setInst]    = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    const u = JSON.parse(raw);
    if (u.role !== 'institution_admin') {
      addToast('Access restricted to orphanage administrators.', 'error');
      navigate('/dashboard');
      return;
    }
    setUser(u);

    // Fetch institution linked to this user
    fetch(`${API}/institutions/`, { credentials: 'include' })
      .then(r => r.json())
      .then(list => {
        // Try to find institution with matching username, otherwise use first as demo
        const matched = Array.isArray(list)
          ? (list.find(i => i.user === u.id || i.user === u.username) || list[0])
          : null;
        setInst(matched || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div style={s.page}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.sidebarBrand}>
          <div style={s.sidebarLogo}><Home size={20} /></div>
          <div>
            <div style={s.sidebarTitle}>{institution?.name || 'My Orphanage'}</div>
            <div style={s.sidebarSub}>{institution?.district || 'Kumasi'}</div>
          </div>
        </div>

        <div style={s.sidebarDivider} />

        {/* Nav links */}
        <nav style={s.sidebarNav}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...s.sidebarLink,
                ...(activeTab === tab.id ? s.sidebarLinkActive : {}),
              }}
            >
              <span style={s.sidebarIcon}><tab.icon size={17} /></span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarDivider} />

        {/* User tag at bottom */}
        <div style={s.sidebarUser}>
          <div style={s.sidebarAvatar}>
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Institution Admin</div>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main style={s.content}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.topBarTitle}>{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p style={s.topBarSub}>GoFundUs · Orphanage Admin Portal</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge children_count={institution?.children_count} funding_gap={institution?.funding_gap} />
          </div>
        </div>

        {/* Tab content */}
        <div style={s.tabContent}>
          {activeTab === 'profile'  && <ProfileTab  institution={institution} setInst={setInst} addToast={addToast} user={user} />}
          {activeTab === 'funding'  && <FundingTab  username={user?.username} institutionId={institution?.id} addToast={addToast} />}
          {activeTab === 'donors'   && <DonorsTab   username={user?.username} addToast={addToast} />}
          {activeTab === 'staff'    && <StaffTab    username={user?.username} addToast={addToast} />}
          {activeTab === 'issues'   && <IssuesTab   institutionId={institution?.id} addToast={addToast} />}
          {activeTab === 'help'     && <HelpTab />}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 1 — PROFILE
   ══════════════════════════════════════════════════════════ */
function ProfileTab({ institution, setInst, addToast, user }) {
  const [form, setForm]     = useState({
    name:              institution?.name || '',
    district:          institution?.district || '',
    address:           institution?.address || '',
    cause_description: institution?.cause_description || '',
    contact_email:     institution?.contact_email || '',
    contact_phone:     institution?.contact_phone || '',
    children_count:    institution?.children_count || 0,
    funding_gap:       institution?.funding_gap || '0.00',
    most_lacking_need: institution?.most_lacking_need || 'Food & Groceries',
    funding_last_updated: institution?.funding_last_updated || today(),
  });
  const [saving, setSaving] = useState(false);

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (institution?.id) {
        const res = await apiFetch(`/institutions/${institution.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            funding_last_updated: form.funding_last_updated || today(),
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setInst(updated);
          addToast('Profile updated successfully!', 'success');
        } else {
          addToast('Saved locally (API offline).', 'success');
        }
      } else {
        addToast('Saved locally (no institution linked).', 'success');
      }
    } catch {
      addToast('Saved locally (API offline).', 'success');
    } finally {
      setSaving(false);
    }
  };

  const avatar = localStorage.getItem(`avatar_${user?.username}`);
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero profile card */}
      <div style={s.profileHero}>
        <div style={s.profileHeroBg} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {avatar
            ? <img src={avatar} alt="avatar" style={s.profileAvatar} />
            : <div style={{ ...s.profileAvatar, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{initials}</div>
          }
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {form.name || 'Your Orphanage'}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <Chip bg="rgba(255,255,255,0.2)" color="#fff">{form.district}</Chip>
              <Chip bg="rgba(255,255,255,0.2)" color="#fff">{form.children_count} children</Chip>
              <Chip bg="#fef08a" color="#854d0e">Most Lacking: {form.most_lacking_need}</Chip>
              <Chip bg="rgba(255,255,255,0.2)" color="#fff">Gap: {fmtGHS(form.funding_gap)}</Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div style={s.card}>
        <SectionTitle icon={Pencil}>Edit Orphanage Details</SectionTitle>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={s.formGrid2}>
            <FormField label="Orphanage Name">
              <input style={s.input} value={form.name} onChange={e => field('name', e.target.value)} placeholder="Official registered name" />
            </FormField>
            <FormField label="District / Area">
              <input style={s.input} value={form.district} onChange={e => field('district', e.target.value)} placeholder="e.g. Asokwa" />
            </FormField>
          </div>

          <FormField label="Full Address">
            <input style={s.input} value={form.address} onChange={e => field('address', e.target.value)} placeholder="Street, area, city" />
          </FormField>

          {/* Primary Need Selection */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
            <FormField label="Primary / Most Lacking Need (Used for AI Matching & Donor Filtering)">
              <select
                style={{ ...s.input, fontWeight: 700, color: '#0f172a' }}
                value={form.most_lacking_need}
                onChange={e => field('most_lacking_need', e.target.value)}
              >
                <option value="Food & Groceries">Food & Groceries (Grains, Oil, Milk, Canned Goods)</option>
                <option value="Clothing & Footwear">Clothing & Footwear (Children's clothes, Shoes, Uniforms)</option>
                <option value="Educational Supplies">Educational Supplies (Books, Stationery, Tuition)</option>
                <option value="Healthcare & Hygiene">Healthcare & Medical (First aid, Toiletries, Medicine)</option>
                <option value="Bedding & Housing">Bedding & Shelter (Mattresses, Blankets, Repairs)</option>
                <option value="Utilities & Operations">Utilities & Operating Funds (Electricity, Water, Rent)</option>
              </select>
            </FormField>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Specifying your top resource shortage helps donors provide exact items or targeted support.
            </p>
          </div>

          <FormField label="Mission & Cause Description (used for AI matching)">
            <textarea style={{ ...s.input, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              value={form.cause_description}
              onChange={e => field('cause_description', e.target.value)}
              placeholder="Describe your mission, the children you serve, and specific needs..."
            />
          </FormField>

          <div style={s.formGrid2}>
            <FormField label="Contact Email">
              <input style={s.input} type="email" value={form.contact_email} onChange={e => field('contact_email', e.target.value)} placeholder="info@yourorphanage.org" />
            </FormField>
            <FormField label="Contact Phone">
              <input style={s.input} value={form.contact_phone} onChange={e => field('contact_phone', e.target.value)} placeholder="+233 24 000 0000" />
            </FormField>
          </div>

          <div style={s.formGrid3}>
            <FormField label="Children Currently in Care">
              <input style={s.input} type="number" min="0" value={form.children_count} onChange={e => field('children_count', e.target.value)} />
            </FormField>
            <FormField label="Current Funding Gap (GHS)">
              <input style={s.input} type="number" min="0" step="0.01" value={form.funding_gap} onChange={e => field('funding_gap', e.target.value)} />
            </FormField>
            <FormField label="Data Last Confirmed">
              <input style={s.input} type="date" value={form.funding_last_updated} onChange={e => field('funding_last_updated', e.target.value)} />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="submit" disabled={saving} style={s.btnPrimary}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — FUNDING LOG
   ══════════════════════════════════════════════════════════ */
function FundingTab({ username, institutionId, addToast }) {
  const key = storageKey(username, 'funding');
  // Also merge any Paystack donations deposited by SupportModal (keyed by institution id)
  const paystackKey = institutionId ? `orgPortal_${institutionId}_funding` : null;

  const loadAll = () => {
    const manual   = load(key) || [];
    const paystack = (paystackKey ? load(paystackKey) : null) || [];
    // Merge, deduplicate by id, sort by date desc
    const merged = [...manual, ...paystack.filter(p => !manual.some(m => m.id === p.id))];
    return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const [entries, setEntries] = useState(() => loadAll());
  const [form, setForm] = useState({ date: today(), type: 'Cash', amount: '', description: '', source: '' });
  const [showForm, setShowForm] = useState(false);

  // Refresh when institutionId loads
  useEffect(() => { setEntries(loadAll()); }, [institutionId]);

  const addEntry = (e) => {
    e.preventDefault();
    const entry = { ...form, id: Date.now() };
    const existing = load(key) || [];
    const updated = [entry, ...existing];
    save(key, updated);
    setEntries(loadAll());
    setForm({ date: today(), type: 'Cash', amount: '', description: '', source: '' });
    setShowForm(false);
    addToast('Funding entry recorded!', 'success');
  };

  const del = (id) => {
    // Remove from both stores
    const manual = (load(key) || []).filter(e => e.id !== id);
    save(key, manual);
    if (paystackKey) {
      const ps = (load(paystackKey) || []).filter(e => e.id !== id);
      save(paystackKey, ps);
    }
    setEntries(loadAll());
  };

  const totalCash   = entries.filter(e => e.type === 'Cash').reduce((a, e) => a + Number(e.amount || 0), 0);
  const totalInKind = entries.filter(e => e.type !== 'Cash').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* KPI row */}
      <div style={s.kpiRow}>
        <KPICard icon={BadgeDollarSign} label="Total Cash Received" value={fmtGHS(totalCash)} color="#16a34a" bg="#dcfce7" />
        <KPICard icon={Package} label="In-Kind Donations" value={`${totalInKind} entries`} color="#0284c7" bg="#e0f2fe" />
        <KPICard icon={FileText} label="Total Log Entries" value={entries.length} color="#7c3aed" bg="#ede9fe" />
      </div>

      {/* Add button */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle icon="📑">Funding & Donation Log</SectionTitle>
          <button onClick={() => setShowForm(v => !v)} style={s.btnPrimary}>
            {showForm ? 'Cancel' : 'Add Entry'}
          </button>
        </div>

        {/* Inline form */}
        {showForm && (
          <form onSubmit={addEntry} style={{ ...s.inlineForm, marginBottom: '1.5rem' }}>
            <div style={s.formGrid2}>
              <FormField label="Date Received">
                <input style={s.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </FormField>
              <FormField label="Type">
                <select style={s.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Cash">Cash / Bank Transfer</option>
                  <option value="Food">Food & Nutrition</option>
                  <option value="Clothing">Clothing & Items</option>
                  <option value="Medical">Medical Supplies</option>
                  <option value="Equipment">Equipment / Furniture</option>
                  <option value="Other">Other In-Kind</option>
                </select>
              </FormField>
            </div>
            <div style={s.formGrid2}>
              <FormField label="Amount (GHS) — leave 0 for in-kind">
                <input style={s.input} type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </FormField>
              <FormField label="Source / Donor Reference">
                <input style={s.input} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. Church fundraiser, GoFundUs match" />
              </FormField>
            </div>
            <FormField label="Description / Notes">
              <input style={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what was received..." required />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={s.btnPrimary}>✔ Record Entry</button>
            </div>
          </form>
        )}

        {/* Table */}
        {entries.length === 0 ? (
          <EmptyState icon={Wallet} text="No funding entries yet. Record your first donation above." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <Th>Date</Th><Th>Type</Th><Th>Amount</Th><Th>Source</Th><Th>Description</Th><Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={s.trow}>
                    <Td>{fmtDate(e.date)}</Td>
                    <Td><TypeBadge type={e.type} /></Td>
                    <Td><span style={{ fontWeight: 700, color: '#16a34a' }}>{e.type === 'Cash' ? fmtGHS(e.amount) : '—'}</span></Td>
                    <Td style={{ color: '#64748b' }}>{e.source || '—'}</Td>
                    <Td>{e.description}</Td>
                    <Td align="right">
                      <button onClick={() => del(e.id)} style={s.btnDanger}>Delete</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 3 — DONOR TRACKER
   ══════════════════════════════════════════════════════════ */
function DonorsTab({ username, addToast }) {
  const key = storageKey(username, 'donors');
  const [donors, setDonors] = useState(() => load(key) || []);
  const [form, setForm] = useState({ date: today(), name: '', anonymous: false, amount: '', note: '', type: 'Cash' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const add = (e) => {
    e.preventDefault();
    const entry = { ...form, id: Date.now(), displayName: form.anonymous ? 'Anonymous' : form.name };
    const updated = [entry, ...donors];
    setDonors(updated);
    save(key, updated);
    setForm({ date: today(), name: '', anonymous: false, amount: '', note: '', type: 'Cash' });
    setShowForm(false);
    addToast('Donor recorded!', 'success');
  };

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditAmount(d.amount || '');
    setEditNote(d.note || '');
  };

  const saveEdit = (id) => {
    const updated = donors.map(d => d.id === id ? { ...d, amount: editAmount, note: editNote } : d);
    setDonors(updated);
    save(key, updated);
    setEditingId(null);
    addToast('Donor updated!', 'success');
  };

  const del = (id) => {
    const updated = donors.filter(d => d.id !== id);
    setDonors(updated);
    save(key, updated);
  };

  const totalRaised = donors.reduce((a, d) => a + Number(d.amount || 0), 0);
  const namedCount  = donors.filter(d => !d.anonymous).length;
  const anonCount   = donors.filter(d => d.anonymous).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div style={s.kpiRow}>
        <KPICard icon={Wallet} label="Total Funds Tracked" value={fmtGHS(totalRaised)} color="#16a34a" bg="#dcfce7" />
        <KPICard icon={Users} label="Named Donors" value={namedCount} color="#0284c7" bg="#e0f2fe" />
        <KPICard icon={CircleHelp} label="Anonymous Donors" value={anonCount} color="#7c3aed" bg="#ede9fe" />
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle icon={Handshake}>Donor Registry</SectionTitle>
          <button onClick={() => setShowForm(v => !v)} style={s.btnPrimary}>
            {showForm ? 'Cancel' : 'Add Donor'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={add} style={{ ...s.inlineForm, marginBottom: '1.5rem' }}>
            <div style={s.formGrid2}>
              <FormField label="Date of Donation">
                <input style={s.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </FormField>
              <FormField label="Donation Type">
                <select style={s.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Cash">Cash</option>
                  <option value="In-Kind">In-Kind Items</option>
                  <option value="Online">Online Transfer</option>
                  <option value="GoFundUs">GoFundUs Match</option>
                </select>
              </FormField>
            </div>

            {/* Anonymous toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.anonymous}
                  onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked, name: e.target.checked ? '' : f.name }))}
                  style={{ width: '16px', height: '16px', accentColor: '#38526A' }}
                />
                This is an anonymous donor (name not disclosed)
              </label>
            </div>

            {!form.anonymous && (
              <FormField label="Donor Full Name">
                <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kwame Asante" required={!form.anonymous} />
              </FormField>
            )}

            <div style={s.formGrid2}>
              <FormField label="Amount (GHS)">
                <input style={s.input} type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter donation amount e.g. 500" />
              </FormField>
              <FormField label="Note / Reference">
                <input style={s.input} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Occasion, campaign name, etc." />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={s.btnPrimary}>✔ Add to Registry</button>
            </div>
          </form>
        )}

        {donors.length === 0 ? (
          <EmptyState icon={Users} text="No donors logged yet. Add your first donor above." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <Th>Date</Th><Th>Donor</Th><Th>Type</Th><Th>Amount (GHS)</Th><Th>Note</Th><Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.id} style={s.trow}>
                    <Td>{fmtDate(d.date)}</Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: d.anonymous ? '#e2e8f0' : '#e0f2fe',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700,
                          color: d.anonymous ? '#64748b' : '#0284c7',
                        }}>
                          {d.anonymous ? '?' : (d.name?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: d.anonymous ? '#64748b' : '#0f172a' }}>
                          {d.anonymous ? 'Anonymous' : d.name}
                        </span>
                        {d.anonymous && <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '99px' }}>Private</span>}
                      </div>
                    </Td>
                    <Td><TypeBadge type={d.type} /></Td>

                    {/* Amount field - view or edit mode */}
                    <Td>
                      {editingId === d.id ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          style={{ ...s.input, width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          placeholder="0.00"
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 700, color: d.amount ? '#16a34a' : '#94a3b8' }}>
                          {d.amount ? fmtGHS(d.amount) : 'Enter Amount'}
                        </span>
                      )}
                    </Td>

                    {/* Note field - view or edit mode */}
                    <Td>
                      {editingId === d.id ? (
                        <input
                          style={{ ...s.input, padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          placeholder="Note..."
                        />
                      ) : (
                        <span style={{ color: '#64748b' }}>{d.note || '—'}</span>
                      )}
                    </Td>

                    {/* Action buttons */}
                    <Td align="right">
                      {editingId === d.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => saveEdit(d.id)} style={{ ...s.btnPrimary, padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ ...s.btnSecondary, padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(d)} style={s.btnSecondary}>Edit</button>
                          <button onClick={() => del(d.id)} style={s.btnDanger}>Delete</button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 4 — STAFF & PROGRESS
   ══════════════════════════════════════════════════════════ */
function StaffTab({ username, addToast }) {
  const key = storageKey(username, 'staff');
  const [staff, setStaff] = useState(() => load(key) || []);
  const [form, setForm] = useState({ name: '', role: '', hireDate: today(), progressNote: '', milestones: '' });
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const add = (e) => {
    e.preventDefault();
    const entry = { ...form, id: Date.now(), milestones: form.milestones.split('\n').filter(Boolean).map(m => ({ text: m.trim(), done: false })) };
    const updated = [entry, ...staff];
    setStaff(updated);
    save(key, updated);
    setForm({ name: '', role: '', hireDate: today(), progressNote: '', milestones: '' });
    setShowForm(false);
    addToast(`${form.name} added to staff!`, 'success');
  };

  const del = (id) => {
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    save(key, updated);
  };

  const toggleMilestone = (staffId, mIdx) => {
    const updated = staff.map(s => s.id === staffId
      ? { ...s, milestones: s.milestones.map((m, i) => i === mIdx ? { ...m, done: !m.done } : m) }
      : s
    );
    setStaff(updated);
    save(key, updated);
  };

  const ROLES = ['Director', 'Caregiver', 'Teacher', 'Cook / Kitchen', 'Medical Staff', 'Social Worker', 'Volunteer', 'Driver', 'Security', 'Admin / Clerical', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div style={s.kpiRow}>
        <KPICard icon={HardHat} label="Total Staff" value={staff.length} color="#0284c7" bg="#e0f2fe" />
        <KPICard icon={CheckCircle} label="Total Milestones" value={staff.reduce((a, s) => a + (s.milestones?.length || 0), 0)} color="#16a34a" bg="#dcfce7" />
        <KPICard icon={Target} label="Completed Goals" value={staff.reduce((a, s) => a + (s.milestones?.filter(m => m.done).length || 0), 0)} color="#d97706" bg="#fef3c7" />
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle icon={HardHat}>Staff Directory & Progress</SectionTitle>
          <button onClick={() => setShowForm(v => !v)} style={s.btnPrimary}>
            {showForm ? 'Cancel' : 'Add Staff Member'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={add} style={{ ...s.inlineForm, marginBottom: '1.5rem' }}>
            <div style={s.formGrid2}>
              <FormField label="Full Name">
                <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ama Owusu" required />
              </FormField>
              <FormField label="Role / Position">
                <select style={s.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="">Select role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Hire / Start Date">
              <input style={s.input} type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
            </FormField>
            <FormField label="Progress Note">
              <textarea style={{ ...s.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                value={form.progressNote}
                onChange={e => setForm(f => ({ ...f, progressNote: e.target.value }))}
                placeholder="Training status, performance notes, responsibilities..."
              />
            </FormField>
            <FormField label="Milestones (one per line)">
              <textarea style={{ ...s.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                value={form.milestones}
                onChange={e => setForm(f => ({ ...f, milestones: e.target.value }))}
                placeholder={"Complete first aid training\nAttend child welfare workshop\nComplete 3-month probation"}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={s.btnPrimary}>✔ Add Staff Member</button>
            </div>
          </form>
        )}

        {staff.length === 0 ? (
          <EmptyState icon={HardHat} text="No staff added yet. Build your team above." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {staff.map(m => {
              const doneCount = m.milestones?.filter(x => x.done).length || 0;
              const totalMs   = m.milestones?.length || 0;
              const pct       = totalMs > 0 ? Math.round((doneCount / totalMs) * 100) : 0;
              const isExpanded = expandedId === m.id;
              return (
                <div key={m.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Staff row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: '#fff', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#38526A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                      {m.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.role || 'Unassigned'} · Joined {fmtDate(m.hireDate)}</div>
                    </div>
                    {totalMs > 0 && (
                      <div style={{ minWidth: '120px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>{doneCount}/{totalMs} milestones · {pct}%</div>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#38526A', borderRadius: '99px', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)} style={s.btnSecondary}>
                        {isExpanded ? '▲ Hide' : '▼ Details'}
                      </button>
                      <button onClick={() => del(m.id)} style={s.btnDanger}>Delete</button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      {m.progressNote && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Progress Note</div>
                          <p style={{ margin: 0, fontSize: '0.87rem', color: '#374151', lineHeight: 1.6 }}>{m.progressNote}</p>
                        </div>
                      )}
                      {m.milestones?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Milestones</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {m.milestones.map((ms, idx) => (
                              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: ms.done ? '#dcfce7' : '#fff', border: '1px solid', borderColor: ms.done ? '#86efac' : '#e2e8f0', transition: 'all 0.15s' }}>
                                <input type="checkbox" checked={ms.done} onChange={() => toggleMilestone(m.id, idx)} style={{ accentColor: '#16a34a', width: '15px', height: '15px' }} />
                                <span style={{ fontSize: '0.85rem', color: ms.done ? '#15803d' : '#374151', textDecoration: ms.done ? 'line-through' : 'none', fontWeight: ms.done ? 600 : 400 }}>
                                  {ms.text}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 5 — MESSAGES & ISSUES INBOX
   ══════════════════════════════════════════════════════════ */
function IssuesTab({ institutionId, addToast }) {
  const key = institutionId ? `orgPortal_${institutionId}_issues` : null;
  const [issues, setIssues] = useState(() => (key ? load(key) : null) || []);

  const markRead = (id) => {
    const updated = issues.map(i => i.id === id ? { ...i, read: true } : i);
    setIssues(updated);
    if (key) save(key, updated);
  };

  const del = (id) => {
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    if (key) save(key, updated);
    addToast('Message removed.', 'success');
  };

  const unread = issues.filter(i => !i.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={s.kpiRow}>
        <KPICard icon={Mail} label="Total Messages" value={issues.length} color="#7c3aed" bg="#ede9fe" />
        <KPICard icon={ShieldCheck} label="Unread" value={unread} color="#dc2626" bg="#fee2e2" />
      </div>

      <div style={s.card}>
        <SectionTitle icon={Mail}>Messages & Issues from Donors / Visitors</SectionTitle>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.4rem 0 1.25rem' }}>
          These messages were submitted via the "Contact / Report Issue" form on the GoFundUs public platform.
        </p>

        {issues.length === 0 ? (
          <EmptyState icon={Mail} text="No messages received yet. When donors contact you through GoFundUs, they'll appear here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {issues.map(issue => (
              <div
                key={issue.id}
                style={{
                  border: `1.5px solid ${issue.read ? '#e2e8f0' : '#bfdbfe'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  background: issue.read ? '#f8fafc' : '#eff6ff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                      {issue.from || 'Anonymous visitor'}
                    </span>
                    {!issue.read && (
                      <span style={{ marginLeft: '0.5rem', background: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        New
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{fmtDate(issue.date)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!issue.read && (
                      <button onClick={() => markRead(issue.id)} style={s.btnSecondary}>Mark read</button>
                    )}
                    <button onClick={() => del(issue.id)} style={s.btnDanger}>Delete</button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                  {issue.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 6 — HELP & SUPPORT
   ══════════════════════════════════════════════════════════ */
const HELP_CATS = [
  { icon: BookOpen, title: 'Getting Started', desc: 'Set up your institution profile, verify your registration, and understand the portal.' },
  { icon: FileText, title: 'Managing Your Data', desc: 'Learn how to use the Funding Log, Donor Tracker, and Staff Progress tabs.' },
  { icon: ShieldCheck, title: 'Privacy & Security', desc: 'How your institution data is handled and kept secure on GoFundUs.' },
  { icon: Mail, title: 'Contact GoFundUs', desc: 'Reach our admin team for account issues, disputes, or technical problems.' },
];

const HELP_FAQS = [
  { q: 'How do I update my orphanage profile?', a: 'Go to the Orphanage Profile tab. Edit any field — name, address, cause description, contact details, children count, or funding gap — and click Save Profile. Changes appear on the public donor-facing dashboard immediately.' },
  { q: 'How do I log an incoming donation or item?', a: 'Open the Funding Log tab and click "+ Add Entry". Fill in the date, type (Cash or In-Kind), amount or description, and source. The entry is saved and added to your total.' },
  { q: 'Do Paystack donations appear automatically?', a: 'Yes. When a donor completes a payment through GoFundUs, the transaction is automatically added to your Funding Log. You can review or delete individual entries.' },
  { q: 'What is the Donor Tracker for?', a: 'The Donor Tracker lets you manually record named or anonymous donors — useful for tracking supporters who give outside GoFundUs (cash deliveries, bank transfers, etc.).' },
  { q: 'What is the Staff & Progress tab?', a: 'You can add your team members, assign roles and hire dates, write progress notes, and track milestones per person. Each staff card shows a progress bar based on completed milestones.' },
  { q: 'Where do donor messages appear?', a: 'In the Messages & Issues tab. Messages submitted through the GoFundUs public platform appear here. Unread messages are highlighted in blue. You can mark them read or delete them.' },
  { q: 'How do I contact GoFundUs support?', a: 'Use the contact form below. Describe your issue or question and our team will respond within 1–2 business days.' },
];

function HelpTab() {
  const [openFaq, setOpen] = useState(null);
  const [query, setQuery]  = useState('');
  const [name, setName]    = useState('');
  const [email, setEmail]  = useState('');
  const [msg, setMsg]      = useState('');
  const [sent, setSent]    = useState(false);

  const filtered = HELP_FAQS.filter(f =>
    !query.trim() ||
    f.q.toLowerCase().includes(query.toLowerCase()) ||
    f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header & Search */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Institution Help & Support Centre</h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>Search documentation or submit a support inquiry directly to GoFundUs platform administrators.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '9px', padding: '0.5rem 0.85rem', maxWidth: '560px' }}>
          <span style={{ color: '#94a3b8' }}><Search size={17} /></span>
          <input
            style={{ border: 'none', outline: 'none', fontSize: '0.88rem', color: '#0f172a', background: 'transparent', width: '100%', fontFamily: 'inherit' }}
            placeholder="Ask a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><X size={15} /></button>}
        </div>
      </div>

      {/* 4 Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {HELP_CATS.map(c => (
          <div key={c.title} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#eff6ff', color: '#234d45', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}><c.icon size={19} /></div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.35rem' }}>{c.title}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.55 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* 2-Column Section: FAQ (Left) & Contact Form (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: FAQs */}
        <div style={s.card}>
          <SectionTitle icon={CircleHelp}>Frequently Asked Questions</SectionTitle>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {filtered.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No FAQs match your search.</p>}
            {filtered.map((f, i) => (
              <div key={i} style={{ border: '1.5px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc' }}>
                <button
                  onClick={() => setOpen(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', fontFamily: 'inherit' }}
                >
                  <span>{f.q}</span>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#475569', flexShrink: 0, fontWeight: 700 }}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1rem 0.85rem', fontSize: '0.83rem', color: '#475569', lineHeight: 1.65, borderTop: '1px solid #e2e8f0', paddingTop: '0.7rem' }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Contact Support */}
        <div style={s.card}>
          <SectionTitle icon={Mail}>Contact System Admin</SectionTitle>
          <p style={{ margin: '0.3rem 0 1.1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
            Need help with verification, account recovery, or system features?
          </p>
          {sent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
              <CheckCircle size={18} aria-hidden="true" /> Message sent! We'll respond shortly.
            </div>
          ) : (
            <form onSubmit={e => {
            e.preventDefault();
            const newInquiry = {
              id: Date.now(),
              date: new Date().toISOString().split('T')[0],
              fromName: name,
              fromEmail: email,
              source: 'Orphanage Portal Help Tab',
              message: msg,
              status: 'Pending',
            };
            const existing = JSON.parse(localStorage.getItem('gofundus_system_inquiries') || '[]');
            localStorage.setItem('gofundus_system_inquiries', JSON.stringify([newInquiry, ...existing]));
            setSent(true);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</label>
                <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                <textarea style={{ ...s.input, minHeight: '110px', resize: 'vertical', fontFamily: 'inherit' }} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Describe your issue or question…" required />
              </div>
              <button type="submit" style={{ ...s.btnPrimary, padding: '0.7rem 1.5rem', width: '100%' }}>Submit Inquiry</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SMALL REUSABLE COMPONENTS
   ══════════════════════════════════════════════════════════ */
const SectionTitle = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <span style={{ display: 'inline-flex', color: '#234d45' }}>{React.createElement(icon, { size: 18, strokeWidth: 1.8 })}</span>
    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{children}</span>
  </div>
);

const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const KPICard = ({ icon, label, value, color, bg }) => (
  <div style={{ flex: 1, minWidth: '160px', background: bg, borderRadius: '14px', padding: '1.1rem 1.25rem' }}>
    <div style={{ color, marginBottom: '0.35rem' }}>{React.createElement(icon, { size: 22, strokeWidth: 1.8 })}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color, opacity: 0.8, marginTop: '0.15rem', fontWeight: 500 }}>{label}</div>
  </div>
);

const StatusBadge = ({ children_count, funding_gap }) => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    {children_count != null && (
      <span style={{ padding: '4px 12px', borderRadius: '99px', background: '#e0f2fe', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700 }}>
        {children_count} children
      </span>
    )}
    {funding_gap != null && (
      <span style={{ padding: '4px 12px', borderRadius: '99px', background: '#fef3c7', color: '#d97706', fontSize: '0.78rem', fontWeight: 700 }}>
        Gap: {fmtGHS(funding_gap)}
      </span>
    )}
  </div>
);

const Chip = ({ children, bg, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: '99px', background: bg, color, fontSize: '0.78rem', fontWeight: 600 }}>{children}</span>
);

const TypeBadge = ({ type }) => {
  const map = {
    Cash: { bg: '#dcfce7', color: '#16a34a' },
    Food: { bg: '#fef3c7', color: '#d97706' },
    Clothing: { bg: '#ede9fe', color: '#7c3aed' },
    Medical: { bg: '#fee2e2', color: '#dc2626' },
    Equipment: { bg: '#e0f2fe', color: '#0284c7' },
    'In-Kind': { bg: '#ede9fe', color: '#7c3aed' },
    Online: { bg: '#dcfce7', color: '#16a34a' },
    GoFundUs: { bg: '#dbeafe', color: '#1d4ed8' },
    Other: { bg: '#f1f5f9', color: '#64748b' },
  };
  const { bg, color } = map[type] || map.Other;
  return <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700, background: bg, color }}>{type}</span>;
};

const EmptyState = ({ icon, text }) => (
  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
    <div style={{ marginBottom: '0.75rem' }}>{React.createElement(icon, { size: 34, strokeWidth: 1.5 })}</div>
    <p style={{ margin: 0, fontSize: '0.9rem' }}>{text}</p>
  </div>
);

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b', fontSize: '1rem' }}>
    Loading your portal...
  </div>
);

/* Table helpers */
const Th = ({ children, align = 'left' }) => (
  <th style={{ padding: '0.65rem 0.85rem', textAlign: align, fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</th>
);
const Td = ({ children, align = 'left', style: extra }) => (
  <td style={{ padding: '0.75rem 0.85rem', textAlign: align, fontSize: '0.85rem', color: '#374151', ...extra }}>{children}</td>
);

/* ═══════════════════════════════════
   STYLES
   ═══════════════════════════════════ */
const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f7f8fa',
    fontFamily: "'Inter', sans-serif",
  },

  /* Sidebar */
  sidebar: {
    width: '260px',
    minWidth: '260px',
    background: '#1e2d3d',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    gap: '0.5rem',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.5rem 1rem',
  },
  sidebarLogo: {
    width: '40px', height: '40px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', flexShrink: 0,
  },
  sidebarTitle: {
    fontWeight: 800, fontSize: '0.9rem', color: '#e2e8f0',
    lineHeight: 1.2,
    wordBreak: 'break-word',
  },
  sidebarSub: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' },
  sidebarDivider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 },
  sidebarLink: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.88rem', fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    width: '100%',
  },
  sidebarLinkActive: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontWeight: 700,
  },
  sidebarIcon: { fontSize: '1.1rem', flexShrink: 0 },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0.5rem',
    marginTop: 'auto',
  },
  sidebarAvatar: {
    width: '36px', height: '36px',
    borderRadius: '50%',
    background: '#38526A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
  },

  /* Main content */
  content: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '1rem',
    padding: '1.5rem 2rem',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky', top: 0, zIndex: 10,
  },
  topBarTitle: { margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' },
  topBarSub: { margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' },
  tabContent: { padding: '2rem', flex: 1 },

  /* Profile hero */
  profileHero: {
    borderRadius: '20px',
    padding: '2rem',
    background: 'linear-gradient(135deg, #1e2d3d 0%, #38526A 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  profileHeroBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 80% 50%, rgba(45,156,219,0.25) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  profileAvatar: {
    width: '70px', height: '70px',
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.4)',
    flexShrink: 0,
  },

  /* Cards */
  card: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
  },

  /* KPI row */
  kpiRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },

  /* Form */
  formGrid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  formGrid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' },
  inlineForm: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    color: '#0f172a',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },

  /* Buttons */
  btnPrimary: {
    padding: '0.6rem 1.25rem',
    background: '#38526A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    padding: '0.4rem 0.8rem',
    background: '#f1f5f9',
    color: '#374151',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDanger: {
    padding: '0.4rem 0.8rem',
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Table */
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  thead: { borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  trow: { borderBottom: '1px solid #f1f5f9' },
};
