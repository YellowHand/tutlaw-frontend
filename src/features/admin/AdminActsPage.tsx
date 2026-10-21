import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { createAdminAct, deleteAdminAct, setAdminActHidden, type ActFilter, type ActInput, type AdminAct } from "../../api/admin";
import { LIST_PAGE_SIZE } from "../../api/pagination";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { Pagination } from "../customTest/Pagination";
import { formatCount } from "../tests/format";
import { ActFormDialog } from "./ActFormDialog";
import { FlashMessage } from "./FlashMessage";
import { useAdminActs, useAdminCourses, useAdminFields, useAdminMutation, useAdminTracks } from "./adminQueries";
import { Badge, ConfirmDialog, SelectField } from "./adminUi";
import { VISIBILITY_OPTIONS } from "./visibility";
import { useFlash } from "./useFlash";

/** Filtr przypisania w jednym polu: „" (wszystkie), „none", „track:3" albo „course:2". */
function parseAssignment(value: string): Pick<ActFilter, "trackId" | "courseId" | "unassigned"> {
  if (value === "none") return { unassigned: true };
  if (value.startsWith("track:")) return { trackId: Number(value.slice(6)) };
  if (value.startsWith("course:")) return { courseId: Number(value.slice(7)) };
  return {};
}

type Dialog = { kind: "create" } | { kind: "hide"; act: AdminAct } | { kind: "delete"; act: AdminAct };

/**
 * Akty prawne: lista ze stronicowaniem i filtrami (w adresie, więc powrót z aktu zachowuje wyszukiwanie), dodawanie,
 * ukrywanie i usuwanie pustych aktów. Rozdziały i przypisania są na stronie aktu.
 */
export function AdminActsPage() {
  const [params, setParams] = useSearchParams();
  const queryParam = params.get("q") ?? "";
  const fieldParam = params.get("field") ?? "";
  const kindParam = params.get("kind") ?? "";
  const visibilityParam = params.get("vis") ?? "";
  const assignmentParam = params.get("assign") ?? "";
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);

  // Pole wyszukiwania ma własny stan i trafia do adresu z krótkim opóźnieniem, żeby nie pytać serwera o każdą literę.
  const [queryText, setQueryText] = useState(queryParam);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (queryText === queryParam) return;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (queryText) next.set("q", queryText);
          else next.delete("q");
          next.delete("page");
          return next;
        },
        { replace: true }
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [queryText, queryParam, setParams]);

  function setParam(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true }
    );
  }

  const filter: ActFilter = useMemo(
    () => ({
      query: queryParam || undefined,
      fieldId: fieldParam ? Number(fieldParam) : undefined,
      kind: kindParam === "ACT" || kindParam === "TOPIC" ? kindParam : undefined,
      hidden: visibilityParam === "hidden" ? true : visibilityParam === "visible" ? false : undefined,
      ...parseAssignment(assignmentParam),
      page,
      size: LIST_PAGE_SIZE,
    }),
    [queryParam, fieldParam, kindParam, visibilityParam, assignmentParam, page]
  );

  const { data, isLoading, isError, refetch } = useAdminActs(filter);
  const { data: fields } = useAdminFields();
  const { data: tracks } = useAdminTracks();
  const { data: courses } = useAdminCourses();
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const trackNames = useMemo(() => new Map((tracks ?? []).map((t) => [t.id, t.shortName])), [tracks]);
  const courseNames = useMemo(() => new Map((courses ?? []).map((c) => [c.id, c.name])), [courses]);

  function close() {
    setDialog(null);
    setDialogError(null);
  }
  function open(next: Dialog) {
    clear();
    setDialogError(null);
    setDialog(next);
  }

  const create = useAdminMutation(
    (input: ActInput) => createAdminAct(input),
    () => {
      close();
      ok("Dodano akt prawny. Znajdziesz go na liście; dodaj rozdziały i przypisz do aplikacji.");
    }
  );
  const hide = useAdminMutation(
    (act: AdminAct) => setAdminActHidden(act.id, !act.hidden),
    (updated) => {
      close();
      ok(updated.hidden ? `Ukryto akt „${updated.name}” przed wszystkimi użytkownikami.` : `Przywrócono akt „${updated.name}”.`);
    }
  );
  const remove = useAdminMutation(
    (act: AdminAct) => deleteAdminAct(act.id),
    (_r, act) => {
      close();
      ok(`Usunięto akt „${act.name}”.`);
    }
  );

  function toggleHidden(act: AdminAct) {
    clear();
    if (act.hidden) {
      // Przywrócenie niczego nie psuje, więc bez pytania.
      hide.mutate(act, { onError: (e) => fail(e, "Nie udało się przywrócić aktu.") });
    } else {
      open({ kind: "hide", act });
    }
  }

  const filtered = Boolean(queryParam || fieldParam || kindParam || visibilityParam || assignmentParam);

  return (
    <div>
      <PageHeader
        title="Akty prawne"
        subtitle="Akty i tematy z rozdziałami, ich przypisanie do aplikacji i przedmiotów oraz ukrywanie"
        actions={
          <Button type="button" onClick={() => open({ kind: "create" })} data-testid="act-add">
            <Plus size={18} aria-hidden="true" />
            Dodaj akt
          </Button>
        }
      />
      <div className="flex max-w-6xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />

        <Card className="grid grid-cols-2 gap-3 xl:grid-cols-5" data-testid="act-filters">
          <div className="flex flex-col gap-1 col-span-2 xl:col-span-1">
            <label htmlFor="act-search" className="text-sm text-fg-muted">
              Szukaj
            </label>
            <div className="relative">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input
                id="act-search"
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Nazwa aktu"
                className="min-h-11 w-full rounded-xl border border-field bg-surface-2 pl-9 pr-3"
              />
            </div>
          </div>
          <SelectField label="Dziedzina" value={fieldParam} onChange={(e) => setParam("field", e.target.value)} data-testid="act-filter-field">
            <option value="">Wszystkie</option>
            {(fields ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Rodzaj" value={kindParam} onChange={(e) => setParam("kind", e.target.value)}>
            <option value="">Wszystkie</option>
            <option value="ACT">Akty prawne</option>
            <option value="TOPIC">Tematy</option>
          </SelectField>
          <SelectField label="Przypisanie" value={assignmentParam} onChange={(e) => setParam("assign", e.target.value)} data-testid="act-filter-assign">
            <option value="">Wszystkie</option>
            <option value="none">Bez przypisania</option>
            <optgroup label="Aplikacja">
              {(tracks ?? [])
                .filter((t) => t.kind === "EXAM")
                .map((t) => (
                  <option key={t.id} value={`track:${t.id}`}>
                    {t.shortName}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Przedmiot Studenta">
              {(courses ?? []).map((c) => (
                <option key={c.id} value={`course:${c.id}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </SelectField>
          <SelectField label="Widoczność" value={visibilityParam} onChange={(e) => setParam("vis", e.target.value)} data-testid="act-filter-vis">
            {VISIBILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
        </Card>

        {isLoading && <Skeleton className="h-72 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać aktów prawnych." onRetry={() => refetch()} />}
        {data && data.items.length === 0 && (
          <EmptyState
            title={filtered ? "Żaden akt nie pasuje do filtrów" : "Nie ma jeszcze aktów prawnych"}
            description={filtered ? "Zmień albo wyczyść filtry." : "Dodaj pierwszy akt prawny."}
            action={
              filtered ? (
                <Button type="button" variant="secondary" onClick={() => { setQueryText(""); setParams({}, { replace: true }); }}>
                  Wyczyść filtry
                </Button>
              ) : undefined
            }
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-3" data-testid="act-list">
              {data.items.map((act) => (
                <li key={act.id}>
                  <ActRow
                    act={act}
                    trackNames={trackNames}
                    courseNames={courseNames}
                    onToggleHidden={() => toggleHidden(act)}
                    onDelete={() => open({ kind: "delete", act })}
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={data.page}
              size={data.size}
              totalElements={data.totalElements}
              totalPages={data.totalPages}
              onPage={(p) => setParam("page", p > 0 ? String(p) : "")}
              nouns={{ one: "akt", few: "akty", many: "aktów" }}
            />
          </>
        )}
      </div>

      {dialog?.kind === "create" && (
        <ActFormDialog
          title="Dodaj akt prawny"
          fields={fields ?? []}
          initial={{ fieldId: fieldParam, name: "", shortName: "", kind: "ACT", sortOrder: "" }}
          pending={create.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            create.mutate(input, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się dodać aktu.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "hide" && (
        <ConfirmDialog
          title="Ukryć akt?"
          confirmLabel="Ukryj akt"
          pending={hide.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            hide.mutate(dialog.act, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się ukryć aktu.")) });
          }}
          onClose={close}
        >
          <p>
            Akt „{dialog.act.name}” zniknie <strong className="text-fg">u wszystkich użytkowników</strong>: z testów, fiszek, liczników i
            statystyk. Pytania i historia odpowiedzi zostają, a po przywróceniu wszystko wraca tak, jak było.
          </p>
          {dialog.act.questionCount > 0 && (
            <p>
              Pytań w tym akcie: {formatCount(dialog.act.questionCount)}. Akt z pytaniami można tylko ukryć, nie usunąć.
            </p>
          )}
        </ConfirmDialog>
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć akt?"
          confirmLabel="Usuń akt"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(dialog.act, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć aktu.")) });
          }}
          onClose={close}
        >
          <p>
            Akt „{dialog.act.name}” zniknie razem z rozdziałami i przypisaniami. Tego nie da się cofnąć. Usunąć można tylko akt bez
            pytań, a gdy ma pytania, użyj ukrycia.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

interface ActRowProps {
  act: AdminAct;
  trackNames: Map<number, string>;
  courseNames: Map<number, string>;
  onToggleHidden: () => void;
  onDelete: () => void;
}

function ActRow({ act, trackNames, courseNames, onToggleHidden, onDelete }: ActRowProps) {
  const assigned = [
    ...act.trackIds.map((id) => trackNames.get(id)).filter((n): n is string => Boolean(n)),
    ...act.courseIds.map((id) => courseNames.get(id)).filter((n): n is string => Boolean(n)),
  ];
  const questions = `${formatCount(act.questionCount)} ${pluralizePl(act.questionCount, { one: "pytanie", few: "pytania", many: "pytań" })}`;
  const sections = `${formatCount(act.sectionCount)} ${pluralizePl(act.sectionCount, { one: "rozdział", few: "rozdziały", many: "rozdziałów" })}`;
  const canDelete = act.questionCount === 0;

  return (
    <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" data-testid={`act-${act.id}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold break-words">
            <Link to={ROUTES.adminAct(act.id)} className="underline-offset-4 hover:underline">
              {act.name}
            </Link>
          </h2>
          {act.kind === "TOPIC" && <Badge>Temat</Badge>}
          {act.hidden && (
            <Badge tone="warn" data-testid={`act-hidden-${act.id}`}>
              Ukryty
            </Badge>
          )}
        </div>
        <p className="text-sm text-fg-muted">
          {act.fieldName} · {questions}
          {act.hiddenQuestionCount > 0 && ` (ukrytych: ${formatCount(act.hiddenQuestionCount)})`} · {sections}
        </p>
        <p className="mt-1 text-sm text-fg-muted" data-testid={`act-assigned-${act.id}`}>
          {assigned.length > 0 ? `Przypisany do: ${assigned.join(", ")}` : "Nie jest przypisany do żadnej aplikacji ani przedmiotu"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={ROUTES.adminAct(act.id)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-fg transition-colors hover:bg-line"
          data-testid={`act-open-${act.id}`}
        >
          <Settings2 size={16} aria-hidden="true" />
          Rozdziały i przypisania
        </Link>
        <Button type="button" variant="ghost" onClick={onToggleHidden} data-testid={`act-toggle-${act.id}`}>
          {act.hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
          {act.hidden ? "Przywróć" : "Ukryj"}
        </Button>
        {canDelete && (
          <Button type="button" variant="ghost" onClick={onDelete} data-testid={`act-delete-${act.id}`}>
            <Trash2 size={16} aria-hidden="true" />
            Usuń
          </Button>
        )}
      </div>
    </Card>
  );
}
