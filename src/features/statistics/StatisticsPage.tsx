import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { SubjectFilter } from "./SubjectFilter";
import { OverviewSummaryRow } from "./OverviewSummaryRow";
import { ChapterMasteryList } from "./ChapterMasteryList";
import { WeakCardsTable } from "./WeakCardsTable";
import { getSourcesBySubject } from "../../api/sources";

export function StatisticsPage() {
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);

  const { data: sources } = useQuery({
    queryKey: ["sources", subjectId],
    queryFn: () => getSourcesBySubject(subjectId!),
    enabled: !!subjectId,
  });

  const textbookSourceId = sources?.find((s) => s.sourceType === "TEXTBOOK")?.id;

  return (
    <div>
      <PageHeader title="Statystyki" actions={<SubjectFilter value={subjectId} onChange={setSubjectId} />} />
      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8">
        <OverviewSummaryRow subjectId={subjectId} />
        <ChapterMasteryList sourceId={textbookSourceId} />
        <WeakCardsTable subjectId={subjectId} />
      </div>
    </div>
  );
}