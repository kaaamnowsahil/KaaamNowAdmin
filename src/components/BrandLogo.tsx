type BrandLogoProps = {
  size?: number;
  className?: string;
  ariaHidden?: boolean;
};

export function BrandLogo({ size = 96, className, ariaHidden = false }: BrandLogoProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : 'KaaamNow'}
      className={className}
      height={size}
      role={ariaHidden ? undefined : 'img'}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kaaamnow-logo-tile" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#171F35" />
          <stop offset="1" stopColor="#0B1020" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#kaaamnow-logo-tile)" />
      <g
        fill="#8B5CF6"
        stroke="#8B5CF6"
        transform="translate(-6.7 -5.9) scale(0.16)"
      >
        <path d="M182 115 H150 A52 52 0 0 0 98 167 V343 A42 42 0 0 0 182 343 Z" stroke="none" />
        <circle cx="290" cy="128" r="40" stroke="none" />
        <line x1="232" y1="244" x2="352" y2="180" strokeLinecap="round" strokeWidth="58" />
        <line x1="240" y1="272" x2="348" y2="348" strokeLinecap="round" strokeWidth="76" />
        <path d="M232 192 L198 226 Q184 256 198 288 L228 322 L250 300 V215 Z" strokeLinejoin="round" strokeWidth="4" />
        <polygon points="334,216 355,240 370,206" strokeLinejoin="round" strokeWidth="4" />
      </g>
    </svg>
  );
}
