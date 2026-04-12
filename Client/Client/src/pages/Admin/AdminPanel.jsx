import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'verification', label: 'Verify NGOs', icon: 'verified_user' },
  { id: 'escrow', label: 'Escrow Control', icon: 'account_balance_wallet' },
  { id: 'users', label: 'User Nodes', icon: 'groups' }
];

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch stats for the overview/header
      const statsRes = await API.get('/admin/stats');
      setStats(statsRes.data.stats);

      let endpoint = '';
      if (activeTab === 'verification') endpoint = '/admin/ngos/pending';
      else if (activeTab === 'escrow') endpoint = '/admin/escrows';
      else if (activeTab === 'users') endpoint = '/admin/users';

      if (endpoint) {
        const res = await API.get(endpoint);
        setData(res.data.pending || res.data.escrows || res.data.users || []);
      }
    } catch (err) {
      console.error('Admin Data Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNgoAction = async (id, status) => {
    const promise = API.put(`/admin/ngos/${id}/status`, { status });
    toast.promise(promise, {
      loading: 'Updating organization status...',
      success: `NGO ${status} successfully!`,
      error: 'Failed to update NGO status.'
    });
    try {
      await promise;
      setRefreshTrigger(prev => prev + 1);
    } catch (err) { console.error(err); }
  };

  const handleEscrowAction = async (id, action) => {
    const promise = API.put(`/admin/escrows/${id}/manage`, { action });
    toast.promise(promise, {
      loading: `Executing ${action} protocol...`,
      success: `Funds ${action}ed successfully!`,
      error: `Protocol failed: ${action} aborted.`
    });
    try {
      await promise;
      setRefreshTrigger(prev => prev + 1);
    } catch (err) { console.error(err); }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized celestial-bg">
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#ff716c' }}>gpp_bad</span>
          <h2 className="font-headline">Access Restricted</h2>
          <p>This module requires Level 4 Administrative Clearance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-view celestial-bg">
      <div className="container">
        
        {/* Header Section */}
        <header className="admin-header">
          <div>
            <label className="label-sm text-primary">MASTER PROTOCOL INTERFACE</label>
            <h1 className="display-sm font-headline">Platform Control Center</h1>
          </div>
          <div className="admin-nav">
            {TABS.map(t => (
              <button 
                key={t.id} 
                className={`admin-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Grid */}
        <section className="admin-stats-grid">
           {[
             { label: 'Ecosystem Agents', value: stats?.totalUsers || 0, icon: 'groups' },
             { label: 'Verified Nodes (NGOs)', value: stats?.totalNgos || 0, icon: 'corporate_fare' },
             { label: 'Platform Liquidity', value: `₹${(stats?.totalRaised || 0).toLocaleString('en-IN')}`, icon: 'payments' },
             { label: 'Escrow Volume', value: `₹${(stats?.escrowVolume || 0).toLocaleString('en-IN')}`, icon: 'lock_person' }
           ].map((s, i) => (
             <div key={i} className="admin-stat-card glass-panel">
                <div className="admin-stat-icon"><span className="material-symbols-outlined">{s.icon}</span></div>
                <div className="admin-stat-val font-headline">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
             </div>
           ))}
        </section>

        {/* Tab Content */}
        <main className="admin-tab-pane">
          <AnimatePresence mode="wait">
             {loading ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-empty">
                 <div className="loader-spinner" style={{ margin: '0 auto 1.5rem' }} />
                 <p>Synchronizing with Distributed Ledger...</p>
               </motion.div>
             ) : (
               <motion.div 
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
               >
                 {activeTab === 'overview' && <OverviewDashboard stats={stats} />}
                 {activeTab === 'verification' && <VerificationQueue items={data} onAction={handleNgoAction} />}
                 {activeTab === 'escrow' && <EscrowControl items={data} onAction={handleEscrowAction} />}
                 {activeTab === 'users' && <UserNodes items={data} />}
               </motion.div>
             )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function OverviewDashboard({ stats }) {
  return (
    <div className="overview-tab">
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
         <span className="material-symbols-outlined" style={{ fontSize: '5rem', opacity: 0.1, marginBottom: '2rem' }}>public</span>
         <h2 className="font-headline">Network Integrity: Optimal</h2>
         <p className="body-md text-muted" style={{ maxWidth: '600px', margin: '1rem auto' }}>
            All platform nodes are synchronized. Currently monitoring <strong>{stats?.activeCauses || 0} active missions</strong> and 
            <strong> {stats?.pendingApprovals || 0} pending organizational verifications</strong>. 
            Escrow safety protocols are active for all transactions.
         </p>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Backend Engine: LIVE</span>
            </div>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Escrow Protocol: V2.5 SECURE</span>
            </div>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Validator Capacity: 100%</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function VerificationQueue({ items, onAction }) {
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

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: EscrowControl — Table + Video Review Flow
   ═══════════════════════════════════════════════════════════ */
function EscrowControl({ items, onAction }) {
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

function UserNodes({ items }) {
  return (
    <div className="escrow-table-container glass-panel">
       <table className="admin-table">
        <thead>
          <tr>
            <th>User Identity</th>
            <th>Role Node</th>
            <th>Contribution Level</th>
            <th>Joined Protocol</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u._id}>
              <td>
                <div className="font-bold">{u.name}</div>
                <div className="body-xs text-muted">{u.email}</div>
              </td>
              <td><span className={`badge-role ${u.role}`} style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '10px' }}>{u.role.toUpperCase()}</span></td>
              <td>{(u.leaderboardScore || 0).toLocaleString()} UNITS</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
