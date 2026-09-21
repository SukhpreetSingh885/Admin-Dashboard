import { useAuth } from '../auth/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  return <div className="settings-grid"><section className="panel settings-card"><span className="eyebrow dark">PROFILE</span><h2>Administrator account</h2><p>Your current sign-in details.</p><dl><div><dt>Name</dt><dd>{user?.name ?? 'Unavailable'}</dd></div><div><dt>Email</dt><dd>{user?.email ?? 'Unavailable'}</dd></div><div><dt>Role</dt><dd>Administrator</dd></div></dl></section><section className="panel settings-card"><span className="eyebrow dark">WORKSPACE</span><h2>Academy settings</h2><p>Workspace settings are not exposed by the current API. Account and course management remain available through their respective pages.</p></section></div>;
}
