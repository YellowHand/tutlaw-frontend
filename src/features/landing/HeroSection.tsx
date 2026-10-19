import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { COPY } from "./copy";
import temidaUrl from "./assets/temida-medalion.svg";
import { CtaLink, Wrap } from "./ui";

/**
 * Hero zajmuje cały pierwszy ekran: okno minus przyklejony nagłówek (min-h-16 + 1 px ramki = 65 px), ale nie więcej
 * niż 1100 px, żeby na bardzo wysokich ekranach nie rozciągał się w pustkę. Używamy svh (najmniejsza wysokość okna
 * na telefonie, gdy pasek adresu jest widoczny), więc początek następnej sekcji nie wchodzi na pierwszy ekran.
 * To tylko minimum: gdy treść jest wyższa niż okno (mały telefon, widok poziomy), hero po prostu rośnie.
 * Pod treścią jest miejsce na strzałkę w dół (pb), która mówi, że strona toczy się dalej.
 */
export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      aria-labelledby="landing-hero"
      className="relative flex min-h-[min(calc(100svh_-_65px),1100px)] flex-col pt-[clamp(24px,4cqw,56px)] pb-[clamp(60px,6cqw,88px)]"
    >
      <Wrap className="grid flex-1 grid-cols-1 grid-rows-[auto_minmax(140px,1fr)] items-center gap-x-[clamp(32px,6cqw,72px)] gap-y-[clamp(20px,4cqw,48px)] @min-[960px]:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] @min-[960px]:grid-rows-[auto]">
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

        {/* Ilustracja ozdobna (alt pusty): Temida z zasłoniętymi oczami, bo "Nie jestem pewien" działa jak uczciwy sędzia.
            Pudełko wypełnia wolne miejsce w hero (self-stretch), a obrazek jest w nim wpisany (object-contain), więc na
            niskim oknie Temida się zmniejsza i całe hero mieści się na ekranie. Szerokość pudełka: 36% szerokości od 960 px
            (obok tekstu), a w jednej kolumnie 52%, bo wtedy jest pod tekstem i ma więcej miejsca. */}
        <div className="relative mx-auto w-[clamp(240px,52cqw,430px)] max-w-full min-w-0 self-stretch @min-[960px]:w-[clamp(240px,36cqw,430px)]">
          <img
            src={temidaUrl}
            alt=""
            width={480}
            height={680}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 block size-full object-contain"
          />
        </div>
      </Wrap>

      {/* Strzałka w dół: to samo co link "Zobacz, jak to działa", więc dla czytników ekranu i klawiatury jest ukryta. */}
      <a
        href="#demo"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute bottom-3 left-1/2 inline-flex size-11 -translate-x-1/2 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-accent"
      >
        <ChevronDown size={22} aria-hidden="true" />
      </a>
    </section>
  );
}
