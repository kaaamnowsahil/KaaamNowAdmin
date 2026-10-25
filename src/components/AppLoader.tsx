import { BrandLogo } from '@/components/BrandLogo';

type AppLoaderProps = {
  label?: string;
};

export function AppLoader({ label = 'Loading…' }: AppLoaderProps) {
  return (
    <div aria-busy="true" aria-live="polite" className="app-loader" role="status">
      <span className="app-loader-badge">
        <span aria-hidden="true" className="app-loader-ring" />
        <BrandLogo ariaHidden className="app-loader-logo" size={46} />
      </span>
      <span className="app-loader-label">{label}</span>
    </div>
  );
}
