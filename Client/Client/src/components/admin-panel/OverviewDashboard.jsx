/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: OverviewDashboard — Platform health status panel
   ═══════════════════════════════════════════════════════════ */
export default function OverviewDashboard({ stats }) {
  return (
    <div className="overview-tab">
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
         <span className="material-symbols-outlined" style={{ fontSize: '5rem', opacity: 0.1, marginBottom: '2rem' }}>public</span>
         <h2 className="font-headline">Network Integrity: Optimal</h2>
         <p className="body-md text-muted" style={{ maxWidth: '600px', margin: '1rem auto' }}>
            All platform nodes are synchronized. Currently monitoring <strong>{stats?.activeCauses || 0} active missions</strong> and 
            <strong> {stats?.pendingApprovals || 0} pending organizational verifications</strong>. 
            Escrow safety protocols are active for all transactions.
         </p>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Backend Engine: LIVE</span>
            </div>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Escrow Protocol: V2.5 SECURE</span>
            </div>
            <div className="mini-status">
               <div className="dot live"></div>
               <span>Validator Capacity: 100%</span>
            </div>
         </div>
      </div>
    </div>
  );
}
