import { Check } from "lucide-react";
import { ORIGIN_ORDER } from "../../lib/origin";
import { cn } from "../../lib/cn";
import { originGroupLabel } from "../statistics/originStats";
import { COPY } from "./copy";
import { Section, Wrap } from "./ui";

const CARD = "flex min-w-0 flex-col gap-3 rounded-[18px] border p-[clamp(20px,3cqw,32px)]";
// Kolory osobno, bo cn() nie rozstrzyga konfliktów klas Tailwinda (dwie klasy bg-* naraz = wygrywa przypadkowa).
const CARD_DARK = "border-line bg-surface";
const CARD_PAPER = "border-paper bg-paper text-ink";
const CARD_TITLE = "text-lp-h3 text-balance";
const CARD_TEXT = "text-fg-soft";

/** Siatka "bento": karty różnej wielkości. Układ: 1 kolumna, od 640 px dwie, od 1000 px sześć. */
export function FeaturesSection() {
  const f = COPY.features;
  return (
    <Section id="funkcje" labelledBy="landing-features" className="pt-0">
      <Wrap>
        <div className="grid max-w-[44rem] gap-3.5">
          <h2 id="landing-features" className="text-lp-h2 text-balance break-words">
            {f.title}
          </h2>
          <p className="max-w-[36em] text-lp-body text-pretty text-fg-soft">{f.lead}</p>
        </div>

        <div className="mt-[clamp(32px,5cqw,56px)] grid grid-cols-1 gap-4 @min-[640px]:grid-cols-2 @min-[1000px]:grid-cols-6">
          <article className={cn(CARD, CARD_DARK, "@min-[640px]:col-span-full @min-[1000px]:col-span-4")}>
            <h3 className={CARD_TITLE}>{f.tests.title}</h3>
            <p className={CARD_TEXT}>{f.tests.text}</p>
            <p className="mt-1 text-sm font-bold text-fg-muted">{f.tests.chipsLead}</p>
            <ul className="flex flex-wrap gap-2">
              {ORIGIN_ORDER.map((origin) => (
                <li
                  key={origin}
                  className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm leading-snug font-semibold text-[#e3e0da]"
                >
                  {originGroupLabel(origin)}
                </li>
              ))}
            </ul>
          </article>

          <article className={cn(CARD, CARD_PAPER, "@min-[1000px]:col-span-2")}>
            <h3 className={CARD_TITLE}>{f.unsure.title}</h3>
            <p className="text-ink-soft">{f.unsure.text}</p>
            <div
              aria-hidden="true"
              className="mt-1.5 flex items-center gap-3 rounded-[14px] border-[1.5px] border-ink bg-paper-warn-bg px-3.5 py-2.5 text-[0.9375rem] font-extrabold"
            >
              <span className="grid size-6 flex-none place-items-center rounded-[7px] border-2 border-ink bg-ink text-white">
                <Check size={15} strokeWidth={3.5} />
              </span>
              <span>{f.unsure.sample}</span>
            </div>
          </article>

          <article className={cn(CARD, CARD_DARK, "@min-[1000px]:col-span-2")}>
            <h3 className={CARD_TITLE}>{f.reviews.title}</h3>
            <p className={CARD_TEXT}>{f.reviews.text}</p>
          </article>

          <article className={cn(CARD, CARD_DARK, "@min-[1000px]:col-span-2")}>
            <h3 className={CARD_TITLE}>{f.flashcards.title}</h3>
            <p className={CARD_TEXT}>{f.flashcards.text}</p>
          </article>

          <article className={cn(CARD, CARD_DARK, "@min-[1000px]:col-span-2")}>
            <h3 className={CARD_TITLE}>{f.exam.title}</h3>
            <p className={CARD_TEXT}>{f.exam.text}</p>
          </article>

          <article className={cn(CARD, CARD_DARK, "@min-[640px]:col-span-full")}>
            <div className="grid grid-cols-1 items-start gap-5 @min-[760px]:grid-cols-2 @min-[760px]:gap-7">
              <div className="grid min-w-0 gap-4">
                <h3 className={CARD_TITLE}>{f.stats.title}</h3>
                <p className={CARD_TEXT}>{f.stats.text}</p>
              </div>
              <div className="grid min-w-0 gap-3.5 rounded-[14px] bg-surface-2 p-4">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[0.8125rem] font-bold text-fg-muted">
                  <span>{f.stats.sampleTitle}</span>
                  <span>{f.stats.sampleBadge}</span>
                </div>
                <ul className="grid gap-3">
                  {f.stats.sample.map((row) => (
                    <li key={row.label} className="grid gap-1.5">
                      <div className="flex justify-between gap-3 text-sm leading-snug font-semibold">
                        <span>{row.label}</span>
                        <span className="flex-none font-extrabold">{row.value}%</span>
                      </div>
                      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#38383e]">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${row.value}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="grid grid-cols-2 gap-2.5">
                  {[f.stats.confidentMistakes, f.stats.fragile].map((item) => (
                    <div key={item.label} className="rounded-[10px] bg-surface px-3 py-2.5">
                      <dt className="text-[0.8125rem] leading-snug text-fg-muted">{item.label}</dt>
                      <dd className="text-[1.375rem] leading-snug font-extrabold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </article>
        </div>
      </Wrap>
    </Section>
  );
}
