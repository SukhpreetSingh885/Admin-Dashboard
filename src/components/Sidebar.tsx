import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ShellIcon from './ShellIcon';
import academyLogo from '../../assets/images/logo.png';

const groups = [
  { heading: 'Overview', items: [{ to: '/', icon: 'dashboard' as const, label: 'Dashboard' }] },
  { heading: 'Academy', items: [
    { to: '/courses', icon: 'courses' as const, label: 'Courses' },
    { to: '/lessons', icon: 'lessons' as const, label: 'Lessons' },
    { to: '/students', icon: 'students' as const, label: 'Students' },
    { to: '/enrollments', icon: 'enrollments' as const, label: 'Enrollments' },
    { to: '/payments', icon: 'payments' as const, label: 'Payments' },
    { to: '/withdrawals', icon: 'withdrawals' as const, label: 'Withdrawals' },
    { to: '/progress', icon: 'progress' as const, label: 'Progress' },
  ] },
  { heading: 'Workspace', items: [
    { to: '/settings', icon: 'settings' as const, label: 'Settings' },
    { to: '/security', icon: 'security' as const, label: 'Security' },
  ] },
];

export default function Sidebar({ open, collapsed, onClose, onCollapse }: { open: boolean; collapsed: boolean; onClose: () => void; onCollapse: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'VA';

  return <>
    <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <img className="brand-mark" src={academyLogo} alt="Viralstan Academy" />
        <div className="brand-copy"><strong>Viralstan</strong><span>ACADEMY ADMIN</span></div>
        <button className="mobile-sidebar-close" onClick={onClose} aria-label="Close navigation"><ShellIcon name="close" size={20} /></button>
      </div>
      <button className="sidebar-collapse" onClick={onCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <ShellIcon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
      </button>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map((group) => <div className="nav-group" key={group.heading}>
          <p className="workspace-label">{group.heading}</p>
          {group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose} title={item.label}>
            <span className="nav-icon"><ShellIcon name={item.icon} /></span><span className="nav-label">{item.label}</span>
          </NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-footer">
        <div className="academy-card"><span>{initials}</span><div className="academy-card-copy"><strong>{user?.name ?? 'Administrator'}</strong><small>{user?.email ?? 'Admin workspace'}</small></div></div>
        <button className="side-link logout" onClick={signOut} title="Logout"><span className="nav-icon"><ShellIcon name="logout" /></span><span className="nav-label">Sign out</span></button>
      </div>
    </aside>
    {open && <button className="sidebar-overlay" onClick={onClose} aria-label="Close navigation" />}
  </>;
}
