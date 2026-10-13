import { OriginToga } from "../../components/icons/TogaIcon";
import { cn } from "../../lib/cn";
import { ORIGIN_ORDER } from "../../lib/origin";
import { originGroupLabel } from "../statistics/originStats";

/**
 * Lista pochodzeń pytań (aplikacje i pytania autorskie), każde z togą w kolorach zawodu. Ta sama lista co
 * w filtrze pochodzenia w Testach, więc nazwy i kolejność biorą się z lib/origin i originStats.
 */
export function OriginChips({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {ORIGIN_ORDER.map((origin) => (
        <li
          key={origin}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1.5 pr-3 pl-2.5 text-sm leading-snug font-semibold text-[#e3e0da]"
        >
          <OriginToga origin={origin} size={22} className="flex-none" />
          {originGroupLabel(origin)}
        </li>
      ))}
    </ul>
  );
}
