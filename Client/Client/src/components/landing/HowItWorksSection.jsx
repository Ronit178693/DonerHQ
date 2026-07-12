import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   SECTION: HowItWorks — 3-step explainer + Featured Causes
   ═══════════════════════════════════════════════════════════ */
export default function HowItWorksSection({ causes }) {
  return (
    <>
      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="section-header">
          <label className="label-sm">Architecture of Philanthropy</label>
          <h2 className="display-md">How the Ledger <br/> <span className="text-primary font-headline">Secures Your Impact</span></h2>
        </div>
        <div className="features-grid">
          {[
            { icon: 'search', title: 'Find a Cause', text: 'Explore our vetted database of high-impact NGOs across India, verified with real-time on-ground data.', fill: 0 },
            { icon: 'lock', title: 'Donate Securely', text: 'Funds are held in an escrow ledger and only released once the NGO provides evidence of the specific task execution.', fill: 1 },
            { icon: 'visibility', title: 'Watch Your Impact', text: 'Receive personalized video updates and blockchain-verifiable reports showing exactly how your donation was utilized.', fill: 1 },
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="feature-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="feature-icon-box">
                <span className={`material-symbols-outlined text-primary text-3xl ${item.fill ? 'symbol-fill' : ''}`}>{item.icon}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Causes */}
      <section className="how-it-works-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
          <div>
            <label className="label-sm">Urgent Missions</label>
            <h2 className="display-md font-headline">Featured Causes</h2>
          </div>
          <Link to="/causes" className="text-primary font-bold hover-underline">Browse All Campaigns →</Link>
        </div>
        <div className="features-grid">
          {causes.map((cause, i) => (
            <motion.div key={i} className="cause-card-container" whileHover={{ y: -10 }}>
              <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '250px' }}>
                  <img src={cause.image} alt={cause.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="label-sm" style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>{cause.category}</div>
                </div>
                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                   <h3 className="title-md" style={{ marginBottom: '1rem' }}>{cause.title}</h3>
                   <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '2rem', flex: 1 }}>{cause.description}</p>
                   <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                         <span>₹{cause.raised.toLocaleString('en-IN')} raised</span>
                         <span className="text-primary">{cause.percent}%</span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: '6px', background: 'var(--color-surface-container-highest)', borderRadius: '3px', overflow: 'hidden' }}>
                         <div className="bg-gradient-primary" style={{ height: '100%', width: `${cause.percent}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
                         <span className="label-xs text-on-surface-variant font-bold">{cause.donors.toLocaleString()} Donors</span>
                         <Link to={`/causes/${cause.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Donate Now</Link>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
