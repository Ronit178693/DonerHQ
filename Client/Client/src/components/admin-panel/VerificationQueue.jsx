/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: VerificationQueue — NGO approval/rejection queue
   ═══════════════════════════════════════════════════════════ */
export default function VerificationQueue({ items, onAction }) {
  if (items.length === 0) return (
    <div className="admin-empty">
      <span className="material-symbols-outlined">rule</span>
      <h3>Queue Integrity Verified</h3>
      <p className="text-muted">No organizational nodes awaiting clearance.</p>
    </div>
  );

  return (
    <div className="ngo-verify-list">
      {items.map(ngo => (
        <div key={ngo._id} className="ngo-verify-card glass-panel">
          <div className="ngo-verify-logo">
            {ngo.logo ? <img src={ngo.logo} alt="" /> : <span className="material-symbols-outlined">corporate_fare</span>}
          </div>
          <div className="ngo-verify-info">
            <h3 className="font-headline">{ngo.name}</h3>
            <p className="body-sm text-muted">{ngo.location} • {ngo.category} • Admin: {ngo.userId?.name}</p>
            <div className="ngo-verify-docs">
               {ngo.logo && <a href={ngo.logo} target="_blank" className="doc-link"><span className="material-symbols-outlined">image</span> LOGO</a>}
               <a href="#" className="doc-link"><span className="material-symbols-outlined">description</span> 80G CERT</a>
               <a href="#" className="doc-link"><span className="material-symbols-outlined">verified</span> FCRA DOC</a>
            </div>
          </div>
          <div className="ngo-action-btns">
            <button className="btn-approve" onClick={() => onAction(ngo._id, 'approved')}>
              <span className="material-symbols-outlined">check</span> APPROVE
            </button>
            <button className="btn-reject" onClick={() => onAction(ngo._id, 'rejected')}>
               REJECT
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
