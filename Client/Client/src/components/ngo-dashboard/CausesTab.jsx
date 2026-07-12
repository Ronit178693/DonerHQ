import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import ImpactProofUpload from './ImpactProofUpload';

/* ═══════════════════════════════════════════════════════════
   TAB: Causes — View, create, and manage fundraising causes
   ═══════════════════════════════════════════════════════════ */
export default function CausesTab({ ngo }) {
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goalAmount: '', deadline: '', media: null });
  const [preview, setPreview] = useState(null);

  const fetchCauses = useCallback(async () => {
    if (!ngo?._id) return;
    try {
      const r = await API.get(`/ngos/${ngo._id}/causes`);
      setCauses(r.data.causes || []);
    } catch { setCauses([]); }
    setLoading(false);
  }, [ngo]);

  useEffect(() => { fetchCauses(); }, [fetchCauses]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.goalAmount) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('goalAmount', Number(form.goalAmount));
      if (form.deadline) formData.append('deadline', form.deadline);
      if (form.media) formData.append('coverImage', form.media);

      await API.post('/causes/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchCauses();
      setForm({ title: '', description: '', goalAmount: '', deadline: '', media: null });
      setPreview(null);
      setShowForm(false);
    } catch (err) { console.error('Cause creation failed:', err.response?.data || err); }
    setCreating(false);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, media: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const getProgress = (raised, goal) => goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <div className="ngo-tab-content">
      <div className="ngo-tab-header">
        <div>
          <h2 className="font-headline">Causes</h2>
          <p className="ngo-tab-subtitle">{causes.length} campaign{causes.length !== 1 ? 's' : ''} launched</p>
        </div>
        <button className="ngo-btn ngo-btn--primary" onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Cause'}
        </button>
      </div>

      {ngo && ngo.status !== 'approved' && (
        <div className="ngo-warning-banner">
          <span className="material-symbols-outlined">warning</span>
          <div>
            <strong>Organization not verified</strong>
            <p>Your NGO must be approved by an admin before you can create new causes.</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div className="ngo-create-card glass-panel" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="ngo-create-header">
              <span className="material-symbols-outlined">volunteer_activism</span>
              <h3 className="font-headline">Launch New Campaign</h3>
            </div>
            <div className="ngo-create-body">
              <div className="ngo-create-row">
                <label>Campaign Title</label>
                <input className="ngo-input" placeholder="e.g. Clean Water for 500 Villages" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>

              {/* Media Upload for Cause */}
              <div className="ngo-create-row">
                <label>Cover Image</label>
                <div className="ngo-file-input-wrapper">
                  <input type="file" id="cause-media-upload" hidden accept="image/*" onChange={onFileChange} />
                  <label htmlFor="cause-media-upload" className="ngo-file-dropzone">
                    <span className="material-symbols-outlined">image</span>
                    <span>{form.media ? form.media.name : 'Upload Campaign Banner'}</span>
                  </label>
                </div>
                {preview && <img src={preview} alt="Preview" style={{width: '100%', borderRadius: '8px', marginTop: '1rem'}} />}
              </div>

              <div className="ngo-create-row">
                <label>Description</label>
                <textarea className="ngo-input ngo-textarea" rows="4" placeholder="Explain the mission, how funds will be used, and expected impact…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="ngo-create-split">
                <div className="ngo-create-row">
                  <label>Goal Amount (₹)</label>
                  <input className="ngo-input" type="number" placeholder="500000" value={form.goalAmount} onChange={e => setForm({...form, goalAmount: e.target.value})} />
                </div>
                <div className="ngo-create-row">
                  <label>Deadline <span className="hint">(optional)</span></label>
                  <input className="ngo-input" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="ngo-create-footer">
              <button className="ngo-btn ngo-btn--primary" onClick={handleCreate} disabled={creating || !form.title.trim() || !form.goalAmount}>
                <span className="material-symbols-outlined">{creating ? 'hourglass_empty' : 'rocket_launch'}</span>
                {creating ? 'Launching…' : 'Launch Cause'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="ngo-empty"><div className="ngo-spinner" /><p>Loading causes…</p></div>
      ) : causes.length === 0 ? (
        <div className="ngo-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.12 }}>volunteer_activism</span>
          <h3>No campaigns yet</h3>
          <p>Launch your first fundraising cause to start receiving donations.</p>
        </div>
      ) : (
        <div className="ngo-cause-list">
          {causes.map((c, i) => {
            const progress = getProgress(c.raisedAmount, c.goalAmount);
            return (
              <motion.div key={c._id} className="ngo-cause-card glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="ngo-cause-top">
                  <div>
                    <h3 className="font-headline">{c.title}</h3>
                    <p className="ngo-cause-desc">{c.description?.substring(0, 120)}{c.description?.length > 120 ? '…' : ''}</p>
                  </div>
                  <span className={`ngo-status-pill ${c.status || 'active'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                      {c.status === 'completed' ? 'check_circle' : c.status === 'cancelled' ? 'cancel' : 'radio_button_checked'}
                    </span>
                    {c.status || 'active'}
                  </span>
                </div>
                <div className="ngo-cause-progress-section">
                  <div className="ngo-cause-amounts">
                    <span className="ngo-cause-raised">₹{(c.raisedAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="ngo-cause-goal">of ₹{(c.goalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ngo-progress-bar">
                    <motion.div className="ngo-progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                  </div>
                  <div className="ngo-cause-meta">
                    <span>{progress}% funded</span>
                    <span>{c.donorCount || 0} donor{(c.donorCount || 0) !== 1 ? 's' : ''}</span>
                    {c.deadline && <span>Deadline: {new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                <div className="ngo-cause-footer">
                  <Link to={`/causes/${c._id}`} className="ngo-btn ngo-btn--ghost ngo-btn--sm">
                    <span className="material-symbols-outlined">open_in_new</span>
                    View Page
                  </Link>
                </div>
                
                {/* IMPACT PROOF FLOW */}
                <ImpactProofUpload 
                  causeId={c._id} 
                  impactVideoUrl={c.impactVideoUrl} 
                  escrowStatus={c.escrowStatus}
                  onComplete={fetchCauses}
                  raisedAmount={c.raisedAmount}
                  goalAmount={c.goalAmount}
                  deadline={c.deadline}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
