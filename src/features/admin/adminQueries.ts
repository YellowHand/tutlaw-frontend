import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getAdminAct,
  getAdminActOptions,
  getAdminActs,
  getAdminCourses,
  getAdminFields,
  getAdminOverview,
  getAdminQuestion,
  getAdminQuestions,
  getAdminReports,
  getAdminSections,
  getAdminSheets,
  getAdminSources,
  getAdminTracks,
  getMarkedQuestions,
  getMarkSummary,
  getReportSummary,
  type ActFilter,
  type MarkListFilter,
  type QuestionFilter,
  type ReportFilter,
} from "../../api/admin";

/** Wspólny początek kluczy panelu: po każdej zmianie unieważniamy wszystko pod nim. */
const ADMIN = ["admin"] as const;

export function useAdminOverview() {
  return useQuery({ queryKey: [...ADMIN, "overview"], queryFn: getAdminOverview });
}

export function useAdminTracks() {
  return useQuery({ queryKey: [...ADMIN, "tracks"], queryFn: getAdminTracks });
}

export function useAdminCourses() {
  return useQuery({ queryKey: [...ADMIN, "courses"], queryFn: getAdminCourses });
}

export function useAdminFields() {
  return useQuery({ queryKey: [...ADMIN, "fields"], queryFn: getAdminFields });
}

export function useAdminActs(filter: ActFilter) {
  return useQuery({
    queryKey: [...ADMIN, "acts", filter],
    queryFn: () => getAdminActs(filter),
    // Przy zmianie strony lub filtra stara lista zostaje na ekranie, aż przyjdzie nowa (bez migania szkieletu).
    placeholderData: keepPreviousData,
  });
}

export function useAdminActOptions(enabled = true) {
  return useQuery({ queryKey: [...ADMIN, "act-options"], queryFn: getAdminActOptions, enabled });
}

export function useAdminAct(id: number) {
  return useQuery({ queryKey: [...ADMIN, "act", id], queryFn: () => getAdminAct(id), enabled: Number.isFinite(id) });
}

export function useAdminSections(actId: number) {
  return useQuery({ queryKey: [...ADMIN, "sections", actId], queryFn: () => getAdminSections(actId), enabled: Number.isFinite(actId) });
}

export function useAdminSheets(trackId?: number) {
  return useQuery({ queryKey: [...ADMIN, "sheets", trackId ?? "all"], queryFn: () => getAdminSheets(trackId) });
}

export function useAdminQuestions(filter: QuestionFilter) {
  return useQuery({
    queryKey: [...ADMIN, "questions", filter],
    queryFn: () => getAdminQuestions(filter),
    placeholderData: keepPreviousData,
  });
}

export function useAdminQuestion(id: number | null) {
  return useQuery({
    queryKey: [...ADMIN, "question", id],
    queryFn: () => getAdminQuestion(id as number),
    enabled: id !== null,
    // Edytujemy aktualną treść, a nie kopię sprzed chwili.
    gcTime: 0,
  });
}

export function useAdminSources(enabled = true) {
  return useQuery({ queryKey: [...ADMIN, "sources"], queryFn: getAdminSources, enabled });
}

export function useMarkSummary() {
  return useQuery({ queryKey: [...ADMIN, "mark-summary"], queryFn: getMarkSummary });
}

export function useMarkedQuestions(filter: MarkListFilter) {
  return useQuery({
    queryKey: [...ADMIN, "marked", filter],
    queryFn: () => getMarkedQuestions(filter),
    placeholderData: keepPreviousData,
  });
}

export function useAdminReports(filter: ReportFilter) {
  return useQuery({
    queryKey: [...ADMIN, "reports", filter],
    queryFn: () => getAdminReports(filter),
    placeholderData: keepPreviousData,
  });
}

export function useReportSummary() {
  return useQuery({ queryKey: [...ADMIN, "report-summary"], queryFn: getReportSummary });
}

/**
 * Zapis w panelu. Po sukcesie unieważnia wszystkie zapytania (panelu i reszty aplikacji): zmiana aktu, aplikacji czy arkusza
 * zmienia liczniki i pule pytań w wielu miejscach, a odświeżają się tylko te zapytania, które są teraz na ekranie.
 */
export function useAdminMutation<Variables, Result>(
  fn: (variables: Variables) => Promise<Result>,
  onSuccess?: (result: Result, variables: Variables) => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries();
      onSuccess?.(result, variables);
    },
  });
}
