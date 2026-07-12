import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';
import OverviewDashboard from '../../components/admin-panel/OverviewDashboard';
import VerificationQueue from '../../components/admin-panel/VerificationQueue';
import EscrowControl from '../../components/admin-panel/EscrowControl';
import UserNodes from '../../components/admin-panel/UserNodes';
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
