import { useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, Check, ClipboardList, Play } from "lucide-react";
import { setChapterProgress } from "../api/chapters";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/PageHeader";
import { cn } from "../lib/cn";
import { loadErrorMessage, serverMessage } from "../lib/errors";
import { ROUTES } from "../config/routes";
import { chaptersKey, parseId, useChaptersWithMastery, type ChapterWithMastery } from "../features/flashcards/hooks";
import { invalidateReviewData } from "../features/review/hooks";
import { NotFoundPage } from "../features/misc/NotFoundPage";

const ACTION_BASE = "inline-flex items-center gap-2 rounded-xl px-4 min-h-11 text-sm font-medium";
const NEEDS_READ_HINT = "Zaznacz co najmniej jeden rozdział";

export function ChaptersPage() {
  const { subjectId, sourceId } = useParams();
  const id = parseId(sourceId);
  const queryClient = useQueryClient();
  const { data: chapters, isError, error, refetch } = useChaptersWithMastery(id);
  // Rozdziały, których zmiana jest właśnie zapisywana, oraz ostatni błąd zapisu.
  const [savingIds, setSavingIds] = useState<ReadonlySet<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  if (id === undefined) return <NotFoundPage />;

  function setReadInCache(chapterId: number, isRead: boolean) {
    queryClient.setQueryData<ChapterWithMastery[]>(chaptersKey(id), (old) =>
      old?.map((c) => (c.id === chapterId ? { ...c, isRead } : c))
    );
  }

  function markSaving(chapterId: number, saving: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(chapterId);
      else next.delete(chapterId);
      return next;
    });
  }

  async function toggleRead(chapter: ChapterWithMastery) {
    if (savingIds.has(chapter.id)) return;

    const newValue = !chapter.isRead;
    setSaveError(null);
    markSaving(chapter.id, true);
    // Zmiana widoczna od razu; jeśli serwer jej nie przyjmie, wracamy do poprzedniego stanu.
    setReadInCache(chapter.id, newValue);
    try {
      await setChapterProgress(chapter.id, newValue);
      // Od przeczytanych rozdziałów zależy, które fiszki trafiają do nauki: odśwież licznik powtórek i statystyki.
      invalidateReviewData(queryClient);
    } catch (e) {
      setReadInCache(chapter.id, !newValue);
      setSaveError(serverMessage(e, "Nie udało się zapisać zmiany. Sprawdź połączenie i spróbuj ponownie."));
    } finally {
      markSaving(chapter.id, false);
    }
  }

  const hasReadChapter = chapters?.some((c) => c.isRead) ?? false;

  function action(to: string, label: string, icon: ReactNode, variant: "primary" | "outline") {
    const style =
      variant === "primary"
        ? "bg-accent text-accent-fg"
        : "border border-accent-ink text-accent-ink";
    if (hasReadChapter) {
      return (
        <Link to={to} className={cn(ACTION_BASE, style, variant === "primary" ? "hover:opacity-90" : "hover:bg-accent/10")}>
          {icon}
          {label}
        </Link>
      );
    }
    return (
      <button type="button" disabled title={NEEDS_READ_HINT} className={cn(ACTION_BASE, style, "cursor-not-allowed opacity-50")}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div>
      <PageHeader
        title="Rozdziały"
        actions={
          <div className="flex flex-wrap gap-2">
            {action(
              ROUTES.study(subjectId ?? "", sourceId ?? ""),
              "Rozpocznij naukę",
              <Play size={16} aria-hidden="true" />,
              "primary"
            )}
            {action(
              ROUTES.test(subjectId ?? "", sourceId ?? ""),
              "Rozpocznij test",
              <ClipboardList size={16} aria-hidden="true" />,
              "outline"
            )}
            <Link
              to={ROUTES.statistics}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 min-h-11 text-sm font-medium hover:bg-surface-2"
            >
              <BarChart3 size={16} aria-hidden="true" />
              Statystyki
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-2 px-4 pb-8 sm:px-8">
        {saveError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {saveError}
          </p>
        )}

        {isError ? (
          <ErrorState message={loadErrorMessage(error, "rozdziałów")} onRetry={() => refetch()} />
        ) : chapters === undefined ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : chapters.length === 0 ? (
          <EmptyState icon={BookOpen} title="Brak rozdziałów" description="Wkrótce pojawią się tu materiały." />
        ) : (
          chapters.map((chapter) => {
            const started = chapter.mastery?.cardsStarted ?? 0;
            const total = chapter.mastery?.totalCards ?? 0;

            return (
              <div key={chapter.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={chapter.isRead}
                    disabled={savingIds.has(chapter.id)}
                    onChange={() => void toggleRead(chapter)}
                    className="peer sr-only"
                  />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-field transition-colors peer-checked:border-accent-ink peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink">
                    {chapter.isRead && <Check size={14} className="text-accent-fg" aria-hidden="true" />}
                  </span>
                  <span className={cn("flex-1 text-sm", !chapter.isRead && "text-fg-muted")}>{chapter.title}</span>
                </label>

                {total > 0 && (
                  <div className="pl-9">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(started / total) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-fg-muted tabular-nums">
                      {started} / {total} fiszek
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
