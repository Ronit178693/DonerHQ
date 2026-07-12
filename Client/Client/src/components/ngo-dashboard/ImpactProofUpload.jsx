import { useState } from 'react';
import API from '../../api/axios';

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: ImpactProofUpload — Handles video evidence for a cause
   ═══════════════════════════════════════════════════════════ */
export default function ImpactProofUpload({ causeId, impactVideoUrl, escrowStatus, onComplete, raisedAmount, goalAmount, deadline }) {
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
