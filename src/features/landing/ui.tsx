import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/** Kontener treści: do 1180 px, boczny margines płynny (--lp-gutter ustawia LandingPage). */
export function Wrap({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-[min(100%_-_2*var(--lp-gutter),1180px)]", className)} {...props} />;
}

interface SectionProps {
  id?: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/** Sekcja strony z płynnym odstępem pionowym i odsunięciem kotwicy pod przyklejonym nagłówkiem. */
export function Section({ id, labelledBy, className, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-20 py-(--lp-section)", className)}>
      {children}
    </section>
  );
}

type CtaSize = "sm" | "md" | "lg";
type CtaTone = "gold" | "ink";

const CTA_SIZE: Record<CtaSize, string> = {
  sm: "min-h-11 px-4 text-[0.9375rem]",
  md: "min-h-12 px-6 text-base",
  lg: "min-h-14 px-8 text-[1.0625rem]",
};

const CTA_TONE: Record<CtaTone, string> = {
  gold: "bg-accent text-accent-fg hover:bg-accent-hover",
  ink: "bg-canvas text-fg hover:bg-black",
};

interface CtaLinkProps {
  to: string;
  size?: CtaSize;
  tone?: CtaTone;
  className?: string;
  children: ReactNode;
}

/** Link wyglądający jak przycisk (zawsze <a>, bo prowadzi do innej strony). */
export function CtaLink({ to, size = "md", tone = "gold", className, children }: CtaLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-xl text-center font-extrabold leading-tight transition-[background-color,transform] duration-150 active:translate-y-px",
        CTA_SIZE[size],
        CTA_TONE[tone],
        className
      )}
    >
      {children}
    </Link>
  );
}
