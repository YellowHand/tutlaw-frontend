import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import temidaUrl from "./assets/temida-medalion.svg";
import { CtaLink, Wrap } from "./ui";

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section aria-labelledby="landing-hero" className="pt-[clamp(36px,7cqw,88px)]">
      <Wrap className="grid grid-cols-1 items-center gap-[clamp(32px,6cqw,72px)] @min-[960px]:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <div className="min-w-0">
          <h1 id="landing-hero" className="text-lp-h1 text-balance break-words">
            {COPY.hero.title}
          </h1>
          <p className="mt-5 max-w-[34em] text-lp-lead text-pretty text-fg-soft">{COPY.hero.lead}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
            <CtaLink to={isAuthenticated ? ROUTES.dashboard : ROUTES.register} size="lg">
              {isAuthenticated ? COPY.cta.member : COPY.cta.guest}
            </CtaLink>
            <a
              href="#demo"
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
          {/* Ilustracja ozdobna (alt pusty): Temida z zasłoniętymi oczami, bo "Nie jestem pewien" działa jak uczciwy sędzia. */}
          <img
            src={temidaUrl}
            alt=""
            width={480}
            height={680}
            decoding="async"
            fetchPriority="high"
            className="mx-auto block h-auto w-[clamp(240px,36cqw,430px)] max-w-full"
          />
        </div>
      </Wrap>
    </section>
  );
}
