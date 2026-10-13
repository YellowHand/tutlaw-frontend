import { Link } from "react-router-dom";
import { Logo } from "../../components/layout/Logo";
import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import { CtaLink, Wrap } from "./ui";

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/6 bg-canvas/90 backdrop-blur-md backdrop-saturate-150">
      <Wrap className="flex min-h-16 items-center justify-between gap-3">
        <a href="#top" className="inline-flex min-h-11 flex-none items-center rounded-md">
          <Logo variant="wordmark" />
        </a>

        <nav aria-label="Sekcje strony" className="hidden gap-0.5 @min-[900px]:flex">
          {COPY.nav.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-[10px] px-3.5 text-[0.9375rem] font-semibold text-fg-muted hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          {isAuthenticated ? (
            <CtaLink to={ROUTES.dashboard} size="sm">
              {COPY.cta.member}
            </CtaLink>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="hidden min-h-11 items-center rounded-[10px] px-3.5 text-[0.9375rem] font-bold hover:underline @min-[420px]:inline-flex"
              >
                {COPY.cta.login}
              </Link>
              <CtaLink to={ROUTES.register} size="sm">
                {COPY.cta.guestShort}
              </CtaLink>
            </>
          )}
        </div>
      </Wrap>
    </header>
  );
}
