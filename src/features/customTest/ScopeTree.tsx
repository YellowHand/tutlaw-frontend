import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatCount } from "../tests/format";
import {
  categoryState,
  isEverythingSelected,
  toggleCategory,
  toggleSubject,
  type CheckState,
  type TreeCategory,
} from "./selection";

const ROW = "flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-surface-2";

/** Pole wyboru z trzecim stanem „część zaznaczona" (rodzaj, w którym zaznaczono tylko niektóre akty prawne). */
function TriCheckbox({ state, onChange }: { state: CheckState; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "partial";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "checked"}
      onChange={onChange}
      className="size-5 shrink-0 cursor-pointer accent-accent"
    />
  );
}

function QuestionCount({ value }: { value: number }) {
  return (
    <span className="shrink-0 text-xs tabular-nums text-fg-muted">
      {formatCount(value)}
      <span className="sr-only"> pytań</span>
    </span>
  );
}

interface ScopeTreeProps {
  tree: readonly TreeCategory[];
  selected: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/**
 * Wybór działów do własnego testu: rodzaje (z polem wyboru i rozwijaniem) z aktami prawnymi w środku.
 * Rodzaj zaznaczony w całości = wszystkie jego akty; po rozwinięciu można zostawić tylko niektóre.
 */
export function ScopeTree({ tree, selected, onChange, onSelectAll, onClear }: ScopeTreeProps) {
  // Na początku rozwinięty jest rodzaj, w którym zaznaczono tylko część (żeby było widać, co dokładnie wybrano),
  // a gdy rodzaj jest jeden, to on.
  const [open, setOpen] = useState<Set<number>>(
    () =>
      new Set(
        tree
          .filter((category) => tree.length === 1 || categoryState(category, selected) === "partial")
          .map((category) => category.id)
      )
  );
  const listId = useId();
  const everything = isEverythingSelected(tree, selected);

  function toggleOpen(id: number) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${listId}-title`} className="text-base font-semibold">
          Z czego?
        </h2>
        <button
          type="button"
          onClick={everything ? onClear : onSelectAll}
          className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm text-accent underline-offset-2 hover:underline"
        >
          {everything ? "Odznacz wszystko" : "Zaznacz wszystko"}
        </button>
      </div>

      <ul aria-labelledby={`${listId}-title`} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-2">
        {tree.map((category) => {
          const state = categoryState(category, selected);
          const isOpen = open.has(category.id);
          const panelId = `${listId}-c${category.id}`;
          return (
            <li key={category.id}>
              <div className="flex items-center gap-1">
                <label className={ROW}>
                  <TriCheckbox state={state} onChange={() => onChange(toggleCategory(category, selected))} />
                  <span className="min-w-0 flex-1 font-medium">{category.name}</span>
                  <QuestionCount value={category.questionCount} />
                </label>
                <button
                  type="button"
                  onClick={() => toggleOpen(category.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${isOpen ? "Zwiń" : "Rozwiń"}: ${category.name}`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <ChevronDown size={18} aria-hidden="true" className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
              </div>

              {isOpen && (
                <ul id={panelId} className="mb-1 ml-5 flex flex-col border-l border-line pl-2">
                  {category.subjects.map((subject) => (
                    <li key={subject.id}>
                      <label className={ROW}>
                        <input
                          type="checkbox"
                          checked={selected.has(subject.id)}
                          onChange={() => onChange(toggleSubject(subject.id, selected))}
                          className="size-5 shrink-0 cursor-pointer accent-accent"
                        />
                        <span className="min-w-0 flex-1 text-sm">{subject.name}</span>
                        <QuestionCount value={subject.questionCount} />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
