import { useId, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExamTerm, type ExamTerm } from "../../api/examTerms";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { formatDatePl, startOfToday, toLocalDateKey } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { useIsAdmin } from "../auth/role";
import { EXAM_TERMS_KEY, LEARNING_SETTINGS_KEY, useExamTerms } from "./hooks";

/**
 * „Terminy egzaminów" w Koncie, tylko dla administratora (serwer i tak sprawdza rolę przy każdym zapisie). Jedna data na
 * aplikację (ścieżkę egzaminacyjną; Student terminu nie ma): od niej zależą odliczanie, tryb egzaminacyjny i plan nowych
 * pytań u wszystkich, którzy tę ścieżkę wybrali.
 * Pusta data to „termin nieogłoszony". Zmiana działa od razu, ale już wyznaczone terminy powtórek nie są przeliczane.
 */
export function ExamTermsCard() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return <ExamTermsEditor />;
}

function ExamTermsEditor() {
  const { data, isLoading, isError, refetch } = useExamTerms();

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }
  if (isError || !Array.isArray(data)) {
    return (
      <Card>
        <ErrorState message="Nie udało się pobrać terminów egzaminów." onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <Card data-testid="exam-terms">
      <h2 className="mb-1 text-base font-semibold">Terminy egzaminów</h2>
      <p className="mb-2 max-w-prose text-sm text-fg-muted">
        Ustawiasz je jako administrator, jedną datę na aplikację. Użytkownicy wybierają aplikację, a odliczanie i plan nauki
        biorą datę stąd. Puste pole oznacza „termin nieogłoszony".
      </p>
      <ul className="flex flex-col divide-y divide-line">
        {data.map((term) => (
          <ExamTermRow key={term.track.id} term={term} />
        ))}
      </ul>
    </Card>
  );
}

function ExamTermRow({ term }: { term: ExamTerm }) {
  const { track } = term;
  const queryClient = useQueryClient();
  const inputId = useId();
  const today = useMemo(() => toLocalDateKey(startOfToday()), []);
  const stored = term.examDate ?? "";
  const [value, setValue] = useState(stored);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: (examDate: string | null) => updateExamTerm(track.id, examDate),
    onSuccess: (updated) => {
      queryClient.setQueryData<ExamTerm[]>(EXAM_TERMS_KEY, (old) =>
        Array.isArray(old) ? old.map((t) => (t.track.id === updated.track.id ? updated : t)) : old
      );
      // Termin wpływa na ustawienia nauki (odliczanie, plan) wszystkich, którzy wybrali tę aplikację, także admina.
      void queryClient.invalidateQueries({ queryKey: LEARNING_SETTINGS_KEY });
      setValue(updated.examDate ?? "");
      setSaved(true);
    },
    onError: (err) => setError(serverMessage(err, "Nie udało się zapisać terminu. Spróbuj ponownie.")),
  });

  function save(next: string) {
    setError(null);
    setSaved(false);
    mutation.mutate(next === "" ? null : next);
  }

  const dirty = value !== stored;
  const status = !term.examDate
    ? "termin nieogłoszony"
    : term.daysToExam == null
      ? `${formatDatePl(term.examDate)}, już minął`
      : `${formatDatePl(term.examDate)}, za ${term.daysToExam} ${pluralizePl(term.daysToExam, { one: "dzień", few: "dni", many: "dni" })}`;

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-end sm:gap-4" data-testid={`exam-term-${track.slug}`}>
      <div className="min-w-0 sm:flex-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-fg">
          {track.name}
        </label>
        <p className="text-xs text-fg-muted" data-testid={`exam-term-status-${track.slug}`}>
          Teraz: {status}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
        {saved && !dirty && !mutation.isPending && (
          <p role="status" className="mt-1 text-xs text-success">
            Zapisano.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          type="date"
          min={today}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
            setError(null);
          }}
          className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
        />
        {/* Stała szerokość miejsca na przyciski, żeby pola dat stały w jednej linii także w wierszach bez „Usuń termin". */}
        <div className="flex items-center gap-2 sm:w-48">
          <Button type="button" variant="secondary" disabled={!dirty || mutation.isPending} onClick={() => save(value)}>
            {mutation.isPending ? "Zapisuję..." : "Zapisz"}
          </Button>
          {stored !== "" && (
            <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => save("")}>
              Usuń termin
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
