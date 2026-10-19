import "@fontsource/newsreader/500-italic.css";

interface LogoProps {
  variant?: "wordmark" | "monogram";
}

/*
 * Znak Gradus iuris: pięć stopni na złotym tle (jak pięć lat studiów). Kształt jest też w plikach marki: docs/brand/.
 * Napis: „Gradus” pogrubiony (Manrope) i „iuris” kursywą szeryfową (Newsreader), oba w kolorze tekstu.
 * Zawsze małe „iuris”: wielkie „I” w tej czcionce wygląda jak małe „l”.
 */
function Monogram() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--color-accent)" />
      <polygon
        fill="var(--color-accent-fg)"
        points="7,24.5 7,21.3 10.6,21.3 10.6,18.1 14.2,18.1 14.2,14.9 17.8,14.9 17.8,11.7 21.4,11.7 21.4,8.5 25,8.5 25,24.5"
      />
    </svg>
  );
}

export function Logo({ variant = "wordmark" }: LogoProps) {
  if (variant === "monogram") return <Monogram />;

  return (
    <div className="flex items-center gap-2">
      <Monogram />
      <span className="text-lg font-bold tracking-tight">
        Gradus <span className="font-display text-[1.12em] font-medium italic">iuris</span>
      </span>
    </div>
  );
}
