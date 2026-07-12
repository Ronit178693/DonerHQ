import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   CUSTOM NGO TOP NAVBAR — replaces both global navbar & sidebar
   ═══════════════════════════════════════════════════════════ */
export const TABS = [
  { id: 'overview', label: 'Page', icon: 'account_circle' },
  { id: 'posts', label: 'Posts', icon: 'edit_note' },
  { id: 'causes', label: 'Causes', icon: 'volunteer_activism' },
  { id: 'analytics', label: 'Analytics', icon: 'bar_chart' },
];

export default function NgoTopNav({ ngo, user, activeTab, onTabChange, onLogout }) {
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
