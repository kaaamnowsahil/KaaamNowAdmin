import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAdminSignIn } from '@/features/auth/useAdminSignIn';

type AdminSignInPageProps = {
  onSignedIn: (token: string) => void;
};

export function AdminSignInPage({ onSignedIn }: AdminSignInPageProps) {
  const {
    busy,
    email,
    error,
    getApiBaseUrl,
    handleSubmit,
    password,
    setEmail,
    setPassword,
    setShowPassword,
    showPassword,
  } = useAdminSignIn({ onSignedIn });

  return (
    <main className="auth-shell">
      <section className="auth-layout" aria-label="KaaamNow administrator sign-in">
        <div className="auth-brand-panel">
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">K</span>
            <span>KaaamNow <small>ADMIN</small></span>
          </div>
          <div className="auth-brand-message">
            <span className="auth-brand-kicker"><ShieldCheck size={15} /> ADMINISTRATOR ACCESS</span>
            <h1>Run your marketplace with confidence.</h1>
            <p>One secure workspace for your KaaamNow operations.</p>
          </div>
          <div className="auth-security-note">
            <LockKeyhole size={16} />
            <span><strong>Protected sign-in</strong><small>Credentials are verified securely by the server.</small></span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <div className="auth-icon"><KeyRound size={21} /></div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to Admin</h2>
            <p>Enter your administrator credentials to continue.</p>
          </div>

          {!getApiBaseUrl() ? (
            <div className="inline-error" role="alert">VITE_API_BASE_URL is not configured.</div>
          ) : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="admin-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="admin@kaaamnow.com"
              />
            </div>

            <div className="auth-password-label">
              <label htmlFor="admin-password">Password</label>
            </div>
            <div className="auth-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                maxLength={128}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(value => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error ? <div className="inline-error" role="alert">{error}</div> : null}
            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={busy || !getApiBaseUrl()}
            >
              {busy ? <LoadingIndicator label="Signing in…" className="loading-indicator-compact" /> : 'Sign in'}
              {!busy ? <ArrowRight size={16} /> : null}
            </button>
          </form>
          <p className="auth-footer">Authorized administrator access only</p>
        </div>
      </section>
    </main>
  );
}
