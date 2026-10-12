import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitExam, type ExamAnswerPayload, type ExamResult, type ExamStart } from "../../api/exam";
import { PageHeader } from "../../components/layout/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { fetchMe } from "../account/api";
import { clearDraft, loadDraft, saveDraft, type ExamDraft } from "./examStorage";
import { ExamResultView } from "./ExamResultView";
import { ExamRunner } from "./ExamRunner";
import { ExamSetup, type ExamConfig } from "./ExamSetup";
import { EXAM_HISTORY_KEY } from "./hooks";

/** Najdłuższy czas trwania, jaki przyjmuje serwer (48 godzin). */
const MAX_DURATION_SECONDS = 172_800;

type Phase = { kind: "setup" } | { kind: "running"; exam: ExamDraft } | { kind: "result"; result: ExamResult };

/** Egzamin próbny: ustawienia → egzamin → raport. Kolejne fazy zastępują się na tej samej stronie. */
export function ExamPage() {
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 5 * 60_000 });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Egzamin próbny" />
        <div className="px-4 pb-8 sm:px-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  // Bez adresu konta nie wiadomo, czyj to egzamin, więc niczego nie zapisujemy ani nie wznawiamy.
  return <ExamFlow owner={me?.email ?? ""} />;
}

function ExamFlow({ owner }: { owner: string }) {
  const queryClient = useQueryClient();
  const persist = owner !== "";
  const [draft, setDraft] = useState<ExamDraft | null>(() => (persist ? loadDraft(owner) : null));
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleStarted = useCallback(
    (start: ExamStart, config: ExamConfig) => {
      const startedAtMs = Date.now();
      const exam: ExamDraft = {
        version: 1,
        owner,
        scope: config.scope,
        scopeLabel: start.scopeLabel,
        requestedCount: start.requestedCount,
        timeLimitMinutes: config.timeLimitMinutes,
        passThresholdPercent: config.passThresholdPercent,
        questions: start.questions,
        answers: {},
        flagged: [],
        currentIndex: 0,
        startedAtMs,
        deadlineMs: config.timeLimitMinutes === null ? null : startedAtMs + config.timeLimitMinutes * 60_000,
      };
      if (persist) saveDraft(exam);
      setDraft(null);
      setSubmitError(null);
      setPhase({ kind: "running", exam });
    },
    [owner, persist]
  );

  const handleSubmit = useCallback(
    async (exam: ExamDraft, answers: ExamAnswerPayload[], timedOut: boolean) => {
      setSubmitting(true);
      setSubmitError(null);
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - exam.startedAtMs) / 1000));
      // Po wznowieniu po długiej przerwie upłynęło więcej niż limit; do wyniku liczymy co najwyżej limit.
      const cap = exam.timeLimitMinutes === null ? MAX_DURATION_SECONDS : exam.timeLimitMinutes * 60;
      try {
        const result = await submitExam({
          ...exam.scope,
          timeLimitMinutes: exam.timeLimitMinutes,
          passThresholdPercent: exam.passThresholdPercent,
          durationSeconds: Math.min(elapsedSeconds, cap, MAX_DURATION_SECONDS),
          timedOut,
          answers,
        });
        // Zapis niedokończonego egzaminu kasujemy dopiero po udanym wysłaniu: błąd sieci nie może zabrać odpowiedzi.
        clearDraft();
        void queryClient.invalidateQueries({ queryKey: EXAM_HISTORY_KEY });
        setPhase({ kind: "result", result });
      } catch (err) {
        // Zawsze mówimy, że odpowiedzi są bezpieczne; komunikat serwera (jeśli jest) dopisujemy jako powód.
        const reason = serverMessage(err, "");
        setSubmitError(
          `Nie udało się wysłać egzaminu${reason ? `: ${reason}` : "."} Odpowiedzi są zapisane w tej przeglądarce, spróbuj jeszcze raz.`
        );
      } finally {
        setSubmitting(false);
      }
    },
    [queryClient]
  );

  const handleAbandon = useCallback(() => {
    clearDraft();
    setDraft(null);
    setSubmitError(null);
    setPhase({ kind: "setup" });
  }, []);

  if (phase.kind === "running") {
    const { exam } = phase;
    return (
      <ExamRunner
        exam={exam}
        persist={persist}
        submitting={submitting}
        submitError={submitError}
        onSubmit={(answers, timedOut) => void handleSubmit(exam, answers, timedOut)}
        onAbandon={handleAbandon}
      />
    );
  }

  if (phase.kind === "result") {
    return <ExamResultView result={phase.result} onNewExam={() => setPhase({ kind: "setup" })} />;
  }

  return (
    <div>
      <PageHeader
        title="Egzamin próbny"
        subtitle="Sprawdź się w warunkach zbliżonych do egzaminu: czas, próg zaliczenia i raport z błędami."
      />
      <div className="px-4 pb-8 sm:px-8">
        <ExamSetup
          draft={draft}
          onResume={() => draft && setPhase({ kind: "running", exam: draft })}
          onDiscard={handleAbandon}
          onStarted={handleStarted}
        />
      </div>
    </div>
  );
}
