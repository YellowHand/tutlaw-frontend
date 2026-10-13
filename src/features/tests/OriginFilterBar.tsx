import { useId, useRef, useState } from "react";
import { ListFilter } from "lucide-react";
import type { OriginFilter } from "../../api/originFilter";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { ORIGIN_LABELS, ORIGIN_ORDER, type QuestionOrigin } from "../../lib/origin";
import {
  describeSelection,
  isFilterActive,
  questionsWord,
  selectedQuestionCount,
  useOriginFilter,
  useSaveOriginFilter,
} from "./originFilter";

interface OriginFilterBarProps {
  className?: string;
}

/**
 * Pasek „Pochodzenie pytań" w Testach: co jest teraz wybrane i przycisk „Zmień", który otwiera okno z polami wyboru.
 * Filtr jest zapisany na koncie i dotyczy tylko Testów (katalog, testy, powtórki, błędy, egzamin), nie Fiszek ani
 * statystyk. Gdy nie uda się go pobrać, paska nie ma, a Testy działają jak zwykle.
 */
export function OriginFilterBar({ className }: OriginFilterBarProps) {
  const { data } = useOriginFilter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();

  if (!data) return null;

  const active = isFilterActive(data);
  const count = selectedQuestionCount(data);

  return (
    <div
      data-testid="origin-filter-bar"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <ListFilter size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <p id={labelId} className="text-sm">
          <span className="text-fg-muted">Pochodzenie pytań: </span>
          <span data-testid="origin-filter-summary" className="font-medium">
            {describeSelection(data)}
          </span>
          {active && (
            <span className="text-fg-muted">
              {" "}
              · <span className="tabular-nums">{count}</span> {questionsWord(count)}
            </span>
          )}
        </p>
      </div>
      <Button
        ref={buttonRef}
        type="button"
        variant="secondary"
        aria-describedby={labelId}
        className="shrink-0 self-start sm:self-auto"
        onClick={() => setOpen(true)}
      >
        Zmień
      </Button>
      {open && <OriginFilterDialog filter={data} onClose={() => setOpen(false)} returnFocusTo={buttonRef} />}
    </div>
  );
}

interface OriginFilterDialogProps {
  filter: OriginFilter;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLElement | null>;
}

/** Okno wyboru. Montowane tylko, gdy jest otwarte, więc za każdym razem startuje od zapisanego filtra. */
function OriginFilterDialog({ filter, onClose, returnFocusTo }: OriginFilterDialogProps) {
  const [chosen, setChosen] = useState<ReadonlySet<QuestionOrigin>>(() => new Set(filter.selected));
  const save = useSaveOriginFilter();
  const hintId = useId();
  const counts = new Map(filter.options.map((o) => [o.origin, o.questionCount]));
  const noneChosen = chosen.size === 0;

  function toggle(origin: QuestionOrigin) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(origin)) next.delete(origin);
      else next.add(origin);
      return next;
    });
  }

  function handleSave() {
    if (noneChosen || save.isPending) return;
    save.mutate(
      ORIGIN_ORDER.filter((origin) => chosen.has(origin)),
      { onSuccess: onClose }
    );
  }

  return (
    <Dialog title="Pochodzenie pytań" onClose={onClose} returnFocusTo={returnFocusTo}>
      <p className="text-sm text-fg-muted">
        Wybierz, z których pytań chcesz się uczyć w Testach. Filtr działa w katalogu, testach, powtórkach, błędach
        i egzaminie. Fiszek i statystyk nie dotyczy.
      </p>

      <fieldset className="flex flex-col gap-1" aria-describedby={hintId}>
        <legend className="sr-only">Pochodzenie pytań</legend>
        {ORIGIN_ORDER.map((origin) => {
          const questionCount = counts.get(origin) ?? 0;
          return (
            <label
              key={origin}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <input
                type="checkbox"
                checked={chosen.has(origin)}
                onChange={() => toggle(origin)}
                className="size-5 shrink-0 cursor-pointer accent-accent"
              />
              <span className="flex-1 text-sm">{ORIGIN_LABELS[origin]}</span>
              <span className="text-xs tabular-nums text-fg-muted">
                {questionCount} {questionsWord(questionCount)}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex min-h-5 flex-col gap-1">
        <p id={hintId} aria-live="polite" className={cn("text-xs", noneChosen ? "text-danger" : "text-fg-muted")}>
          {noneChosen ? "Zaznacz co najmniej jedno pochodzenie." : "Zmiana działa od razu we wszystkich Testach."}
        </p>
        {save.isError && (
          <p role="alert" className="text-xs text-danger">
            {serverMessage(save.error, "Nie udało się zapisać filtra. Spróbuj ponownie.")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setChosen(new Set(ORIGIN_ORDER))}
          className="min-h-11 cursor-pointer rounded-lg px-1 text-sm text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Zaznacz wszystkie
        </button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="button" disabled={noneChosen || save.isPending} onClick={handleSave}>
            {save.isPending ? "Zapisuję…" : "Zapisz"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
