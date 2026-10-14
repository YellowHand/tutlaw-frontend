import { useId, useRef, useState } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
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

interface OriginFilterChipProps {
  className?: string;
}

/**
 * Znacznik „Pochodzenie pytań" przy tytule strony: co jest teraz wybrane, a kliknięcie otwiera okno z polami wyboru.
 * Gdy filtr coś zawęża, znacznik ma złotą kropkę i podpowiedź z liczbą pytań, bo filtr po cichu zmienia liczby w całych
 * Testach. Filtr jest zapisany na koncie i dotyczy tylko Testów (katalog, testy, powtórki, błędy, egzamin), nie Fiszek
 * ani statystyk. Gdy nie uda się go pobrać, znacznika nie ma, a Testy działają jak zwykle.
 */
export function OriginFilterChip({ className }: OriginFilterChipProps) {
  const { data } = useOriginFilter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!data) return null;

  const active = isFilterActive(data);
  const count = selectedQuestionCount(data);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-testid="origin-filter-chip"
        aria-haspopup="dialog"
        title={active ? `${count} ${questionsWord(count)} w wybranych pochodzeniach` : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors hover:bg-surface-2",
          active ? "border-accent-ink/50 bg-accent/10" : "border-line bg-surface",
          className
        )}
      >
        <ListFilter size={16} aria-hidden="true" className={active ? "shrink-0 text-accent-ink" : "shrink-0 text-fg-muted"} />
        <span className="min-w-0 truncate">
          <span className="text-fg-muted">Pochodzenie pytań: </span>
          <span data-testid="origin-filter-summary" className="font-medium">
            {data.all ? "wszystkie" : describeSelection(data)}
          </span>
        </span>
        {active && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />}
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
        <span className="sr-only">{active ? `, filtr włączony: ${count} ${questionsWord(count)}. Zmień` : ". Zmień"}</span>
      </button>
      {open && <OriginFilterDialog filter={data} onClose={() => setOpen(false)} returnFocusTo={buttonRef} />}
    </>
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
                className="size-5 shrink-0 cursor-pointer accent-accent-ink"
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
          className="min-h-11 cursor-pointer rounded-lg px-1 text-sm text-accent-ink underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
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
