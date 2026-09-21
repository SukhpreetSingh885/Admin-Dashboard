import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const groups = [
  { heading: 'MAIN', items: [{ to: '/', icon: '⌂', label: 'Dashboard' }] },
 {
  heading: 'ACADEMY',
  items: [
    { to: '/courses', icon: '▣', label: 'Courses' },
    { to: '/lessons', icon: '▷', label: 'Lessons' },
    { to: '/students', icon: '♙', label: 'Students' },
    { to: '/enrollments', icon: '↗', label: 'Enrollments' },
    { to: '/payments', icon: '₹', label: 'Payments' },
    { to: '/progress', icon: '◫', label: 'Progress' },
  ],
},
  { heading: 'SYSTEM', items: [{ to: '/settings', icon: '⚙', label: 'Settings' }] },
];

export default function Sidebar({ open, collapsed, onClose, onCollapse }: { open: boolean; collapsed: boolean; onClose: () => void; onCollapse: () => void }) {
  const { logout } = useAuth(); const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  return <>
    <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand"><div className="brand-mark">V</div><div className="brand-copy"><strong>Viralstan</strong><span>ACADEMY</span></div><button className="mobile-sidebar-close" onClick={onClose} aria-label="Close navigation">×</button></div>
      <button className="sidebar-collapse" onClick={onCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? '›' : '‹'}<span>{collapsed ? '' : 'Collapse menu'}</span></button>
      <nav className="sidebar-nav" aria-label="Main navigation">{groups.map((group) => <div className="nav-group" key={group.heading}><p className="workspace-label">{group.heading}</p>{group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose} title={item.label}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span className="nav-label">{item.label}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-footer"><button className="side-link logout" onClick={signOut} title="Logout"><span className="nav-icon" aria-hidden="true">↪</span><span className="nav-label">Logout</span></button><div className="academy-card"><span>VA</span><div><strong>Viralstan Academy</strong><small>Admin workspace</small></div></div></div>
    </aside>{open && <button className="sidebar-overlay" onClick={onClose} aria-label="Close navigation" />}
  </>;
}
