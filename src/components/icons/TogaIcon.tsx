import type { SVGProps } from "react";
import { togaTrimForTrack, type TogaTrim } from "./togaTrim";

type TogaIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "fill" | "stroke" | "viewBox"> & {
  /** Kolor(y) żabotu. Bez tego żabot ma kolor obrysu (neutralna toga). */
  trim?: TogaTrim;
  /** Rozmiar w px, tak jak w ikonach lucide-react. */
  size?: number;
  strokeWidth?: number;
  /** Gdy podasz, ikona dostaje nazwę dla czytników ekranu. Bez tego jest ozdobna (aria-hidden). */
  title?: string;
};

const ROBE = "M9 3 5.2 5.2 2.5 16.5h4.6L5.4 21h13.2l-1.7-4.5h4.6L18.8 5.2 15 3";
const COLLAR = "M9 3l3 3.5L15 3";
const BIB_FULL = "M10.2 7h3.6l1.2 6H9z";
const BIB_LEFT = "M10.2 7H12v6H9z";
const BIB_RIGHT = "M12 7h1.8l1.2 6H12z";

/**
 * Ikona togi w stylu lucide (24x24, kreska 2, zaokrąglone końce). Obrys ma kolor tekstu (currentColor),
 * a żabot kolor zawodu, więc ikona dopasowuje się do stanu aktywnego/nieaktywnego tak jak pozostałe.
 */
export function TogaIcon({ trim, size = 20, strokeWidth = 2, title, ...rest }: TogaIconProps) {
  const labelled = title !== undefined;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      {...rest}
    >
      {labelled && <title>{title}</title>}
      <path d={ROBE} />
      <path d={COLLAR} />
      {trim === undefined && <path d={BIB_FULL} fill="currentColor" strokeWidth={1.5} />}
      {trim?.length === 1 && <path d={BIB_FULL} fill={trim[0]} stroke={trim[0]} strokeWidth={1.5} />}
      {trim?.length === 2 && (
        <>
          <path d={BIB_LEFT} fill={trim[0]} stroke={trim[0]} strokeWidth={1.5} />
          <path d={BIB_RIGHT} fill={trim[1]} stroke={trim[1]} strokeWidth={1.5} />
        </>
      )}
    </svg>
  );
}

/** Toga w kolorach zawodów dla ścieżki (adwokacka+radcowska: zielony i niebieski itd.). Student: toga neutralna. */
export function TrackToga({ slug, ...props }: Omit<TogaIconProps, "trim"> & { slug: string | null | undefined }) {
  return <TogaIcon trim={togaTrimForTrack(slug)} {...props} />;
}
