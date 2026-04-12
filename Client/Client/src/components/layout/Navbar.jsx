import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Track scroll for glass effect intensity — MUST be above any conditional returns
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close discover dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDiscoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setDiscoverOpen(false); }, [location.pathname]);

  // Hide global navbar on NGO/Admin views (they have their own nav)
  // This check MUST come AFTER all hooks to respect Rules of Hooks
  const hideNavbar = location.pathname.startsWith('/ngo/dashboard') ||
                     location.pathname.startsWith('/admin');
  
  if (hideNavbar) return null;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="logo">
          DONER<span className="logo-accent">HQ</span>
        </Link>

        {/* Global Navigation Links */}
        <div className="nav-links">
          {/* Universal surfing links */}
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <a href="/#about" className="nav-link">About</a>
          <a href="/#contact" className="nav-link">Contact</a>

          {/* Post-Auth Platform Links */}
          {isAuthenticated && (
            <>
              <div className="nav-divider" />
              
              <NavLink to="/feed" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Feed
              </NavLink>
              
              {/* Improved Discover Dropdown */}
              <div 
                ref={dropdownRef}
                className="nav-dropdown-trigger"
                onMouseEnter={() => setDiscoverOpen(true)}
                onMouseLeave={() => setDiscoverOpen(false)}
              >
                <button 
                  className={`nav-link nav-link--dropdown ${location.pathname.includes('/causes') || location.pathname.includes('/ngos') ? 'active' : ''}`}
                  onClick={() => setDiscoverOpen(prev => !prev)}
                  aria-expanded={discoverOpen}
                >
                  Discover
                  <span className={`material-symbols-outlined nav-chevron ${discoverOpen ? 'nav-chevron--open' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                <AnimatePresence>
                  {discoverOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      className="nav-dropdown"
                    >
                      <div className="nav-dropdown__header">
                        <span className="label-xs">EXPLORE THE ECOSYSTEM</span>
                      </div>
                      
                      <Link to="/causes" className="dropdown-item" onClick={() => setDiscoverOpen(false)}>
                        <div className="dropdown-item__icon">
                          <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <div className="dropdown-item__text">
                          <p className="dropdown-item__title">Causes</p>
                          <p className="dropdown-item__desc">Browse active missions & verified campaigns</p>
                        </div>
                        <span className="material-symbols-outlined dropdown-item__arrow">arrow_forward</span>
                      </Link>
                      
                      <Link to="/ngos" className="dropdown-item" onClick={() => setDiscoverOpen(false)}>
                        <div className="dropdown-item__icon">
                          <span className="material-symbols-outlined">corporate_fare</span>
                        </div>
                        <div className="dropdown-item__text">
                          <p className="dropdown-item__title">NGOs</p>
                          <p className="dropdown-item__desc">Verified impact partner organizations</p>
                        </div>
                        <span className="material-symbols-outlined dropdown-item__arrow">arrow_forward</span>
                      </Link>
                      
                      <div className="nav-dropdown__footer">
                        <Link to="/donor/dashboard" className="dropdown-footer-link" onClick={() => setDiscoverOpen(false)}>
                          <span className="material-symbols-outlined">account_balance_wallet</span>
                          Track My Impact
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Leaderboard
              </NavLink>

              <NavLink 
                to={user?.role === 'ngo' ? '/ngo/dashboard' : user?.role === 'admin' ? '/admin' : '/donor/dashboard'} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Dashboard
              </NavLink>
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-cluster">
               <Link 
                 to={user?.role === 'ngo' ? '/ngo/dashboard' : user?.role === 'admin' ? '/admin' : '/donor/dashboard'}
                 className="nav-profile-link"
               >
                 <div className="avatar-sm">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="Avatar" />
                 </div>
                 <span className="nav-profile-name">{user?.name?.split(' ')[0]}</span>
               </Link>
               <button onClick={logout} className="nav-icon-btn nav-icon-btn--logout" title="Sign Out">
                 <span className="material-symbols-outlined">logout</span>
               </button>
            </div>
          ) : (
            <div className="nav-auth-cluster">
              <Link to="/login" className="nav-login-btn">
                Log In
              </Link>
              <Link to="/register" className="nav-cta-btn">
                Explore Platform
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
