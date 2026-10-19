import { COPY } from "./copy";
import { TrackChips } from "./TrackChips";
import { Section, Wrap } from "./ui";

export function FaqSection() {
  return (
    <Section id="faq" labelledBy="landing-faq">
      <Wrap className="grid grid-cols-1 gap-8 @min-[960px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] @min-[960px]:gap-16">
        <div className="grid content-start gap-3.5">
          <h2 id="landing-faq" className="text-lp-h2 text-balance break-words">
            {COPY.faq.title}
          </h2>
          <p className="max-w-[36em] text-lp-body text-pretty text-fg-soft">{COPY.faq.lead}</p>
        </div>
        <div className="min-w-0 border-b border-line">
          {COPY.faq.items.map((item) => (
            <details key={item.q} className="group border-t border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[1.0625rem] leading-snug font-bold [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mr-1 size-2.5 flex-none rotate-45 border-r-[2.5px] border-b-[2.5px] border-accent transition-transform duration-200 group-open:rotate-[225deg]"
                />
              </summary>
              <div className="grid gap-3.5 pb-[22px]">
                <p className="max-w-[62ch] text-pretty text-fg-soft">{item.a}</p>
                {item.tracks && <TrackChips />}
              </div>
            </details>
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
