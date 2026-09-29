import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('viralstan_sidebar_collapsed') === 'true',
  );
  const location = useLocation();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const message = (location.state as { notice?: string } | null)?.notice;
    if (!message) return;
    setNotice(message);
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [location.key, location.state]);

  const toggleSidebar = () => {
    setCollapsed((value) => {
      localStorage.setItem('viralstan_sidebar_collapsed', String(!value));
      return !value;
    });
  };

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar open={open} collapsed={collapsed} onCollapse={toggleSidebar} onClose={() => setOpen(false)} />
      <main className="main-shell">
        <Navbar onMenu={() => setOpen(true)} />
        <div className="content"><Outlet /></div>
      </main>
      {notice && <div className="app-toast" role="status">✓ {notice}</div>}
    </div>
  );
}
