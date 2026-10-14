import { cn } from "../../lib/cn";

const STEPS = [
  { when: "na początku", title: "Pierwsza poprawna odpowiedź", text: "Pytanie wraca po około 2 dniach." },
  { when: "po około 2 dniach", title: "Druga poprawna odpowiedź", text: "Następna powtórka dopiero za około 10 dni." },
  { when: "po około 2 tygodniach", title: "Trzecia poprawna odpowiedź", text: "Pytanie jest opanowane i wraca za ponad miesiąc." },
] as const;

/**
 * Wyjaśnienie, czym jest „opanowane" i kiedy pytanie takie się staje. Stoi pod liczbami, bo bez niego „0 opanowanych"
 * przez pierwsze dwa tygodnie wygląda jak porażka, a to normalny przebieg: serwer uznaje pytanie za opanowane, gdy jego
 * stabilność przekroczy 21 dni, a przy powtórkach w terminie dzieje się to po trzeciej poprawnej odpowiedzi.
 */
export function MasteryExplainer({ className }: { className?: string }) {
  return (
    <aside
      aria-labelledby="mastery-explainer-title"
      data-testid="mastery-explainer"
      className={cn("flex flex-col gap-4 rounded-xl border border-line bg-surface-2 p-4 sm:p-5", className)}
    >
      <div>
        <h3 id="mastery-explainer-title" className="text-sm font-semibold text-fg">
          Kiedy pytanie jest „opanowane"?
        </h3>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          Gdy jest zapamiętane tak mocno, że kolejna powtórka wypada za ponad 3 tygodnie. Nie da się tego osiągnąć od razu:
          potrzebne są trzy poprawne odpowiedzi rozłożone w czasie.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              "flex gap-3 rounded-lg border p-3",
              index === STEPS.length - 1 ? "border-accent-ink/50 bg-accent/10" : "border-line bg-surface"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                index === STEPS.length - 1 ? "bg-accent text-accent-fg" : "border border-field bg-surface-2 text-fg-muted"
              )}
            >
              {index + 1}
            </span>
            <p className="min-w-0 text-sm">
              <span className="font-medium text-fg">{step.title}</span>
              <span className="block text-xs text-fg-muted">{step.when}</span>
              <span className="mt-1 block text-fg-muted">{step.text}</span>
            </p>
          </li>
        ))}
      </ol>

      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-fg-muted">
        <li>
          Przez pierwsze dwa tygodnie nauki opanowanych jest 0. To normalne: pierwsze pytania dochodzą do trzeciej odpowiedzi
          dopiero po około dwóch tygodniach.
        </li>
        <li>
          Błędna odpowiedź albo zaznaczone „Nie jestem pewien" zwykle cofa pytanie do „W nauce", więc liczba opanowanych
          może też spaść.
        </li>
      </ul>
    </aside>
  );
}
