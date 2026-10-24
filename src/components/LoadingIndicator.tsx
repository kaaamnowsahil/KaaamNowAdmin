type LoadingIndicatorProps = {
  label: string;
  className?: string;
};

export function LoadingIndicator({ label, className = '' }: LoadingIndicatorProps) {
  return (
    <span className={`loading-indicator ${className}`.trim()} role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
