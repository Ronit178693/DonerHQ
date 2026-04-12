import { Link } from 'react-router-dom';
import './CauseCard.css';

export default function CauseCard({ cause }) {
  const percent = Math.min(Math.round((cause.raisedAmount / cause.goalAmount) * 100), 100);

  return (
    <div className="cause-card">
        <div className="card-image-box">
        <img 
          src={cause.coverImage || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2670&auto=format&fit=crop"} 
          alt={cause.title} 
        />
        <div className="category-tag">
          {cause.category || 'IMPACT'}
        </div>
      </div>
      <div className="card-body">
        <h3 className="card-title font-headline">{cause.title}</h3>
        <div className="ngo-meta">
          <span>{cause.ngoId?.name || 'Verified NGO'}</span>
          <span className="material-symbols-outlined text-primary symbol-fill" style={{ fontSize: '16px' }}>verified</span>
        </div>
        
        <div className="card-progress-section">
          <div className="progress-header">
            <span style={{ color: 'var(--color-on-surface-variant)' }}>₹{cause.raisedAmount?.toLocaleString('en-IN')} raised</span>
            <span className="text-primary">{percent}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-fill" style={{ width: `${percent}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--color-outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Goal: ₹{cause.goalAmount?.toLocaleString('en-IN')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
              <span>{cause.donorCount || 0} donors</span>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <Link 
            to={`/causes/${cause._id}`}
            className="btn btn-primary btn-donate-sm"
          >
            Donate Now
          </Link>
        </div>
      </div>
    </div>
  );
}
