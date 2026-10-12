import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart3, Check, ClipboardList, Play } from "lucide-react";
import { getChaptersBySource, getChapterMastery, setChapterProgress, type Chapter, type ChapterMastery } from "../api/chapters";
import { Skeleton } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/PageHeader";
import { cn } from "../lib/cn";
import { ROUTES } from "../config/routes";

interface ChapterWithMastery extends Chapter {
  mastery?: ChapterMastery;
}

export function ChaptersPage() {
  const { subjectId, sourceId } = useParams();
  const [chapters, setChapters] = useState<ChapterWithMastery[] | null>(null);

  useEffect(() => {
    if (!sourceId) return;
    const id = Number(sourceId);

    Promise.all([getChaptersBySource(id), getChapterMastery(id)]).then(([chapterList, masteryList]) => {
      const masteryByChapterId = new Map(masteryList.map((m) => [m.chapterId, m]));
      setChapters(chapterList.map((c) => ({ ...c, mastery: masteryByChapterId.get(c.id) })));
    });
  }, [sourceId]);

  async function toggleRead(chapter: ChapterWithMastery) {
    const newValue = !chapter.isRead;
    setChapters((prev) => prev && prev.map((c) => (c.id === chapter.id ? { ...c, isRead: newValue } : c)));
    await setChapterProgress(chapter.id, newValue);
  }

  const hasReadChapter = chapters?.some((c) => c.isRead) ?? false;

  const studyButtonClass = "inline-flex items-center gap-2 rounded-xl bg-accent px-4 min-h-11 text-sm font-medium text-accent-fg";

  return (
    <div>
      <PageHeader
        title="Rozdziały"
        actions={
          <div className="flex flex-wrap gap-2">
  {hasReadChapter ? (
  <Link
    to={ROUTES.study(subjectId ?? "", sourceId ?? "")}
    className={cn(studyButtonClass, "hover:opacity-90")}
  >
    <Play size={16} aria-hidden="true" />
    Rozpocznij naukę
  </Link>
) : (
  <button
    type="button"
    disabled
    title="Zaznacz co najmniej jeden rozdział"
    className={cn(studyButtonClass, "cursor-not-allowed opacity-50")}
  >
    <Play size={16} aria-hidden="true" />
    Rozpocznij naukę
  </button>
)}

            <Link
              to={ROUTES.test(subjectId ?? "", sourceId ?? "")}
              className="inline-flex items-center gap-2 rounded-xl border border-accent px-4 min-h-11 text-sm font-medium text-accent hover:bg-accent/10"
            >
              <ClipboardList size={16} aria-hidden="true" />
              Rozpocznij test
            </Link>
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
        {chapters === null
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
          : chapters.map((chapter) => {
              const started = chapter.mastery?.cardsStarted ?? 0;
              const total = chapter.mastery?.totalCards ?? 0;

              return (
                <div key={chapter.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
                  <label className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={chapter.isRead} onChange={() => toggleRead(chapter)} className="peer sr-only" />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line transition-colors peer-checked:border-accent peer-checked:bg-accent">
                      {chapter.isRead && <Check size={14} className="text-accent-fg" aria-hidden="true" />}
                    </span>
                    <span className={cn("flex-1 text-sm", !chapter.isRead && "text-fg-muted")}>{chapter.title}</span>
                  </label>

                  {total > 0 && (
                    <div className="pl-9">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(started / total) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-fg-muted tabular-nums">{started} / {total} fiszek</p>
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}