import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api/axios';

/* ═══════════════════════════════════════════════════════════
   TAB: Analytics — Performance dashboard with Graphs
   ═══════════════════════════════════════════════════════════ */
export default function AnalyticsTab({ ngo }) {
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
