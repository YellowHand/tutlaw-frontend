import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";

/** Dane zalogowanego konta: adres e-mail w pasku bocznym i na ekranie Konto (jedno zapytanie, wspólna pamięć podręczna). */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 5 * 60_000 });
}
