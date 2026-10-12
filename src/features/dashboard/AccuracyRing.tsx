import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AccuracyRingProps {
  /** Procent 0–100 albo null, gdy nie ma jeszcze z czego go policzyć. */
  percentage: number | null;
  title: string;
  /** Podpis pod kółkiem, gdy dane są. */
  caption: string;
  /** Podpis pod kółkiem, gdy danych jeszcze nie ma. */
  emptyCaption: string;
  /** Opis dla czytników ekranu, np. „Skuteczność powtórek". */
  ariaLabel: string;
}

/** Kółko z procentem. Bez danych pokazuje „—" zamiast mylącego 0%. */
export function AccuracyRing({ percentage, title, caption, emptyCaption, ariaLabel }: AccuracyRingProps) {
  const target = percentage === null ? 0 : Math.max(0, Math.min(100, percentage)) / 100;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const dashOffset = CIRCUMFERENCE * (1 - animated);
  const text = percentage === null ? "—" : `${Math.round(target * 100)}%`;

  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{title}</p>
      <div
        className="relative"
        role="img"
        aria-label={percentage === null ? `${ariaLabel}: brak danych` : `${ariaLabel}: ${text}`}
      >
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="tabular-nums text-2xl font-bold">{text}</span>
        </div>
      </div>
      <p className="text-xs text-fg-muted">{percentage === null ? emptyCaption : caption}</p>
    </Card>
  );
}
