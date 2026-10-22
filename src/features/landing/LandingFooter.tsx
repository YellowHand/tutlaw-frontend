import { Link } from "react-router-dom";
import { CookieSettingsLink } from "../../components/CookieSettingsLink";
import { Logo } from "../../components/layout/Logo";
import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import { Wrap } from "./ui";

const FOOT_LINK = "inline-flex min-h-11 items-center rounded-md px-2.5 text-fg hover:underline";

export function LandingFooter({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <footer className="border-t border-line py-9 pb-12 text-[0.9375rem] text-fg-muted">
      <Wrap>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <a href="#top" className="inline-flex min-h-11 items-center rounded-md text-fg">
            <Logo variant="wordmark" />
          </a>
          <nav aria-label="Informacje" className="flex flex-wrap gap-x-1">
            <Link to={ROUTES.terms} className={FOOT_LINK}>
              {COPY.footer.terms}
            </Link>
            <Link to={ROUTES.privacy} className={FOOT_LINK}>
              {COPY.footer.privacy}
            </Link>
            <CookieSettingsLink className={`${FOOT_LINK} cursor-pointer`} />
            {!isAuthenticated && (
              <Link to={ROUTES.login} className={FOOT_LINK}>
                {COPY.cta.login}
              </Link>
            )}
          </nav>
        </div>
        <p className="mt-4 max-w-[60ch] text-sm leading-normal">{COPY.footer.note}</p>
      </Wrap>
    </footer>
  );
}
