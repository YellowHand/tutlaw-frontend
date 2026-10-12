import { useState } from "react";
import { DashboardModeSwitcher, type DashboardMode } from "./DashboardModeSwitcher";
import { QuickActions } from "./QuickActions";
import { ProgressSummaryCard } from "./ProgressSummaryCard";
import { WeeklyBarsCard } from "./WeeklyBarsCard";
import { RetentionRingCard } from "./RetentionRingCard";
import { TestsComingSoonCard } from "./TestsComingSoonCard";

export function DashboardPage() {
  const [mode, setMode] = useState<DashboardMode>("flashcards");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Cześć!</h1>

      <QuickActions />

      <div className="mt-1 flex items-center justify-between">
        <h2 className="text-sm font-medium text-fg-muted">Twoje postępy</h2>
        <DashboardModeSwitcher value={mode} onChange={setMode} />
      </div>

      {mode === "flashcards" ? (
        <div aria-live="polite" className="flex flex-col gap-3">
          <ProgressSummaryCard />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
            <WeeklyBarsCard />
            <RetentionRingCard />
          </div>
        </div>
      ) : (
        <div aria-live="polite">
          <TestsComingSoonCard />
        </div>
      )}
    </div>
  );
}