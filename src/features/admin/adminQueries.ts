import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getAdminAct,
  getAdminActOptions,
  getAdminActs,
  getAdminCourses,
  getAdminFields,
  getAdminOverview,
  getAdminSections,
  getAdminSheets,
  getAdminTracks,
  type ActFilter,
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
