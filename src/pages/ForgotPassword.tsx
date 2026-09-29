import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { getApiError } from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../services/auth.service';
import academyLogo from '../../assets/images/logo.png';

type RecoveryStep = 1 | 2 | 3;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

function recoveryError(error: unknown, fallback: string) {
  const message = getApiError(error, fallback);

  if (/no account|not found|unauthori[sz]ed|unknown user/i.test(message)) {
    return fallback;
  }

  return message;
}

export default function ForgotPassword() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<RecoveryStep>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!completed) {
      return;
    }

    const timer = window.setTimeout(() => {
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Password reset successfully. Sign in with your new password.',
        },
      });
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [completed, navigate]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const sendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter a valid admin email address.');
      return;
    }

    setLoading(true);

    try {
      await authService.sendPasswordResetOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setStep(2);
      setNotice('If this email is eligible, a six-digit code has been sent.');
    } catch (reason) {
      const message = getApiError(reason, 'Unable to send a code right now.');

      if (/no account|not found|unauthori[sz]ed|unknown user/i.test(message)) {
        setEmail(normalizedEmail);
        setStep(2);
        setNotice('If this email is eligible, a six-digit code has been sent.');
      } else {
        setError(recoveryError(reason, 'Unable to send a code right now.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the six-digit code from your email.');
      return;
    }

    setLoading(true);

    try {
      await authService.verifyPasswordResetOtp(email, otp);
      setOtp('');
      setStep(3);
      setNotice('Code verified. Create a new password.');
    } catch (reason) {
      setError(recoveryError(reason, 'The code is invalid or has expired.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError(
        'Use uppercase, lowercase, a number, and a special character.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, password);
      setPassword('');
      setConfirmPassword('');
      setCompleted(true);
      setNotice('Password reset successfully. Returning to sign in…');
    } catch (reason) {
      setError(recoveryError(reason, 'Unable to reset the password. Request a new code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setOtp('');
    setError('');
    setNotice('');
    setStep(1);
  };

  return (
    <main className="login-page premium-login password-recovery-page">
      <section className="login-visual recovery-visual">
        <div className="login-brand">
          <img
            className="brand-mark"
            src={academyLogo}
            alt="Viralstan Academy"
          />
          <strong>Viralstan Academy</strong>
        </div>

        <div className="login-message">
          <span className="eyebrow">SECURE ACCOUNT RECOVERY</span>
          <h1>Restore access to your workspace.</h1>
          <p>
            Verify your administrator email before choosing a new password.
          </p>

          <ol className="recovery-overview">
            <li className={step >= 1 ? 'active' : ''}>
              <span>1</span><div><strong>Confirm email</strong><small>Request a secure code</small></div>
            </li>
            <li className={step >= 2 ? 'active' : ''}>
              <span>2</span><div><strong>Verify code</strong><small>Enter the six digits</small></div>
            </li>
            <li className={step >= 3 ? 'active' : ''}>
              <span>3</span><div><strong>New password</strong><small>Restore account access</small></div>
            </li>
          </ol>
        </div>

        <div className="login-visual-footer">
          VIRALSTAN ACADEMY · ADMIN PORTAL
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap recovery-form-wrap">
          <div className="mobile-login-brand">
            <img
              className="brand-mark"
              src={academyLogo}
              alt="Viralstan Academy"
            />
            <strong>Viralstan Academy</strong>
          </div>

          <div className="recovery-step-label">Step {step} of 3</div>

          {step === 1 && (
            <>
              <span className="eyebrow dark">PASSWORD RECOVERY</span>
              <h2>Find your account</h2>
              <p>Enter the email address used for your admin account.</p>

              <form onSubmit={sendOtp} noValidate>
                <label className="field">
                  <span>Admin email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@academy.com"
                    disabled={loading}
                    autoFocus
                    required
                  />
                </label>

                {error && <div className="form-error" role="alert">{error}</div>}

                <button className="button primary login-button" type="submit" disabled={loading}>
                  {loading ? 'Sending code…' : 'Send OTP'}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <span className="eyebrow dark">VERIFY EMAIL</span>
              <h2>Enter your code</h2>
              <p>
                Enter the six-digit code sent for <strong>{email}</strong>.
              </p>

              <form onSubmit={verifyOtp} noValidate>
                <label className="field">
                  <span>One-time code</span>
                  <input
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </label>

                {notice && <div className="recovery-notice" role="status">{notice}</div>}
                {error && <div className="form-error" role="alert">{error}</div>}

                <button className="button primary login-button" type="submit" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                  <span aria-hidden="true">→</span>
                </button>

                <button className="recovery-secondary-action" type="button" onClick={changeEmail} disabled={loading}>
                  Use a different email
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <span className="eyebrow dark">CREATE PASSWORD</span>
              <h2>Choose a new password</h2>
              <p>Use at least 8 characters and avoid a password used elsewhere.</p>

              <form onSubmit={resetPassword} noValidate>
                <label className="field">
                  <span>New password</span>
                  <div className="password-field">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter a strong password"
                      minLength={8}
                      disabled={loading || completed}
                      required
                    />
                    <button type="button" onClick={() => setPasswordVisible((value) => !value)} disabled={loading || completed}>
                      {passwordVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Confirm password</span>
                  <div className="password-field">
                    <input
                      type={confirmVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Enter the password again"
                      minLength={8}
                      disabled={loading || completed}
                      required
                    />
                    <button type="button" onClick={() => setConfirmVisible((value) => !value)} disabled={loading || completed}>
                      {confirmVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <div className="password-requirements">
                  8+ characters · uppercase · lowercase · number · special character
                </div>

                {notice && <div className="recovery-success" role="status">{notice}</div>}
                {error && <div className="form-error" role="alert">{error}</div>}

                <button className="button primary login-button" type="submit" disabled={loading || completed}>
                  {loading ? 'Resetting password…' : completed ? 'Password reset' : 'Reset password'}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </>
          )}

          <Link className="back-to-login" to="/login">
            ← Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
