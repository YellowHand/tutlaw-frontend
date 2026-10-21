import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { formatCount } from "../tests/format";
import {
  actState,
  chosenSections,
  groupState,
  toggleAct,
  toggleGroup,
  toggleSection,
  type CheckState,
  type Selection,
  type TreeAct,
  type TreeGroup,
} from "./selection";

/** Ile rozdziałów widać od razu; reszta po „Pokaż wszystkie rozdziały". */
const SECTIONS_PREVIEW = 6;

const BOX = "size-5 shrink-0 cursor-pointer accent-accent-ink";

/** Pole wyboru z trzecim stanem „część zaznaczona" (akt z kilkoma rozdziałami, dziedzina z częścią aktów). */
function TriCheckbox({ state, onChange, label }: { state: CheckState; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "partial";
  }, [state]);
  return (
    <input ref={ref} type="checkbox" checked={state === "checked"} onChange={onChange} aria-label={label} className={BOX} />
  );
}

function Count({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("shrink-0 text-xs tabular-nums text-fg-muted", className)}>
      {formatCount(value)}
      <span className="sr-only"> {pluralizePl(value, { one: "pytanie", few: "pytania", many: "pytań" })}</span>
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return <ChevronDown size={18} aria-hidden="true" className={cn("shrink-0 text-fg-muted transition-transform", open && "rotate-180")} />;
}

interface ScopePickerProps {
  tree: readonly TreeGroup[];
  selection: Selection;
  onChange: (next: Selection) => void;
  /** Czy akty są pogrupowane w przedmioty Studenta (a nie dziedziny); tylko do podpisów. */
  courses: boolean;
}

/**
 * Wybór przepisów: dziedziny (u Studenta przedmioty) jako lista rozwijana, w środku akty prawne, a pod aktem, który ma
 * rozdziały, ich lista. Akt zaznaczony w całości obejmuje wszystkie pytania aktu (także te bez rozdziału); zaznaczenie
 * rozdziału zawęża wybór tylko do wskazanych rozdziałów.
 */
export function ScopePicker({ tree, selection, onChange, courses }: ScopePickerProps) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(
    () => new Set(tree.filter((group) => tree.length === 1 || groupState(group, selection) !== "unchecked").map((g) => g.id))
  );
  const [openActs, setOpenActs] = useState<Set<number>>(
    () => new Set(tree.flatMap((group) => group.acts).filter((act) => actState(act, selection) === "partial").map((act) => act.id))
  );
  const [allSections, setAllSections] = useState<Set<number>>(new Set());
  const baseId = useId();

  function flip(setter: (updater: (current: Set<number>) => Set<number>) => void, id: number) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ul className="flex flex-col overflow-hidden rounded-2xl border border-line" aria-label={courses ? "Przedmioty" : "Dziedziny prawa"}>
      {tree.map((group, index) => {
        const state = groupState(group, selection);
        const isOpen = openGroups.has(group.id);
        const panelId = `${baseId}-g${group.id}`;
        const chosenActs = group.acts.filter((act) => actState(act, selection) !== "unchecked").length;
        return (
          <li key={group.id} className={cn(index > 0 && "border-t border-line", isOpen && "bg-surface-2/50")}>
            <div className="flex min-h-14 items-center gap-2 pl-4 pr-1">
              <TriCheckbox state={state} onChange={() => onChange(toggleGroup(group, selection))} label={`Cała pozycja: ${group.name}`} />
              <button
                type="button"
                onClick={() => flip(setOpenGroups, group.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-2 text-left"
              >
                <span className={cn("min-w-0 truncate text-sm", isOpen ? "font-bold" : "font-semibold")}>{group.name}</span>
                {chosenActs > 0 && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                    {chosenActs} {pluralizePl(chosenActs, { one: "wybrany", few: "wybrane", many: "wybranych" })}
                  </span>
                )}
                <span className="flex-1" />
                <Count value={group.questionCount} />
                <Chevron open={isOpen} />
              </button>
            </div>

            {isOpen && (
              <ul id={panelId} className="flex flex-col gap-2 px-4 pb-4 pl-4 sm:pl-11">
                {group.acts.map((act) => (
                  <ActRow
                    key={act.id}
                    act={act}
                    selection={selection}
                    onChange={onChange}
                    open={openActs.has(act.id)}
                    onToggleOpen={() => flip(setOpenActs, act.id)}
                    showAll={allSections.has(act.id)}
                    onShowAll={() => flip(setAllSections, act.id)}
                  />
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface ActRowProps {
  act: TreeAct;
  selection: Selection;
  onChange: (next: Selection) => void;
  open: boolean;
  onToggleOpen: () => void;
  showAll: boolean;
  onShowAll: () => void;
}

function ActRow({ act, selection, onChange, open, onToggleOpen, showAll, onShowAll }: ActRowProps) {
  const state = actState(act, selection);
  const hasSections = act.sections.length > 0;
  const panelId = useId();
  const picked = chosenSections(act, selection).length;
  // Zaznaczony rozdział jest widoczny zawsze, także gdy leży poza podglądem (np. po zmianie źródła albo z zapisanego testu).
  const visible = showAll
    ? act.sections
    : act.sections.filter((section, index) => index < SECTIONS_PREVIEW || selection.sections.has(section.id));

  const head = (
    <>
      <span className="min-w-0 flex-1 text-sm font-semibold">{act.name}</span>
      <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-fg-muted">
        {picked > 0 && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent-ink">
            {picked} {pluralizePl(picked, { one: "rozdział", few: "rozdziały", many: "rozdziałów" })}
          </span>
        )}
        <span>
          {formatCount(act.questionCount)}
          <span className="sr-only"> {pluralizePl(act.questionCount, { one: "pytanie", few: "pytania", many: "pytań" })}</span>
          {hasSections && (
            <span className="hidden sm:inline">
              , {act.sections.length} {pluralizePl(act.sections.length, { one: "rozdział", few: "rozdziały", many: "rozdziałów" })}
            </span>
          )}
        </span>
      </span>
    </>
  );

  return (
    <li className="flex flex-col gap-2">
      <div
        className={cn(
          "flex min-h-12 items-center gap-3 rounded-xl border px-3.5",
          state === "unchecked" ? "border-line bg-surface" : "border-accent-ink/40 bg-surface-2"
        )}
      >
        <TriCheckbox state={state} onChange={() => onChange(toggleAct(act, selection))} label={`Cały akt: ${act.name}`} />
        {hasSections ? (
          <button
            type="button"
            onClick={onToggleOpen}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
          >
            {head}
            <Chevron open={open} />
          </button>
        ) : (
          <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3">{head}</div>
        )}
      </div>

      {hasSections && open && (
        <div id={panelId} className="flex flex-col gap-2 pl-0 sm:pl-3">
          {state === "checked" && (
            <p className="text-xs text-fg-muted">Cały akt jest wybrany. Zaznacz rozdział, żeby zawęzić wybór tylko do niego.</p>
          )}
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {visible.map((section) => (
              <li key={section.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3.5 transition-colors hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={selection.sections.has(section.id)}
                    onChange={() => onChange(toggleSection(act, section, selection))}
                    className={BOX}
                  />
                  <span className="min-w-0 flex-1 text-sm">{section.name}</span>
                  <Count value={section.questionCount} />
                </label>
              </li>
            ))}
            {act.sections.length > SECTIONS_PREVIEW && (
              <li>
                <button
                  type="button"
                  onClick={onShowAll}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-fg-muted/60 px-3.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-surface-2"
                >
                  {showAll ? "Pokaż mniej rozdziałów" : `Pokaż wszystkie rozdziały (${act.sections.length})`}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </li>
  );
}
