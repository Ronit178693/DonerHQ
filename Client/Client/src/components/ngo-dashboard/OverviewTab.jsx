import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';

/* ═══════════════════════════════════════════════════════════
   TAB: Overview — Profile hero + stats grid
   ═══════════════════════════════════════════════════════════ */
export default function OverviewTab({ ngo, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', location: '', category: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ngo) setForm({ name: ngo.name || '', bio: ngo.bio || '', location: ngo.location || '', category: ngo.category || '' });
  }, [ngo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put(`/ngos/${ngo._id}`, form);
      onUpdate();
      setEditing(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (!ngo) return <div className="ngo-empty"><p>Loading profile…</p></div>;

  const stats = [
    { icon: 'groups', label: 'Followers', value: ngo.followerCount || 0 },
    { icon: 'payments', label: 'Total Raised', value: `₹${(ngo.totalRaised || 0).toLocaleString('en-IN')}` },
    { icon: 'shield_with_heart', label: 'Transparency', value: `${ngo.transparencyScore || 0}%` },
    { icon: 'campaign', label: 'Causes', value: ngo.causes?.length || 0 },
  ];

  return (
    <div className="ngo-tab-content">
      {/* Hero Card */}
      <div className="ngo-hero-card">
        <div className="ngo-hero-glow" />
        <div className="ngo-hero-inner">
          <div className="ngo-hero-avatar">
            {ngo.logo ? <img src={ngo.logo} alt={ngo.name} /> : <span>{ngo.name?.charAt(0)}</span>}
          </div>
          <div className="ngo-hero-info">
            {editing ? (
              <input className="ngo-input ngo-input--hero" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Organization Name" />
            ) : (
              <h2 className="font-headline">{ngo.name}</h2>
            )}
            <div className="ngo-hero-badges">
              <span className={`ngo-status-pill ${ngo.status}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                  {ngo.status === 'approved' ? 'verified' : ngo.status === 'rejected' ? 'cancel' : 'schedule'}
                </span>
                {ngo.status}
              </span>
              <span className="ngo-category-pill">{ngo.category}</span>
              {ngo.doc80G && <span className="ngo-doc-chip">80G ✓</span>}
              {ngo.docFCRA && <span className="ngo-doc-chip">FCRA ✓</span>}
            </div>
          </div>
          <div className="ngo-hero-actions">
            <button className="ngo-btn ngo-btn--ghost" onClick={() => window.open(`/ngos/${ngo._id}`, '_blank')}>
              <span className="material-symbols-outlined">visibility</span>
              Public Page
            </button>
            <button className="ngo-btn ngo-btn--ghost" onClick={() => setEditing(!editing)}>
              <span className="material-symbols-outlined">{editing ? 'close' : 'edit'}</span>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      <AnimatePresence>
        {editing && (
          <motion.div className="ngo-edit-panel glass-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="ngo-edit-grid">
              <div className="ngo-edit-field">
                <label>Mission Statement</label>
                <textarea className="ngo-input ngo-textarea" rows="3" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
              </div>
              <div className="ngo-edit-row">
                <div className="ngo-edit-field">
                  <label>Location</label>
                  <input className="ngo-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="ngo-edit-field">
                  <label>Category</label>
                  <select className="ngo-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['Education', 'Healthcare', 'Environment', 'Animal Welfare', 'Social Equality', 'Disaster Relief', 'Sustainability'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button className="ngo-btn ngo-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="ngo-stats-grid">
        {stats.map((s, i) => (
          <motion.div key={i} className="ngo-stat-card glass-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="ngo-stat-icon"><span className="material-symbols-outlined">{s.icon}</span></div>
            <div className="ngo-stat-val font-headline">{s.value}</div>
            <div className="ngo-stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bio Section */}
      {ngo.bio && (
        <div className="ngo-bio-section glass-panel">
          <h3 className="font-headline">About</h3>
          <p>{ngo.bio}</p>
          <div className="ngo-bio-meta">
            {ngo.location && <span><span className="material-symbols-outlined">location_on</span>{ngo.location}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
