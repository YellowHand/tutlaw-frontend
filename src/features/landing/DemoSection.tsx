import { COPY } from "./copy";
import { DemoQuestion } from "./DemoQuestion";
import { Section, Wrap } from "./ui";

/** Działające przykładowe pytanie pod hero: dwie kolumny od 900 px (tekst po lewej, karta po prawej). */
export function DemoSection() {
  const { section } = COPY.demo;
  return (
    <Section id="demo" labelledBy="landing-demo">
      <Wrap className="grid grid-cols-1 items-start gap-[clamp(28px,5cqw,64px)] @min-[900px]:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <div className="grid min-w-0 content-start gap-4">
          <h2 id="landing-demo" className="text-lp-h2 text-balance break-words">
            {section.title}
          </h2>
          <p className="max-w-[34em] text-lp-body text-pretty text-fg-soft">{section.lead}</p>
        </div>
        <div className="min-w-0 @min-[900px]:max-w-[40rem]">
          <DemoQuestion />
        </div>
      </Wrap>
    </Section>
  );
}
