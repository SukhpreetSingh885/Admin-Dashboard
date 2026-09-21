import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const titles: Record<string, [string, string]> = {
  '/courses': ['Courses', 'Create, publish, and manage your learning catalog.'],
  '/courses/new': ['Create course', 'Build a new learning experience.'],
  '/lessons': ['Lessons', 'Organize your course content.'],
  '/students': ['Students', 'Explore your academy community.'],
  '/enrollments': ['Enrollments', 'Track student access across courses.'],
  '/progress': ['Progress', 'Follow learning activity and completion.'],
  '/settings': ['Settings', 'Your administrator workspace.'],
};

export default function Navbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation(), navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState(''), [notifications, setNotifications] = useState(false), [profile, setProfile] = useState(false);
  const [title, subtitle] = pathname === '/' ? ['Welcome back, Admin', 'Monitor your academy performance and student activity.'] : pathname.startsWith('/courses/') && pathname !== '/courses/new' ? ['Edit course', 'Update course details and publishing status.'] : titles[pathname] ?? ['Admin workspace', 'Manage Viralstan Academy.'];
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'VA';
  const submit = (event: FormEvent) => { event.preventDefault(); if (search.trim()) navigate(`/courses?q=${encodeURIComponent(search.trim())}`); };
  return <header className="navbar"><div className="nav-heading"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation">☰</button><div className="page-heading"><span className="eyebrow dark">VIRALSTAN ACADEMY</span><h1>{title}</h1><p>{subtitle}</p></div></div><div className="nav-actions"><form className="nav-search" onSubmit={submit}><span aria-hidden="true">⌕</span><input aria-label="Search courses" placeholder="Search courses…" value={search} onChange={(event) => setSearch(event.target.value)} /></form><div className="header-popover-wrap"><button className="icon-button notification-button" onClick={() => { setNotifications((value) => !value); setProfile(false); }} aria-label="Notifications" aria-expanded={notifications}>♧</button>{notifications && <div className="header-popover"><strong>Notifications</strong><p>No notifications are available.</p></div>}</div><div className="header-popover-wrap"><button className="profile-trigger" onClick={() => { setProfile((value) => !value); setNotifications(false); }} aria-label="Admin profile menu" aria-expanded={profile}><span className="avatar">{initials}</span><span className="profile-copy"><strong>{user?.name ?? 'Administrator'}</strong><small>Administrator</small></span><span aria-hidden="true">⌄</span></button>{profile && <div className="header-popover profile-popover"><strong>{user?.email}</strong><Link to="/settings" onClick={() => setProfile(false)}>Settings</Link><button onClick={() => { logout(); navigate('/login', { replace: true }); }}>Logout</button></div>}</div></div></header>;
}
