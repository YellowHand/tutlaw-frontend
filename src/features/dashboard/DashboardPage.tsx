import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { formatFullDatePl } from "../../lib/date";
import { ExamCard } from "./ExamCard";
import { ProgressCard } from "./ProgressCard";
import { TodayCard } from "./TodayCard";

/**
 * Pulpit odpowiada na dwa pytania: co robić teraz („Na dziś") i czy jestem na dobrej drodze („Postęp", „Egzamin
 * próbny"). Są tylko trzy karty, bo więcej rozprasza; mapy aktywności i rozbicia błędów są w Statystykach. Nie ma
 * przełącznika Fiszki / Testy ani skrótów do nich: te same wejścia są w menu.
 *
 * Wyboru egzaminu tu nie ma: nowy użytkownik wybiera aplikację w obowiązkowym oknie startowym zaraz po zalogowaniu
 * (features/onboarding), a potem zmienia ją w Koncie.
 *
 * Na komputerze dwie kolumny: „Na dziś" i „Postęp" po lewej, „Egzamin próbny" po prawej. Na telefonie jedna, a
 * opakowania kolumn znikają (`contents`), więc karty idą jedna pod drugą w kolejności z kodu. Nie przestawiamy ich przez
 * CSS (`order`), żeby klawisz Tab przechodził po ekranie w tej samej kolejności, w jakiej widać karty.
 */
export function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Pulpit" subtitle={formatFullDatePl(new Date())} />

      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(400px,480px)] lg:items-start">
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <TodayCard />
            <ProgressCard />
          </div>
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <ExamCard />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
