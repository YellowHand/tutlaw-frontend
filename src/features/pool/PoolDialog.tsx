import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import type { Pool, PoolField, SourceFilterUpdate } from "../../api/pool";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { SOURCE_GROUP_HINTS, SOURCE_GROUP_LABELS, SOURCE_GROUP_ORDER, type SourceGroup } from "../../lib/source";
import { formatCount } from "../tests/format";
import { useCourses, useUpdatePoolActs, useUpdateSourceFilter } from "./hooks";
import { allActIds, questionsWord, selectedActIds } from "./summary";

interface PoolDialogProps {
  pool: Pool;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLElement | null>;
}

type GroupChoice = Record<SourceGroup, boolean>;

function groupChoice(pool: Pool): GroupChoice {
  const byCode = new Map(pool.sourceGroups.map((group) => [group.code, group.selected]));
  return {
    OWN_SHEETS: byCode.get("OWN_SHEETS") ?? true,
    OTHER_SHEETS: byCode.get("OTHER_SHEETS") ?? true,
    AUTHORED: byCode.get("AUTHORED") ?? true,
  };
}

function sameSet(a: ReadonlySet<number>, b: readonly number[]): boolean {
  return a.size === b.length && b.every((id) => a.has(id));
}

/** Pole wyboru z trzecim stanem „część zaznaczona" (dla dziedziny i przedmiotu, w których zaznaczono tylko część aktów). */
function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="size-5 shrink-0 cursor-pointer accent-accent-ink"
    />
  );
}

/**
 * Okno „Pula pytań". Montowane tylko, gdy jest otwarte, więc za każdym razem startuje od zapisanej puli.
 * Dwie niezależne rzeczy: które akty prawne ścieżki są w puli (zawężenie trwałe, nie dotyczy egzaminu próbnego)
 * i które grupy źródeł dają pytania w Testach (moje arkusze, arkusze innych ścieżek, pytania autorskie).
 */
export function PoolDialog({ pool, onClose, returnFocusTo }: PoolDialogProps) {
  const base = allActIds(pool);
  const saved = selectedActIds(pool);
  const savedGroups = groupChoice(pool);
  const [acts, setActs] = useState<ReadonlySet<number>>(() => new Set(saved));
  const [groups, setGroups] = useState<GroupChoice>(savedGroups);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const updateActs = useUpdatePoolActs();
  const updateFilter = useUpdateSourceFilter();
  const hintId = useId();
  const isStudent = pool.track?.kind === "STUDENT";
  const courses = useCourses(isStudent);

  const noActs = acts.size === 0;
  const noGroup = !groups.OWN_SHEETS && !groups.OTHER_SHEETS && !groups.AUTHORED;
  const actsChanged = !sameSet(acts, saved);
  const groupsChanged = SOURCE_GROUP_ORDER.some((code) => groups[code] !== savedGroups[code]);
  const unchanged = !actsChanged && !groupsChanged;
  const everyAct = acts.size === base.length;

  function toggleActs(ids: readonly number[], on: boolean) {
    setActs((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (noActs || noGroup || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (actsChanged) await updateActs.mutateAsync(everyAct ? [] : [...acts]);
      if (groupsChanged) {
        const filter: SourceFilterUpdate = {
          ownSheets: groups.OWN_SHEETS,
          otherSheets: groups.OTHER_SHEETS,
          authored: groups.AUTHORED,
        };
        await updateFilter.mutateAsync(filter);
      }
      onClose();
    } catch (err) {
      setError(serverMessage(err, "Nie udało się zapisać puli. Spróbuj ponownie."));
      setSaving(false);
    }
  }

  const groupCounts = new Map(pool.sourceGroups.map((group) => [group.code, group.questionCount]));

  return (
    <Dialog title="Pula pytań" onClose={onClose} returnFocusTo={returnFocusTo}>
      <p className="text-sm text-fg-muted">
        Pula to pytania z aktów prawnych Twojej ścieżki
        {pool.track ? (
          <>
            {" "}
            (<span className="font-medium text-fg">{pool.track.name}</span>)
          </>
        ) : null}
        . Wszystkie dziedziny widzisz zawsze, ale uczysz się tylko z aktów, które tu zaznaczysz. Zawężenie dotyczy Testów,
        Fiszek i statystyk, ale nie egzaminu próbnego.{" "}
        <Link to={ROUTES.account} onClick={onClose} className="text-accent-ink underline">
          Zmień ścieżkę w Koncie
        </Link>
        .
      </p>

      {isStudent && courses.data && courses.data.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-semibold">Przedmioty</legend>
          {courses.data.map((course) => {
            const ids = course.actIds.filter((id) => base.includes(id));
            const chosen = ids.filter((id) => acts.has(id)).length;
            return (
              <label
                key={course.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-surface-2"
              >
                <TriCheckbox
                  checked={ids.length > 0 && chosen === ids.length}
                  indeterminate={chosen > 0 && chosen < ids.length}
                  onChange={() => toggleActs(ids, chosen !== ids.length)}
                  label={`Przedmiot: ${course.name}`}
                />
                <span className="flex-1 text-sm">{course.name}</span>
                <span className="text-xs tabular-nums text-fg-muted">
                  {formatCount(course.questionCount)} {questionsWord(course.questionCount)}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <section aria-labelledby={`${hintId}-acts`} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${hintId}-acts`} className="text-sm font-semibold">
            Akty prawne
          </h3>
          <button
            type="button"
            onClick={() => toggleActs(base, true)}
            disabled={everyAct}
            className="min-h-11 cursor-pointer rounded-lg px-1 text-sm text-accent-ink underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-default disabled:opacity-50 disabled:no-underline"
          >
            Zaznacz wszystkie
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {pool.fields.map((field) => (
            <FieldGroup key={field.id} field={field} chosen={acts} onToggle={toggleActs} />
          ))}
        </div>
      </section>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">Źródła pytań w Testach</legend>
        {SOURCE_GROUP_ORDER.map((code) => {
          const count = groupCounts.get(code) ?? 0;
          const empty = count === 0;
          return (
            <label
              key={code}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-2",
                empty ? "cursor-default" : "cursor-pointer hover:bg-surface-2"
              )}
            >
              <input
                type="checkbox"
                checked={groups[code]}
                disabled={empty}
                onChange={() => setGroups((prev) => ({ ...prev, [code]: !prev[code] }))}
                className="size-5 shrink-0 cursor-pointer accent-accent-ink disabled:cursor-default"
              />
              <span className="flex-1">
                <span className={cn("block text-sm", empty && "text-fg-muted")}>{SOURCE_GROUP_LABELS[code]}</span>
                <span className="block text-xs text-fg-muted">{SOURCE_GROUP_HINTS[code]}</span>
              </span>
              <span className="text-xs tabular-nums text-fg-muted">
                {formatCount(count)} {questionsWord(count)}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex min-h-5 flex-col gap-1">
        <p
          id={hintId}
          aria-live="polite"
          className={cn("text-xs", noActs || noGroup ? "text-danger" : "text-fg-muted")}
        >
          {noActs
            ? "Zaznacz co najmniej jeden akt prawny."
            : noGroup
              ? "Zaznacz co najmniej jedną grupę pytań."
              : "Zmiana działa od razu w całej aplikacji."}
        </p>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Anuluj
        </Button>
        <Button type="button" disabled={noActs || noGroup || unchanged || saving} onClick={() => void handleSave()}>
          {saving ? "Zapisuję…" : "Zapisz"}
        </Button>
      </div>
    </Dialog>
  );
}

function FieldGroup({
  field,
  chosen,
  onToggle,
}: {
  field: PoolField;
  chosen: ReadonlySet<number>;
  onToggle: (ids: readonly number[], on: boolean) => void;
}) {
  const ids = field.acts.map((act) => act.id);
  const picked = ids.filter((id) => chosen.has(id)).length;
  // Na początku rozwinięta jest dziedzina, w której zaznaczono tylko część aktów (widać, co dokładnie wybrano).
  const [open, setOpen] = useState(() => picked > 0 && picked < ids.length);
  const panelId = useId();

  if (field.acts.length === 0) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 text-sm text-fg-muted">
        <span>{field.name}</span>
        <span className="text-xs">Brak aktów w Twojej ścieżce</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {/* Pole wyboru i przycisk rozwijania są rodzeństwem (nie zagnieżdżamy kontrolek jedna w drugiej). */}
      <div className="flex items-center gap-1 px-2">
        <TriCheckbox
          checked={picked === ids.length}
          indeterminate={picked > 0 && picked < ids.length}
          onChange={() => onToggle(ids, picked !== ids.length)}
          label={`Cała dziedzina: ${field.name}`}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >
          <span className="flex-1 text-sm font-medium">{field.name}</span>
          <span className="text-xs tabular-nums text-fg-muted">
            {picked} / {ids.length}
          </span>
          <ChevronDown size={16} aria-hidden="true" className={cn("shrink-0 text-fg-muted transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <ul id={panelId} className="flex flex-col gap-0.5 border-t border-line px-2 py-1">
          {field.acts.map((act) => (
            <li key={act.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={chosen.has(act.id)}
                  onChange={() => onToggle([act.id], !chosen.has(act.id))}
                  className="size-5 shrink-0 cursor-pointer accent-accent-ink"
                />
                <span className="flex-1 text-sm">{act.name}</span>
                <span className="text-xs tabular-nums text-fg-muted">
                  {formatCount(act.questionCount)} {questionsWord(act.questionCount)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
