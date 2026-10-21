import { useRef, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatCount } from "../tests/format";
import { usePool } from "./hooks";
import { PoolDialog } from "./PoolDialog";
import { describePool, isStudentPool, questionsWord } from "./summary";

/**
 * „Zakres nauki" w Koncie: z których aktów prawnych (Student: z których przedmiotów) uczy się użytkownik. To trwałe
 * zawężenie, które obejmuje Testy, Fiszki i statystyki (ale nie egzamin próbny). Źródło pytań (Ministerstwo, autorskie)
 * i rozdziały wybiera się osobno przy każdym teście, więc tutaj ich nie ma.
 */
export function LearningScopeCard() {
  const { data, isLoading, isError, refetch } = usePool();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <Card id="zakres-nauki" data-testid="learning-scope-card">
      <h2 className="text-lg font-semibold">Zakres nauki</h2>
      {isLoading ? (
        <Skeleton className="mt-3 h-16 w-full" />
      ) : isError || !data ? (
        <div className="mt-3">
          <ErrorState message="Nie udało się pobrać zakresu nauki." onRetry={() => void refetch()} />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-fg-muted">
            {isStudentPool(data)
              ? "Przedmioty, z których się uczysz."
              : "Akty prawne Twojej ścieżki, z których się uczysz."}{" "}
            Zawężenie dotyczy Testów, Fiszek i statystyk, ale nie egzaminu próbnego. Źródło pytań i rozdziały wybierasz osobno
            przy każdym teście.
          </p>
          <p className="mt-3 text-sm" data-testid="scope-summary">
            <span className="font-medium">{describePool(data)}</span>
            <span className="text-fg-muted">
              {" "}
              · {formatCount(data.questionCount)} {questionsWord(data.questionCount)}
            </span>
          </p>
          <Button ref={buttonRef} type="button" variant="secondary" className="mt-4" onClick={() => setOpen(true)} data-testid="scope-change">
            Zmień zakres nauki
          </Button>
          {open && <PoolDialog pool={data} onClose={() => setOpen(false)} returnFocusTo={buttonRef} />}
        </>
      )}
    </Card>
  );
}
