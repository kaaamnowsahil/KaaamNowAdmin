import { Clock, KeyRound, LogOut, Server, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { getApiBaseUrl } from '@/api/client';
import { StatusBadge } from '@/components/StatusBadge';
import { BRAND } from '@/constants/brand';

type SettingsPageProps = {
  accessToken: string;
  onSignOut: () => void;
};

type TokenClaims = {
  sub?: string;
  exp?: number;
  iat?: number;
  role?: string;
  roles?: string[];
};

function decodeClaims(token: string): TokenClaims {
  try {
    const payload = token.split('.')[1] ?? '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as TokenClaims;
  } catch {
    return {};
  }
}

function formatEpoch(seconds?: number) {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="settings-row">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function SettingsPage({ accessToken, onSignOut }: SettingsPageProps) {
  const claims = decodeClaims(accessToken);
  const roles = claims.roles ?? (claims.role ? [claims.role] : []);
  const expired = claims.exp ? claims.exp * 1000 < Date.now() : false;

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">CONSOLE</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">Preferences</span>
          </div>
          <h1>Settings</h1>
          <p className="page-description">Your admin session and the environment this console is connected to.</p>
        </div>
      </section>

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><ShieldCheck size={16} /></span>
            <div><h2>Admin session</h2><p>Signed in with a server-verified admin token.</p></div>
          </div>
          <SettingRow label="Status">
            <StatusBadge tone={expired ? 'danger' : 'success'}>{expired ? 'Expired' : 'Active'}</StatusBadge>
          </SettingRow>
          <SettingRow label="Admin ID"><code>{claims.sub ?? '—'}</code></SettingRow>
          <SettingRow label="Roles">{roles.length ? roles.join(', ') : 'Admin'}</SettingRow>
          <SettingRow label="Signed in">{formatEpoch(claims.iat)}</SettingRow>
          <SettingRow label="Session expires">{formatEpoch(claims.exp)}</SettingRow>
        </section>

        <section className="panel settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><Server size={16} /></span>
            <div><h2>Environment</h2><p>Where this console sends its requests.</p></div>
          </div>
          <SettingRow label="Mode">
            <StatusBadge tone={import.meta.env.PROD ? 'purple' : 'warning'}>
              {import.meta.env.PROD ? 'Production' : 'Development'}
            </StatusBadge>
          </SettingRow>
          <SettingRow label="API base URL"><code>{getApiBaseUrl() ?? 'Not configured'}</code></SettingRow>
          <SettingRow label="Console">{BRAND.PRODUCT}</SettingRow>
        </section>

        <section className="panel settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><KeyRound size={16} /></span>
            <div><h2>Security</h2><p>Sessions are stored for this browser tab only.</p></div>
          </div>
          <p className="settings-note">
            <Clock size={13} />
            Closing this tab or signing out removes the admin token from this browser.
          </p>
          <button className="button button-secondary settings-signout" onClick={onSignOut} type="button">
            <LogOut size={15} />
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
