import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import type { TestSourceNode } from "../../api/tests";
import { ROUTES } from "../../config/routes";
import { SOURCE_GROUP_LABELS, SOURCE_GROUP_ORDER, type SourceGroup } from "../../lib/source";
import { ProgressLine } from "./CatalogTile";
import { QUIET_BUTTON } from "./StartButtons";

function groupSources(sources: readonly TestSourceNode[]): { group: SourceGroup; items: TestSourceNode[] }[] {
  return SOURCE_GROUP_ORDER.flatMap((group) => {
    const items = sources.filter((source) => source.group === group);
    return items.length > 0 ? [{ group, items }] : [];
  });
}

/**
 * „Arkusze i pytania autorskie": te same pytania co w dziedzinach, ale pogrupowane według źródła. Tu zaczyna się test
 * z jednego arkusza egzaminu (np. „Notarialna 2021"). Grupy i arkusze są tylko te, które dają pytania w puli i w filtrze
 * źródeł; gdy nic nie zostało, sekcji nie ma.
 */
export function SourcesSection({ sources }: { sources: readonly TestSourceNode[] }) {
  const groups = groupSources(sources);
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="test-sources" className="flex flex-col gap-3" data-testid="test-sources">
      <h2 id="test-sources" className="text-sm font-medium text-fg-muted">
        Według źródła
      </h2>
      <div className="flex flex-col gap-5">
        {groups.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{SOURCE_GROUP_LABELS[group]}</h3>
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
              {items.map((source) => (
                <li key={source.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{source.name}</p>
                    <div className="mt-2 max-w-md">
                      <ProgressLine counts={source} />
                    </div>
                  </div>
                  <Link
                    to={ROUTES.testScope({ sourceId: source.id })}
                    className={`${QUIET_BUTTON} shrink-0`}
                    aria-label={`Rozwiąż test: ${source.name}`}
                  >
                    <Play size={16} aria-hidden="true" />
                    Rozwiąż
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
