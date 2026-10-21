# 09. Słownik

[← Spis treści](README.md)

Pojęcia z aplikacji w kolejności alfabetycznej, z nazwami używanymi w kodzie. W pierwszej kolumnie jest nazwa widoczna
dla użytkownika (albo pojęcie techniczne), w drugiej wyjaśnienie, w trzeciej miejsce w kodzie lub w dokumentacji.

## Pojęcia z nauki i treści

| Pojęcie | Co znaczy | W kodzie i w dokumentacji |
|---------|-----------|---------------------------|
| **Akt prawny** (`ACT`, `TOPIC`) | Ustawa, kodeks albo zagadnienie, do którego należy każde pytanie. Zagadnienie bez ustawy (np. paremie łacińskie, prawoznawstwo) to akt typu `TOPIC`. Akty są pogrupowane w dziedziny; w „Puli pytań” użytkownik zaznacza, z których się uczy | `ActKind`, `PoolAct` w `api/pool.ts`, [04](04-nauka-w-aplikacji.md#pula-pytań-i-zakres-nauki) |
| **Aplikacja** (prawnicza) | Nie program, tylko **aplikacja prawnicza**: szkolenie zawodowe po studiach (adwokacka i radcowska, sędziowska i prokuratorska, uzupełniająca sędziowska, notarialna, komornicza). Każda ma własne arkusze egzaminacyjne, listę aktów i termin egzaminu. W kodzie to ścieżka typu `EXAM` | `Track`, `TrackKind` w `api/tracks.ts` |
| **Arkusz** | Zestaw pytań z egzaminu jednej aplikacji w danym roku, np. „Notarialna 2024”. Pytania autorskie to osobne źródło „Pytania autorskie” | `SourceKind` (`EXAM_SHEET`, `AUTHORED`) w `lib/source.ts` |
| **Czas nauki** | Łączny czas spędzony na ekranach nauki (osobny od czasu odpowiedzi). Liczy się przy widocznej karcie i do 3 minut bez ruchu, na serwer idzie co ok. 30 s | `StudyTimeMeter`, `StudyTimeTracker.tsx` |
| **Dodaj do fiszek** | Przycisk pod odpowiedzią w teście: dodaje fiszkę tego pytania do działu Fiszki (przycisk „Usuń z fiszek” cofa ręczne dodanie) | `QuestionFlashcardActions.tsx`, [04](04-nauka-w-aplikacji.md) |
| **Dziedzina** | Najwyższy poziom podziału materiału (jedenaście dziedzin, np. prawo karne i proces karny). Każdy widzi wszystkie dziedziny, ale w każdej tylko akty swojej puli | `PoolField` w `api/pool.ts`, `features/customTest/selection.ts` |
| **Dzienny limit** | Ile nowych fiszek i pytań testowych oraz ile zaległych powtórek aplikacja podaje jednego dnia (osobno w fiszkach i w testach). Ustawia go użytkownik w Koncie, pilnuje serwer | `LearningSettings`, [04](04-nauka-w-aplikacji.md) |
| **Egzamin MS** (karta „Egzaminy MS”) | Egzamin próbny złożony z **całego arkusza** wybranej aplikacji i roku (np. „Notarialna 2024”). Wybiera się aplikację, potem rok; można wybrać egzamin dowolnej aplikacji | `ExamSheetPicker`, `GET /api/exams/sheets` |
| **Egzamin próbny** | Egzamin w stałym formacie: do 150 pytań z wybranego źródła puli ścieżki (bez zawężenia do wybranych aktów) albo cały egzamin MS, zaliczenie od 100 punktów (próg ustala serwer), z zegarem, bez podpowiedzi w trakcie i z raportem na końcu. Oddzielny od zwykłych Testów. Ćwiczenie jednego działu to nie egzamin, tylko test z **kreatora** | `features/exam`, [04](04-nauka-w-aplikacji.md) |
| **Fiszka** | **Tryb pytania**, a nie osobna karta: ta sama treść z przodem (pytanie) i tyłem (odpowiedź), którą użytkownik ocenia czterema przyciskami. Ma własny harmonogram powtórek, niezależny od testu tego samego pytania | `pages/StudySessionPage.tsx`, `FlashcardQueueItem` w `api/review.ts` |
| **Fiszki** (z wielkiej litery) | Dział aplikacji z fiszkami. Zaczyna pusty: fiszki pojawiają się po pewnym błędzie w teście albo po „Dodaj do fiszek” | `/app/flashcards`, [02](02-routing-i-strony.md) |
| **FSRS-6** | Algorytm powtórek interwałowych (21 parametrów), który wylicza, kiedy pytanie ma wrócić. Działa **tylko w backendzie**; frontend pokazuje wynik | Dokumentacja backendu |
| **Grupa źródeł** (`SourceGroup`) | Jedna z trzech grup, na które Statystyki dzielą pytania: `OWN_SHEETS` (arkusze wybranej ścieżki), `OTHER_SHEETS` (arkusze innych ścieżek, z aktów Twojej puli) i `AUTHORED` (pytania autorskie). To nie jest ustawienie: do testu źródło wybiera się osobno (zob. **Źródło pytań w teście**) | `SOURCE_GROUP_LABELS` w `lib/source.ts` |
| **Kreator testu** | Jedna podstrona (Testy › Nauka albo Powtórki), na której użytkownik układa test: źródło pytań, przepisy z rozdziałami, rodzaj i liczba pytań, z przyklejonym podsumowaniem „Twój test”. Ma dwie odmiany: Nauka i Powtórki | `TestBuilderPage.tsx` w `features/customTest`, [04](04-nauka-w-aplikacji.md#testy-do-ułożenia-kreator-i-szybkie-zestawy) |
| **Krucha wiedza** | Poprawne odpowiedzi z zaznaczonym „Nie jestem pewien”: trafione, ale nie pewne | Statystyki Testów, [04](04-nauka-w-aplikacji.md) |
| **Licznik czasu przy pytaniu** | Mały zegar przy pytaniu i fiszce; liczy tylko przy widocznej karcie. Kliknięcie go chowa (zapisane na koncie). Ten sam czas idzie na serwer jako czas odpowiedzi | `QuestionTimer.tsx`, `useQuestionClock.ts` |
| **Limit automatyczny** | Tryb limitu nowych pytań dziennie, w którym limit idzie za planem do egzaminu (co najmniej 40, najwyżej 100 dziennie); drugi tryb to własny limit | `newQuestionsLimit.ts`, `LimitNotice.tsx` |
| **Moje testy** | Dwie stronicowane listy: **Testy** (zapisane testy z kreatora, z losowania i z szybkich zestawów, także nieukończone, ze szczegółami i przyciskiem „Ułóż ponownie z tymi ustawieniami”) i **Egzaminy** (podejścia do egzaminu próbnego z raportami) | `MyTestsPage.tsx`, `MyTestDetailPage.tsx`, `MyExamPage.tsx` |
| **Terminy / Pułapki** | Rodzaje pytań w teście: pytania o terminy i okresy (`TIME_LIMIT`) oraz pytania z podchwytliwym sformułowaniem (`TRAPS`). To pytania z zatwierdzonym oznaczeniem administratora; użytkownik nie widzi oznaczeń | `kindLabels.ts`, `QuickSets.tsx` |
| **Nie jestem pewien** | Pole wyboru, które zaznacza się **przed** odpowiedzią, gdy się zgaduje. Poprawna, ale niepewna odpowiedź jest traktowana jak „Nie pamiętam” | Pole `guessed` w `submitTestAnswer`; klawisz `G` |
| **Nowe pytanie** | Pytanie, którego użytkownik jeszcze nie widział w danym trybie (w teście albo w fiszkach). Ile nowych dochodzi dziennie, określa limit | `newFlashcardsPerDay`, `newTestQuestionsPerDay` |
| **Ocena fiszki** | Cztery przyciski: 1 Nie pamiętam, 2 Trudne, 3 Znam, 4 Łatwe. Liczba (1–4) idzie do serwera | `submitReview` w `api/review.ts` |
| **Okno startowe** | Obowiązkowe okno po zalogowaniu nowego użytkownika: wybór ścieżki (aplikacja albo Student) i wyglądu strony. Nie zamyka się bez wyboru | `OnboardingDialog.tsx` |
| **Opanowanie** (aktu prawnego) | Procent pytań aktu, które są już „opanowane” (serwer liczy tak pytania o stabilności powyżej 21 dni) | `ActMastery.masteryPercentage` w `features/statistics/types.ts` |
| **Paremia** | Łacińska sentencja prawnicza. W Gradus iuris to zwykłe pytania ABC (autorskie) w zagadnieniu typu `TOPIC`, a nie osobny rodzaj treści | `ActKind` w `api/pool.ts` |
| **Pewna pomyłka** | Błędna odpowiedź **bez** zaznaczenia „Nie jestem pewien”: użytkownik był przekonany, że wie. Najgorsza kombinacja; pytanie wraca szybko i trafia do fiszek | `flashcardUnlocked` w `TestAnswerResult` |
| **Podpowiedź skrótów** | Pasek z klawiszami pod pytaniem. Znika po 10 odpowiedziach (osobno w testach i fiszkach), „×” chowa ją na stałe, klawisz `?` pokazuje z powrotem na chwilę | `KeyboardHint.tsx`, `features/interface/hooks.ts` |
| **Podsumowanie sesji** | Dwa zdania na ekranie „Brawo!”: nowe pytania (fiszki) w tej sesji i ile powtórek wróci jutro | `SessionSummary.tsx` |
| **Podstawa prawna** | Przepis, na którym opiera się pytanie, np. „art. 415 k.c.”; pokazywana po odpowiedzi | `legalBasis`; `features/review/LegalBasisLine.tsx` |
| **Powtórka** | Ponowne rozwiązanie albo ocena pytania po terminie wyznaczonym przez algorytm | `getDueCount`, odznaki w menu |
| **Powtórz jeszcze** | Przycisk na końcu sesji: dokłada porcję zaległych powtórek ponad dzienny limit (20) | `EXTRA_DUE_BATCH` w `features/review/useBacklog.ts` |
| **Powtórz moje błędy** | Specjalna sesja z pytań, na które ostatnia odpowiedź w teście była błędna. Wchodzi się z niej przyciskiem „Moje błędy” w „Szybkim starcie” na ekranie Testy | Tryb `mistakes`, `/app/test/mistakes` |
| **Przedmiot** | To, z czego uczy się Student (np. Prawo karne): administrator przypisuje przedmiotowi akty prawne w panelu, a Student wybiera przedmioty i dostaje wszystkie pytania ich aktów. Pytania nadal należą do aktów | `PoolCourse` w `api/pool.ts`, `TestCourseNode` w `api/tests.ts` |
| **Pula pytań** | Pytania, z których uczy się użytkownik: akty jego ścieżki (u Studenta akty wybranych przedmiotów), po opcjonalnym zawężeniu do wybranych aktów (zob. **Zakres nauki**). Liczy ją serwer, a frontend pokazuje ją w karcie „Zakres nauki” w Koncie | `Pool` w `api/pool.ts`, `features/pool`, [04](04-nauka-w-aplikacji.md#pula-pytań-i-zakres-nauki) |
| **Zmiana w prawie** | Data (i krótki opis) zmiany przepisów, która dotyka pytania. Od tego dnia pytanie wraca jako zaległe u tych, którzy na nie odpowiadali, a przez rok trafia do rodzaju „Zmiany w prawie” we Własnym teście; przy pytaniu stoi plakietka „Zmiana w prawie: data” | `LawChange` w `lib/lawChange.ts`, `features/review/LawChangeBadge.tsx` |
| **Zerowanie postępów** | Nieodwracalne skasowanie stanu nauki, historii odpowiedzi, własnych testów, egzaminów i czasu nauki. Konto, ścieżka, ustawienia, wybrane przedmioty i zgłoszenia zostają. Wymaga wpisania słowa WYZERUJ | `api/studyProgress.ts`, `features/progress` |
| **Pytanie autorskie** | Pytanie napisane na potrzeby Gradus iuris (np. paremie łacińskie), nie pochodzące z egzaminu. Ma źródło „Pytania autorskie” i nie ma roku | `SourceKind` (`AUTHORED`) |
| **Pytanie testowe** | Pytanie ABC z trzema odpowiedziami i dokładnie jedną poprawną. To samo pytanie ma też swój tryb fiszki | `TestQueueItem` w `api/review.ts` |
| **Retencja** (docelowa) | Szansa, z jaką chcesz pamiętać pytanie w chwili powtórki (70–97%). Wyższa retencja to częstsze powtórki | `desiredRetention` w ustawieniach nauki |
| **Retencja podniesiona** | W ostatnich 30 dniach przed egzaminem serwer sam podnosi retencję do co najmniej 95% | `effectiveRetention`, `retentionBoosted` |
| **Rok egzaminu** (`examYear`) | Rok, z którego jest arkusz egzaminacyjny; pytania autorskie go nie mają. Podpis pytania składa się z nazwy źródła i roku | `sourceLabel()` w `lib/source.ts` |
| **Rozdział** | Część aktu prawnego (np. „XIX. Przestępstwa przeciwko życiu i zdrowiu” w Kodeksie karnym). Pytanie może należeć do jednego rozdziału albo do żadnego (wtedy jest tylko w akcie jako całości). W kreatorze zaznacza się akty w całości albo wybrane rozdziały | `TestSectionNode` w `api/tests.ts`, `features/customTest/selection.ts` |
| **Sesja** | Jedno podejście do nauki: kolejka pytań pobrana z serwera i przerobiona po kolei | `StudySessionPage`, `TestSessionPage` |
| **Sesja dodatkowa** | Dokładanie pytań po zakończeniu głównej sesji: „Powtórz jeszcze” (zaległe) albo „Rozwiąż jeszcze” (nowe, 10) | [04](04-nauka-w-aplikacji.md) |
| **Stan prawny** (`validAsOf`) | Data, na którą sprawdzono zgodność pytania z przepisami | `legalDate.ts` w `features/review` |
| **Student** | Ścieżka bez aplikacji (typ `STUDENT`): bez terminu, odliczania i planu dnia. Pulę składa z wybranych przedmiotów (bez wyboru: ze wszystkich) | `TrackKind` w `api/tracks.ts` |
| **Szkic egzaminu** | Zapis trwającego egzaminu w przeglądarce (pytania, odpowiedzi, termin końca, próg w punktach z serwera). Dzięki niemu odświeżenie strony nie kasuje egzaminu | `gradus.exam.draft.v2`, `features/exam/examStorage.ts` |
| **Szybki zestaw** | Kafelek na ekranie Testy („Moje błędy”, „Zmiany w prawie”, „Nowe pytania”), który zaczyna test od razu: do 20 pytań danego rodzaju z całej puli, bez kreatora | `features/tests/QuickSets.tsx`, [02](02-routing-i-strony.md) |
| **Ścieżka** (`Track`) | Wybór użytkownika w oknie startowym i w Koncie: jedna z pięciu aplikacji albo Student. Od ścieżki zależy pula pytań, a w aplikacjach także termin egzaminu, odliczanie i plan dnia | `Track`, `chooseTrack` w `api/settings.ts` |
| **Testy** (z wielkiej litery) | Dział aplikacji z pytaniami ABC: dziedzina, potem akt prawny, z którego od razu zaczyna się sesja | `/app/tests`, [02](02-routing-i-strony.md) |
| **Trudne pytanie** (`leech`) | Pytanie, w którym liczba błędów osiągnęła próg ustalony przez serwer. Aplikacja proponuje je zawiesić | `DifficultQuestions.leechThreshold` w `api/difficult.ts` |
| **Tryb sesji** (`SessionMode`) | `FLASHCARD` albo `TEST`: Fiszki i Testy mają osobne liczniki, kolejki i harmonogramy tego samego pytania | `api/review.ts` |
| **Tryb skupienia** | Sesja fiszek albo testu bez menu, z przyciskiem „Zakończ sesję” u góry. Włącza się sam po adresie | `sessionExitRoute` w `config/navigation.ts`, [02](02-routing-i-strony.md) |
| **Ukryte pytanie**, **ukryta fiszka** | Pytanie (albo sama jego fiszka) schowane przez administratora przed wszystkimi użytkownikami. Przywraca się je w panelu (Pytania). Pytań się nie usuwa | `HideQuestionButton.tsx`, `QuestionCard.tsx` |
| **Oznaczenie pytania** | „Pytanie z terminem” albo jedna z pięciu pułapek (przeczenie, słowo bezwzględne, zbliżone liczby, spójnik, nieaktualny stan prawny). Automat tylko **proponuje**, a testy „Pytania z terminów” i „Pułapki” układają się dopiero z oznaczeń **zatwierdzonych** przez administratora | `features/admin/marks.ts`, `AdminMarksPage.tsx` |
| **Import pytań** | Wczytanie pytań z pliku CSV albo JSON w panelu: najpierw sprawdzenie z raportem (bez zapisu), potem zapis „wszystko albo nic”; powtórzone pytania są pomijane | `AdminImportPage.tsx`, `ImportReportView.tsx`, `importFile.ts` |
| **Ukryty akt**, **ukryty arkusz** | Akt prawny albo arkusz egzaminu schowany przez administratora w panelu przed wszystkimi użytkownikami (znika z puli, testów, fiszek, liczników i egzaminów, a pytania i historia zostają). Akt, arkusz i rozdział z pytaniami można tylko ukryć, nie usunąć | `AdminActsPage.tsx`, `AdminSheetsPage.tsx` |
| **Panel administratora** | Ekran `/admin` tylko dla roli `ADMIN`: aplikacje, przedmioty Studenta, akty prawne z rozdziałami i przypisaniami, arkusze i terminy egzaminów, pytania, import pytań, oznaczenia i zgłoszenia błędów | `features/admin`, [02](02-routing-i-strony.md#panel-administratora-admin) |
| **Wygląd** (motyw) | Ciemny (domyślny) albo jasny; zapisany na koncie w backendzie, działa tylko wewnątrz aplikacji (`/app`) | `lib/theme.ts`, `ThemeSync.tsx`, `AppearanceCard.tsx` |
| **Własny test** | Sesja nauki ułożona przez użytkownika (w kreatorze, „Losuj z całej puli” albo szybkim zestawie): źródło pytań, wybrane przepisy i rozdziały z puli, rodzaj pytań (wszystkie, nowe, błędy, zmiany w prawie, zaległe) i liczba pytań (10, 20, 50, 100, 150 albo „Wszystkie”). Zapisuje się w „Moich testach”. To nauka, a nie egzamin: bez progu i wyniku „zdał / nie zdał” | `features/customTest`, [04](04-nauka-w-aplikacji.md) |
| **Zaległości** (`backlog`) | Pytania po terminie powtórki: ile jest teraz (`dueNow`) i ile nie zmieści się dziś w limicie (`deferred`) | `Backlog` w `api/review.ts` |
| **Zakres nauki** | Trwały wybór aktów (Student: przedmiotów), do których użytkownik ogranicza swoją pulę. Zaznaczenie wszystkiego oznacza brak zawężenia. Dotyczy Testów, Fiszek i statystyk, nie egzaminu próbnego; zmiana ścieżki go zdejmuje. Ustawia się go w karcie „Zakres nauki” w Koncie | `updatePoolActs` w `api/pool.ts`, `LearningScopeCard.tsx`, `PoolDialog.tsx` |
| **Zawieszone pytanie** | Pytanie, które użytkownik wyłączył z nauki w jednym trybie (testy albo fiszki osobno). Postęp zostaje, można je przywrócić w Koncie | `suspendQuestion`, `unsuspendQuestion` w `api/difficult.ts` |
| **Zgłoś błąd** | Przycisk (dopiero po odpowiedzi, w prawym górnym rogu panelu wyniku albo odwróconej fiszki), który otwiera okno na środku ekranu, w którym użytkownik zgłasza błąd w pytaniu (powody: błędna odpowiedź, nieaktualny przepis, literówka lub niejasne sformułowanie, coś innego) | `ReportQuestionButton.tsx`, `ReportReason` |
| **Źródło** (`Source`) | Skąd pochodzi pytanie: arkusz egzaminu jednej aplikacji w danym roku albo „Pytania autorskie”. W Statystykach źródła są w trzech grupach (zob. **Grupa źródeł**) | `SourceKind`, `sourceLabel()` w `lib/source.ts` |
| **Źródło pytań w teście** (`SourceMode`) | Wybór przy każdym teście w kreatorze i przy każdym egzaminie: „Wszystkie źródła”, „Ministerstwo Sprawiedliwości” (arkusze egzaminacyjne) albo „Autorskie”. Nie jest ustawieniem trwałym i nie dotyczy Fiszek | `lib/sourceMode.ts` |

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
