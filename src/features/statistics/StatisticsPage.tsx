import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { getSourcesBySubject } from "../../api/sources";
import { ActivityChart } from "./ActivityChart";
import { FlashcardsSection } from "./FlashcardsSection";
import { LearningSummarySection } from "./LearningSummarySection";
import { MasterySection } from "./MasterySection";
import { RecentAnswersCard } from "./RecentAnswersCard";

/**
 * Statystyki w czterech częściach: opanowanie pytań (z wyjaśnieniem, co znaczy „opanowane"), podsumowanie nauki (liczby
 * odpowiedzi, czas nauki, średni czas na pytanie), ostatnie 30 dni i aktywność, a na końcu fiszki z podręcznikiem.
 * Tylko ostatnia część zależy od wyboru przedmiotu.
 */
export function StatisticsPage() {
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);

  const { data: sources } = useQuery({
    queryKey: ["sources", subjectId],
    queryFn: () => getSourcesBySubject(subjectId!),
    enabled: !!subjectId,
  });

  const textbookSourceId = sources?.find((s) => s.sourceType === "TEXTBOOK")?.id;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Statystyki" subtitle="Co już umiesz, jak Ci idzie i jak często się uczysz" />
      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <MasterySection />
        <LearningSummarySection />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <RecentAnswersCard />
          <ActivityChart />
        </div>
        <FlashcardsSection subjectId={subjectId} onSubjectChange={setSubjectId} textbookSourceId={textbookSourceId} />
      </div>
    </div>
  );
}
