import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   SECTION: Hero — Main headline, CTAs, and real-time ticker
   ═══════════════════════════════════════════════════════════ */
export default function HeroSection({ isAuthenticated }) {
  return (
    <section className="hero-section">
      <div className="hero-glow"></div>
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <label className="label-sm">The Precision Impact Ledger</label>
        <h1 className="hero-headline font-headline">
          Where Every Rupee <br/> <span className="text-gradient-primary font-headline">Tells a Story</span>
        </h1>
        
        <div className="hero-cta-group">
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="btn btn-primary btn-lg-padding">
                Start Giving
              </Link>
            </>
          ) : (
            <Link to="/causes" className="btn btn-primary btn-lg-padding">
              Explore Active Missions
            </Link>
          )}
        </div>

        <div className="hero-stats-row">
          {['verified_user', 'shield', 'videocam'].map((icon, i) => (
            <div key={icon} className="stat-chip">
              <span className="material-symbols-outlined text-primary symbol-fill">{icon}</span>
              <span className="label-xs font-bold font-label text-on-surface-variant">
                {['100% Transparent', 'Escrow Protected', 'Video Verified'][i]}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Real-time Ticker */}
      <div className="impact-ticker">
        <div className="ticker-track animate-marquee">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ticker-item">
              <div className="ticker-dot"></div>
              <span>RECENT IMPACT: Rahul donated <span className="text-primary font-bold">₹5,000</span> to Rural Education Fund</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
