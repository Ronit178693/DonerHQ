import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="slim-footer">
      <div className="container footer-flex">
        {/* Brand & Sync Status */}
        <div className="footer-left">
          <Link to="/" className="footer-logo-slim">DonerHQ</Link>
          <div className="sync-pill">
            <div className="pulse-dot"></div>
            <span>LIVE</span>
          </div>
        </div>



        {/* Rights & Socials */}
        <div className="footer-right">
          <span className="copyright-text">© 2026 DonerHQ</span>
          <div className="footer-socials">
            {['public', 'hub', 'mail'].map((icon, i) => (
              <a key={i} href="#" className="social-mini-link">
                <span className="material-symbols-outlined">{icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
