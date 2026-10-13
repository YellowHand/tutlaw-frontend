import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { COPY } from "./copy";
import { DEMO_CORRECT, DEMO_TONE, demoOutcomeId, type DemoAnswer, type DemoTone } from "./demo";

const TONE_CLASS: Record<DemoTone, string> = {
  ok: "bg-paper-ok-bg text-paper-ok-ink",
  warn: "bg-paper-warn-bg text-paper-warn-ink",
  bad: "bg-paper-bad-bg text-paper-bad-ink",
};

function Tag({ tone, children }: { tone: "ok" | "yours"; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[0.8125rem] leading-normal font-extrabold text-white",
        tone === "ok" ? "bg-paper-ok" : "bg-ink"
      )}
    >
      {children}
    </span>
  );
}

/**
 * Działające przykładowe pytanie ABC: jedyny "odważny" element strony. Pokazuje na żywo, co Tutlaw robi z
 * odpowiedzią pewną i niepewną. Reguły w demo.ts, teksty w copy.ts.
 */
export function DemoQuestion() {
  const [answer, setAnswer] = useState<DemoAnswer | null>(null);
  const [unsure, setUnsure] = useState(false);
  const firstOption = useRef<HTMLInputElement>(null);
  const groupName = useId();
  const questionId = useId();
  const captionId = useId();

  const demo = COPY.demo;
  const outcome = answer ? demo.outcomes[demoOutcomeId(answer, unsure)] : null;
  const tone = answer ? DEMO_TONE[demoOutcomeId(answer, unsure)] : null;

  function reset() {
    setAnswer(null);
    setUnsure(false);
    // Przycisk "Spróbuj jeszcze raz" znika razem z wynikiem, więc fokus wraca na pierwszą opcję.
    firstOption.current?.focus();
  }

  return (
    <div>
      <p id={captionId} className="mb-3 text-[0.9375rem] font-bold text-fg-soft">
        {demo.caption}
      </p>
      <div
        role="group"
        aria-labelledby={captionId}
        className="overflow-hidden rounded-[18px] bg-paper text-ink shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_32px_64px_-28px_rgb(0_0_0/0.85)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-paper-line px-[clamp(16px,3cqw,24px)] py-3.5 text-sm font-bold text-ink-muted">
          <span>{demo.subject}</span>
          <span className="rounded-full bg-paper-chip px-2.5 py-0.5 text-[0.8125rem] text-[#4a463e]">{demo.badge}</span>
        </div>

        <div className="grid gap-4 p-[clamp(16px,3cqw,24px)]">
          <p id={questionId} className="font-display text-lp-question text-balance">
            {demo.question}
          </p>

          <label
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 py-2 text-[0.9375rem] leading-snug font-extrabold transition-colors has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
              unsure ? "border-solid border-ink bg-paper-warn-bg" : "border-dashed border-paper-dash hover:border-ink"
            )}
          >
            <input type="checkbox" className="sr-only" checked={unsure} onChange={(e) => setUnsure(e.target.checked)} />
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 flex-none place-items-center rounded-[7px] border-2 border-ink text-white",
                unsure ? "bg-ink" : "bg-white"
              )}
            >
              {unsure && <Check size={15} strokeWidth={3.5} />}
            </span>
            <span>
              <span>{demo.unsureLabel}</span>
              <small className="mt-px block text-[0.8125rem] leading-snug font-medium text-ink-muted">{demo.unsureHint}</small>
            </span>
          </label>

          <div role="radiogroup" aria-labelledby={questionId} className="relative grid gap-2.5">
            {demo.options.map((option, index) => {
              const answered = answer !== null;
              const chosen = answer === option.id;
              const correct = option.id === DEMO_CORRECT;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "relative grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 rounded-[14px] border-[1.5px] px-3.5 py-2.5 text-[1.0625rem] leading-snug font-semibold transition-colors has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                    answered && correct && "border-paper-ok bg-paper-ok-bg",
                    answered && chosen && !correct && "border-paper-bad bg-paper-bad-bg",
                    !(answered && (correct || chosen)) && "border-paper-line bg-paper-2 hover:border-ink"
                  )}
                >
                  <input
                    ref={index === 0 ? firstOption : undefined}
                    type="radio"
                    name={groupName}
                    className="sr-only"
                    checked={chosen}
                    onChange={() => setAnswer(option.id)}
                  />
                  <span className="grid size-8 place-items-center rounded-full border-[1.5px] border-ink text-[0.9375rem] font-extrabold">
                    {option.id.toUpperCase()}
                  </span>
                  <span>{option.text}</span>
                  {answered && (correct || chosen) && (
                    <span className="col-start-2 flex flex-wrap gap-1.5">
                      {correct && <Tag tone="ok">{demo.tagCorrect}</Tag>}
                      {chosen && <Tag tone="yours">{demo.tagYours}</Tag>}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div role="status" aria-live="polite" className="grid gap-2.5">
            {outcome && tone ? (
              <>
                <div key={`${answer}-${unsure}`} className={cn("animate-rise rounded-xl px-4 py-3.5", TONE_CLASS[tone])}>
                  <strong className="mb-0.5 block text-[1.0625rem] leading-snug">{outcome.title}</strong>
                  <p className="text-[0.9375rem] leading-normal">{outcome.text}</p>
                </div>
                <p className="px-0.5 text-sm leading-normal text-ink-muted">
                  <b className="text-ink">{demo.explainLead}</b> {demo.explain}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-11 cursor-pointer rounded-[10px] border-[1.5px] border-ink px-[18px] text-[0.9375rem] font-extrabold hover:bg-ink hover:text-paper"
                  >
                    {demo.again}
                  </button>
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-paper-hint px-4 py-3.5 text-[0.9375rem] leading-normal text-ink-soft">{demo.idle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
