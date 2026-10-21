import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { chooseTrack, type LearningSettings } from "../../api/settings";
import { formatDatePl } from "../../lib/date";
import { pluralizePl } from "../../lib/plural";
import { invalidateAfterPoolChange, POOL_KEY } from "../pool/hooks";
import { LEARNING_SETTINGS_KEY } from "./hooks";

/**
 * Po wyborze ścieżki serwer zmienia pulę pytań (akty ścieżki albo własne arkusze) i zdejmuje zawężenie do aktów, więc
 * odświeżamy wszystko, co liczy pytania: pulę, katalog Testów, liczniki powtórek i błędów, kreator testu oraz statystyki.
 */
export function refreshAfterTrackChosen(queryClient: QueryClient, settings: LearningSettings): void {
  queryClient.setQueryData(LEARNING_SETTINGS_KEY, settings);
  void queryClient.invalidateQueries({ queryKey: POOL_KEY });
  invalidateAfterPoolChange(queryClient);
}

/** Wybór ścieżki, do której użytkownik się przygotowuje: jedna z pięciu aplikacji albo Student (zmiana w Koncie). */
export function useChooseTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: number) => chooseTrack(trackId),
    onSuccess: (settings) => refreshAfterTrackChosen(queryClient, settings),
  });
}

/** „egzamin 15 marca 2027, za 154 dni", „termin nieogłoszony" albo null, gdy terminów nie udało się pobrać. */
export function examTermLine(date: string | null | undefined, days: number | null | undefined, loaded: boolean): string | null {
  if (!loaded) return null;
  if (!date) return "termin nieogłoszony";
  if (days == null) return `egzamin ${formatDatePl(date)}`;
  if (days === 0) return `egzamin dzisiaj, ${formatDatePl(date)}`;
  return `egzamin ${formatDatePl(date)}, za ${days} ${pluralizePl(days, { one: "dzień", few: "dni", many: "dni" })}`;
}
