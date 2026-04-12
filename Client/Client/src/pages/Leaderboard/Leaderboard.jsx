import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './Leaderboard.css';

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/users/leaderboard')
      .then(res => setData(res.data.leaderboard || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <main className="leaderboard-view celestial-bg">
      <div className="container">
        <header className="leaderboard-hero">
           <label className="label-sm text-primary">PRECISION RANKING PROTOCOL</label>
           <h1 className="display-md font-headline">Celestial Leaderboard</h1>
           <p className="body-lg text-muted" style={{ maxWidth: '44rem', margin: '1rem auto 0' }}>
              Ranking the highest-performing donor nodes by verified capital throughput and ground-impact multipliers.
           </p>
        </header>

        {loading ? (
             <div className="loader-box"><div className="spinner"></div></div>
        ) : (
          <div className="ranking-stage">
             {/* Podium Display */}
             <section className="podium-display">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="podium-node rank-2">
                     <div className="node-avatar-box silver-glow">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${topThree[1].name}`} alt="" />
                        <div className="rank-tag">02</div>
                     </div>
                     <div className="node-info">
                        <h3 className="title-sm">{topThree[1].name}</h3>
                        <p className="impact-val">₹{topThree[1].totalDonated?.toLocaleString('en-IN')}</p>
                        <span className="label-xs text-muted">VERIFIED THROUGHPUT</span>
                     </div>
                  </div>
                )}
                
                {/* 1st Place */}
                {topThree[0] && (
                  <div className="podium-node rank-1">
                     <div className="node-avatar-box gold-glow">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${topThree[0].name}`} alt="" />
                        <div className="rank-tag gold">01</div>
                        <div className="crown-icon">
                           <span className="material-symbols-outlined">military_tech</span>
                        </div>
                     </div>
                     <div className="node-info">
                        <h2 className="title-md">{topThree[0].name}</h2>
                        <p className="impact-val gold-text">₹{topThree[0].totalDonated?.toLocaleString('en-IN')}</p>
                        <span className="label-xs text-primary">PLATINUM NODE STATUS</span>
                     </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="podium-node rank-3">
                     <div className="node-avatar-box bronze-glow">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${topThree[2].name}`} alt="" />
                        <div className="rank-tag">03</div>
                     </div>
                     <div className="node-info">
                        <h3 className="title-sm">{topThree[2].name}</h3>
                        <p className="impact-val">₹{topThree[2].totalDonated?.toLocaleString('en-IN')}</p>
                        <span className="label-xs text-muted">VERIFIED THROUGHPUT</span>
                     </div>
                  </div>
                )}
             </section>

             {/* Expanded Ranking */}
             <div className="expanded-rank-list glass-panel">
                <table className="rank-table">
                   <thead>
                      <tr>
                         <th>RANK</th>
                         <th>DONOR IDENTITY</th>
                         <th>STATUS</th>
                         <th>VERIFIED CAPITAL</th>
                      </tr>
                   </thead>
                   <tbody>
                      {others.map((donor, i) => (
                        <tr key={i} className="rank-row">
                           <td className="rank-num">#{(i + 4).toString().padStart(2, '0')}</td>
                           <td>
                              <div className="donor-cell">
                                 <div className="donor-pfp">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${donor.name}`} alt="" />
                                 </div>
                                 <span className="font-bold">{donor.name}</span>
                              </div>
                           </td>
                           <td><span className="node-status-chip">ACTIVE NODE</span></td>
                           <td className="capital-cell font-headline">₹{donor.totalDonated?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
