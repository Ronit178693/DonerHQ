/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENT: UserNodes — Platform user listing table
   ═══════════════════════════════════════════════════════════ */
export default function UserNodes({ items }) {
  return (
    <div className="escrow-table-container glass-panel">
       <table className="admin-table">
        <thead>
          <tr>
            <th>User Identity</th>
            <th>Role Node</th>
            <th>Contribution Level</th>
            <th>Joined Protocol</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u._id}>
              <td>
                <div className="font-bold">{u.name}</div>
                <div className="body-xs text-muted">{u.email}</div>
              </td>
              <td><span className={`badge-role ${u.role}`} style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '10px' }}>{u.role.toUpperCase()}</span></td>
              <td>{(u.leaderboardScore || 0).toLocaleString()} UNITS</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
