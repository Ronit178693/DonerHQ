import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import './DonorDashboard.css';

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
  { id: 'ledger', label: 'Escrow Ledger', icon: 'account_balance_wallet' },
  { id: 'teams', label: 'Teams', icon: 'group' },
  { id: 'preferences', label: 'Preferences', icon: 'style' }
];

export default function DonorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState(null);
  const [donations, setDonations] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, donationRes, ledgerRes] = await Promise.all([
        API.get('/users/me'),
        API.get('/donations/history'),
        API.get('/escrow/donor-ledger')
      ]);
      setUserData(userRes.data.user);
      setDonations(donationRes.data.donations || []);
      setLedger(ledgerRes.data.escrows || []);
    } catch (err) {
      console.error('Failed to load donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dash-loading celestial-bg">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
        className="loader-spinner"
      />
    </div>
  );

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Apr 2024';

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
       case 'released': return '#b9ffe8';
       case 'holding': return '#ffd700';
       case 'video_uploaded': return '#00f2ff';
       case 'admin_review': return '#ff8c00';
       default: return '#888';
    }
  };

  return (
    <div className="donor-dash-view celestial-bg">
      <div className="container">
        
        {/* ═══ Profile Hero Banner ═══ */}
        <section className="dash-hero">
          <div className="dash-hero__bg-glow" />
          <div className="dash-hero__content">
            <div className="dash-hero__identity">
              <div className="dash-hero__avatar">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="Avatar" />
                <div className="dash-hero__avatar-badge">
                  <span className="material-symbols-outlined">verified</span>
                </div>
              </div>
              <div className="dash-hero__info">
                <label className="label-sm text-primary">VERIFIED DONOR NODE</label>
                <h1 className="display-sm font-headline">{user?.name}</h1>
                <p className="body-sm text-muted">{user?.email}</p>
              </div>
            </div>
            
            <div className="dash-hero__meta">
              <div className="dash-hero__stat">
                <span className="material-symbols-outlined text-primary">military_tech</span>
                <div>
                  <p className="label-xs">RANK</p>
                  <p className="font-bold">ELITE NODE</p>
                </div>
              </div>
              <div className="dash-hero__stat">
                <span className="material-symbols-outlined text-primary">target</span>
                <div>
                  <p className="label-xs">TOTAL CONTRIBUTIONS</p>
                  <p className="font-bold">{donations.length} RECORDS</p>
                </div>
              </div>
              <div className="dash-hero__stat">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <div>
                  <p className="label-xs">MEMBER SINCE</p>
                  <p className="font-bold">{joinDate.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Inner Horizontal Tab Navigation ═══ */}
        <nav className="dash-tabs glass-panel">
           {TABS.map(tab => (
             <button 
               key={tab.id}
               className={`dash-tab ${activeTab === tab.id ? 'dash-tab--active' : ''}`}
               onClick={() => setActiveTab(tab.id)}
             >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
             </button>
           ))}
        </nav>

        {/* ═══ Tab Content ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="dash-content"
            >
              <div className="dash-grid-4">
                <div className="dash-stat-card glass-panel">
                  <span className="material-symbols-outlined dash-stat-icon">payments</span>
                  <label className="label-xs">TOTAL CAPITAL DEPLOYED</label>
                  <div className="display-sm font-headline">₹{(userData?.totalDonated || 0).toLocaleString('en-IN')}</div>
                  <div className="impact-meter"><div className="meter-fill" style={{ width: '85%' }} /></div>
                </div>

                <div className="dash-stat-card glass-panel">
                  <span className="material-symbols-outlined dash-stat-icon text-primary">leaderboard</span>
                  <label className="label-xs">LEADERBOARD RANK</label>
                  <div className="display-sm font-headline text-primary">#{userData?.rank?.toString().padStart(2, '0') || '00'}</div>
                  <p className="body-xs text-muted">Impact Score: {userData?.leaderboardScore || 0}</p>
                </div>
                
                <div className="dash-stat-card glass-panel">
                  <span className="material-symbols-outlined dash-stat-icon">lock_open</span>
                  <label className="label-xs">FUNDS IN ESCROW</label>
                  <div className="display-sm font-headline">₹{(userData?.escrowBalance || 0).toLocaleString('en-IN')}</div>
                  <p className="body-xs text-muted">Secured pending proof</p>
                </div>

                <div className="dash-stat-card glass-panel">
                  <span className="material-symbols-outlined dash-stat-icon">groups</span>
                  <label className="label-xs">MISSIONS SUPPORTED</label>
                  <div className="display-sm font-headline">{userData?.donationCount || 0}</div>
                  <p className="body-xs text-muted">Verified across all nodes</p>
                </div>
              </div>

              {/* Welcome Section */}
              <div className="dash-minimal-welcome glass-panel">
                 <h2 className="title-md font-headline">Impact Protocol v2.5 Synchronized</h2>
                 <p className="body-sm text-muted">Welcome back, {user?.name.split(' ')[0]}. Your current contributions are actively secured across <strong>{new Set(donations.map(d => d.causeId?._id)).size}</strong> mission nodes. Use the dedicated tabs to audit your ledger or manage squad preferences.</p>
                 <div className="dash-minimal-actions">
                    <button onClick={() => navigate('/feed')} className="btn-link-sm"><span className="material-symbols-outlined">dynamic_feed</span> LIVE FEED</button>
                    <button onClick={() => navigate('/causes')} className="btn-link-sm"><span className="material-symbols-outlined">explore</span> MISSIONS</button>
                    <button onClick={() => setActiveTab('ledger')} className="btn-link-sm"><span className="material-symbols-outlined">account_balance_wallet</span> AUDIT LEDGER</button>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div 
               key="ledger-tab"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="ledger-full-view"
            >
              <div className="ledger-header">
                <h2 className="title-lg font-headline">Celestial Escrow Ledger</h2>
                <p className="body-md text-muted italic">"Transparency is the only currency in the ledger."</p>
              </div>

              <div className="ledger-grid">
                {ledger.map((item) => {
                  const progress = Math.min(100, (item.causeId?.raisedAmount / item.causeId?.goalAmount) * 100);
                  const statusLabel = {
                    'holding': 'PENDING VERIFICATION',
                    'video_uploaded': 'PROOF UNDER REVIEW',
                    'released': 'CAPITAL RELEASED',
                    'disputed': 'AUDIT IN PROGRESS',
                    'refunded': 'FUNDS RETURNED'
                  }[item.status] || item.status.toUpperCase();

                  return (
                    <div key={item._id} className="ledger-card glass-panel">
                       <div className="ledger-card__top">
                          <div className="dn-info">
                             <div className="dn-amount">₹{item.totalHeld?.toLocaleString()}</div>
                             <div className="label-xs text-muted">SECURED CAPITAL</div>
                          </div>
                          <div className={`escrow-badge ${item.status?.toLowerCase()}`}>
                             <span className="dot"></span>
                             {statusLabel}
                          </div>
                       </div>

                       <div className="ledger-card__body">
                          <div className="ngo-mini">
                             <img src={item.ngoId?.logo} alt="" onError={e => e.target.src=`https://api.dicebear.com/7.x/shapes/svg?seed=${item.ngoId?._id}`} />
                             <span>{item.ngoId?.name}</span>
                          </div>
                          <h4 className="cause-title">{item.causeId?.title}</h4>
                          
                          <div className="cause-progress-section">
                             <div className="prog-label">
                                <span>Mission Progress</span>
                                <span>{Math.round(progress)}%</span>
                             </div>
                             <div className="prog-bar-container">
                                <div className="prog-bar-fill" style={{ width: `${progress}%` }}></div>
                             </div>
                             <div className="prog-stats">
                                <span>₹{(item.causeId?.raisedAmount || 0).toLocaleString()} raised</span>
                                <span>Goal: ₹{(item.causeId?.goalAmount || 0).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>

                       <div className="ledger-card__actions">
                          <button 
                            className="btn-view-cause"
                            onClick={() => navigate(`/causes/${item.causeId?._id}`)}
                          >
                             VIEW AUDIT TRAIL
                          </button>
                          
                          {item.stellarTxHash && (
                            <a 
                              href={`https://stellar.expert/explorer/testnet/tx/${item.stellarTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="stellar-badge-link"
                            >
                              <span className="material-symbols-outlined">verified_user</span>
                              BLOCKCHAIN PROOF
                            </a>
                          )}
                       </div>
                    </div>
                  );
                })}
              </div>

              {ledger.length === 0 && (
                <div className="empty-ledger glass-panel">
                   <span className="material-symbols-outlined">receipt_long</span>
                   <p>Your ledger is currently empty. Start your impact journey to see transactions here.</p>
                </div>
              )}
            </motion.div>
          )}

          {['teams', 'preferences'].includes(activeTab) && (
            <motion.div 
               key="placeholder" 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="placeholder-view glass-panel"
            >
               <span className="material-symbols-outlined">construction</span>
               <h3>Module Under Calibration</h3>
               <p className="text-muted">Node syncing in progress for {TABS.find(t => t.id === activeTab)?.label}.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
