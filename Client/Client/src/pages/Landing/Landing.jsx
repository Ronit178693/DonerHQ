import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated } = useAuthStore();
  
  const causes = [
    {
      id: '1',
      title: "Digital Literacy for Rural Odisha",
      description: "Equipping 20 village schools with computers and high-speed internet for technical training.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyzl2QcPJyoLIPdJWN1L1LUg0rQVrqkiDVqn42nmboS0ewejYOK2yJc5BIM2-5NCFoTi2Sc-ZH0XCxrV0pFMIGQ0XHnZ1QB2KJIrNUtE61wFqWQvqZX7L57HQuyo1VlVLfTLAHzK6XdEjM1vFIZHC1dQrLQ_km-r5brigJ3wcHDJ7e6J2PltZ7Y85tf8a9eUvhnTo_AR8Zcjz4TpT_1F3R8c9I-ElXfDY5mgvaIfcHystr6BAnv7rPWeYv2fBNLVF6dEpiNsGdGfWL",
      category: "EDUCATION",
      raised: 845000,
      total: 1120000,
      donors: 342,
      percent: 75
    },
    {
      id: '2',
      title: "Clean Water Access: Thar Desert",
      description: "Building sustainable rainwater harvesting pits for 500 households in Rajasthan.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmBX6nQs8y5CMnrl39SONdQh4LiMdNLQLqnSkzNlCK8sPNt3xdgZQWRqL8k-GYGfnAh-n7pdYr2_U5CMEtigP_bUGHaSI-XYb5OQpFB6u-DUUfepANydCbOYZn26THPhBO9xP67HXSx2rsk9l0VsPS3bG9kMxVnRmiY3Aay_7nghGbMlh8jYZQUo2cepuGnosFvFH8M0hEWk8EbageN03XvxFxl4nbUPygn2K7L--wiJtcNgRhy_QA9vMX9-lsqyUVeIDAJAcdfLOw",
      category: "SUSTAINABILITY",
      raised: 1220000,
      total: 2900000,
      donors: 892,
      percent: 42
    },
    {
      id: '3',
      title: "Mobile Health Clinics: Slum Outreach",
      description: "Providing basic medical screening and generic medicines to urban slums in Bangalore.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDk3PR6q2MmOAGpKt0B3sa7fRAM_Zv5VoIsgzSOFtEP7nH8lNYZaQGJKm_dl_J_R0gfLzw1EwZLpVneL-6HvtpyeC73-i9Nto9a3dGTJh73HkCz61PrnXv-Jtw3pMh2X-pTLv59cCnpHeouWd5VsMGML8HLtU5-0_QMNqHHCMldsSucLgNzb367l8ngalvHSnVEDTZ1EnrBPDgITGrHnrosXX7sb7laRaDSzqeMQh0dONIokevLq5CsDQ9yrmx0fG1eNj2U7uo0740p",
      category: "HEALTHCARE",
      raised: 412000,
      total: 457000,
      donors: 1204,
      percent: 90
    }
  ];

  return (
    <main className="landing-page">
      {/* Hero Section */}
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
                <Link to="/causes" className="btn btn-glass btn-lg-padding">
                  View Causes
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

      {/* How It Works Section */}
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

      {/* Impact Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { val: '₹2.5Cr+', label: 'Total Funds Raised' },
            { val: '150+', label: 'Verified NGOs' },
            { val: '10K+', label: 'Individual Donors' },
            { val: '500+', label: 'Impact Videos' },
          ].map((stat, i) => (
            <div key={i} className="stat-item">
              <div className="stat-value font-headline">{stat.val}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
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

      {/* ══════════ ABOUT SECTION ══════════ */}
      <section className="about-section" id="about">
        <div className="about-container">
          <motion.div 
            className="section-header" 
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <label className="label-sm">Who We Are</label>
            <h2 className="display-md font-headline">
              Building India's Most <br/> <span className="text-gradient-primary">Transparent Donation Platform</span>
            </h2>
          </motion.div>

          <div className="about-grid">
            <motion.div 
              className="about-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="about-icon-box">
                <span className="material-symbols-outlined symbol-fill">visibility</span>
              </div>
              <h3>Radical Transparency</h3>
              <p>Every rupee is tracked, every milestone verified. Our escrow-based system ensures NGOs only receive funds when they deliver measurable impact — backed by video evidence and on-ground reports.</p>
            </motion.div>

            <motion.div 
              className="about-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="about-icon-box">
                <span className="material-symbols-outlined symbol-fill">group</span>
              </div>
              <h3>For Donors & NGOs</h3>
              <p>Whether you're a donor looking to maximize your social ROI, or an NGO seeking a credible platform to fundraise — DonerHQ is built for both. We bridge the trust gap between generosity and ground-level execution.</p>
            </motion.div>

            <motion.div 
              className="about-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="about-icon-box">
                <span className="material-symbols-outlined symbol-fill">rocket_launch</span>
              </div>
              <h3>Built for Scale</h3>
              <p>From a single school in rural Odisha to clean water access for an entire district — DonerHQ's infrastructure supports causes at every scale, powered by real-time analytics and community-driven accountability.</p>
            </motion.div>
          </div>

          <motion.div 
            className="about-mission-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="mission-quote">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '2rem' }}>format_quote</span>
              <blockquote>
                "We believe that charitable giving should be as transparent and accountable as any financial investment. DonerHQ exists to make that a reality for every Indian donor."
              </blockquote>
              <p className="mission-author">— DonerHQ Founding Team</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ CONTACT SECTION ══════════ */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <motion.div 
            className="section-header" 
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <label className="label-sm">Get In Touch</label>
            <h2 className="display-md font-headline">
              Let's Build <span className="text-gradient-primary">Impact Together</span>
            </h2>
          </motion.div>

          <div className="contact-grid">
            <motion.div 
              className="contact-info-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="contact-item">
                <div className="contact-icon"><span className="material-symbols-outlined symbol-fill">mail</span></div>
                <div>
                  <h4>Email Us</h4>
                  <p>hello@donerhq.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><span className="material-symbols-outlined symbol-fill">location_on</span></div>
                <div>
                  <h4>Headquarters</h4>
                  <p>Bangalore, India</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><span className="material-symbols-outlined symbol-fill">schedule</span></div>
                <div>
                  <h4>Working Hours</h4>
                  <p>Mon – Fri, 9AM – 6PM IST</p>
                </div>
              </div>
            </motion.div>

            <motion.form 
              className="contact-form glass-panel"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="form-row">
                <input type="text" placeholder="Your Name" className="form-input" />
                <input type="email" placeholder="Your Email" className="form-input" />
              </div>
              <input type="text" placeholder="Subject" className="form-input" />
              <textarea placeholder="Your Message" rows={5} className="form-input form-textarea"></textarea>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                Send Message
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Final CTA — Pruned if Authenticated */}
      {!isAuthenticated && (
        <section className="final-cta-section">
          <div className="cta-card">
            <h2 className="title-lg font-headline" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Ready to make a <span className="text-gradient-primary">verifiable difference?</span></h2>
            <p className="body-lg text-on-surface-variant" style={{ maxWidth: '40rem', margin: '0 auto 2.5rem' }}>Join 10,000+ donors who are changing lives through India's most transparent donation platform.</p>
            <div className="hero-cta-group" style={{ gap: '1.5rem' }}>
              <Link to="/register" className="btn btn-primary">Create Impact Account</Link>
              <Link to="/register?role=ngo" className="btn btn-glass">Register as NGO</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
