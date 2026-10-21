import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, Play } from "lucide-react";
import { getAvailableNewQuestionsCount, type ReviewScope } from "../../api/review";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { pluralizePl } from "../../lib/plural";
import { DueReviewBanner } from "../review/DueReviewBanner";
import { useBacklog } from "../review/useBacklog";
import { useOverview } from "../statistics/hooks";
import { actGroups } from "../tests/groups";
import { useTestCatalog } from "../tests/hooks";

/** Wybór zakresu w liście: „all", „field:3" albo „act:12". */
function parseScope(value: string): ReviewScope {
  const [kind, raw] = value.split(":");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return {};
  if (kind === "field") return { fieldId: id };
  if (kind === "act") return { actId: id };
  return {};
}

const FLASHCARD_FORMS = { one: "fiszka", few: "fiszki", many: "fiszek" };

/**
 * Fiszki: ekran startowy. Fiszka to drugi tryb tego samego pytania, więc nie ma tu osobnych materiałów ani rozdziałów.
 * Na górze „Powtórki na dziś" z całej puli, niżej nauka z wybranej dziedziny albo aktu prawnego. Fiszki powstają same:
 * po pewnym błędzie w teście albo po „Dodaj do fiszek"; dopóki żadnej nie ma, ekran to wyjaśnia.
 */
export function FlashcardsPage() {
  // Fiszki zaczynają puste. Gdy nie ma żadnej, tłumaczymy to zamiast pokazywać zakresy, w których nic nie ma.
  // Gdy nie uda się tego sprawdzić, pokazujemy zwykły ekran.
  const overview = useOverview(undefined, "FLASHCARD");
  const noFlashcardsYet = overview.data?.totalQuestions === 0;

  return (
    <PageContainer>
      <PageHeader title="Fiszki" />
      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        {noFlashcardsYet ? (
          <EmptyState
            icon={Layers}
            title="Nie masz jeszcze fiszek"
            description="Fiszki pojawiają się tu same: po błędnej odpowiedzi w teście (bez zaznaczenia „Nie jestem pewien”) albo gdy po odpowiedzi klikniesz „Dodaj do fiszek”. To to samo pytanie, tylko z własnym harmonogramem powtórek."
            action={
              <Link
                to={ROUTES.tests}
                className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                Przejdź do Testów
              </Link>
            }
          />
        ) : (
          <>
            <DueReviewBanner />
            <ScopeCard loading={overview.isLoading} />
          </>
        )}
      </div>
    </PageContainer>
  );
}

function ScopeCard({ loading }: { loading: boolean }) {
  const [choice, setChoice] = useState("all");
  const catalog = useTestCatalog();
  const scope = useMemo(() => parseScope(choice), [choice]);
  const backlog = useBacklog({ mode: "FLASHCARD", ...scope });
  const available = useQuery({
    queryKey: ["review", "new-available", "FLASHCARD", scope.fieldId ?? null, scope.actId ?? null],
    queryFn: () => getAvailableNewQuestionsCount(scope, "FLASHCARD"),
    staleTime: 0,
    retry: false,
  });

  if (loading) return <Skeleton className="h-40 w-full" />;

  const groups = actGroups(catalog.data);
  const studentView = (catalog.data?.courses.length ?? 0) > 0;
  const due = backlog.data?.dueNow;
  const fresh = available.data;

  return (
    <Card className="flex flex-col gap-4 p-5" data-testid="flashcards-scope">
      <div>
        <h2 className="text-sm font-medium text-fg-muted">Nauka z wybranego zakresu</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {studentView ? "Fiszki tylko z jednego aktu prawnego wybranego przedmiotu." : "Fiszki tylko z jednej dziedziny albo jednego aktu prawnego."}
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm sm:max-w-md">
        <span className="text-fg-muted">Zakres</span>
        <select
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-field bg-surface-2 px-3 text-sm"
        >
          <option value="all">Cała pula</option>
          {groups.map((group) => (
            <optgroup key={group.id} label={group.name}>
              {/* Zakres „cała dziedzina" istnieje tylko dla aplikacji; przedmiot nie jest zakresem sesji. */}
              {!studentView && <option value={`field:${group.id}`}>Cała dziedzina: {group.name}</option>}
              {group.acts.map((act) => (
                <option key={act.id} value={`act:${act.id}`}>
                  {act.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div>
          <dt className="text-sm text-fg-muted">Do powtórki</dt>
          <dd data-testid="scope-due" className="tabular-nums text-2xl font-bold">
            {due ?? "—"}
          </dd>
          <dd className="text-xs text-fg-muted">{due === undefined ? "" : pluralizePl(due, FLASHCARD_FORMS)}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">Nowe</dt>
          <dd data-testid="scope-new" className="tabular-nums text-2xl font-bold">
            {fresh ?? "—"}
          </dd>
          <dd className="text-xs text-fg-muted">{fresh === undefined ? "" : pluralizePl(fresh, FLASHCARD_FORMS)}</dd>
        </div>
      </dl>

      <div>
        <Link
          to={choice === "all" ? ROUTES.studyAll : ROUTES.studyScope(scope)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-5 text-sm font-medium text-fg transition-colors hover:bg-line"
        >
          <Play size={16} aria-hidden="true" />
          Ucz się z tego zakresu
        </Link>
      </div>
    </Card>
  );
}
