# 09. Słownik

[← Spis treści](README.md)

Pojęcia z aplikacji w kolejności alfabetycznej, z nazwami używanymi w kodzie. W pierwszej kolumnie jest nazwa widoczna
dla użytkownika (albo pojęcie techniczne), w drugiej wyjaśnienie, w trzeciej miejsce w kodzie lub w dokumentacji.

## Pojęcia z nauki i treści

| Pojęcie | Co znaczy | W kodzie i w dokumentacji |
|---------|-----------|---------------------------|
| **Akt prawny** | W części kategorii (np. kodeksy) „przedmiot” nazywa się aktem prawnym. Nazwę zawartości kategorii podaje serwer w polu `itemsLabel` („Przedmioty”, „Akty prawne”) | `Category.itemsLabel` w `api/categories.ts` |
| **Aplikacja** (prawnicza) | Nie program, tylko **aplikacja prawnicza**: szkolenie zawodowe po studiach (adwokacka, radcowska, sędziowska, prokuratorska, notarialna, komornicza). Z jej egzaminów pochodzą pytania | Sześć wartości `QuestionOrigin` w `lib/origin.ts` |
| **Dodaj do fiszek** | Przycisk pod odpowiedzią w teście: tworzy z pytania fiszkę w dziale Fiszki | `QuestionFlashcardActions.tsx`, [04](04-nauka-w-aplikacji.md) |
| **Dzienny limit** | Ile nowych kart i ile zaległych powtórek aplikacja podaje jednego dnia. Ustawia go użytkownik w Koncie, pilnuje serwer | `LearningSettings`, [04](04-nauka-w-aplikacji.md) |
| **Egzamin próbny** | Losowy zestaw pytań z zegarem, bez podpowiedzi w trakcie, z raportem na końcu. Oddzielny od zwykłych Testów | `features/exam`, [04](04-nauka-w-aplikacji.md) |
| **Fiszka** | Karta z przodem (pytanie) i tyłem (odpowiedź), którą użytkownik sam ocenia czterema przyciskami | Sesja: `pages/StudySessionPage.tsx` |
| **Fiszki** (z wielkiej litery) | Dział aplikacji z fiszkami i podręcznikami | `/app/flashcards`, [02](02-routing-i-strony.md) |
| **FSRS-6** | Algorytm powtórek interwałowych (21 parametrów), który wylicza, kiedy pytanie ma wrócić. Działa **tylko w backendzie**; frontend pokazuje wynik | Dokumentacja backendu |
| **Karta** (`card`) | Wspólna nazwa pytania testowego i fiszki w danych serwera. W interfejsie mówi się „pytanie” albo „fiszka” | `cardId` w całym `api/` |
| **Krucha wiedza** | Poprawne odpowiedzi z zaznaczonym „Nie jestem pewien”: trafione, ale nie pewne | Statystyki Testów, [04](04-nauka-w-aplikacji.md) |
| **Nie jestem pewien** | Pole wyboru, które zaznacza się **przed** odpowiedzią, gdy się zgaduje. Poprawna, ale niepewna odpowiedź jest traktowana jak „Nie pamiętam” | Pole `guessed` w `submitTestAnswer`; klawisz `G` |
| **Nowa karta** | Karta, której użytkownik jeszcze nie widział. Ile nowych dochodzi dziennie, określa limit | `newCardsPerDay`, `newTestQuestionsPerDay` |
| **Ocena fiszki** | Cztery przyciski: 1 Nie pamiętam, 2 Trudne, 3 Znam, 4 Łatwe. Liczba (1–4) idzie do serwera | `submitReview` w `api/review.ts` |
| **Opanowanie** (rozdziału) | Procent kart rozdziału, które są już „opanowane” (serwer liczy tak karty o stabilności powyżej 21 dni) | `ChapterMastery.masteryPercentage` |
| **Pewna pomyłka** | Błędna odpowiedź **bez** zaznaczenia „Nie jestem pewien”: użytkownik był przekonany, że wie. Najgorsza kombinacja; pytanie wraca szybko i trafia do fiszek | `flashcardUnlocked` w `TestAnswerResult` |
| **Pochodzenie** (`origin`) | Skąd jest pytanie: aplikacja adwokacka i radcowska, sędziowska i prokuratorska, notarialna, uzupełniająca sędziowska, komornicza albo autorskie | `lib/origin.ts`, filtr w [04](04-nauka-w-aplikacji.md) |
| **Podręcznik** (`TEXTBOOK`) | Źródło podzielone na rozdziały. Pytania z rozdziału są dostępne w Testach dopiero po oznaczeniu go jako przeczytany | `SourceType` w `api/sources.ts` |
| **Podstawa prawna** | Przepis, na którym opiera się pytanie, np. „art. 415 k.c.”; pokazywana po odpowiedzi | `legalBasis`; `features/review/LegalBasisLine.tsx` |
| **Powtórka** | Ponowne rozwiązanie albo ocena karty po terminie wyznaczonym przez algorytm | `getDueCount`, odznaki w menu |
| **Powtórz jeszcze** | Przycisk na końcu sesji: dokłada porcję zaległych powtórek ponad dzienny limit (20) | `EXTRA_DUE_BATCH` w `features/review/useBacklog.ts` |
| **Powtórz moje błędy** | Specjalna sesja z pytań, na które ostatnia odpowiedź w teście była błędna | Tryb `mistakes`, `/app/test/mistakes` |
| **Przeczytany** (rozdział) | Oznaczenie, które odblokowuje pytania z rozdziału podręcznika | `Chapter.isRead`, `setChapterProgress` |
| **Pula płaska** (`FLAT_POOL`) | Źródło bez rozdziałów: po prostu zbiór pytań (np. z egzaminu). Dostępna od razu, nie wymaga „przeczytania” | `SourceType` |
| **Pytanie autorskie** (`AUTHORED`) | Pytanie napisane na potrzeby Tutlaw, nie pochodzące z egzaminu. Nie ma roku | `QuestionOrigin` |
| **Pytanie testowe** | Pytanie ABC z trzema odpowiedziami i dokładnie jedną poprawną | `TestQueueItem` |
| **Retencja** (docelowa) | Szansa, z jaką chcesz pamiętać kartę w chwili powtórki (70–97%). Wyższa retencja to częstsze powtórki | `desiredRetention` w ustawieniach nauki |
| **Retencja podniesiona** | W ostatnich 30 dniach przed egzaminem serwer sam podnosi retencję do co najmniej 95% | `effectiveRetention`, `retentionBoosted` |
| **Rok egzaminu** (`examYear`) | Rok, z którego jest pytanie egzaminacyjne; pytania autorskie go nie mają | `originLabel()` w `lib/origin.ts` |
| **Rozdział** | Część podręcznika. Użytkownik oznacza, które przeczytał | `Chapter` w `api/chapters.ts` |
| **Sesja** | Jedno podejście do nauki: kolejka kart pobrana z serwera i przerobiona po kolei | `StudySessionPage`, `TestSessionPage` |
| **Sesja dodatkowa** | Dokładanie kart po zakończeniu głównej sesji: „Powtórz jeszcze” (zaległe) albo „Rozwiąż jeszcze” (nowe, 10) | [04](04-nauka-w-aplikacji.md) |
| **Stan prawny** (`validAsOf`) | Data, na którą sprawdzono zgodność pytania z przepisami | `legalDate.ts` w `features/review` |
| **Szkic egzaminu** | Zapis trwającego egzaminu w przeglądarce (pytania, odpowiedzi, termin końca). Dzięki niemu odświeżenie strony nie kasuje egzaminu | `tutlaw.exam.draft.v1`, `features/exam/examStorage.ts` |
| **Testy** (z wielkiej litery) | Dział aplikacji z pytaniami ABC | `/app/tests`, [02](02-routing-i-strony.md) |
| **Trudne pytanie** (`leech`) | Pytanie, w którym liczba błędów osiągnęła próg ustalony przez serwer. Aplikacja proponuje je zawiesić | `DifficultCards.leechThreshold` |
| **Tryb sesji** (`SessionMode`) | `FLASHCARD` albo `TEST`: Fiszki i Testy mają osobne liczniki i kolejki | `api/review.ts` |
| **Tryb skupienia** | Sesja fiszek albo testu bez menu, z przyciskiem „Zakończ sesję” u góry. Włącza się sam po adresie | `sessionExitRoute` w `config/navigation.ts`, [02](02-routing-i-strony.md) |
| **Ukryta karta** | Karta schowana przez administratora przed wszystkimi użytkownikami | `HideCardButton.tsx` |
| **Zaległości** (`backlog`) | Karty po terminie powtórki: ile jest teraz (`dueNow`) i ile nie zmieści się dziś w limicie (`deferred`) | `Backlog` w `api/review.ts` |
| **Zawieszone pytanie** | Pytanie, które użytkownik wyłączył z nauki. Postęp zostaje, można je przywrócić w Koncie | `suspendCard`, `unsuspendCard` |
| **Zgłoszenie błędu** | Przycisk, którym użytkownik zgłasza błąd w pytaniu (powody: błędna odpowiedź, nieaktualny przepis, literówka lub niejasne sformułowanie, coś innego) | `ReportCardButton.tsx`, `ReportReason` |
| **Źródło** (`Source`) | Książka lub zbiór pytań należący do przedmiotu. Ma typ: podręcznik albo pula płaska | `api/sources.ts` |

## Pojęcia techniczne

| Pojęcie | Co znaczy | W kodzie i w dokumentacji |
|---------|-----------|---------------------------|
| **Aplikacja jednostronicowa (SPA)** | Strona, która ładuje się raz, a potem sama podmienia ekrany bez przeładowania | [01](01-architektura.md) |
| **axios** | Biblioteka do wysyłania żądań HTTP do serwera | `api/axiosInstance.ts`, [05](05-warstwa-api-i-dane.md) |
| **Dolna belka** (`BottomNav`) | Menu na telefonie: pięć pozycji przyklejonych do dołu ekranu, w zasięgu kciuka | `components/layout/BottomNav.tsx`, [06](06-wyglad-i-komponenty.md) |
| **Dostawca** (`provider`) | Komponent otaczający aplikację, który udostępnia coś wszystkim ekranom (dane, sesję) | `app/providers.tsx` |
| **Hook** | Funkcja Reacta zaczynająca się od `use`, np. `useQuery`, `useDueCount` | `features/*/hooks.ts` |
| **Interceptor** | Funkcja axiosa, która „przechwytuje” każde żądanie lub odpowiedź: dokłada token albo wylogowuje po 401 | [03](03-logowanie-i-sesja.md) |
| **JWT** | Token logowania: podpisany napis z identyfikatorem konta, rolą i terminem ważności | [03](03-logowanie-i-sesja.md) |
| **Klucz zapytania** (`queryKey`) | Nazwa, pod którą React Query trzyma dane w pamięci, np. `["review","due-count","TEST"]` | [05](05-warstwa-api-i-dane.md) |
| **Mermaid** | Zapis diagramów tekstem w plikach Markdown | Diagramy w tej dokumentacji |
| **Mutacja** (`useMutation`) | Zapis danych na serwerze (w odróżnieniu od odczytu) | [05](05-warstwa-api-i-dane.md) |
| **Pasek boczny** (`SideNav`) | Menu po lewej na komputerze i tablecie: szeroki panel (`full`) albo wąski pasek z podpisami (`rail`) | `components/layout/SideNav.tsx`, [06](06-wyglad-i-komponenty.md) |
| **Portal** | Sposób na wyrysowanie elementu poza miejscem w drzewie komponentów (okno `Dialog` trafia do `<body>`) | `components/ui/Dialog.tsx` |
| **React Query** | Biblioteka do pobierania danych, trzymania ich w pamięci i odświeżania | [05](05-warstwa-api-i-dane.md) |
| **Router** | Mechanizm wybierający ekran według adresu | `app/router.tsx`, [02](02-routing-i-strony.md) |
| **staleTime** | Jak długo dane z pamięci uchodzą za świeże i nie są pobierane ponownie | [05](05-warstwa-api-i-dane.md) |
| **Szkielet** (`Skeleton`) | Szary pulsujący prostokąt pokazywany w czasie ładowania | `components/ui/Skeleton.tsx` |
| **Tailwind** | Biblioteka stylów: wygląd zapisuje się klasami w kodzie | [06](06-wyglad-i-komponenty.md) |
| **Token dostępu** (`accessToken`) | JWT zapisany w `localStorage` pod tym kluczem | `features/auth/tokenStorage.ts` |
| **Twarda spacja** (`nbsp`) | Spacja, na której nie wolno łamać wiersza; po „w”, „z”, „i” w polskim tekście | `features/landing/typography.ts` |
| **Unieważnienie** (`invalidateQueries`) | Oznaczenie danych w pamięci jako nieaktualnych, żeby pobrać je od nowa | `invalidateReviewData` w `features/review/hooks.ts` |
| **Zapytanie kontenera** (`@container`) | Reguła stylów zależna od szerokości samej strony, a nie okna | [07](07-strona-glowna.md) |
