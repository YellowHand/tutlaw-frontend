import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInterfaceSettings,
  updateInterfaceSettings,
  type InterfaceSettings,
  type InterfaceSettingsUpdate,
} from "../../api/interfaceSettings";

export const INTERFACE_SETTINGS_KEY = ["settings", "interface"] as const;

/** Po tylu odpowiedziach podpowiedź klawiszy znika sama (osobno w testach i w fiszkach). */
export const HINT_AUTO_HIDE_AFTER = 10;

export type StudyKind = "test" | "flashcard";

/**
 * Ustawienia interfejsu z konta. Przy wejściu na ekran zawsze pytamy serwer o świeże liczniki odpowiedzi.
 * Gdy serwer nie odpowie, `data` zostaje puste i ekrany działają tak, jakby nic nie było ukryte (podpowiedź i licznik
 * widoczne): to bezpieczniejsze niż chowanie czegokolwiek na podstawie braku danych.
 */
export function useInterfaceSettings() {
  return useQuery({
    queryKey: INTERFACE_SETTINGS_KEY,
    queryFn: getInterfaceSettings,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/** Zapis ustawienia z natychmiastową zmianą na ekranie; gdy zapis się nie uda, wracamy do poprzedniej wartości. */
export function useUpdateInterfaceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: InterfaceSettingsUpdate) => updateInterfaceSettings(update),
    onMutate: (update) => {
      const previous = queryClient.getQueryData<InterfaceSettings>(INTERFACE_SETTINGS_KEY);
      if (previous) queryClient.setQueryData<InterfaceSettings>(INTERFACE_SETTINGS_KEY, { ...previous, ...update });
      return { previous };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(INTERFACE_SETTINGS_KEY, settings);
    },
    onError: (_error, _update, context) => {
      if (context?.previous) queryClient.setQueryData(INTERFACE_SETTINGS_KEY, context.previous);
    },
  });
}

/**
 * Wywoływane po zapisanej odpowiedzi: zwiększa w pamięci licznik odpowiedzi z konta (serwer liczy to samo),
 * dzięki czemu podpowiedź znika od razu po dziesiątej odpowiedzi, bez kolejnego zapytania.
 */
export function useCountAnswer(kind: StudyKind): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.setQueryData<InterfaceSettings>(INTERFACE_SETTINGS_KEY, (current) => {
      if (!current) return current;
      return kind === "test"
        ? { ...current, testAnswers: Math.min(HINT_AUTO_HIDE_AFTER, current.testAnswers + 1) }
        : { ...current, flashcardReviews: Math.min(HINT_AUTO_HIDE_AFTER, current.flashcardReviews + 1) };
    });
  }, [queryClient, kind]);
}

/** Czy podpowiedź klawiszy w danym trybie jest stale ukryta: wyborem użytkownika albo po 10 odpowiedziach. */
export function isHintRetired(settings: InterfaceSettings | undefined, kind: StudyKind): boolean {
  if (!settings) return false;
  return kind === "test"
    ? settings.testHintHidden || settings.testAnswers >= HINT_AUTO_HIDE_AFTER
    : settings.flashcardHintHidden || settings.flashcardReviews >= HINT_AUTO_HIDE_AFTER;
}

/**
 * Ukrywanie i pokazywanie licznika czasu przy pytaniu (zapisane na koncie). `ready` jest false, dopóki nie wiemy,
 * czy licznik ma być schowany; gdy serwer nie odpowie, licznik jest widoczny, a przełączanie działa do końca wizyty.
 */
export function useQuestionTimerSetting() {
  const settings = useInterfaceSettings();
  const update = useUpdateInterfaceSettings();
  const [local, setLocal] = useState<boolean | null>(null);
  const hidden = local ?? settings.data?.questionTimerHidden ?? false;

  const toggle = useCallback(() => {
    const next = !hidden;
    setLocal(next);
    update.mutate({ questionTimerHidden: next });
  }, [hidden, update]);

  return { ready: !settings.isPending, hidden, toggle };
}
