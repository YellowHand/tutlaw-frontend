import { COPY } from "./copy";
import { ForgettingCurve } from "./ForgettingCurve";
import { Section, Wrap } from "./ui";

export function SpacedRepetitionSection() {
  return (
    <Section id="algorytm" labelledBy="landing-spaced">
      <Wrap className="grid grid-cols-1 items-center gap-[clamp(32px,5cqw,72px)] @min-[900px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid min-w-0 gap-5">
          <h2 id="landing-spaced" className="text-lp-h2 text-balance break-words">
            {COPY.spaced.title}
          </h2>
          {COPY.spaced.paragraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-[36em] text-lp-body text-pretty text-fg-soft">
              {paragraph}
            </p>
          ))}
        </div>
        <ForgettingCurve />
      </Wrap>
    </Section>
  );
}
