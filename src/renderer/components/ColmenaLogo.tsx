interface ColmenaLogoProps {
  size?: number;
}

export function ColmenaLogo({ size = 22 }: ColmenaLogoProps) {
  const id = `colmena-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 22.5L38.5 26.25V33.75L32 37.5L25.5 33.75V26.25L32 22.5Z"
        fill={`url(#${id}-center)`}
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <path
        d="M32 9L38.5 12.75V20.25L32 24L25.5 20.25V12.75L32 9Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d="M43.3 15.75L49.8 19.5V27L43.3 30.75L36.8 27V19.5L43.3 15.75Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M43.3 29.25L49.8 33V40.5L43.3 44.25L36.8 40.5V33L43.3 29.25Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M32 36L38.5 39.75V47.25L32 51L25.5 47.25V39.75L32 36Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M20.7 29.25L27.2 33V40.5L20.7 44.25L14.2 40.5V33L20.7 29.25Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M20.7 15.75L27.2 19.5V27L20.7 30.75L14.2 27V19.5L20.7 15.75Z"
        fill={`url(#${id}-outer)`}
        stroke="#f59e0b"
        strokeWidth="1"
        opacity="0.6"
      />
      <circle cx="32" cy="30" r="2.5" fill="#f59e0b" opacity="0.8" />

      <defs>
        <radialGradient id={`${id}-center`} cx="50%" cy="50%" r="50%">
          <stop stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d97706" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id={`${id}-outer`} cx="50%" cy="50%" r="50%">
          <stop stopColor="#f59e0b" stopOpacity="0.15" />
          <stop offset="1" stopColor="#d97706" stopOpacity="0.03" />
        </radialGradient>
      </defs>
    </svg>
  );
}
