import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileUp, Plus, Search } from "lucide-react";
import { type AdminQuestion, type MarkStatus, type MarkType, type QuestionFilter } from "../../api/admin";
import { LIST_PAGE_SIZE } from "../../api/pagination";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { serverMessage } from "../../lib/errors";
import { Pagination } from "../customTest/Pagination";
import { FlashMessage } from "./FlashMessage";
import { QuestionCard } from "./QuestionCard";
import { QuestionDialog } from "./QuestionDialog";
import { QuestionMarksDialog } from "./QuestionMarksDialog";
import { useAdminActOptions, useAdminQuestions, useAdminSections, useAdminSources } from "./adminQueries";
import { ConfirmDialog, SelectField } from "./adminUi";
import { isMarkStatus, isMarkType, MARK_TYPES } from "./marks";
import { useAdminListParams } from "./useAdminListParams";
import { useFlash } from "./useFlash";
import { useQuestionVisibility } from "./questionVisibility";
import { VISIBILITY_OPTIONS } from "./visibility";

/** Filtr oznaczenia w jednym polu: „CONFIRMED:TRAP_NEGATION” (stan i rodzaj). */
function parseMark(value: string): { mark?: MarkType; markStatus?: MarkStatus } {
  const [status, type] = value.split(":");
  if (status && type && isMarkStatus(status) && isMarkType(type)) return { mark: type, markStatus: status };
  return {};
}

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; id: number }
  | { kind: "marks"; id: number }
  | { kind: "hide"; question: AdminQuestion };

/**
 * Pytania: lista ze stronicowaniem, wyszukiwarką i filtrami (w adresie), dodawanie, edycja, oznaczenia oraz ukrywanie
 * pytania i jego fiszki. Pytań się nie usuwa, tylko ukrywa (historia odpowiedzi zostaje). Import z pliku jest osobnym ekranem.
 */
export function AdminQuestionsPage() {
  const list = useAdminListParams();
  const actParam = list.get("act");
  const sectionParam = list.get("section");
  const sourceParam = list.get("source");
  const visibilityParam = list.get("vis");
  const extraParam = list.get("extra");
  const markParam = list.get("mark");

  const filter: QuestionFilter = useMemo(
    () => ({
      query: list.queryParam || undefined,
      actId: actParam ? Number(actParam) : undefined,
      sectionId: actParam && sectionParam ? Number(sectionParam) : undefined,
      sourceId: sourceParam ? Number(sourceParam) : undefined,
      hidden: visibilityParam === "hidden" ? true : visibilityParam === "visible" ? false : undefined,
      withoutSection: extraParam === "no-section" || undefined,
      reported: extraParam === "reported" || undefined,
      ...parseMark(markParam),
      page: list.page,
      size: LIST_PAGE_SIZE,
    }),
    [list.queryParam, actParam, sectionParam, sourceParam, visibilityParam, extraParam, markParam, list.page]
  );

  const { data, isLoading, isError, refetch } = useAdminQuestions(filter);
  const acts = useAdminActOptions();
  const sources = useAdminSources();
  const sections = useAdminSections(actParam ? Number(actParam) : Number.NaN);
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { hide, hideFlashcard } = useQuestionVisibility((text) => {
    setDialog(null);
    setDialogError(null);
    ok(text);
  });

  function close() {
    setDialog(null);
    setDialogError(null);
  }
  function open(next: Dialog) {
    clear();
    setDialogError(null);
    setDialog(next);
  }

  function toggleHidden(question: AdminQuestion) {
    clear();
    if (question.hidden) {
      // Przywrócenie niczego nie psuje, więc bez pytania.
      hide.mutate({ id: question.id, hidden: false }, { onError: (e) => fail(e, "Nie udało się przywrócić pytania.") });
    } else {
      open({ kind: "hide", question });
    }
  }

  const fields = new Map<string, NonNullable<typeof acts.data>>();
  for (const act of acts.data ?? []) {
    const group = fields.get(act.fieldName) ?? [];
    group.push(act);
    fields.set(act.fieldName, group);
  }

  const markedQuestion = dialog?.kind === "marks" ? data?.items.find((q) => q.id === dialog.id) : undefined;

  return (
    <div>
      <PageHeader
        title="Pytania"
        subtitle="Wyszukiwarka, dodawanie i edycja pytań, oznaczenia oraz ukrywanie"
        actions={
          <>
            <Link
              to={ROUTES.adminImport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-fg transition-colors hover:bg-line"
              data-testid="questions-import-link"
            >
              <FileUp size={18} aria-hidden="true" />
              Importuj z pliku
            </Link>
            <Button type="button" onClick={() => open({ kind: "create" })} data-testid="question-add">
              <Plus size={18} aria-hidden="true" />
              Dodaj pytanie
            </Button>
          </>
        }
      />
      <div className="flex max-w-6xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />

        <Card className="grid grid-cols-2 gap-3 xl:grid-cols-4" data-testid="question-filters">
          <div className="col-span-2 flex flex-col gap-1 xl:col-span-4">
            <label htmlFor="question-search" className="text-sm text-fg-muted">
              Szukaj
            </label>
            <div className="relative">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input
                id="question-search"
                type="search"
                value={list.queryText}
                onChange={(e) => list.setQueryText(e.target.value)}
                placeholder="Fragment pytania, odpowiedzi albo podstawy prawnej; numer pytania"
                className="min-h-11 w-full rounded-xl border border-field bg-surface-2 pl-9 pr-3"
              />
            </div>
          </div>
          <SelectField
            label="Akt prawny"
            value={actParam}
            onChange={(e) => list.setParams({ section: "", act: e.target.value })}
            data-testid="question-filter-act"
          >
            <option value="">Wszystkie</option>
            {[...fields.entries()].map(([fieldName, group]) => (
              <optgroup key={fieldName} label={fieldName}>
                {group.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
          <SelectField
            label="Rozdział"
            value={sectionParam}
            onChange={(e) => list.setParam("section", e.target.value)}
            disabled={!actParam}
            data-testid="question-filter-section"
          >
            <option value="">{actParam ? "Wszystkie" : "Najpierw wybierz akt"}</option>
            {(sections.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Źródło" value={sourceParam} onChange={(e) => list.setParam("source", e.target.value)} data-testid="question-filter-source">
            <option value="">Wszystkie</option>
            {(sources.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.hidden ? " (ukryty)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField label="Widoczność" value={visibilityParam} onChange={(e) => list.setParam("vis", e.target.value)} data-testid="question-filter-vis">
            {VISIBILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Tylko pytania" value={extraParam} onChange={(e) => list.setParam("extra", e.target.value)} data-testid="question-filter-extra">
            <option value="">Wszystkie</option>
            <option value="reported">Z otwartym zgłoszeniem</option>
            <option value="no-section">Bez rozdziału</option>
          </SelectField>
          <SelectField label="Oznaczenie" value={markParam} onChange={(e) => list.setParam("mark", e.target.value)} data-testid="question-filter-mark">
            <option value="">Dowolne</option>
            <optgroup label="Zatwierdzone">
              {MARK_TYPES.map((m) => (
                <option key={m.type} value={`CONFIRMED:${m.type}`}>
                  {m.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Propozycje automatu">
              {MARK_TYPES.map((m) => (
                <option key={m.type} value={`SUGGESTED:${m.type}`}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          </SelectField>
        </Card>

        {isLoading && <Skeleton className="h-72 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać pytań." onRetry={() => refetch()} />}
        {data && data.items.length === 0 && (
          <EmptyState
            title={list.hasFilters ? "Żadne pytanie nie pasuje do filtrów" : "Nie ma jeszcze pytań"}
            description={list.hasFilters ? "Zmień albo wyczyść filtry." : "Dodaj pierwsze pytanie albo zaimportuj je z pliku."}
            action={
              list.hasFilters ? (
                <Button type="button" variant="secondary" onClick={list.reset}>
                  Wyczyść filtry
                </Button>
              ) : undefined
            }
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-3" data-testid="question-list">
              {data.items.map((q) => (
                <li key={q.id}>
                  <QuestionCard
                    question={q}
                    onEdit={() => open({ kind: "edit", id: q.id })}
                    onMarks={() => open({ kind: "marks", id: q.id })}
                    onToggleHidden={() => toggleHidden(q)}
                    onToggleFlashcard={() => {
                      clear();
                      hideFlashcard.mutate(
                        { id: q.id, hidden: !q.flashcardHidden },
                        { onError: (e) => fail(e, "Nie udało się zmienić widoczności fiszki.") }
                      );
                    }}
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={data.page}
              size={data.size}
              totalElements={data.totalElements}
              totalPages={data.totalPages}
              onPage={(p) => list.setParam("page", p > 0 ? String(p) : "")}
              nouns={{ one: "pytanie", few: "pytania", many: "pytań" }}
            />
          </>
        )}
      </div>

      {dialog?.kind === "create" && (
        <QuestionDialog
          mode="create"
          defaults={{
            actId: actParam ? Number(actParam) : undefined,
            sectionId: sectionParam ? Number(sectionParam) : undefined,
            sourceId: sourceParam ? Number(sourceParam) : undefined,
          }}
          onSaved={(saved) => {
            close();
            ok(`Dodano pytanie nr ${saved.id}.`);
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "edit" && (
        <QuestionDialog
          mode="edit"
          questionId={dialog.id}
          onSaved={(saved) => {
            close();
            ok(`Zapisano pytanie nr ${saved.id}.`);
          }}
          onClose={close}
        />
      )}
      {markedQuestion && <QuestionMarksDialog question={markedQuestion} onClose={close} />}
      {dialog?.kind === "hide" && (
        <ConfirmDialog
          title="Ukryć pytanie?"
          confirmLabel="Ukryj pytanie"
          pending={hide.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            hide.mutate({ id: dialog.question.id, hidden: true }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się ukryć pytania.")) });
          }}
          onClose={close}
        >
          <p>
            Pytanie nr {dialog.question.id} zniknie <strong className="text-fg">u wszystkich użytkowników</strong>: z testów, fiszek, liczników i
            egzaminu. Historia odpowiedzi zostaje, a po przywróceniu wszystko wraca tak, jak było. Pytań się nie usuwa.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
