// A Victorian damask / acanthus flourish, used as faint background ornament
// in the gallery hero cell (replaces the original Next.js Conf bridge icon).
export default function Bridge() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <g transform="translate(200 200)" opacity="0.9">
        {/* Centre rosette */}
        <circle r="6" />
        <circle r="18" />
        <circle r="34" />
        {/* Four-fold acanthus scrolls around the centre */}
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d="M0 -34 C 30 -90, 90 -90, 110 -40 C 130 0, 80 40, 40 30 C 10 22, 0 0, 0 -34 Z" />
            <path d="M0 -50 C 40 -120, 130 -130, 150 -70" opacity="0.7" />
            <path d="M30 -70 C 50 -100, 90 -100, 110 -80" opacity="0.6" />
            <path d="M-4 -100 L 0 -160 L 4 -100" opacity="0.5" />
          </g>
        ))}
        {/* Diagonal flourishes */}
        {[45, 135, 225, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`} opacity="0.55">
            <path d="M0 -38 C 20 -80, 70 -90, 90 -60" />
            <circle cx="0" cy="-150" r="3" />
            <circle cx="0" cy="-130" r="2" />
          </g>
        ))}
        {/* Outer wreath suggestion */}
        <circle r="170" opacity="0.3" />
        <circle r="178" opacity="0.18" />
      </g>
    </svg>
  );
}
