import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getChaptersBySubject, setChapterProgress, type Chapter } from "../api/chapters";

export function ChaptersPage() {
  const { subjectId } = useParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    getChaptersBySubject(Number(subjectId)).then(setChapters);
  }, [subjectId]);

  async function toggleRead(chapter: Chapter) {
    const newValue = !chapter.isRead;
    await setChapterProgress(chapter.id, newValue);
    setChapters((prev) =>
      prev.map((c) => (c.id === chapter.id ? { ...c, isRead: newValue } : c))
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Rozdziały</h1>
      <ul className="flex flex-col gap-3 mb-8">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="border rounded p-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={chapter.isRead}
              onChange={() => toggleRead(chapter)}
            />
            <span>{chapter.title}</span>
          </li>
        ))}
      </ul>
      <Link to={`/study/${subjectId}`} className="bg-blue-600 text-white rounded p-3 inline-block">
        Rozpocznij naukę
      </Link>
      <Link to={`/subjects/${subjectId}/statistics`} className="ml-3 text-blue-600 underline">
  Zobacz statystyki
</Link>
    </div>
  );
}