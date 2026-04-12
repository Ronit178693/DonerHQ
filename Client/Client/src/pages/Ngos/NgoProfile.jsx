import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Users, Award, ExternalLink, Globe, Heart, Share2, Calendar, ShieldCheck } from 'lucide-react';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import CauseCard from '../../components/ui/CauseCard';
import '../../components/ui/CauseCard.css';

import PostCard from '../../components/ui/PostCard';

export default function NgoProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ngo, setNgo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ngoRes, postsRes] = await Promise.all([
          API.get(`/ngos/${id}`),
          API.get(`/ngos/${id}/posts`)
        ]);
        const ngoData = ngoRes.data.ngo;
        setNgo(ngoData);
        setLocalFollowerCount(ngoData?.followerCount || 0);
        setPosts(postsRes.data.posts || []);

        // Check if user is already following this NGO
        if (user?.following?.includes(id)) {
          setIsFollowing(true);
        }
      } catch (err) {
        console.error('Error loading NGO profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await API.post(`/ngos/${id}/unfollow`);
        setIsFollowing(false);
        setLocalFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await API.post(`/ngos/${id}/follow`);
        setIsFollowing(true);
        setLocalFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err.response?.data || err);
    }
    setFollowLoading(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '3px solid var(--color-surface-container-highest)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
    </div>
  );

  if (!ngo) return (
    <div className="container section" style={{ textAlign: 'center', py: '10rem' }}>
      <h2 className="display-md">NGO Not Found</h2>
      <Link to="/discover" className="btn btn-primary" style={{ mt: '2rem' }}>Back to Discovery</Link>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', color: 'var(--color-on-surface)' }}>
      {/* Dynamic Background */}
      <div className="celestial-bg" style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.4 }} />

      {/* Hero Header */}
      <section style={{ position: 'relative', paddingTop: '8rem', paddingBottom: '4rem', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Logo Sphere */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel ambient-glow" 
              style={{ 
                width: 220, 
                height: 220, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                border: '2px solid var(--color-primary)',
                padding: '1rem'
              }}
            >
              {ngo.logo ? (
                <img src={ngo.logo} alt={ngo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span className="display-lg" style={{ color: 'var(--color-primary)' }}>{ngo.name?.charAt(0)}</span>
              )}
            </motion.div>

            {/* Title & Category */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
                 <span className="label-md" style={{ color: 'var(--color-primary)', letterSpacing: '0.2em' }}>VERIFIED_LEDGER_ENTITY</span>
                 <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h1 className="display-lg" style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{ngo.name}</h1>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <span className="body-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-on-surface-variant)' }}>
                  <MapPin size={20} /> {ngo.location}
                </span>
                <span className="body-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-on-surface-variant)' }}>
                  <Award size={20} /> {ngo.category}
                </span>
              </div>
            </div>

            {/* Hero Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
               <button 
                 className={`btn ${isFollowing ? 'btn-glass' : 'btn-primary primary-glow'}`}
                 style={{ 
                   padding: '1rem 2rem', 
                   borderRadius: '1rem',
                   background: isFollowing ? 'rgba(76, 175, 80, 0.15)' : undefined,
                   borderColor: isFollowing ? '#4CAF50' : undefined,
                   color: isFollowing ? '#4CAF50' : undefined,
                   opacity: followLoading ? 0.7 : 1
                 }}
                 onClick={handleFollow}
                 disabled={followLoading}
               >
                 <Heart size={20} style={{ marginRight: '0.75rem', fill: isFollowing ? '#4CAF50' : 'none' }} />
                 {followLoading ? 'Processing...' : isFollowing ? 'Following' : 'Follow NGO'}
               </button>
               <button className="btn btn-glass" style={{ padding: '1rem', borderRadius: '1rem' }} onClick={() => window.open(ngo.website || '#', '_blank')}>
                 <Globe size={24} />
               </button>
               <button className="btn btn-glass" style={{ padding: '1rem', borderRadius: '1rem' }}>
                 <Share2 size={24} />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="container" style={{ position: 'relative', zIndex: 1, pb: '10rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', alignItems: 'start' }}>
          
          {/* Left Column: Feed & Info */}
          <div className="profile-main-stack">
            {/* Premium Tab Bar */}
            <div style={{ 
              display: 'flex', 
              gap: '4rem', 
              borderBottom: '1px solid var(--color-outline-variant)', 
              marginBottom: '3.5rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {['causes', 'posts', 'about'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    padding: '1.2rem 0', 
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                    borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'causes' && (
                <motion.div key="causes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    {ngo.causes?.length > 0 ? (
                      ngo.causes.map((cause, i) => (
                        <CauseCard key={cause._id || i} cause={cause} index={i} />
                      ))
                    ) : (
                      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '2rem' }}>
                        <p className="body-lg text-muted">No active fundraising causes at the moment.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'posts' && (
                <motion.div key="posts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {posts.length > 0 ? (
                      posts.map((post, i) => (
                        <PostCard key={post._id || i} post={post} />
                      ))
                    ) : (
                      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '2rem' }}>
                        <p className="body-lg text-muted">No social updates posted yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

               {activeTab === 'about' && (
                <motion.div key="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '1.2rem', textAlign: 'left' }}>
                        <div className="label-sm font-bold" style={{ opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>TOTAL RAISED</div>
                        <div className="title-md" style={{ color: 'var(--color-primary)', fontWeight: 800 }}>₹{(ngo.totalRaised || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '1.2rem', textAlign: 'left' }}>
                        <div className="label-sm font-bold" style={{ opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>ACTIVE CAUSES</div>
                        <div className="title-md" style={{ fontWeight: 800 }}>{ngo.causes?.length || 0}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '1.2rem', textAlign: 'left' }}>
                        <div className="label-sm font-bold" style={{ opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>COMMUNITY FOLLOWERS</div>
                        <div className="title-md" style={{ fontWeight: 800 }}>{localFollowerCount}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '1.2rem', textAlign: 'left' }}>
                        <div className="label-sm font-bold" style={{ opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>TRANSPARENCY SCORE</div>
                        <div className="title-md" style={{ color: 'var(--color-secondary)', fontWeight: 800 }}>{ngo.transparencyScore || 0}%</div>
                      </div>
                   </div>

                   <div className="glass-panel" style={{ padding: '4rem', borderRadius: '2.5rem' }}>
                      <h3 className="title-lg font-headline" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '3rem', height: '2px', background: 'var(--color-primary)' }} />
                        Our Mission
                      </h3>
                      <div className="about-bio-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {(ngo.bio || 'The mission statement for this organization has not been provided yet.').split('\n').filter(p => p.trim()).map((para, i) => (
                          <p key={i} className="body-lg" style={{ lineHeight: 1.9, color: 'var(--color-on-surface-variant)', fontSize: '1.1rem' }}>
                            {para}
                          </p>
                        ))}
                      </div>
                      
                      <div style={{ marginTop: '5rem' }}>
                        <h3 className="title-md font-headline" style={{ marginBottom: '2rem' }}>Entity Registry Info</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                           {[
                             { label: 'Official Charter Name', value: ngo.name },
                             { label: 'Operational Base', value: ngo.location },
                             { label: 'Core Category', value: ngo.category },
                             { label: '80G Status', value: ngo.doc80G ? 'Verified Certificate Active' : 'Not Provided' },
                             { label: 'FCRA Status', value: ngo.docFCRA ? 'International Funding Eligible' : 'Domestic Only' }
                           ].map((item, idx) => (
                             <div key={idx} style={{ 
                               display: 'flex', 
                               justifyContent: 'space-between', 
                               padding: '1.5rem', 
                               background: 'var(--color-surface-container-low)', 
                               borderRadius: '1.2rem',
                               border: '1px solid var(--color-outline-variant)'
                             }}>
                                <span className="body-md" style={{ opacity: 0.7 }}>{item.label}</span>
                                <span className="body-md" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.value}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
