import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import './DiscoverNgos.css';

export default function DiscoverNgos() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.append('category', activeCategory);
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    params.append('limit', '50');

    setLoading(true);
    API.get(`/ngos/discover?${params.toString()}`)
      .then(res => setNgos(res.data.ngos || []))
      .catch(err => console.error('Discover fetch failed:', err))
      .finally(() => setLoading(false));
  }, [activeCategory, searchTerm]);

  const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Animal Welfare', 'Social Equality', 'Disaster Relief', 'Sustainability'];

  return (
    <main className="discover-ngo-page celestial-bg">
      <div className="container">
        <header className="discover-header">
           <label className="label-sm text-primary">ORGANIZATIONAL ECOSYSTEM</label>
           <h1 className="display-md font-headline">Impact Entities</h1>
           <p className="body-lg text-muted" style={{ maxWidth: '44rem' }}>
              Interface with our verified organizational network. Every entity listed has passed the 3-tier ground verification audit.
           </p>

           <div className="search-filter-stack">
              <div className="search-box glass-panel">
                 <span className="material-symbols-outlined">search</span>
                 <input 
                   placeholder="Search by name or mission..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              
              <div className="filter-chips">
                 {categories.map(cat => (
                   <button 
                     key={cat} 
                     className={`chip ${activeCategory === cat ? 'active' : ''}`}
                     onClick={() => setActiveCategory(cat)}
                   >
                     {cat}
                   </button>
                 ))}
              </div>
           </div>
        </header>

        {loading ? (
           <div className="loader-box"><div className="spinner"></div></div>
        ) : ngos.length === 0 ? (
           <div className="loader-box" style={{ flexDirection: 'column', gap: '1rem' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2 }}>search_off</span>
             <p className="body-lg text-muted">No organizations found matching your criteria.</p>
           </div>
        ) : (
          <div className="ngos-grid-modern">
            {ngos.map((ngo, i) => (
              <Link key={ngo._id || i} to={`/ngos/${ngo._id}`} className="ngo-modern-card glass-panel">
                <div className="ngo-rank-badge gold">
                   <span className="material-symbols-outlined">military_tech</span>
                   {ngo.verified ? 'VERIFIED' : 'PENDING'}
                </div>
                
                <div className="ngo-header">
                   <div className="ngo-avatar">
                      <img 
                        src={ngo.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${ngo.name}`} 
                        alt={ngo.name}
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${ngo.name}` }}
                      />
                   </div>
                   <div className="ngo-title">
                      <h3 className="title-sm">{ngo.name}</h3>
                      <p className="label-xs text-primary">{ngo.category || 'GLOBAL MISSION'}</p>
                   </div>
                </div>

                <p className="ngo-bio body-sm text-muted">
                  {(ngo.bio || 'Verified impact organization committed to creating sustainable change.').substring(0, 100)}...
                </p>

                <div className="ngo-metrics">
                   <div className="metric">
                      <span className="val">₹{(ngo.totalRaised || 0).toLocaleString('en-IN')}</span>
                      <span className="lab">RAISED</span>
                   </div>
                   <div className="metric">
                      <span className="val">{ngo.followerCount || 0}</span>
                      <span className="lab">FOLLOWERS</span>
                   </div>
                   <div className="metric">
                      <span className="val">{ngo.transparencyScore || 0}%</span>
                      <span className="lab">TRUST</span>
                   </div>
                </div>

                <button className="btn btn-glass btn-full mt-4">View Profile</button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
