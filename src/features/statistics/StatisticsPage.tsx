import { useState } from "react";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { ActMasteryList } from "./ActMasteryList";
import { ActivityChart } from "./ActivityChart";
import { FlashcardsSection } from "./FlashcardsSection";
import { LearningSummarySection } from "./LearningSummarySection";
import { MasterySection } from "./MasterySection";
import { RecentAnswersCard } from "./RecentAnswersCard";

/**
 * Statystyki w pięciu częściach: opanowanie pytań według źródła (z wyjaśnieniem, co znaczy „opanowane"), opanowanie
 * aktów prawnych, podsumowanie nauki (liczby odpowiedzi, czas nauki, średni czas na pytanie), ostatnie 30 dni
 * i aktywność, a na końcu fiszki. Tylko ostatnia część zależy od wyboru aktu prawnego.
 */
export function StatisticsPage() {
  const [actId, setActId] = useState<number | undefined>(undefined);

  return (
    <PageContainer>
      <PageHeader title="Statystyki" subtitle="Co już umiesz, jak Ci idzie i jak często się uczysz" />
      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <MasterySection />
        <ActMasteryList />
        <LearningSummarySection />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <RecentAnswersCard />
          <ActivityChart />
        </div>
        <FlashcardsSection actId={actId} onActChange={setActId} />
      </div>
    </PageContainer>
  );
}
