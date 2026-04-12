import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, Target, Crown } from 'lucide-react';
import API from '../../api/axios';
import '../Dashboard/Dashboard.css';

export default function TeamDashboard() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/teams/${id || 'my'}`)
      .then(res => setTeam(res.data.team))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [id]);

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  if (loading) return <div className="container section"><p>Loading team...</p></div>;
  if (!team) return (
    <div className="dashboard">
      <div className="container">
        <div className="empty-state" style={{ paddingTop: 'var(--space-16)' }}>
          <Users size={48} style={{ color: 'var(--outline)', marginBottom: 'var(--space-4)' }} />
          <h3>No Team Found</h3>
          <p>Join or create a team to collaborate with fellow donors.</p>
        </div>
      </div>
    </div>
  );

  const stats = [
    { icon: <Users size={20} />, value: team.members?.length || 0, label: 'Members' },
    { icon: <Trophy size={20} />, value: team.totalScore || 0, label: 'Team Score' },
    { icon: <Target size={20} />, value: `₹${(team.totalDonated || 0).toLocaleString('en-IN')}`, label: 'Total Donated' },
    { icon: <Crown size={20} />, value: `#${team.rank || '—'}`, label: 'Rank' },
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="dashboard-header">
            <div className="dashboard-header__left">
              <span className="label-md text-primary"><Users size={14} /> Team Dashboard</span>
              <h1>{team.name}</h1>
              <p className="body-md text-muted">{team.description || 'United for impact.'}</p>
            </div>
          </div>

          <div className="dashboard-stats">
            {stats.map((s, i) => (
              <motion.div className="dashboard-stat-card" key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <div className="stat-icon">{s.icon}</div>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="dashboard-section">
            <h2>Team Members</h2>
            {team.members && team.members.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr><th>Member</th><th>Role</th><th>Score</th><th>Donations</th></tr>
                </thead>
                <tbody>
                  {team.members.map((m, i) => (
                    <tr key={m._id || i}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--secondary), var(--tertiary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6875rem', fontWeight: 700, color: 'var(--on-primary)', flexShrink: 0
                        }}>{getInitials(m.userId?.name || m.name)}</div>
                        <span>{m.userId?.name || m.name || 'Member'}</span>
                      </td>
                      <td><span className={`badge ${m.role === 'captain' ? 'badge-primary' : 'badge-secondary'}`}>{m.role || 'member'}</span></td>
                      <td className="text-primary" style={{ fontWeight: 600 }}>{m.userId?.leaderboardScore || 0}</td>
                      <td className="text-muted">{m.userId?.donationHistory?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><p>No members yet.</p></div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
