import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: EscrowControl — Table + Video Review Flow
   ═══════════════════════════════════════════════════════════ */
export default function EscrowControl({ items, onAction }) {
  const [reviewing, setReviewing] = useState(null);

  const handleAction = (id, action) => {
    onAction(id, action);
    setReviewing(null);
  };

  return (
    <>
      <div className="escrow-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mission Entity</th>
              <th>NGO Beneficiary</th>
              <th>Total Held</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Master Control</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td>
                  <div className="font-bold">{item.causeId?.title}</div>
                  <div className="body-xs text-muted">TRANSACTION_ID: {item._id.substring(0,8)}</div>
                </td>
                <td>{item.ngoId?.name}</td>
                <td className="font-headline" style={{color: 'var(--color-primary)'}}>₹{item.totalHeld?.toLocaleString()}</td>
                 <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <span className={`status-chip ${item.status}`}>
                         {item.status?.replace('_', ' ')}
                       </span>
                       {item.stellarTxHash && (
                         <a 
                           href={`https://stellar.expert/explorer/testnet/tx/${item.stellarTxHash}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="admin-stellar-link"
                         >
                           <span className="material-symbols-outlined" style={{fontSize: '12px'}}>history_edu</span>
                           ON-CHAIN
                         </a>
                       )}
                    </div>
                 </td>
                <td>
                  {item.causeId?.impactVideoUrl ? (
                    <button className="ngo-btn ngo-btn--sm ngo-btn--primary" onClick={() => setReviewing(item)}>
                       <span className="material-symbols-outlined" style={{fontSize: '1rem'}}>video_library</span>
                       REVIEW
                    </button>
                  ) : (
                    <span className="body-xs text-muted">Awaiting Proof</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => onAction(item._id, 'release')} className="escrow-btn release" title="Instant Release"><span className="material-symbols-outlined">payments</span></button>
                    <button onClick={() => onAction(item._id, 'freeze')} className="escrow-btn freeze" title="Freeze Liquidity"><span className="material-symbols-outlined">ac_unit</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {reviewing && (
          <div className="admin-modal-overlay" onClick={() => setReviewing(null)}>
            <motion.div 
              className="admin-modal glass-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h3 className="font-headline">IMPACT VERIFICATION VAULT</h3>
                <button className="close-btn" onClick={() => setReviewing(null)}>&times;</button>
              </div>
              <div className="admin-modal-body">
                <div className="video-vault-container">
                  <video src={reviewing.causeId.impactVideoUrl} controls autoPlay className="vault-video" />
                </div>
                <div className="vault-info">
                  <div className="vault-meta">
                    <div className="label-sm">MISSION: {reviewing.causeId.title}</div>
                    <div className="label-sm">NGO: {reviewing.ngoId.name}</div>
                    <div className="label-sm" style={{color: 'var(--color-primary)'}}>DISBURSEMENT: ₹{reviewing.totalHeld?.toLocaleString()}</div>
                    {reviewing.stellarTxHash && (
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${reviewing.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-vault-stellar"
                      >
                         <span className="material-symbols-outlined">verified_user</span>
                         VERIFY BLOCKCHAIN ANCHOR
                      </a>
                    )}
                  </div>
                  <div className="vault-actions">
                    <button 
                      className="ngo-btn ngo-btn--primary" 
                      style={{flex: 1, padding: '1.25rem'}}
                      onClick={() => handleAction(reviewing._id, 'release')}
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      AUTHORIZE RELEASE
                    </button>
                    <button 
                      className="ngo-btn ngo-btn--ghost" 
                      style={{padding: '1.25rem'}}
                      onClick={() => handleAction(reviewing._id, 'freeze')}
                    >
                      <span className="material-symbols-outlined">warning</span>
                      DISPUTE PROOF
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
