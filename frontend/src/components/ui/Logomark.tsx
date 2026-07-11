export function Logomark({ size = 28, bare = false }: { size?: number; bare?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {!bare && <circle cx="16" cy="16" r="15" fill="#0B1120" />}
      <circle cx="16" cy="16" r="15" stroke="#0EA5E9" strokeOpacity={bare ? 0.5 : 0.35} />
      <path
        d="M10.5 16.5L14 20L21.5 11.5"
        stroke="#38BDF8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
