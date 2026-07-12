/* ═══════════════════════════════════════════════════════════
   SECTION: Stats — Platform impact statistics row
   ═══════════════════════════════════════════════════════════ */
export default function StatsSection() {
  const stats = [
    { val: '₹2.5Cr+', label: 'Total Funds Raised' },
    { val: '150+', label: 'Verified NGOs' },
    { val: '10K+', label: 'Individual Donors' },
    { val: '500+', label: 'Impact Videos' },
  ];

  return (
    <section className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-item">
            <div className="stat-value font-headline">{stat.val}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
