import { PageHeader } from "../../components/layout/PageHeader";
import { formatFullDatePl } from "../../lib/date";
import { useLearningSettings } from "../settings/hooks";
import { ExamCard } from "./ExamCard";
import { ExamChoiceCard } from "./ExamChoiceCard";
import { ProgressCard } from "./ProgressCard";
import { TodayCard } from "./TodayCard";
import { useExamPromptSkipped } from "./examPromptSkip";

/**
 * Pulpit odpowiada na dwa pytania: co robić teraz („Na dziś") i czy jestem na dobrej drodze („Postęp", „Egzamin
 * próbny"). Są tylko trzy karty, bo więcej rozprasza; mapy aktywności i rozbicia błędów są w Statystykach. Nie ma
 * przełącznika Fiszki / Testy ani skrótów do nich: te same wejścia są w menu.
 *
 * Gdy użytkownik nie wybrał jeszcze egzaminu (i nie odłożył wyboru), na samej górze jest kafelek z wyborem aplikacji.
 *
 * Na komputerze dwie kolumny: „Na dziś" i „Postęp" po lewej, „Egzamin próbny" po prawej. Na telefonie jedna, a
 * opakowania kolumn znikają (`contents`), więc karty idą jedna pod drugą w kolejności z kodu. Nie przestawiamy ich przez
 * CSS (`order`), żeby klawisz Tab przechodził po ekranie w tej samej kolejności, w jakiej widać karty.
 */
export function DashboardPage() {
  const settings = useLearningSettings();
  const [promptSkipped, skipPrompt] = useExamPromptSkipped();
  // Pytamy dopiero, gdy wiemy na pewno, że wyboru nie ma: błąd lub ładowanie ustawień nie może wołać o egzamin.
  const askForExam = settings.data !== undefined && settings.data.examOrigin == null && !promptSkipped;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Pulpit" subtitle={formatFullDatePl(new Date())} />

      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        {askForExam && <ExamChoiceCard onSkip={skipPrompt} />}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <TodayCard examPromptSkipped={promptSkipped} />
            <ProgressCard />
          </div>
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <ExamCard />
          </div>
        </div>
      </div>
    </div>
  );
}
