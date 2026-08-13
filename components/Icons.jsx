const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconWorld({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

export function IconMobile({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

export function IconChip({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
    </svg>
  );
}

export function IconGamepad({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M8 12H4.5M6.25 10.25v3.5" />
      <circle cx="15" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7 7h10a4 4 0 0 1 4 4l-.6 5.2A2.6 2.6 0 0 1 16 17.5l-1.3-1.7a2 2 0 0 0-1.6-.8h-2.2a2 2 0 0 0-1.6.8L8 17.5a2.6 2.6 0 0 1-4.4-1.3L3 11a4 4 0 0 1 4-4Z" />
    </svg>
  );
}

export function IconScan({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function IconArrow({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function IconMenu({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function WaveLine({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 48"
      width="100%"
      height="34"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lw-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2F68EC" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#34E1E1" />
          <stop offset="1" stopColor="#2F68EC" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <path
        d="M0,24 C25,6 75,6 100,24 S175,42 200,24 S275,6 300,24 S375,42 400,24 S475,6 500,24 S575,42 600,24"
        fill="none"
        stroke="url(#lw-wave)"
        strokeWidth="2"
      />
    </svg>
  );
}
