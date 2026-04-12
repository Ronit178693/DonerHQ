import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

/* Layout */
import Layout from './components/layout/Layout';

/* Pages */
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DiscoverCauses from './pages/Causes/DiscoverCauses';
import CauseDetail from './pages/Causes/CauseDetail';
import DiscoverNgos from './pages/Ngos/DiscoverNgos';
import NgoProfile from './pages/Ngos/NgoProfile';
import SocialFeed from './pages/Feed/SocialFeed';
import DonorDashboard from './pages/Dashboard/DonorDashboard';
import NgoDashboard from './pages/Dashboard/NgoDashboard';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import EscrowLedger from './pages/Escrow/EscrowLedger';
import TeamDashboard from './pages/Team/TeamDashboard';
import AdminPanel from './pages/Admin/AdminPanel';

import { Toaster } from 'react-hot-toast';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Specialized standalone routes — own navbar, no shared layout */}
        <Route path="/ngo/dashboard" element={<NgoDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Platform & Public Pages — use shared Navbar + Footer layout */}
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/causes" element={<DiscoverCauses />} />
          <Route path="/causes/:id" element={<CauseDetail />} />
          <Route path="/ngos" element={<DiscoverNgos />} />
          <Route path="/ngos/:id" element={<NgoProfile />} />
          
          {/* Platform */}
          <Route path="/feed" element={<SocialFeed />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/escrow" element={<EscrowLedger />} />
          <Route path="/donor/dashboard" element={<DonorDashboard />} />

          {/* Team */}
          <Route path="/teams/:id" element={<TeamDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
