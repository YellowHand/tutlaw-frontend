import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas px-4 py-10 text-fg">
      <Link to="/" aria-label="Wróć do strony głównej">
        <Logo variant="wordmark" />
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
        <h1 className="mb-6 text-xl font-bold">{title}</h1>
        {children}
      </div>

      {footer && <div className="text-sm text-fg-muted">{footer}</div>}
    </main>
  );
}