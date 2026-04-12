import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-glow" />
      <div className="notfound-content">
        <span className="material-symbols-outlined notfound-icon">explore_off</span>
        <h1 className="notfound-code font-headline">404</h1>
        <h2 className="notfound-title font-headline">Signal Lost</h2>
        <p className="notfound-desc">
          The node you requested could not be located in the DonerHQ network.
          The mission may have been archived or the coordinates are invalid.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            <span className="material-symbols-outlined">home</span>
            Return to Base
          </Link>
          <Link to="/causes" className="notfound-btn notfound-btn--ghost">
            <span className="material-symbols-outlined">explore</span>
            Browse Missions
          </Link>
        </div>
      </div>
    </div>
  );
}
