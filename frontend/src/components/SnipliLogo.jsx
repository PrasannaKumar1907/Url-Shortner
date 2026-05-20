/**
 * Snipli brand icon — orange rounded square with a chain-link symbol.
 * Use <SnipliLogo size={32} /> anywhere in the app.
 * The `radius` prop controls the corner rounding (default: 7).
 */
export default function SnipliLogo({ size = 32, radius = 7 }) {
  const id = `snipli-bg-${size}`; // unique gradient id per size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Snipli"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#D9541E" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx={radius} fill={`url(#${id})`} />

      {/* Subtle glass highlight */}
      <rect x="2" y="2" width="28" height="13" rx={radius - 1.5} fill="white" fillOpacity="0.10" />

      {/* Left C-shape */}
      <path
        d="M14 22H10A6 6 0 0 1 10 10H14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right C-shape */}
      <path
        d="M18 10H22A6 6 0 0 1 22 22H18"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center connector */}
      <line x1="14" y1="16" x2="18" y2="16" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
