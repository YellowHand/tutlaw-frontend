import { Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { ErrorBoundary } from "../ErrorBoundary";
import { RouteFallback } from "../RouteFallback";
import { sessionExitRoute } from "../../config/navigation";
import { OnboardingGate } from "../../features/onboarding/OnboardingDialog";
import { ThemeSync } from "../../features/settings/ThemeSync";
import { StudyTimeTracker } from "../../features/studytime/StudyTimeTracker";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";
import { useNavCollapsed } from "./useNavCollapsed";

/**
 * Szkielet aplikacji po zalogowaniu. Menu zależy od szerokości okna: od `xl` szeroki panel (można go zwinąć),
 * od `md` wąski pasek z podpisami, poniżej `md` dolna belka. W sesji nauki (fiszki, test) menu znika,
 * a u góry jest przycisk „Zakończ sesję”. Szkielet pilnuje też wyglądu (ciemny/jasny z konta) i obowiązkowego okna
 * startowego z wyborem aplikacji, więc działają na każdym ekranie aplikacji, także po wejściu z zakładki prosto w sesję.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, toggleCollapsed] = useNavCollapsed();
  const exitTo = sessionExitRoute(pathname);

  return (
    <div className="flex h-dvh bg-canvas text-fg">
      {!exitTo && (
        <>
          <SideNav variant={collapsed ? "rail" : "full"} onToggle={toggleCollapsed} className="hidden xl:flex" />
          <SideNav variant="rail" className="hidden md:flex xl:hidden" />
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {exitTo && (
          <header className="flex h-14 shrink-0 items-center px-3 sm:px-5">
            <Link
              to={exitTo}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X size={18} aria-hidden="true" />
              Zakończ sesję
            </Link>
          </header>
        )}
        <main className={cn("flex-1 overflow-y-auto", !exitTo && "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0")}>
          {/* Błąd w jednym ekranie nie zabiera menu, a przejście na inny adres próbuje wyrenderować go od nowa. */}
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {!exitTo && <BottomNav className="md:hidden" />}

      <ThemeSync />
      <StudyTimeTracker />
      <OnboardingGate />
    </div>
  );
}
