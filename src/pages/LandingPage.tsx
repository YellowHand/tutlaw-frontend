import "@fontsource/newsreader/500.css";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ACCOUNT_DELETED_PARAM, ACCOUNT_DELETED_VALUE } from "../features/account/constants";
import { COPY } from "../features/landing/copy";
import { DemoSection } from "../features/landing/DemoSection";
import { FaqSection } from "../features/landing/FaqSection";
import { FeaturesSection } from "../features/landing/FeaturesSection";
import { FinalCta } from "../features/landing/FinalCta";
import { HeroSection } from "../features/landing/HeroSection";
import { LandingFooter } from "../features/landing/LandingFooter";
import { LandingHeader } from "../features/landing/LandingHeader";
import { SpacedRepetitionSection } from "../features/landing/SpacedRepetitionSection";
import { StepsSection } from "../features/landing/StepsSection";
import { Wrap } from "../features/landing/ui";

/**
 * Strona główna. Układ reaguje na szerokość kontenera (zapytania @container), a nie okna, więc wygląda tak samo
 * w całym oknie, w podglądzie tabletu i w wąskiej kolumnie. Zalogowany użytkownik zamiast "Załóż konto" i
 * "Zaloguj się" dostaje wszędzie "Przejdź do aplikacji".
 */
export function LandingPage() {
  const { isAuthenticated: loggedIn, isInitializing } = useAuth();
  // W trakcie odzyskiwania sesji (zalogowany po odświeżeniu strony) od razu pokazujemy wersję dla zalogowanych, bez mignięcia przycisku „Załóż konto”.
  const isAuthenticated = loggedIn || isInitializing;
  const [searchParams] = useSearchParams();
  const accountDeleted = searchParams.get(ACCOUNT_DELETED_PARAM) === ACCOUNT_DELETED_VALUE;

  return (
    <div id="top" className="@container min-h-dvh overflow-x-clip bg-canvas font-sans text-fg antialiased">
      <div className="[--lp-gutter:clamp(16px,4.5cqw,40px)] [--lp-section:clamp(56px,9cqw,112px)]">
        <a
          href="#tresc"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-[10px] focus:bg-accent focus:px-4 focus:py-3 focus:font-extrabold focus:text-accent-fg"
        >
          Przejdź do treści
        </a>

        <LandingHeader isAuthenticated={isAuthenticated} />

        {accountDeleted && (
          <Wrap className="pt-4">
            <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-center text-sm">
              {COPY.accountDeleted}
            </p>
          </Wrap>
        )}

        <main id="tresc">
          <HeroSection isAuthenticated={isAuthenticated} />
          <DemoSection />
          <SpacedRepetitionSection />
          <FeaturesSection />
          <StepsSection isAuthenticated={isAuthenticated} />
          <FaqSection />
          <FinalCta isAuthenticated={isAuthenticated} />
        </main>

        <LandingFooter isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
