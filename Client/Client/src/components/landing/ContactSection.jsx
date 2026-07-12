import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   SECTION: Contact — About blurb, contact info, and form
   ═══════════════════════════════════════════════════════════ */
export default function ContactSection({ isAuthenticated }) {
  return (
    <>
      {/* About Section */}
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
              <h3>For Donors &amp; NGOs</h3>
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

      {/* Contact Section */}
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
    </>
  );
}
