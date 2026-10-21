import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/**
 * Szerokość treści ekranów z menu (Testy, Pulpit, Statystyki, Egzamin i podstrony Testów). Treść rozciąga się na całą
 * dostępną szerokość, jak w Fiszkach, a dopiero na bardzo szerokich monitorach staje się wyśrodkowaną kolumną, żeby karty
 * nie rozjeżdżały się bez końca. Nagłówek strony też należy do kolumny, więc tytuł, przyciski i karty zawsze są w jednej linii.
 */
export const PAGE_WIDTH = "mx-auto w-full max-w-[1680px]";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(PAGE_WIDTH, className)} {...props} />;
}
