import { COPY } from "./copy";

/**
 * Schemat krzywej zapominania: bez powtórek pamięć spada i nie wraca, z powtórkami wraca na szczyt, a każdy
 * kolejny spadek jest wolniejszy. Schemat poglądowy, bez liczb na osiach. Opisy są w HTML pod rysunkiem,
 * a nie w SVG, żeby skalowały się jak zwykły tekst.
 */
export function ForgettingCurve() {
  const spaced = COPY.spaced;
  const strokeProps = { fill: "none", vectorEffect: "non-scaling-stroke" } as const;

  return (
    <figure className="min-w-0 rounded-[18px] border border-line bg-surface p-[clamp(14px,3cqw,28px)]">
      <svg viewBox="0 0 600 280" role="img" aria-label={spaced.chartLabel} className="block h-auto w-full">
        <path d="M40 18 L40 252 L592 252" stroke="#5a5960" strokeWidth={1.5} {...strokeProps} />
        <line x1="140" y1="36" x2="140" y2="252" stroke="#d8b13a" strokeOpacity={0.22} vectorEffect="non-scaling-stroke" />
        <line x1="300" y1="36" x2="300" y2="252" stroke="#d8b13a" strokeOpacity={0.22} vectorEffect="non-scaling-stroke" />
        <line
          x1="40"
          y1="170"
          x2="592"
          y2="170"
          stroke="#d8b13a"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M40 36 C90 110 150 170 260 205 S440 240 584 250"
          stroke="#8b8a91"
          strokeWidth={3}
          strokeDasharray="1 7"
          strokeLinecap="round"
          {...strokeProps}
        />
        <path
          d="M40 36 C70 100 100 150 140 170 L140 36 C190 70 250 120 300 170 L300 36 C380 62 480 100 584 150"
          stroke="#d8b13a"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...strokeProps}
        />
        <circle cx="140" cy="36" r="7" fill="#1a1a1d" stroke="#d8b13a" strokeWidth={3} vectorEffect="non-scaling-stroke" />
        <circle cx="300" cy="36" r="7" fill="#1a1a1d" stroke="#d8b13a" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      </svg>

      <ul className="mt-[18px] grid gap-3 text-[0.9375rem] leading-snug text-fg-soft">
        {spaced.legend.map((item) => (
          <li key={item.kind} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={
                item.kind === "with"
                  ? "mt-[0.62em] h-0 w-[30px] flex-none border-t-[3.5px] border-accent"
                  : item.kind === "without"
                    ? "mt-[0.62em] h-0 w-[30px] flex-none border-t-[3px] border-dotted border-[#8b8a91]"
                    : "mt-[0.62em] h-0 w-[30px] flex-none border-t-2 border-dashed border-accent/70"
              }
            />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3.5 text-[0.8125rem] text-fg-muted">{spaced.note}</figcaption>
    </figure>
  );
}
