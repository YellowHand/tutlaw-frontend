import { deepNbsp } from "./typography";
import type { DemoAnswer, DemoOutcomeId } from "./demo";

/**
 * Wszystkie teksty strony głównej w jednym miejscu. Fakty o produkcie (tryby, reguły "Nie jestem pewien",
 * FSRS-6, pula pytań i filtr źródeł, eksport danych) odpowiadają temu, co aplikacja naprawdę robi. Bez liczb o
 * użytkownikach, zdawalności i liczbie pytań: dopisujemy je dopiero, gdy będą prawdziwe.
 * Przy zmianie tekstów twarde spacje (nbsp) dodaje deepNbsp(), więc piszemy zwyczajnie.
 */
export const COPY = deepNbsp({
  nav: [
    { href: "#demo", label: "Wypróbuj" },
    { href: "#algorytm", label: "Jak działa nauka" },
    { href: "#funkcje", label: "Funkcje" },
    { href: "#start", label: "Start" },
    { href: "#faq", label: "Pytania" },
  ],
  cta: {
    guest: "Załóż darmowe konto",
    guestShort: "Załóż konto",
    member: "Przejdź do aplikacji",
    login: "Zaloguj się",
  },
  // Ścieżki do wyboru (te same, co w bazie); slug wskazuje kolory togi.
  tracks: [
    { slug: "adwokacka-radcowska", label: "Adwokacka i radcowska" },
    { slug: "sedziowska-prokuratorska", label: "Sędziowska i prokuratorska" },
    { slug: "uzupelniajaca-sedziowska", label: "Uzupełniająca sędziowska" },
    { slug: "notarialna", label: "Notarialna" },
    { slug: "komornicza", label: "Komornicza" },
    { slug: "student", label: "Student" },
  ],
  accountDeleted: "Twoje konto i wszystkie powiązane z nim dane zostały usunięte. Dziękujemy za korzystanie z serwisu.",
  hero: {
    title: "Testy, które pamiętają, co ci umyka.",
    lead: "Rozwiązuj pytania ABC z egzaminów na aplikacje prawnicze. Gradus zapisuje, co zgadłeś, a co naprawdę wiesz, i sam układa powtórki.",
    howLink: "Zobacz, jak to działa",
    fine: "Bez karty płatniczej.",
    haveAccount: "Masz już konto?",
  },
  demo: {
    section: {
      title: "Wypróbuj na jednym pytaniu",
      lead: "Wybierz odpowiedź i zobacz, co Gradus z nią zrobi. Potem spróbuj jeszcze raz z zaznaczonym „Nie jestem pewien”: wynik będzie inny.",
    },
    // Nazwa grupy dla czytników ekranu (nad kartą jest już nagłówek sekcji, więc nie pokazujemy jej drugi raz).
    caption: "Przykładowe pytanie ABC z przełącznikiem „Nie jestem pewien”",
    subject: "Prawo cywilne",
    badge: "Pytanie przykładowe",
    question: "Od jakiej chwili człowiek ma zdolność prawną?",
    unsureLabel: "Nie jestem pewien",
    unsureHint: "Zaznacz przed odpowiedzią, jeśli zgadujesz.",
    options: [
      { id: "a", text: "Od ukończenia 13 lat." },
      { id: "b", text: "Od urodzenia." },
      { id: "c", text: "Od uzyskania pełnoletności." },
    ] satisfies { id: DemoAnswer; text: string }[],
    tagCorrect: "Poprawna odpowiedź",
    tagYours: "Twoja odpowiedź",
    idle: "Wybierz odpowiedź, a pokażemy, co Gradus z nią zrobi. Spróbuj też z zaznaczonym „Nie jestem pewien”.",
    outcomes: {
      "ok-sure": {
        title: "Dobrze i pewnie.",
        text: "Gradus zapisuje pytanie jako znane i wróci do niego po dłuższej przerwie. Kiedy dokładnie, wylicza algorytm FSRS-6.",
      },
      "ok-unsure": {
        title: "Dobrze, ale niepewnie.",
        text: "Trafiony strzał to jeszcze nie wiedza. Gradus traktuje to pytanie jak niezapamiętane i szybko do niego wróci.",
      },
      "bad-sure": {
        title: "Pewna pomyłka.",
        text: "Byłeś przekonany, że wiesz, a to najgorsza kombinacja. Pytanie szybko wraca do powtórek, a Gradus odblokowuje jego fiszkę.",
      },
      "bad-unsure": {
        title: "Pomyłka, ale wiedziałeś, że nie wiesz.",
        text: "Pytanie szybko wraca do powtórek. Do fiszek trafia dopiero po pewnej pomyłce albo gdy dodasz je sam.",
      },
    } satisfies Record<DemoOutcomeId, { title: string; text: string }>,
    explainLead: "Wyjaśnienie przykładowe.",
    explain:
      "Zgodnie z art. 8 § 1 Kodeksu cywilnego każdy człowiek ma zdolność prawną od chwili urodzenia. Od 13 lat zaczyna się dopiero ograniczona zdolność do czynności prawnych, a pełna od pełnoletności.",
    again: "Spróbuj jeszcze raz",
  },
  spaced: {
    title: "Zapominanie da się przewidzieć. Powtórki też.",
    paragraphs: [
      "Bez powtórek pamięć słabnie z dnia na dzień, a przed egzaminem okazuje się, że sporo przerobionego materiału gdzieś wyparowało.",
      "Gradus wraca do pytania tuż przed momentem, w którym by ci umknęło. Każda kolejna przerwa jest dłuższa, więc z czasem powtarzasz coraz mniej, a pamiętasz coraz dłużej.",
      "Terminy wylicza FSRS-6, nowoczesny algorytm powtórek interwałowych: osobno dla każdego pytania, na podstawie twoich odpowiedzi.",
    ],
    chartLabel:
      "Schemat poglądowy: bez powtórek pamięć spada i już nie wraca. Przy powtórkach każda kolejna powtórka przywraca pamięć, a spadek jest coraz wolniejszy.",
    legend: [
      { kind: "with", text: "Z powtórkami: kropki to powtórki, a po każdej pamięć spada wolniej." },
      { kind: "without", text: "Bez powtórek: pamięć słabnie i już nie wraca." },
      { kind: "threshold", text: "Poziom, poniżej którego zaczynasz zapominać. Powtórka wypada tuż przed nim." },
    ],
    note: "Schemat poglądowy, nie wynik pomiaru. Poziomo: czas, pionowo: ile pamiętasz.",
  },
  features: {
    title: "Testy, powtórki i fiszki w jednym miejscu",
    lead: "Uczysz się z pytań egzaminacyjnych i nie prowadzisz osobnego kalendarza powtórek.",
    tests: {
      title: "Testy ABC z jedną dobrą odpowiedzią",
      text: "Pytania z egzaminów na pięć aplikacji prawniczych oraz pytania autorskie, w tym paremie łacińskie. Każde jest podpięte do aktu prawnego, więc ten sam kodeks ćwiczysz z arkuszy wszystkich aplikacji. Przy pytaniu widzisz akt i źródło (arkusz z rokiem). Uczysz się z całej puli, z wybranej dziedziny, z aktu prawnego albo tylko z nowych pytań.",
      chipsLead: "Wybierasz swoją ścieżkę:",
    },
    unsure: {
      title: "„Nie jestem pewien” działa jak uczciwy sędzia",
      text: "Zgadłeś? Zaznacz to przed odpowiedzią. Szczęśliwe trafienie nie zaliczy się jako wiedza, a pewne pomyłki policzymy osobno, bo to je najtrudniej wyplenić.",
      sample: "Nie jestem pewien",
    },
    reviews: {
      title: "Powtórki układają się same",
      text: "FSRS-6 wylicza termin każdego pytania. Wchodzisz w „Zaległe powtórki” i robisz tylko to, co na dziś. Możesz ustawić dzienny limit nowych pytań i opcjonalnie datę egzaminu.",
    },
    flashcards: {
      title: "Fiszki z twoich pomyłek",
      text: "Pewna pomyłka w teście sama odblokowuje fiszkę tego pytania. Każde inne pytanie dodasz do fiszek jednym kliknięciem. Fiszka ma własny harmonogram FSRS-6, osobny od testu, więc nie ma drugiego kalendarza do prowadzenia.",
    },
    exam: {
      title: "Egzamin próbny",
      text: "Losowe pytania z Twojej puli, wynik i raport na końcu. Błędne pytania możesz od razu przećwiczyć.",
    },
    stats: {
      title: "Wiesz, gdzie naprawdę stoisz",
      text: "Skuteczność według aktów prawnych i źródeł pytań, ostatnie 30 dni i liczba opanowanych pytań. Osobno liczymy pewne błędy i kruchą wiedzę, czyli poprawne odpowiedzi z zaznaczonym „Nie jestem pewien”.",
      sampleTitle: "Skuteczność według aktów prawnych",
      sampleBadge: "Przykładowe dane",
      sample: [
        { label: "Kodeks cywilny", value: 78 },
        { label: "Kodeks karny", value: 64 },
        { label: "Prawo o notariacie", value: 52 },
      ] satisfies { label: string; value: number }[],
      confidentMistakes: { label: "Pewne błędy", value: "6" },
      fragile: { label: "Krucha wiedza", value: "11" },
    },
  },
  steps: {
    title: "Zaczynasz w trzech krokach",
    items: [
      { title: "Załóż konto", text: "Podajesz e-mail i hasło, potwierdzasz adres i gotowe. Bez karty płatniczej." },
      {
        title: "Rozwiązuj i zaznaczaj, czego nie jesteś pewien",
        text: "Wybierasz ścieżkę (jedną z pięciu aplikacji albo Student) i zakres: całą pulę, dziedzinę, akt prawny albo tylko nowe pytania. Zgadujesz? Zaznacz to przed odpowiedzią.",
      },
      {
        title: "Wracaj, gdy przyjdzie czas",
        text: "Pulpit pokazuje, ile powtórek czeka na dziś. Robisz je, a resztę czasu poświęcasz na nowe pytania.",
      },
    ],
  },
  faq: {
    title: "Najczęstsze pytania",
    lead: "Krótko o tym, skąd są pytania, jak działa „Nie jestem pewien” i ile to kosztuje.",
    items: [
      {
        q: "Czy Gradus naprawdę jest darmowy?",
        a: "Tak. Obecnie korzystasz z całej aplikacji bez opłat i bez podawania karty płatniczej.",
      },
      {
        q: "Skąd pochodzą pytania?",
        a: "Z egzaminów na aplikacje prawnicze oraz z pytań autorskich, w tym z paremii łacińskich. Każde pytanie jest podpięte do aktu prawnego, więc ta sama ustawa łączy arkusze różnych aplikacji. Baza jest uzupełniana. Ścieżki do wyboru są poniżej.",
        tracks: true,
      },
      {
        q: "Co znaczy „Nie jestem pewien”?",
        a: "To znacznik, który zaznaczasz przed odpowiedzią, gdy zgadujesz. Odpowiedź niepewna, nawet poprawna, wraca do powtórek tak jak pomyłka. Dzięki temu szczęśliwe trafienie nie udaje wiedzy.",
      },
      {
        q: "Czym jest FSRS-6?",
        a: "To algorytm powtórek interwałowych, nowocześniejszy od klasycznego SM-2. Na podstawie historii twoich odpowiedzi szacuje, jak mocno pamiętasz dane pytanie, i wyznacza termin kolejnej powtórki.",
      },
      {
        q: "Czy mogę uczyć się tylko do jednej aplikacji?",
        a: "Tak. Wybierasz ścieżkę, a Gradus układa pulę z jej arkuszy i aktów prawnych. W „Puli pytań” możesz ją zawęzić do wybranych aktów oraz włączyć lub wyłączyć arkusze innych aplikacji i pytania autorskie. Ustawienia zapamiętują się na koncie, więc działają też na innym urządzeniu.",
      },
      {
        q: "Czy działa na telefonie?",
        a: "Tak, w przeglądarce na telefonie, tablecie i komputerze. Niczego nie instalujesz.",
      },
      {
        q: "Znalazłem błąd w pytaniu. Co zrobić?",
        a: "Przy pytaniu jest przycisk „Zgłoś błąd w pytaniu”.",
      },
      {
        q: "Co z moimi danymi?",
        a: "W ustawieniach konta możesz pobrać swoje dane albo usunąć konto razem z całą historią nauki. Szczegóły są w Polityce prywatności.",
      },
    ],
  },
  final: {
    guest: {
      title: "Pierwsze pytanie czeka.",
      text: "Konto jest teraz bezpłatne i nie wymaga karty płatniczej. Zaczniesz od razu po potwierdzeniu adresu e-mail.",
    },
    member: {
      title: "Wracaj do nauki.",
      text: "Pulpit pokaże, ile powtórek czeka na dziś.",
    },
  },
  footer: {
    terms: "Regulamin",
    privacy: "Polityka prywatności",
    note: "© 2026 Gradus iuris. Materiały służą do nauki i nie stanowią porady prawnej.",
  },
});
