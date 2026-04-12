import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function NgoCard({ ngo, index = 0 }) {
  return (
    <motion.div
      className="card ngo-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div className="ngo-card__header">
        <div className="ngo-card__logo">
          {ngo.logo
            ? <img src={ngo.logo} alt={ngo.name} />
            : <span>{ngo.name?.charAt(0)}</span>
          }
        </div>
        <div>
          <h3 className="title-md" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {ngo.name}
            {ngo.verified && <CheckCircle size={16} style={{ color: 'var(--primary)' }} />}
          </h3>
          <p className="body-sm text-muted">{ngo.location}</p>
        </div>
      </div>
      <p className="body-sm text-muted" style={{ margin: '0.75rem 0' }}>
        {ngo.bio?.slice(0, 120)}...
      </p>
      <div className="ngo-card__meta">
        <div className="stat">
          <span className="stat-value" style={{ fontSize: '1.25rem' }}>
            ₹{(ngo.totalRaised || 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Raised</span>
        </div>
        <div className="stat">
          <span className="stat-value" style={{ fontSize: '1.25rem' }}>
            {ngo.transparencyScore || 0}%
          </span>
          <span className="stat-label">Trust Score</span>
        </div>
      </div>
      <Link to={`/ngos/${ngo._id}`} className="btn btn-sm btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>
        View Profile
      </Link>
    </motion.div>
  );
}
