import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/layout/Logo";
import { ROUTES } from "../../config/routes";

interface LegalPageProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

/** Wspólny układ stron prawnych: nagłówek z logo, tekst i odnośniki do drugiego dokumentu. */
export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link to={ROUTES.landing} aria-label="Wróć do strony głównej">
          <Logo variant="wordmark" />
        </Link>
        <Link to={ROUTES.login} className="text-sm font-medium text-fg-muted hover:text-fg">
          Zaloguj się
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-fg-muted">Ostatnia aktualizacja: {updatedAt}</p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
          <Link to={ROUTES.terms} className="text-accent-ink underline">
            Regulamin
          </Link>
          <Link to={ROUTES.privacy} className="text-accent-ink underline">
            Polityka prywatności
          </Link>
          <Link to={ROUTES.landing} className="text-fg-muted underline">
            Strona główna
          </Link>
        </nav>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
