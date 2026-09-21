interface StatCardProps { label: string; value: string | number; icon: string; tone: 'blue' | 'violet' | 'cyan' | 'green'; helper: string; trend?: string }

export default function StatCard({ label, value, icon, tone, helper, trend }: StatCardProps) {
  const displayedValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;
  return <article className="stat-card"><div className="stat-card-top"><div className={`stat-icon ${tone}`} aria-hidden="true">{icon}</div>{trend && <span className={`trend-up ${trend.startsWith('-') ? 'trend-down' : trend.startsWith('No') ? 'trend-neutral' : ''}`}>{trend}</span>}</div><div className="stat-copy"><span>{label}</span><strong>{displayedValue}</strong><small>{helper}</small></div></article>;
}
