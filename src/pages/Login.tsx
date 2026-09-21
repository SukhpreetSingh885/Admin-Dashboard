import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getApiError } from '../api/axios';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate(), location = useLocation();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false), [remember, setRemember] = useState(false);
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!email.trim() || !password) { setError('Enter your email address and password.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try { await login(email.trim(), password, remember); navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/', { replace: true, state: { notice: 'Signed in successfully.' } }); }
    catch (reason) { setError(reason instanceof Error && !('response' in reason) ? reason.message : getApiError(reason, 'Unable to sign in. Check your credentials.')); }
    finally { setLoading(false); }
  };
  return <main className="login-page premium-login">
    <section className="login-visual"><div className="login-brand"><div className="brand-mark">V</div><strong>Viralstan Academy</strong></div><div className="login-message"><span className="eyebrow">THE ACADEMY WORKSPACE</span><h1>Everything your academy needs, in one place.</h1><p>Organize courses, support students, and see how learning moves forward.</p><div className="login-feature"><span>01</span><div><strong>Clarity for every decision</strong><small>A focused view of your students, courses, and activity.</small></div></div></div><div className="login-visual-footer">VIRALSTAN ACADEMY · ADMIN PORTAL</div></section>
    <section className="login-panel"><div className="login-form-wrap"><div className="mobile-login-brand"><div className="brand-mark">V</div><strong>Viralstan Academy</strong></div><span className="eyebrow dark">ADMIN SIGN IN</span><h2>Welcome back.</h2><p>Enter your credentials to access your workspace.</p><form onSubmit={submit} noValidate><label className="field"><span>Email address</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@academy.com" required /></label><label className="field"><span>Password</span><div className="password-field"><input type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></div></label><label className="remember-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me on this device</span></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary login-button" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in to dashboard'}<span aria-hidden="true">→</span></button></form><p className="security-note">Secure access for academy administrators</p></div></section>
  </main>;
}
