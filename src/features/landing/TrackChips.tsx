import { TrackToga } from "../../components/icons/TogaIcon";
import { cn } from "../../lib/cn";
import { COPY } from "./copy";

/**
 * Ścieżki do wyboru (pięć aplikacji i Student), każda z togą w kolorach zawodu. Strona główna jest publiczna, więc lista
 * jest stała (ta sama co w bazie: adwokacka i radcowska, sędziowska i prokuratorska, uzupełniająca sędziowska,
 * notarialna, komornicza, Student).
 */
export function TrackChips({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {COPY.tracks.map((track) => (
        <li
          key={track.slug}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1.5 pr-3 pl-2.5 text-sm leading-snug font-semibold text-[#e3e0da]"
        >
          <TrackToga slug={track.slug} size={22} className="flex-none" />
          {track.label}
        </li>
      ))}
    </ul>
  );
}
