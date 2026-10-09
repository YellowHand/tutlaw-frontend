import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getOverview, getChapterMastery, getWeakCards, getActivity,
  type OverviewResponse, type ChapterMastery, type WeakCard, type ActivityItem
} from "../api/statistics";

export function StatisticsPage() {
  const { subjectId } = useParams();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [chapters, setChapters] = useState<ChapterMastery[]>([]);
  const [weakCards, setWeakCards] = useState<WeakCard[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    const id = Number(subjectId);
    getOverview(id).then(setOverview);
    getChapterMastery(id).then(setChapters);
    getWeakCards(id).then(setWeakCards);
    getActivity(30).then(setActivity);
  }, [subjectId]);

  if (!overview) return <p className="p-10">Ładowanie statystyk...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Statystyki</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Wszystkie fiszki" value={overview.totalCards} />
        <StatCard label="Rozpoczęte" value={overview.cardsStarted} />
        <StatCard label="Opanowane" value={overview.matureCards} />
        <StatCard label="Retencja (30 dni)" value={`${overview.retentionRate.toFixed(0)}%`} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Prognoza powtórek (7 dni)</h2>
      <div className="flex gap-3 mb-8">
        {overview.upcomingReviews.map((d) => (
          <div key={d.date} className="text-center">
            <div className="text-xs text-gray-500">{d.date.slice(5)}</div>
            <div className="font-bold">{d.count}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Opanowanie per rozdział</h2>
      <div className="flex flex-col gap-3 mb-8">
        {chapters.map((c) => (
          <div key={c.chapterId}>
            <div className="flex justify-between text-sm mb-1">
              <span>{c.chapterTitle}</span>
              <span>{c.masteryPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className={`h-2 rounded ${
                  c.masteryPercentage < 50 ? "bg-red-500" :
                  c.masteryPercentage < 80 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${c.masteryPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Najsłabsze pojęcia</h2>
      <ul className="flex flex-col gap-2 mb-8">
        {weakCards.map((wc) => (
          <li key={wc.cardId} className="border rounded p-3 flex justify-between">
            <span>{wc.front}</span>
            <span className="text-sm text-gray-500">
              R: {(wc.currentRetrievability * 100).toFixed(0)}% · zapomnień: {wc.lapses}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-3">Aktywność (30 dni)</h2>
      <div className="flex gap-1 flex-wrap">
        {activity.map((item) => {
          const max = Math.max(...activity.map((a) => a.reviewCount), 1);
          const intensity = item.reviewCount / max;
          return (
            <div
              key={item.date}
              title={`${item.date}: ${item.reviewCount} powtórek`}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(37, 99, 235, ${intensity === 0 ? 0.08 : intensity})` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}