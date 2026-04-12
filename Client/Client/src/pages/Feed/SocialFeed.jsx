import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import './SocialFeed.css';

import PostCard from '../../components/ui/PostCard';

export default function SocialFeed() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Feed state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('For You');
  
  // Sidebar data
  const [suggestedNgos, setSuggestedNgos] = useState([]);
  const [trendingCauses, setTrendingCauses] = useState([]);

  // Infinite Scroll Observer
  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Reset feed on filter change
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [activeFilter]);

  // Fetch posts when page changes
  useEffect(() => {
    fetchFeed();
  }, [page, activeFilter]);

  // Regular sidebar updates
  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchFeed = async () => {
    if (!hasMore && page !== 1) return;
    setLoading(true);
    try {
      let url = `/feed?page=${page}&limit=10&shuffle=${page === 1}`;
      if (activeFilter === 'Following') url += '&filter=following';
      if (activeFilter === 'Trending') url += '&filter=trending';
      const res = await API.get(url);
      const newPosts = res.data.posts || [];
      
      if (newPosts.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const filteredNew = newPosts.filter(p => !existingIds.has(p._id));
        
        if (filteredNew.length === 0 && newPosts.length < 10) {
           setHasMore(false);
        }
        
        return [...prev, ...filteredNew];
      });

      if (newPosts.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Feed load failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSidebarData = async () => {
    try {
      const [ngoRes, causeRes] = await Promise.all([
        API.get('/ngos/discover?limit=5'),
        API.get('/causes?limit=5')
      ]);
      setSuggestedNgos(ngoRes.data.ngos || []);
      setTrendingCauses(causeRes.data.causes || []);
    } catch (err) {
      console.error('Sidebar load failed', err);
    }
  };

  return (
    <div className="feed-view-container celestial-bg">
      <div className="container feed-grid">
        
        {/* Left Sidebar */}
        <aside className="feed-left-col">
          <div className="user-mini-card glass-panel">
            <div className="avatar-med">
               <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="Avatar" />
            </div>
            <h3 className="title-sm" style={{ textAlign: 'center' }}>{user?.name}</h3>
            <p className="label-xs text-primary" style={{ textAlign: 'center', marginTop: '4px', letterSpacing: '1px' }}>CELESTIAL RANK: GOLD</p>
            
            <div className="stats-grid">
               <div className="stat-item">
                  <span className="stat-value">{user?.following?.length || 0}</span>
                  <span className="stat-label">Following</span>
               </div>
               <div className="stat-item">
                  <span className="stat-value">{user?.donationHistory?.length || 0}</span>
                  <span className="stat-label">Donations</span>
               </div>
               <div className="stat-item">
                  <span className="stat-value">₹{user?.totalDonated || 0}</span>
                  <span className="stat-label">Impact</span>
               </div>
            </div>
          </div>

          <div className="feed-footer-links">
             <Link to="/privacy">Privacy</Link>
             <Link to="/terms">Terms</Link>
             <Link to="/ledger">Impact Ledger</Link>
             <p className="label-xs mt-4">DonerHQ © 2024</p>
          </div>
        </aside>

        {/* Center Main Feed */}
        <main className="feed-center-col">
          <header className="feed-filter-bar glass-panel">
             {['For You', 'Following', 'Trending'].map(f => (
               <button 
                 key={f} 
                 className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
                 onClick={() => setActiveFilter(f)}
               >
                 {f}
               </button>
             ))}
          </header>

          <div className="posts-stream">
            {posts.map((post, index) => (
              <div 
                key={post._id} 
                ref={posts.length === index + 1 ? lastPostElementRef : null}
              >
                <PostCard post={post} />
              </div>
            ))}
            
            {loading && (
              <div className="feed-loader">
                <div className="spinner"></div>
                <p className="label-sm mt-4 text-center">Loading more impact stories...</p>
              </div>
            )}
            
            {!hasMore && posts.length > 0 && (
              <div className="end-of-feed label-sm text-secondary text-center py-8">
                ✨ You've reached the end of the celestial ledger. Follow more NGOs to see more updates!
              </div>
            )}
          </div>
        </main>


        {/* Right Sidebar */}
        <aside className="feed-right-col">
          <section className="glass-panel right-section">
            <h3 className="label-sm mb-4" style={{ letterSpacing: '1px' }}>SUGGESTED FOR YOU</h3>
            <div className="sidebar-list">
              {suggestedNgos.map(ngo => (
                <div key={ngo._id} className="sidebar-item" onClick={() => navigate(`/ngos/${ngo._id}`)}>
                  <img 
                    src={ngo.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${ngo._id}`} 
                    className="sidebar-item-img" 
                    alt="" 
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${ngo._id}` }}
                  />
                  <div className="sidebar-item-info">
                    <span className="sidebar-item-name">{ngo.name}</span>
                    <span className="sidebar-item-sub">{ngo.category}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/explore" className="view-all-link label-xs">EXPLORE ALL NGOS</Link>
          </section>

          <section className="glass-panel right-section mt-4">
            <h3 className="label-sm mb-4" style={{ letterSpacing: '1px' }}>TRENDING CAUSES</h3>
            <div className="sidebar-list">
              {trendingCauses.map(cause => (
                <div key={cause._id} className="sidebar-item" onClick={() => navigate(`/causes/${cause._id}`)}>
                   <div className="pill-dot"></div>
                   <div className="sidebar-item-info">
                    <span className="sidebar-item-name">{cause.title}</span>
                    <span className="sidebar-item-sub impact-text">₹{cause.raisedAmount?.toLocaleString()} raised</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
}
