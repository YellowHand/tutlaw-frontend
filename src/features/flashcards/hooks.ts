import { useQuery } from "@tanstack/react-query";
import { getCategories, type Category } from "../../api/categories";
import { getSubjectsByCategory } from "../../api/subjects";
import { getSourceProgress, getSourcesBySubject, type Source, type SourceProgress } from "../../api/sources";
import { getChapterMastery, getChaptersBySource, type Chapter, type ChapterMastery } from "../../api/chapters";

/** Parametr z adresu na liczbę; zły albo brakujący parametr to undefined (zapytanie się wtedy nie wysyła). */
export function parseId(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export const CATEGORIES_KEY = ["catalog", "categories"] as const;
export const subjectsKey = (categoryId: number | undefined) => ["catalog", "subjects", categoryId] as const;
export const sourcesKey = (subjectId: number | undefined) => ["catalog", "sources", subjectId] as const;
export const chaptersKey = (sourceId: number | undefined) => ["catalog", "chapters", sourceId] as const;

/** Wszystkie rodzaje (działy). Rzadko się zmieniają, więc domyślny czas ważności wystarcza. */
export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: getCategories });
}

/** Puste rodzaje (np. działy prawa, do których jeszcze nic nie przeniesiono) nie są w Fiszkach potrzebne. */
function onlyNonEmpty(categories: Category[]): Category[] {
  return categories.filter((c) => c.subjectCount > 0);
}

export function useNonEmptyCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: getCategories, select: onlyNonEmpty });
}

export function useSubjects(categoryId: number | undefined) {
  return useQuery({
    queryKey: subjectsKey(categoryId),
    queryFn: () => getSubjectsByCategory(categoryId as number),
    enabled: categoryId !== undefined,
  });
}

export interface SourceWithProgress extends Source {
  progress?: SourceProgress;
}

/** Źródła przedmiotu razem z postępem. staleTime 0: po powrocie z nauki paski postępu są świeże. */
export function useSourcesWithProgress(subjectId: number | undefined) {
  return useQuery({
    queryKey: sourcesKey(subjectId),
    enabled: subjectId !== undefined,
    staleTime: 0,
    queryFn: async (): Promise<SourceWithProgress[]> => {
      const [sources, progress] = await Promise.all([
        getSourcesBySubject(subjectId as number),
        getSourceProgress(subjectId as number),
      ]);
      const progressBySourceId = new Map(progress.map((p) => [p.sourceId, p]));
      return (
        sources
          .map((s) => ({ ...s, progress: progressBySourceId.get(s.id) }))
          // Pula samych pytań testowych nie ma w Fiszkach czego uczyć. Podręcznik zostaje zawsze, bo to tu
          // oznacza się przeczytane rozdziały, od których zależą pytania testowe.
          .filter((s) => !(s.sourceType === "FLAT_POOL" && s.progress !== undefined && s.progress.totalCards === 0))
      );
    },
  });
}

export interface ChapterWithMastery extends Chapter {
  mastery?: ChapterMastery;
}

/** Rozdziały źródła razem z postępem w każdym z nich. */
export function useChaptersWithMastery(sourceId: number | undefined) {
  return useQuery({
    queryKey: chaptersKey(sourceId),
    enabled: sourceId !== undefined,
    staleTime: 0,
    queryFn: async (): Promise<ChapterWithMastery[]> => {
      const [chapters, mastery] = await Promise.all([
        getChaptersBySource(sourceId as number),
        getChapterMastery(sourceId as number),
      ]);
      const masteryByChapterId = new Map(mastery.map((m) => [m.chapterId, m]));
      return chapters.map((c) => ({ ...c, mastery: masteryByChapterId.get(c.id) }));
    },
  });
}
