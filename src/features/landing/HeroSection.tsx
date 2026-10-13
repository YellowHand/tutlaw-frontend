import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import { DemoQuestion } from "./DemoQuestion";
import { CtaLink, Wrap } from "./ui";

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section aria-labelledby="landing-hero" className="pt-[clamp(36px,7cqw,88px)]">
      <Wrap className="grid grid-cols-1 gap-[clamp(36px,6cqw,72px)] @min-[960px]:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] @min-[960px]:items-start">
        <div className="min-w-0 @min-[960px]:pt-[clamp(24px,5cqw,72px)]">
          <h1 id="landing-hero" className="text-lp-h1 text-balance break-words">
            {COPY.hero.title}
          </h1>
          <p className="mt-5 max-w-[34em] text-lp-lead text-pretty text-fg-soft">{COPY.hero.lead}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
            <CtaLink to={isAuthenticated ? ROUTES.dashboard : ROUTES.register} size="lg">
              {isAuthenticated ? COPY.cta.member : COPY.cta.guest}
            </CtaLink>
            <a
              href="#algorytm"
              className="inline-flex min-h-12 items-center font-bold text-fg underline decoration-fg/35 decoration-[1.5px] underline-offset-[5px] hover:decoration-accent"
            >
              {COPY.hero.howLink}
            </a>
          </div>

          {!isAuthenticated && (
            <p className="mt-3.5 text-[0.9375rem] text-fg-muted">
              {COPY.hero.fine} {COPY.hero.haveAccount}{" "}
              <Link to={ROUTES.login} className="font-bold text-fg underline underline-offset-[3px]">
                {COPY.cta.login}
              </Link>
            </p>
          )}
        </div>

        <div className="min-w-0">
          <DemoQuestion />
        </div>
      </Wrap>
    </section>
  );
}
