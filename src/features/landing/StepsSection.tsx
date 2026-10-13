import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import { CtaLink, Section, Wrap } from "./ui";

export function StepsSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Section id="start" labelledBy="landing-start" className="border-y border-line bg-band">
      <Wrap>
        <h2 id="landing-start" className="max-w-[44rem] text-lp-h2 text-balance break-words">
          {COPY.steps.title}
        </h2>
        <ol className="mt-[clamp(28px,5cqw,48px)] grid grid-cols-1 gap-2 @min-[860px]:grid-cols-3 @min-[860px]:gap-8">
          {COPY.steps.items.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[auto_minmax(0,1fr)] content-start items-start gap-x-5 gap-y-1.5 border-t border-line py-6 @min-[860px]:grid-cols-1 @min-[860px]:gap-y-2.5 @min-[860px]:pt-7"
            >
              <span
                aria-hidden="true"
                className="row-span-2 min-w-[0.7em] font-display text-[3.25rem] leading-[0.9] font-medium text-accent @min-[860px]:row-auto"
              >
                {index + 1}
              </span>
              <h3 className="text-lp-h3 text-balance">{step.title}</h3>
              <p className="text-fg-soft">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-[clamp(20px,4cqw,36px)]">
          <CtaLink to={isAuthenticated ? ROUTES.dashboard : ROUTES.register} size="lg">
            {isAuthenticated ? COPY.cta.member : COPY.cta.guest}
          </CtaLink>
        </div>
      </Wrap>
    </Section>
  );
}
