import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, RotateCcw, Timer, type LucideIcon } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import { EXAM_PASS_POINTS, EXAM_QUESTION_COUNT } from "../exam/format";

const CARD =
  "group flex min-h-[76px] items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors sm:min-h-[196px] sm:flex-col sm:items-stretch sm:justify-between sm:gap-5 sm:rounded-[20px] sm:p-5";
const CARD_ACTIVE = "cursor-pointer hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink";

function Head({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none sm:flex-col sm:items-start sm:gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-ink sm:size-11">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-bold sm:text-lg">{title}</span>
        <span className="block text-xs text-fg-muted sm:mt-0.5 sm:text-sm">{text}</span>
      </span>
    </span>
  );
}

function Foot({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <span className={cn("hidden items-center justify-between font-semibold sm:flex", muted ? "text-fg-muted" : "text-accent-ink")}>
      <span>{children}</span>
      {!muted && <ChevronRight size={18} aria-hidden="true" />}
    </span>
  );
}

interface TestKindCardsProps {
  /** Ile pytań czeka na powtórkę (ta sama liczba co na odznace „Testy" w menu). */
  dueCount: number;
  onStudy: () => void;
  onReview: () => void;
}

/**
 * „Ułóż test": trzy rodzaje. Nauka i Powtórki otwierają kreator (źródło, przepisy, liczba pytań), Egzamin próbny ma swój
 * ekran. Na telefonie karty są wąskimi wierszami jedna pod drugą.
 */
export function TestKindCards({ dueCount, onStudy, onReview }: TestKindCardsProps) {
  const questions = pluralizePl(dueCount, { one: "pytanie", few: "pytania", many: "pytań" });

  return (
    <section aria-labelledby="kinds-title" className="flex flex-col gap-3">
      <h2 id="kinds-title" className="text-sm font-medium text-fg-muted">
        Ułóż test
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <button type="button" onClick={onStudy} data-testid="kind-study" className={cn(CARD, CARD_ACTIVE)}>
          <Head icon={BookOpen} title="Nauka" text="Wybierz przepisy, rozdziały i źródło pytań. Po każdej odpowiedzi od razu wyjaśnienie." />
          <Foot>Wybierz zakres</Foot>
          <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-fg-muted sm:hidden" />
        </button>

        <button
          type="button"
          onClick={onReview}
          disabled={dueCount <= 0}
          data-testid="kind-review"
          className={cn(CARD, dueCount > 0 ? CARD_ACTIVE : "cursor-not-allowed opacity-60")}
        >
          <Head
            icon={RotateCcw}
            title="Powtórki"
            text={dueCount > 0 ? "Pytania, którym minął termin powtórki. Bez nowych pytań." : "Nic nie czeka na powtórkę."}
          />
          <Foot muted={dueCount <= 0}>{dueCount > 0 ? `${dueCount} ${questions} do powtórki` : "Wróć, gdy minie któryś termin"}</Foot>
          {dueCount > 0 && <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-fg-muted sm:hidden" />}
        </button>

        <Link to={ROUTES.exam} data-testid="kind-exam" className={cn(CARD, CARD_ACTIVE)}>
          <Head
            icon={Timer}
            title="Egzamin próbny"
            text={`${EXAM_QUESTION_COUNT} pytań jak na egzaminie, zaliczenie od ${EXAM_PASS_POINTS} pkt. Wynik i raport dopiero na końcu.`}
          />
          <Foot>Przejdź do egzaminu</Foot>
          <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-fg-muted sm:hidden" />
        </Link>
      </div>
    </section>
  );
}
