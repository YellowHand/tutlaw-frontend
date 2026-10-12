interface LogoProps {
  variant?: "wordmark" | "monogram";
}

function Monogram() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--color-accent)" />
      <text x="16" y="21" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--color-accent-fg)">
        T
      </text>
    </svg>
  );
}

export function Logo({ variant = "wordmark" }: LogoProps) {
  if (variant === "monogram") return <Monogram />;

  return (
    <div className="flex items-center gap-2">
      <Monogram />
      <span className="text-lg font-bold">Tutlaw</span>
    </div>
  );
}