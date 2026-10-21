import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { fold } from "./text";
import { useAdminActOptions } from "./adminQueries";
import { Badge, FormActions, FormError } from "./adminUi";

interface ActPickerDialogProps {
  title: string;
  /** Jedno zdanie: co ustawia ta lista i co z niej wynika. */
  description: string;
  initialIds: number[];
  pending: boolean;
  error: string | null;
  onSave: (actIds: number[]) => void;
  onClose: () => void;
}

/**
 * Wybór aktów prawnych dla aplikacji albo przedmiotu: lista z polem wyszukiwania, pogrupowana według dziedzin.
 * Zapis zastępuje całą listę aktów, więc zaznaczenie ukrytego aktu też zostaje (ukryty akt nadal jest przypisany).
 */
export function ActPickerDialog({ title, description, initialIds, pending, error, onSave, onClose }: ActPickerDialogProps) {
  const { data, isLoading, isError, refetch } = useAdminActOptions();
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initialIds));
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = fold(query);
    const byField = new Map<number, { name: string; items: NonNullable<typeof data> }>();
    for (const act of data ?? []) {
      if (q && !fold(`${act.name} ${act.shortName}`).includes(q)) continue;
      const group = byField.get(act.fieldId) ?? { name: act.fieldName, items: [] };
      group.items.push(act);
      byField.set(act.fieldId, group);
    }
    return [...byField.entries()].map(([id, g]) => ({ id, ...g }));
  }, [data, query]);

  const visibleIds = useMemo(() => groups.flatMap((g) => g.items.map((a) => a.id)), [groups]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setMany(ids: number[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave([...selected]);
  }

  return (
    <Dialog title={title} onClose={onClose} closeOnBackdrop={false}>
      <form onSubmit={submit} className="flex flex-col gap-3" data-testid="act-picker">
        <p className="text-sm text-fg-muted">{description}</p>
        {isLoading && <Skeleton className="h-48 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać listy aktów." onRetry={() => refetch()} />}
        {data && (
          <>
            <Field label="Szukaj aktu" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setMany(visibleIds, true)} disabled={visibleIds.length === 0}>
                Zaznacz widoczne
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMany(visibleIds, false)} disabled={visibleIds.length === 0}>
                Odznacz widoczne
              </Button>
              <p className="ml-auto text-sm text-fg-muted tabular-nums" data-testid="act-picker-count" aria-live="polite">
                Wybrano: {selected.size}
              </p>
            </div>
            <div className="max-h-[42vh] overflow-y-auto rounded-xl border border-line" tabIndex={0} aria-label="Lista aktów prawnych">
              {groups.length === 0 && <p className="p-4 text-sm text-fg-muted">Żaden akt nie pasuje do wyszukiwania.</p>}
              {groups.map((group) => (
                <fieldset key={group.id} className="border-b border-line px-3 py-2 last:border-b-0">
                  <legend className="px-1 text-sm font-semibold">{group.name}</legend>
                  <ul className="flex flex-col">
                    {group.items.map((act) => (
                      <li key={act.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-surface-2">
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-[var(--color-accent)]"
                            checked={selected.has(act.id)}
                            onChange={() => toggle(act.id)}
                            data-testid={`act-pick-${act.id}`}
                          />
                          <span className="min-w-0 flex-1 break-words">{act.name}</span>
                          {act.hidden && <Badge tone="warn">ukryty</Badge>}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}
            </div>
          </>
        )}
        <FormError message={error} />
        <FormActions pending={pending} submitLabel="Zapisz akty" onCancel={onClose} />
      </form>
    </Dialog>
  );
}
