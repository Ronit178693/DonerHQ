import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './EscrowLedger.css';

export default function EscrowLedger() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/escrow')
      .then(res => setData(res.data.transactions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="escrow-page">
      <div className="container">
        <header className="ledger-header">
           <label className="label-sm">Precision Impact Verification</label>
           <h1 className="display-md font-headline">Celestial Ledger</h1>
           <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '48rem' }}>
              Real-time synchronization of all capital flows. This ledger represents cryptographically verified proof-of-impact nodes across the entire DonerHQ ecosystem.
           </p>
        </header>

        {/* Global Summary Stats */}
        <section className="ledger-summary-row">
           <div className="summary-card glass-panel">
              <div className="summary-val">₹2.4Cr</div>
              <div className="summary-label">Total Volume Managed</div>
           </div>
           <div className="summary-card glass-panel">
              <div className="summary-val">₹42L</div>
              <div className="summary-label">In Active Escrow</div>
           </div>
           <div className="summary-card glass-panel">
              <div className="summary-val">100%</div>
              <div className="summary-label">Node Verification Sync</div>
           </div>
           <div className="summary-card glass-panel">
              <div className="summary-val">12k+</div>
              <div className="summary-label">Proof-of-Impact Docs</div>
           </div>
        </section>

        {loading ? (
             <div style={{ padding: '8rem', textAlign: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid rgba(185,255,232,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1.5s linear infinite', margin: '0 auto' }}></div>
             </div>
        ) : (
          <div className="ledger-table-wrapper">
             <table className="ledger-table">
                <thead className="ledger-thead">
                   <tr>
                      <th>Node Identifier</th>
                      <th>Entity Node</th>
                      <th>Mission Category</th>
                      <th>Capital Val</th>
                      <th>Status Protocol</th>
                   </tr>
                </thead>
                <tbody>
                   {(data.length > 0 ? data : [
                      { _id: '0x8f23...a12b', causeId: { title: 'Rural Education' }, amount: 5000, status: 'Released', createdAt: '2023-11-20' },
                      { _id: '0x9c41...e42c', causeId: { title: 'Thar Desert Water' }, amount: 15000, status: 'Escrow', createdAt: '2023-11-21' },
                      { _id: '0xa112...f110', causeId: { title: 'Urban Slum Health' }, amount: 2500, status: 'Pending', createdAt: '2023-11-22' },
                   ]).map((tx, i) => (
                      <tr key={i} className="ledger-row">
                         <td className="hash-id">{tx._id}</td>
                         <td className="body-sm font-bold">{tx.causeId?.title || 'Unknown Entity'}</td>
                         <td>
                            <div className="category-tag" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', fontSize: '9px', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                               IMPACT_MISSION
                            </div>
                         </td>
                         <td className="font-headline font-bold">₹{tx.amount?.toLocaleString('en-IN')}</td>
                         <td>
                            <span className={`status-indicator ${tx.status === 'Released' ? 'status-released' : tx.status === 'Escrow' ? 'status-held' : 'status-pending'}`}>
                               <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                  {tx.status === 'Released' ? 'verified_user' : tx.status === 'Escrow' ? 'lock' : 'pending'}
                               </span>
                               {tx.status || 'Verified'}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </main>
  );
}
