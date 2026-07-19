import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

/* Layout */
import Layout from './components/layout/Layout';

/* Guards */
import ProtectedRoute from './components/guards/ProtectedRoute';

/* Pages */
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import DiscoverCauses from './pages/Causes/DiscoverCauses';
import CauseDetail from './pages/Causes/CauseDetail';
import DiscoverNgos from './pages/Ngos/DiscoverNgos';
import NgoProfile from './pages/Ngos/NgoProfile';
import SocialFeed from './pages/Feed/SocialFeed';
import DonorDashboard from './pages/Dashboard/DonorDashboard';
import NgoDashboard from './pages/Dashboard/NgoDashboard';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import TeamDashboard from './pages/Team/TeamDashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import NotFound from './pages/NotFound/NotFound';

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
        <Route path="/ngo/dashboard" element={<ProtectedRoute roles={['ngo']}><NgoDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />

        {/* Platform & Public Pages — use shared Navbar + Footer layout */}
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/causes" element={<DiscoverCauses />} />
          <Route path="/causes/:id" element={<CauseDetail />} />
          <Route path="/ngos" element={<DiscoverNgos />} />
          <Route path="/ngos/:id" element={<NgoProfile />} />
          
          {/* Protected Platform Pages */}
          <Route path="/feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/donor/dashboard" element={<ProtectedRoute roles={['donor']}><DonorDashboard /></ProtectedRoute>} />

          {/* Team */}
          <Route path="/teams/:id" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
