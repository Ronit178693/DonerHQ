import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';

/* ═══════════════════════════════════════════════════════════
   TAB: Posts — View, create, and delete social posts
   ═══════════════════════════════════════════════════════════ */
export default function PostsTab({ ngo }) {
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
