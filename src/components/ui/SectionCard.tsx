import { useId, type ReactNode } from "react";
import { Card } from "./Card";

/** Karta z nagłówkiem do jednej części formularza (np. „Źródło pytań" w kreatorze testu i w egzaminie). */
export function SectionCard({ title, children, "data-testid": testId }: { title: string; children: ReactNode; "data-testid"?: string }) {
  const id = useId();
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6" role="group" aria-labelledby={id} data-testid={testId}>
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      {children}
    </Card>
  );
}

/** Wiersz podsumowania („Źródło" / „Zakres" / „Liczba"): mała etykieta nad pogrubioną wartością. Używać w `<dl>`. */
export function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words font-semibold">{children}</dd>
    </div>
  );
}
