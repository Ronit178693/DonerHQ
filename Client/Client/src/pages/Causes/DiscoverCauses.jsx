import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import CauseCard from '../../components/ui/CauseCard';
import './DiscoverCauses.css';

export default function DiscoverCauses() {
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    API.get('/causes')
      .then(res => setCauses(res.data.causes || []))
      .catch(() => setCauses([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Sustainability', 'Rural Dev'];
  const filteredCauses = filter === 'All' ? causes : causes.filter(c => c.category === filter);

  return (
    <main className="discover-page">
      <div className="container">
      {/* Header & Search */}
      <section className="discover-header">
        <div className="header-top">
          <div className="header-text">
            <h1>Explore Causes</h1>
            <p>Allocating capital to high-integrity global impact nodes. Transparency starts with verified ground data.</p>
          </div>
          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              className="search-input" 
              placeholder="Search causes, NGOs, or identifiers..." 
              type="text"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="filters-row">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="main-content-split">
        {/* Main Grid */}
        <div className="causes-grid-column">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
              <div style={{ width: '3rem', height: '3rem', border: '4px solid rgba(185,255,232,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredCauses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--color-surface-container-low)', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-outline)', marginBottom: '1rem' }}>search_off</span>
              <h3 className="title-md" style={{ marginBottom: '0.5rem' }}>No causes found</h3>
              <p style={{ color: 'var(--color-on-surface-variant)' }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
              {filteredCauses.map((cause, i) => (
                <motion.div
                  key={cause._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CauseCard cause={cause} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Trending Causes */}
        <aside className="sidebar-column">
          <div className="sticky-sidebar">
            <div>
               <div className="sidebar-section-title">
                  <h2>Trending</h2>
                  <span className="material-symbols-outlined trending-icon">trending_up</span>
               </div>
               
               <div className="trending-list">
                 {causes.slice(0, 3).map((cause, i) => (
                   <Link 
                     key={i} 
                     to={`/causes/${cause._id}`}
                     className="trending-card glass-panel"
                   >
                     <div className="trending-thumb">
                       <img src={cause.coverImage} alt={cause.title} />
                     </div>
                     <div className="trending-info">
                       <h4 className="font-headline">{cause.title}</h4>
                       <div className="progress-bar-container" style={{ height: '4px', background: 'var(--color-surface-container-highest)', borderRadius: '2px', overflow: 'hidden' }}>
                         <div className="bg-gradient-primary" style={{ height: '100%', width: `${Math.min((cause.raisedAmount / cause.goalAmount) * 100, 100)}%` }}></div>
                       </div>
                       <p style={{ fontSize: '0.625rem', color: 'var(--color-outline)', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                         {Math.min(Math.round((cause.raisedAmount / cause.goalAmount) * 100), 100)}% FUNDED
                       </p>
                     </div>
                   </Link>
                 ))}
               </div>
            </div>

            {/* Side Promo Card */}
            <div className="sidebar-promo glass-panel">
               <h3 className="font-headline">Impact Node</h3>
               <p>Set up a recurring node to automate your impact across the highest-performing verified causes.</p>
               <button className="label-sm" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(8px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                  Initialize Node <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
               </button>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </main>
  );
}
