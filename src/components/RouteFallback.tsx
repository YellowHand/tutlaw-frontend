import { Skeleton } from "./ui/Skeleton";

/** Chwilowy wygląd ekranu, którego kod dopiero się pobiera (ekrany są ładowane przy pierwszym wejściu). */
export function RouteFallback() {
  return (
    <div role="status" aria-label="Wczytywanie" className="flex flex-col gap-4 p-4 sm:p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
