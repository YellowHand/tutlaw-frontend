import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { ROUTES } from "../../config/routes";
import { usePool } from "../pool/hooks";
import { useDueCount } from "../review/hooks";
import { DrawFromPoolCard } from "./DrawFromPoolCard";
import { DueBar } from "./DueBar";
import { formatCount } from "./format";
import { QuickSets } from "./QuickSets";
import { TestKindCards } from "./TestKindCards";

/**
 * Testy: od góry pasek „do powtórki" (jedyny ze złotą obwódką), „Losuj z całej puli" (liczba pytań i Start), trzy rodzaje
 * testu do ułożenia (Nauka, Powtórki, Egzamin próbny) i szybkie zestawy (błędy, zmiany w prawie, nowe pytania), które
 * zaczynają się od razu. Nauka i Powtórki prowadzą na własne podstrony z kreatorem (źródło pytań, przepisy z rozdziałami,
 * liczba pytań), a Egzamin próbny na ekran egzaminu. Treść jest rozciągnięta na całą szerokość, jak w Fiszkach.
 */
export function TestsPage() {
  // To samo zapytanie co odznaka „Testy" w menu, więc nie kosztuje dodatkowego żądania. Błąd po prostu nic nie dopisuje.
  const { data: dueTests } = useDueCount("TEST");
  const pool = usePool().data;
  const dueCount = dueTests ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title="Testy"
        subtitle="Wybierz, co chcesz zrobić."
        actions={
          <Link
            to={ROUTES.myTests}
            data-testid="my-tests-link"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:bg-surface-2"
          >
            <History size={16} aria-hidden="true" className="text-fg-muted" />
            Moje testy
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-4 pb-8 sm:gap-7 sm:px-8">
        {pool?.narrowed && (
          <p data-testid="narrowed-note" className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            Uczysz się z wybranego zakresu: {formatCount(pool.questionCount)} pytań. Zmienisz to w{" "}
            <Link to={ROUTES.account} className="text-accent-ink underline underline-offset-2">
              Koncie
            </Link>
            .
          </p>
        )}

        <DueBar count={dueCount} />

        <DrawFromPoolCard />

        <TestKindCards dueCount={dueCount} />

        <QuickSets />
      </div>
    </PageContainer>
  );
}
