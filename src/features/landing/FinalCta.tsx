import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import { CtaLink, Wrap } from "./ui";

export function FinalCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const text = isAuthenticated ? COPY.final.member : COPY.final.guest;
  return (
    <section aria-labelledby="landing-final" className="pb-(--lp-section)">
      <Wrap>
        <div className="grid grid-cols-1 justify-items-start gap-6 rounded-[clamp(20px,3cqw,32px)] bg-accent p-[clamp(28px,7cqw,80px)] text-accent-fg @min-[760px]:grid-cols-[minmax(0,1fr)_auto] @min-[760px]:items-center @min-[760px]:justify-items-stretch">
          <div className="grid gap-3.5">
            <h2 id="landing-final" className="text-lp-h2 text-balance break-words">
              {text.title}
            </h2>
            <p className="max-w-[32em] text-lp-lead text-on-accent-soft">{text.text}</p>
          </div>
          <CtaLink to={isAuthenticated ? ROUTES.dashboard : ROUTES.register} size="lg" tone="ink">
            {isAuthenticated ? COPY.cta.member : COPY.cta.guest}
          </CtaLink>
        </div>
      </Wrap>
    </section>
  );
}
