import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import './NgoDashboard.css';

/* ═══════════════════════════════════════════════════════════
   TAB: Overview — Profile hero + stats grid
   ═══════════════════════════════════════════════════════════ */
function OverviewTab({ ngo, onUpdate }) {
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

/* ═══════════════════════════════════════════════════════════
   TAB: Posts — View, create, and delete social posts
   ═══════════════════════════════════════════════════════════ */
function PostsTab({ ngo }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [newPost, setNewPost] = useState({ type: 'text', caption: '', tags: '', media: null });
  const [preview, setPreview] = useState(null);

  const fetchPosts = useCallback(async () => {
    if (!ngo?._id) return;
    try {
      const r = await API.get(`/ngos/${ngo._id}/posts`);
      setPosts(r.data.posts || []);
    } catch { setPosts([]); }
    setLoading(false);
  }, [ngo]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreate = async () => {
    // If it's a text-only post, we need a caption. Otherwise, caption is optional.
    if (newPost.type === 'text' && !newPost.caption.trim()) return;
    
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('type', newPost.type);
      formData.append('caption', newPost.caption);
      formData.append('ngoId', ngo._id);
      
      // Fixed: Send as JSON string for backend consistency
      const tagArray = newPost.tags ? newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      formData.append('tags', JSON.stringify(tagArray));

      if (newPost.media) {
        formData.append('media', newPost.media);
      }

      await API.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchPosts();
      setNewPost({ type: 'text', caption: '', tags: '', media: null });
      setPreview(null);
      setShowForm(false);
    } catch (err) { 
      console.error('Post creation failed:', err.response?.data || err); 
    }
    setCreating(false);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, media: file, type: file.type.startsWith('video/') ? 'video' : 'photo' });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    setDeleting(postId);
    try {
      await API.delete(`/ngos/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.error('Delete failed:', err); }
    setDeleting(null);
  };

  return (
    <div className="ngo-tab-content">
      <div className="ngo-tab-header">
        <div>
          <h2 className="font-headline">Posts</h2>
          <p className="ngo-tab-subtitle">{posts.length} update{posts.length !== 1 ? 's' : ''} published</p>
        </div>
        <button className="ngo-btn ngo-btn--primary" onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Post'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="ngo-create-card glass-panel" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="ngo-create-header">
              <span className="material-symbols-outlined">edit_note</span>
              <h3 className="font-headline">Compose Update</h3>
            </div>
            <div className="ngo-create-body">
              <div className="ngo-create-row">
                <label>Type</label>
                <div className="ngo-type-selector">
                  {['text', 'photo', 'video'].map(t => (
                    <button key={t} className={`ngo-type-btn ${newPost.type === t ? 'active' : ''}`} onClick={() => setNewPost({...newPost, type: t})}>
                      <span className="material-symbols-outlined">{t === 'text' ? 'article' : t === 'photo' ? 'image' : 'videocam'}</span>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ngo-create-row">
                <label>Content</label>
                <textarea className="ngo-input ngo-textarea" placeholder="Share an update with your supporters…" rows="4" value={newPost.caption} onChange={e => setNewPost({...newPost, caption: e.target.value})} />
              </div>

              {/* Media Upload for Post */}
              <div className="ngo-create-row">
                <label>Attach Media {newPost.type !== 'text' && <span style={{color: 'var(--color-primary)'}}>*</span>}</label>
                <div className="ngo-file-input-wrapper">
                  <input type="file" id="post-media-upload" hidden accept="image/*,video/*" onChange={onFileChange} />
                  <label htmlFor="post-media-upload" className="ngo-file-dropzone">
                    <span className="material-symbols-outlined">cloud_upload</span>
                    <span>{newPost.media ? newPost.media.name : 'Click to upload image or video'}</span>
                  </label>
                </div>
                {preview && (
                  <div className="ngo-upload-preview">
                    {newPost.type === 'video' ? <video src={preview} style={{width: '100%', borderRadius: '8px'}} /> : <img src={preview} alt="Preview" style={{width: '100%', borderRadius: '8px'}} />}
                    <button className="ngo-preview-close" onClick={() => { setPreview(null); setNewPost({...newPost, media: null, type: 'text'}); }}>×</button>
                  </div>
                )}
              </div>

              <div className="ngo-create-row">
                <label>Tags <span className="hint">(comma separated)</span></label>
                <input className="ngo-input" placeholder="e.g. education, rural, water" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} />
              </div>
            </div>
            <div className="ngo-create-footer">
              <button 
                className="ngo-btn ngo-btn--primary" 
                onClick={handleCreate} 
                disabled={creating || (newPost.type === 'text' && !newPost.caption.trim())}
              >
                <span className="material-symbols-outlined">{creating ? 'hourglass_empty' : 'send'}</span>
                {creating ? 'Publishing…' : 'Publish Post'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="ngo-empty"><div className="ngo-spinner" /><p>Loading posts…</p></div>
      ) : posts.length === 0 ? (
        <div className="ngo-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.12 }}>article</span>
          <h3>No posts yet</h3>
          <p>Share your first update with the community to engage donors.</p>
        </div>
      ) : (
        <div className="ngo-post-list">
          {posts.map((p, i) => (
            <motion.div key={p._id} className="ngo-post-card glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="ngo-post-top">
                <div className="ngo-post-type-row">
                  <span className={`ngo-post-type-badge ${p.type}`}>
                    <span className="material-symbols-outlined">{p.type === 'text' ? 'article' : p.type === 'photo' ? 'image' : 'videocam'}</span>
                    {p.type}
                  </span>
                  <span className="ngo-post-date">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <button className="ngo-btn ngo-btn--danger-ghost" onClick={() => handleDelete(p._id)} disabled={deleting === p._id} title="Delete post">
                  <span className="material-symbols-outlined">{deleting === p._id ? 'hourglass_empty' : 'delete'}</span>
                </button>
              </div>
              <p className="ngo-post-caption">{p.caption}</p>
              {p.mediaUrl && <img src={p.mediaUrl} alt="Post media" className="ngo-post-media" />}
              {p.tags?.length > 0 && (
                <div className="ngo-post-tags">{p.tags.map(t => <span key={t} className="ngo-tag">#{t}</span>)}</div>
              )}
              <div className="ngo-post-metrics">
                <span><span className="material-symbols-outlined">favorite</span>{p.likes || 0}</span>
                <span><span className="material-symbols-outlined">chat_bubble</span>{p.commentCount || p.comments?.length || 0}</span>
                <span><span className="material-symbols-outlined">share</span>{p.shares || 0}</span>
                <span><span className="material-symbols-outlined">visibility</span>{p.reach || 0}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: ImpactProofUpload — Handles video evidence for a cause
   ═══════════════════════════════════════════════════════════ */
function ImpactProofUpload({ causeId, impactVideoUrl, escrowStatus, onComplete, raisedAmount, goalAmount, deadline }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const isGoalMet = raisedAmount >= goalAmount;
  // NGOs can upload proof once the goal is met (deadline applies only to fundraising, not proof submission)
  const canUpload = isGoalMet;

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('causeId', causeId);
    formData.append('video', file);

    try {
      await API.post('/impact-videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onComplete();
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Impact Upload Error:', err);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  if (impactVideoUrl) {
    return (
      <div className="ngo-proof-upload">
        <div className="proof-status-card approved">
          <span className="material-symbols-outlined">verified</span>
          <div>
            <p className="font-bold body-sm" style={{margin: 0}}>Impact Evidence Submitted</p>
            <p className="body-xs" style={{opacity: 0.7}}>Status: {escrowStatus?.replace('_', ' ').toUpperCase()}</p>
          </div>
          <button className="ngo-btn ngo-btn--sm ngo-btn--ghost" style={{marginLeft: 'auto'}} onClick={() => window.open(impactVideoUrl, '_blank')}>View Video</button>
        </div>
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="ngo-proof-upload">
         <div className="proof-status-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--color-outline)' }}>
            <span className="material-symbols-outlined">lock_clock</span>
            <div>
               <p className="font-bold body-sm" style={{margin: 0}}>Upload Locked</p>
               <p className="body-xs" style={{opacity: 0.7}}>
                  Goal not yet reached (₹{(raisedAmount || 0).toLocaleString()} / ₹{(goalAmount || 0).toLocaleString()})
               </p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="ngo-proof-upload">
       <div className="proof-upload-header">
          <h4><span className="material-symbols-outlined" style={{fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px'}}>videocam</span> STEP 2: UPLOAD IMPACT PROOF</h4>
       </div>
       <div className="ngo-proof-form">
          {!preview ? (
            <>
              <input type="file" id={`proof-${causeId}`} hidden accept="video/*" onChange={onFileChange} />
              <label htmlFor={`proof-${causeId}`} className="ngo-file-dropzone" style={{padding: '1.5rem', borderStyle: 'solid'}}>
                <span className="material-symbols-outlined">cloud_upload</span>
                <span className="body-xs">Click to upload Video Evidence (MP4/MOV)</span>
              </label>
            </>
          ) : (
            <div className="proof-preview-container">
              <video src={preview} className="proof-video-preview" controls />
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                 <button className="ngo-btn ngo-btn--primary" style={{flex: 1}} onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'UPLOADING...' : 'SUBMIT PROOF'}
                 </button>
                 <button className="ngo-btn ngo-btn--ghost" onClick={() => {setPreview(null); setFile(null);}}>Cancel</button>
              </div>
            </div>
          )}
       </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: Causes — View, create, and manage fundraising causes
   ═══════════════════════════════════════════════════════════ */
function CausesTab({ ngo }) {
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

/* ═══════════════════════════════════════════════════════════
   TAB: Analytics — Performance dashboard with Graphs
   ═══════════════════════════════════════════════════════════ */
function AnalyticsTab({ ngo }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/ngos/dashboard/analytics'),
      API.get('/escrow/my-ledger')
    ]).then(([anaRes, ledRes]) => {
      setAnalytics(anaRes.data);
      setLedger(ledRes.data.escrows || []);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ngo-empty"><div className="ngo-spinner" /><p>Crunching numbers…</p></div>;

  const postStats = analytics?.postAnalytics || {};
  const causeStats = analytics?.causeAnalytics || {};

  // FILTERED METRICS (Removing Total Shares)
  const metrics = [
    { icon: 'visibility', label: 'Total Reach', value: postStats.totalReach || 0, color: '#A78BFA' },
    { icon: 'favorite', label: 'Total Likes', value: postStats.totalLikes || 0, color: '#F472B6' },
    { icon: 'volunteer_activism', label: 'Donate Clicks', value: postStats.totalDonateClicks || 0, color: 'var(--color-primary)' },
    { icon: 'campaign', label: 'Active Causes', value: causeStats.activeCauses || 0, color: '#60A5FA' },
  ];

  // Data for the Reach vs Interaction Bar Chart
  const barData = [
    { label: 'Reach', value: postStats.totalReach || 0, max: Math.max(postStats.totalReach || 1, 1000) },
    { label: 'Engage', value: (postStats.totalLikes || 0) + (postStats.totalComments || 0), max: Math.max(postStats.totalReach || 1, 1000) },
    { label: 'Donations', value: causeStats.totalDonations || 0, max: Math.max(causeStats.totalDonations || 1, 100) },
  ];

  return (
    <div className="ngo-tab-content">
      <div className="ngo-tab-header">
        <div>
          <h2 className="font-headline">Analytics Dashboard</h2>
          <p className="ngo-tab-subtitle">Real-time engagement and growth metrics</p>
        </div>
      </div>

      {/* Graphical Stats Top Row */}
      <div className="ngo-visual-stats">
        <div className="ngo-chart-card glass-panel">
          <h4 className="label-sm mb-6">ENGAGEMENT OVERVIEW</h4>
          <div className="ngo-bar-chart">
            {barData.map((bar, i) => (
              <div key={i} className="ngo-bar-group">
                <div className="ngo-bar-label body-xs">{bar.label}</div>
                <div className="ngo-bar-track">
                  <motion.div 
                    className="ngo-bar-fill" 
                    initial={{ height: 0 }} 
                    animate={{ height: `${(bar.value / bar.max) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
                <div className="ngo-bar-val font-headline">{bar.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ngo-chart-card glass-panel">
          <h4 className="label-sm mb-6">MISSION PROGRESS</h4>
          <div className="ngo-donut-flex">
             <div className="ngo-donut-container">
                <svg viewBox="0 0 36 36" className="ngo-donut">
                  <path className="ngo-donut-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <motion.path 
                    className="ngo-donut-segment" 
                    strokeDasharray={`${(causeStats.completedCauses / (causeStats.totalCauses || 1)) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                </svg>
                <div className="ngo-donut-text">
                  <div className="val">{Math.round((causeStats.completedCauses / (causeStats.totalCauses || 1)) * 100)}%</div>
                  <div className="lab">SOLVED</div>
                </div>
             </div>
             <div className="ngo-donut-legend">
                <div className="legend-item">
                  <span className="dot active"></span>
                  <span>{causeStats.activeCauses || 0} Active</span>
                </div>
                <div className="legend-item">
                  <span className="dot completed"></span>
                  <span>{causeStats.completedCauses || 0} Settled</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="ngo-analytics-grid">
        {metrics.map((m, i) => (
          <motion.div key={i} className="ngo-analytics-card glass-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
            <div className="ngo-analytics-icon" style={{ background: `${m.color}20`, color: m.color }}><span className="material-symbols-outlined">{m.icon}</span></div>
            <div className="ngo-analytics-val font-headline">{typeof m.value === 'number' ? m.value.toLocaleString('en-IN') : m.value}</div>
            <div className="ngo-analytics-label">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Escrow Pipeline */}
      <div className="ngo-pipeline glass-panel">
        <div className="ngo-pipeline-header">
          <h3 className="font-headline">Transparency Ledger</h3>
          <span className="ngo-pipeline-badge">LIVE_ESCROW_PIPELINE</span>
        </div>
        <div className="ngo-pipeline-items">
          {ledger.length === 0 ? (
            <div className="body-sm text-muted" style={{padding: '1rem'}}>No active escrow contracts found.</div>
          ) : ledger.map((item, i) => {
            const statusMap = {
              'holding': { label: 'Securing Funds', color: '#FFD166', pct: 33 },
              'video_uploaded': { label: 'Video Under Review', color: 'var(--color-primary)', pct: 66 },
              'released': { label: 'Funds Released', color: '#A78BFA', pct: 100 },
              'disputed': { label: 'Audit Required', color: '#FF716C', pct: 50 },
            };
            const meta = statusMap[item.status] || { label: item.status, color: '#73757d', pct: 10 };

            return (
              <div key={item._id} className="ngo-pipeline-row">
                <div className="ngo-pipeline-info">
                  <h4>{item.causeId?.title}</h4>
                  <span>{meta.label}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                   <span className="body-xs font-bold" style={{color: 'var(--color-outline)'}}>₹{item.totalHeld?.toLocaleString()} held</span>
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {item.stellarTxHash && (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${item.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ngo-stellar-link"
                          title="Verify on Blockchain"
                        >
                          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>verified_user</span>
                        </a>
                      )}
                      <span className="ngo-pipeline-pct font-headline" style={{ color: meta.color }}>{meta.pct}%</span>
                   </div>
                </div>
                <div className="ngo-pipeline-bar">
                  <motion.div style={{ background: meta.color }} initial={{ width: 0 }} animate={{ width: `${meta.pct}%` }} transition={{ duration: 1.5, delay: 0.3 + (i * 0.2) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM NGO TOP NAVBAR — replaces both global navbar & sidebar
   ═══════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview', label: 'Page', icon: 'account_circle' },
  { id: 'posts', label: 'Posts', icon: 'edit_note' },
  { id: 'causes', label: 'Causes', icon: 'volunteer_activism' },
  { id: 'analytics', label: 'Analytics', icon: 'bar_chart' },
];

function NgoTopNav({ ngo, user, activeTab, onTabChange, onLogout }) {
  return (
    <nav className="ngo-topnav">
      <div className="ngo-topnav-inner">
        {/* Brand */}
        <Link to="/" className="ngo-topnav-brand">
          <span className="ngo-topnav-logo">D</span>
          <span className="ngo-topnav-title">DONER<span className="ngo-topnav-accent">HQ</span></span>
        </Link>

        {/* Profile Cluster Removed */}

        {/* Navigation Tabs */}
        <div className="ngo-topnav-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`ngo-topnav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="ngo-topnav-tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div className="ngo-topnav-indicator" layoutId="ngoNavIndicator" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="ngo-topnav-logout" onClick={onLogout} title="Sign Out">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD SHELL
   ═══════════════════════════════════════════════════════════ */
export default function NgoDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNgo = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      const profile = res.data.user?.ngoProfile;

      if (!profile) { setLoading(false); return; }

      if (profile && typeof profile === 'object' && profile.name) {
        setNgo(profile);
        setLoading(false);
        return;
      }

      const ngoId = profile._id || profile;
      const ngoRes = await API.get(`/ngos/${ngoId}`);
      setNgo(ngoRes.data.ngo || ngoRes.data);
    } catch (err) {
      console.error('Failed to load NGO profile:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNgo(); }, [fetchNgo]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="ngo-dash-loading">
        <div className="ngo-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="ngo-dash-empty">
        <span className="material-symbols-outlined" style={{ fontSize: '4rem', opacity: 0.15 }}>corporate_fare</span>
        <h2 className="font-headline">No NGO Profile Found</h2>
        <p>Your account doesn't have an associated NGO profile.</p>
        <button className="ngo-btn ngo-btn--primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="ngo-dash-shell">
      {/* Custom NGO Top Navbar */}
      <NgoTopNav
        ngo={ngo}
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Tab Content */}
      <main className="ngo-dash-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab ngo={ngo} onUpdate={fetchNgo} />}
            {activeTab === 'posts' && <PostsTab ngo={ngo} />}
            {activeTab === 'causes' && <CausesTab ngo={ngo} />}
            {activeTab === 'analytics' && <AnalyticsTab ngo={ngo} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
