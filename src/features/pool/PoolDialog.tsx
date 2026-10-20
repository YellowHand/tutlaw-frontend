import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import type { Pool, PoolCourse, PoolField, SourceFilterUpdate } from "../../api/pool";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { SOURCE_GROUP_HINTS, SOURCE_GROUP_LABELS, SOURCE_GROUP_ORDER, type SourceGroup } from "../../lib/source";
import { formatCount } from "../tests/format";
import { useUpdatePoolActs, useUpdatePoolCourses, useUpdateSourceFilter } from "./hooks";
import { allActIds, allCourseIds, isStudentPool, questionsWord, selectedActIds, selectedCourseIds } from "./summary";

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

/** Pole wyboru z trzecim stanem „część zaznaczona" (dla dziedziny, w której zaznaczono tylko część aktów). */
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
 * Dwie niezależne rzeczy: z czego uczy się użytkownik (aplikacja: akty prawne ścieżki, Student: przedmioty; zawężenie
 * trwałe, nie dotyczy egzaminu próbnego) i które grupy źródeł dają pytania w Testach (moje arkusze, arkusze innych
 * ścieżek, pytania autorskie). Student nie widzi aktów: przedmiot to dla niego najmniejsza jednostka.
 */
export function PoolDialog({ pool, onClose, returnFocusTo }: PoolDialogProps) {
  const isStudent = isStudentPool(pool);
  // Zakres to numery aktów (aplikacja) albo przedmiotów (Student): jeden zbiór, bo w oknie jest tylko jedno z nich.
  const base = isStudent ? allCourseIds(pool) : allActIds(pool);
  const saved = isStudent ? selectedCourseIds(pool) : selectedActIds(pool);
  const savedGroups = groupChoice(pool);
  const [chosen, setChosen] = useState<ReadonlySet<number>>(() => new Set(saved));
  const [groups, setGroups] = useState<GroupChoice>(savedGroups);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const updateActs = useUpdatePoolActs();
  const updateCourses = useUpdatePoolCourses();
  const updateFilter = useUpdateSourceFilter();
  const hintId = useId();

  const noScope = chosen.size === 0;
  const noGroup = !groups.OWN_SHEETS && !groups.OTHER_SHEETS && !groups.AUTHORED;
  const scopeChanged = !sameSet(chosen, saved);
  const groupsChanged = SOURCE_GROUP_ORDER.some((code) => groups[code] !== savedGroups[code]);
  const unchanged = !scopeChanged && !groupsChanged;
  const everything = chosen.size === base.length;
  const scopeNoun = isStudent ? "przedmiot" : "akt prawny";

  function toggle(ids: readonly number[], on: boolean) {
    setChosen((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (noScope || noGroup || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (scopeChanged) {
        const ids = everything ? [] : [...chosen];
        if (isStudent) await updateCourses.mutateAsync(ids);
        else await updateActs.mutateAsync(ids);
      }
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
  // Student nie ma własnych arkuszy (wszystkie arkusze są dla niego „z innych ścieżek"), więc tej grupy nie pokazujemy.
  const shownGroups = SOURCE_GROUP_ORDER.filter((code) => !(isStudent && code === "OWN_SHEETS"));

  return (
    <Dialog title="Pula pytań" onClose={onClose} returnFocusTo={returnFocusTo}>
      {isStudent ? (
        <p className="text-sm text-fg-muted">
          Uczysz się z <span className="font-medium text-fg">przedmiotów</span>, które tu zaznaczysz: dostajesz wszystkie
          pytania z ich aktów prawnych. Zmiana dotyczy Testów, Fiszek i statystyk, ale nie egzaminu próbnego. Postępy
          zostają, także dla przedmiotów, które odznaczysz.{" "}
          <Link to={ROUTES.account} onClick={onClose} className="text-accent-ink underline">
            Zmień ścieżkę w Koncie
          </Link>
          .
        </p>
      ) : (
        <p className="text-sm text-fg-muted">
          Pula to pytania z aktów prawnych Twojej ścieżki
          {pool.track ? (
            <>
              {" "}
              (<span className="font-medium text-fg">{pool.track.name}</span>)
            </>
          ) : null}
          . Uczysz się tylko z aktów, które tu zaznaczysz. Zawężenie dotyczy Testów, Fiszek i statystyk, ale nie egzaminu
          próbnego.{" "}
          <Link to={ROUTES.account} onClick={onClose} className="text-accent-ink underline">
            Zmień ścieżkę w Koncie
          </Link>
          .
        </p>
      )}

      <section aria-labelledby={`${hintId}-scope`} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${hintId}-scope`} className="text-sm font-semibold">
            {isStudent ? "Przedmioty" : "Akty prawne"}
          </h3>
          <button
            type="button"
            onClick={() => toggle(base, true)}
            disabled={everything}
            className="min-h-11 cursor-pointer rounded-lg px-1 text-sm text-accent-ink underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-default disabled:opacity-50 disabled:no-underline"
          >
            Zaznacz wszystkie
          </button>
        </div>
        {isStudent ? (
          <ul className="flex flex-col gap-1" data-testid="pool-courses">
            {pool.courses.map((course) => (
              <CourseRow key={course.id} course={course} checked={chosen.has(course.id)} onToggle={toggle} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-1">
            {pool.fields.map((field) => (
              <FieldGroup key={field.id} field={field} chosen={chosen} onToggle={toggle} />
            ))}
          </div>
        )}
      </section>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">Źródła pytań w Testach</legend>
        {shownGroups.map((code) => {
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
          className={cn("text-xs", noScope || noGroup ? "text-danger" : "text-fg-muted")}
        >
          {noScope
            ? `Zaznacz co najmniej jeden ${scopeNoun}.`
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
        <Button type="button" disabled={noScope || noGroup || unchanged || saving} onClick={() => void handleSave()}>
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

function CourseRow({
  course,
  checked,
  onToggle,
}: {
  course: PoolCourse;
  checked: boolean;
  onToggle: (ids: readonly number[], on: boolean) => void;
}) {
  return (
    <li>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-surface-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle([course.id], !checked)}
          className="size-5 shrink-0 cursor-pointer accent-accent-ink"
        />
        <span className="flex-1 text-sm">{course.name}</span>
        <span className="text-xs tabular-nums text-fg-muted">
          {formatCount(course.questionCount)} {questionsWord(course.questionCount)}
        </span>
      </label>
    </li>
  );
}
