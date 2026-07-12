import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import NgoTopNav from '../../components/ngo-dashboard/NgoTopNav';
import OverviewTab from '../../components/ngo-dashboard/OverviewTab';
import PostsTab from '../../components/ngo-dashboard/PostsTab';
import CausesTab from '../../components/ngo-dashboard/CausesTab';
import AnalyticsTab from '../../components/ngo-dashboard/AnalyticsTab';
import './NgoDashboard.css';

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD SHELL
   ═══════════════════════════════════════════════════════════ */
export default function NgoDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNgo = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      const profile = res.data.user?.ngoProfile;

      if (!profile) { setLoading(false); return; }

      if (profile && typeof profile === 'object' && profile.name) {
        setNgo(profile);
        setLoading(false);
        return;
      }

      const ngoId = profile._id || profile;
      const ngoRes = await API.get(`/ngos/${ngoId}`);
      setNgo(ngoRes.data.ngo || ngoRes.data);
    } catch (err) {
      console.error('Failed to load NGO profile:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNgo(); }, [fetchNgo]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="ngo-dash-loading">
        <div className="ngo-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="ngo-dash-empty">
        <span className="material-symbols-outlined" style={{ fontSize: '4rem', opacity: 0.15 }}>corporate_fare</span>
        <h2 className="font-headline">No NGO Profile Found</h2>
        <p>Your account doesn't have an associated NGO profile.</p>
        <button className="ngo-btn ngo-btn--primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="ngo-dash-shell">
      {/* Custom NGO Top Navbar */}
      <NgoTopNav
        ngo={ngo}
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Tab Content */}
      <main className="ngo-dash-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab ngo={ngo} onUpdate={fetchNgo} />}
            {activeTab === 'posts' && <PostsTab ngo={ngo} />}
            {activeTab === 'causes' && <CausesTab ngo={ngo} />}
            {activeTab === 'analytics' && <AnalyticsTab ngo={ngo} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
