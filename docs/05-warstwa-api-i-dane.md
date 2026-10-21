# 05. Warstwa API i dane

[← Spis treści](README.md)

Ten dokument opisuje, jak frontend rozmawia z serwerem: wspólnego klienta HTTP, **wszystkie** wywołania serwera
(co, dokąd i który ekran z tego korzysta) oraz pamięć podręczną danych (React Query): klucze, czasy ważności i to, co
po której czynności jest odświeżane. Opis samych endpointów (parametry, odpowiedzi, błędy) jest w dokumentacji
backendu, w katalogu `docs/api/`.

## Klient HTTP: `api/axiosInstance.ts`

Wszystkie wywołania idą przez jeden wspólny obiekt `api` (biblioteka axios):

| Ustawienie | Wartość |
|------------|---------|
| Adres serwera (`baseURL`) | Zmienna `VITE_API_BASE_URL` z pliku `.env` (patrz [08](08-konfiguracja-i-uruchomienie.md)) |
| Nagłówek `Authorization` | Dokładany do **każdego** żądania, jeśli w `localStorage` jest token dostępu: `Bearer <token>` |
| Czas oczekiwania, ponawianie | Brak własnych ustawień. Ponawianie robi tylko React Query (raz) |
| Obsługa odpowiedzi `401` | Najpierw **odświeżenie sesji** tokenem odświeżającym i ponowienie żądania; dopiero gdy się nie uda, wylogowanie i przejście na `/login`. Szczegóły i wyjątki: [03](03-logowanie-i-sesja.md) |

Wywołania do `/api/auth/...` (logowanie, rejestracja, reset hasła, odświeżenie) nie wywołują odświeżania ani wylogowania po
`401`, bo błąd tam znaczy „złe dane logowania” albo „token odświeżający nieważny”, a nie „sesja wygasła”.

### Dwa miejsca poza wspólnym klientem

Wszystko inne idzie przez obiekt `api`. Wyjątki są dwa i oba mają powód:

- **`api/refreshSession.ts`** używa osobnego klienta axios (`bare`) bez interceptorów, żeby własne `401` przy odświeżaniu
  nie wpadło w pętlę. To tu jest `POST /api/auth/refresh`: jedno wspólne odświeżenie dla wszystkich równoległych żądań w
  karcie i blokada Web Locks między kartami (bez niej dwie karty zużyłyby ten sam jednorazowy token, a serwer uznałby to
  za kradzież).
- **`api/keepalive.ts`** wysyła `fetch` z `keepalive: true`. Dzięki temu wylogowanie (`POST /api/auth/logout`) i ostatnie
  sekundy czasu nauki (`POST /api/me/study-time`) dochodzą do serwera nawet wtedy, gdy karta się właśnie zamyka albo
  strona się przeładowuje. `navigator.sendBeacon` odpada, bo nie umie wysłać nagłówka `Authorization`.

### Wzorzec pliku w `api/`

Plik w `src/api/` opisuje jeden zasób i zawiera dwie rzeczy: **typy odpowiedzi** (`interface`) i **cienkie funkcje**
wywołujące serwer. Funkcja nic nie liczy, zwraca `res.data` z typem. Przykład z `api/tests.ts`:

```ts
export async function getTestCatalog(): Promise<TestCatalog> {
  const res = await api.get<TestCatalog>("/api/tests/catalog");
  return res.data;
}
```

Wyjątki w układzie plików: funkcje dla Statystyk (`features/statistics/api.ts`) i Konta (`features/account/api.ts`)
leżą obok swoich ekranów, a sześć wywołań uwierzytelniających (rejestracja, aktywacja, logowanie, „wyślij link ponownie”,
prośba o reset hasła i ustawienie nowego hasła) jest wpisanych bezpośrednio w komponentach formularzy
(`pages/LoginPage.tsx` i podobne).

## Wszystkie wywołania serwera

Frontend używa **63 z 64** endpointów backendu (łącznie 64 wywołań w kodzie, bo `POST /api/me/study-time` jest wołane z
dwóch miejsc). Jeden endpoint backendu pozostaje nieużywany (`GET /api/courses`); sekcja o nim jest [niżej](#endpointy-których-frontend-nie-używa).
Kolumna „Funkcja” podaje nazwę w kodzie, żeby można ją było znaleźć wyszukiwarką.

### Konto i logowanie (bez tokenu)

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/auth/register` | `pages/RegisterPage.tsx` | Formularz rejestracji (mail prywatny, mail uczelniany, hasło, zgoda na regulamin) |
| `GET /api/auth/verify` | `pages/VerifyPage.tsx` | Link aktywacyjny z maila (`/verify?token=`); jedno wywołanie na wejście dzięki `useRef` |
| `POST /api/auth/login` | `pages/LoginPage.tsx` | Logowanie; odpowiedź zawiera `accessToken` i `refreshToken`, oba zapisywane w `localStorage` |
| `POST /api/auth/resend-verification` | `features/auth/ResendVerification.tsx` | „Wyślij link ponownie” (na ekranach logowania i weryfikacji) |
| `POST /api/auth/forgot-password` | `pages/ForgotPasswordPage.tsx` | Prośba o link do zmiany hasła |
| `POST /api/auth/reset-password` | `pages/ResetPasswordPage.tsx` | Ustawienie nowego hasła tokenem z maila |
| `POST /api/auth/refresh` | `refreshSession` (`api/refreshSession.ts`) | Po `401` na zwykłym żądaniu: wymiana tokenu odświeżającego na nową parę. Wywołuje go interceptor, nie ekran |
| `POST /api/auth/logout` | `postKeepalive` (`api/keepalive.ts`), wołane z `AuthContext` | „Wyloguj się”: unieważnia sesję na serwerze; wysyłane przez `fetch` z `keepalive`, bez nagłówka `Authorization` (token odświeżający idzie w treści) |

### Konto zalogowanego

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/me` | `fetchMe` (`features/account/api.ts`) | Konto (adres e-mail) i Egzamin (adres jest „właścicielem” zapisanego szkicu egzaminu); klucz `["me"]` |
| `GET /api/users/me/export` | `fetchAccountExport` | Karta „Pobierz moje dane” w Koncie (plik JSON) |
| `PUT /api/users/me/password` | `changePassword` | Karta „Zmień hasło”; zwraca nową parę tokenów, która zastępuje starą |
| `DELETE /api/users/me` | `deleteAccount` | Karta „Usuń konto”; hasło idzie w treści żądania (`data: { password }`) |
| `GET /api/me/study-progress` | `getStudyProgress` (`api/studyProgress.ts`) | Okna „Wyzeruj postępy” i „Zmień ścieżkę” (po zaznaczeniu „Zacznij od zera”): liczby tego, co zniknie. Pobierane dopiero po otwarciu okna |
| `DELETE /api/me/study-progress` | `resetStudyProgress` | „Wyzeruj na stałe”: zeruje postępy (nie konto, ścieżkę ani ustawienia). Ciało `{ confirm: "WYZERUJ" }` w `data`; odpowiedź to liczby sprzed kasowania |

### Ścieżki, pula pytań i katalog Testów

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/tracks` | `getTracks` (`api/tracks.ts`) | Lista ścieżek (pięć aplikacji i Student): okno startowe i wybór ścieżki w Koncie |
| `GET /api/me/pool` | `getPool` (`api/pool.ts`) | Karta i okno „Zakres nauki” w Koncie; notka o zawężeniu na ekranie Testy, „Postęp” na Pulpicie i ustawienia egzaminu |
| `PUT /api/me/pool/acts` | `updatePoolActs` | Okno „Zakres nauki” (aplikacje): zawężenie do wybranych aktów (pusta lista zdejmuje zawężenie) |
| `PUT /api/me/pool/courses` | `updatePoolCourses` | Okno „Zakres nauki” (Student): wybór przedmiotów (pusta lista = wszystkie). Przedmioty przychodzą w `Pool.courses` |
| `GET /api/tests/catalog` | `getTestCatalog` (`api/tests.ts`) | Kreator testu: drzewo dziedzin (Student: przedmiotów), aktów i rozdziałów dla wybranego źródła (parametr `source`: `MINISTRY` albo `AUTHORED`, bez niego wszystkie); Pulpit: wiersze postępu według dziedzin albo przedmiotów; Fiszki i Statystyki: lista aktów (Student: przedmiotów) |

### Nauka: kolejki, odpowiedzi, liczniki

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/review/flashcard-queue` | `getFlashcardQueue` | Sesja Fiszek (`StudySessionPage`); zakres w parametrach `fieldId`, `actId`, `sourceId` |
| `GET /api/review/test-queue` | `getTestQueue` | Sesja Testów w trybach zakres i powtórki (`TestSessionPage`); zakres w `fieldId`, `actId`, `sourceId` |
| `GET /api/review/practice-queue` | `getPracticeQueue` | Sesja „Przećwicz błędy z egzaminu” i sesja testu z kreatora, z losowania i z szybkiego zestawu (`questionIds=`) |
| `GET /api/review/mistakes-queue` | `getMistakesQueue` | Sesja „Powtórz moje błędy” |
| `GET /api/review/mistakes-count` | `getMistakesCount` | Link „Popraw moje błędy” (z liczbą) na Pulpicie i w Statystykach |
| `GET /api/review/custom-test/counts` | `getCustomTestCounts` (`api/customTest.ts`) | Liczby pytań w zakresie i źródle (parametry `fieldIds`, `actIds`, `courseIds`, `sectionIds`, `source`; odpowiedź `all`, `newQuestions`, `mistakes`, `due`, `lawChanges`): kreator testu (liczby przy rodzajach i liczba pytań), „Losuj z całej puli” i kafelki szybkich zestawów (bez zakresu) |
| `POST /api/review/custom-test` | `drawCustomTest` (`api/customTest.ts`) | Losowanie numerów pytań po „Zacznij test” w kreatorze, „Start” w „Losuj z całej puli” i kliknięciu szybkiego zestawu (ciało: `fieldIds`, `actIds`, `courseIds`, `sectionIds`, `source`, `kind`, `questionCount`; `kind` to `ALL`, `NEW`, `MISTAKES`, `DUE` albo `LAW_CHANGE`); odpowiedź ma `questionIds` i `sessionId` zapisanego testu. Liczba pytań to 10, 20, 50, 100 albo 150 |
| `GET /api/custom-tests/sessions` | `listCustomTestSessions` (`api/customTest.ts`) | „Moje testy”: lista zapisanych testów (`/app/custom-test/history`) |
| `GET /api/custom-tests/sessions/{id}` | `getCustomTestSession` (`api/customTest.ts`) | „Moje testy”: szczegóły testu z odpowiedziami (`/app/custom-test/history/:id`) i przycisk „Ułóż ponownie z tymi ustawieniami” |
| `GET /api/review/due-tomorrow` | `getDueByTomorrow` (`api/review.ts`) | Podsumowanie na ekranie „Brawo!”: „Jutro wróci N powtórek” |
| `GET /api/review/queue/new-available` | `getAvailableNewQuestionsCount` | Przycisk „Dołóż nowe” na końcu sesji i liczba „Nowe” na ekranie Fiszki (z `mode`) |
| `GET /api/review/queue/backlog` | `getBacklog` | Informacja o zaległościach i przycisk „Powtórz jeszcze” |
| `GET /api/review/due-count` | `getDueCount` | Odznaki w menu, karta „Na dziś” na Pulpicie (osobno dla pytań i fiszek), ekrany Testy i Fiszki |
| `POST /api/review` | `submitReview` | Ocena fiszki (1–4, z `questionId`); odpowiedź `{ firstReview }` zasila podsumowanie sesji |
| `POST /api/review/test-answer` | `submitTestAnswer` | Odpowiedź w teście (`questionId`, A/B/C, „Nie jestem pewien”), z czasem odpowiedzi i, w sesji własnego testu, z `sessionId`; odpowiedź ma `newQuestion` i stan fiszki |

### Fiszki z pytań, zgłoszenia, ukrywanie, zawieszanie

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/questions/{questionId}/flashcard` | `addToFlashcards` (`api/flashcards.ts`) | „Dodaj do fiszek” pod odpowiedzią w teście; odpowiedź to nowy stan fiszki |
| `DELETE /api/questions/{questionId}/flashcard` | `removeFromFlashcards` | „Usuń z fiszek” (cofnięcie ręcznego dodania) |
| `POST /api/questions/{questionId}/reports` | `reportQuestion` (`api/reports.ts`) | „Zgłoś błąd” (okno na środku ekranu) |
| `PUT /api/questions/{questionId}/hidden` | `setQuestionHidden` (`api/flashcards.ts`) | „Ukryj pytanie” w teście (tylko administrator) |
| `PUT /api/questions/{questionId}/flashcard-hidden` | `setFlashcardHidden` | „Ukryj fiszkę” w sesji fiszek (tylko administrator); pytanie zostaje w Testach |
| `GET /api/me/difficult-questions` | `getDifficultQuestions` (`api/difficult.ts`) | Konto: lista trudnych i zawieszonych pytań, osobno dla trybów Testy i Fiszki |
| `PUT /api/me/suspended-questions/{questionId}` | `suspendQuestion` | „Zawieś pytanie” w sesji i na liście w Koncie (`mode` w parametrze) |
| `DELETE /api/me/suspended-questions/{questionId}` | `unsuspendQuestion` | „Przywróć” na liście w Koncie (`mode` w parametrze) |

### Egzamin próbny

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/exams/start` | `startExam` (`api/exam.ts`) | Przycisk „Rozpocznij egzamin” w ustawieniach egzaminu. **Bez ciała**: format jest stały. Parametr `source` (`ALL`, `MINISTRY`, `AUTHORED`) wybiera źródło losowania 150 pytań, a `sheetId` (numer z `exams/sheets`) cały egzamin MS z wybranego roku. Odpowiedź ma `scopeLabel` i `passPoints` |
| `GET /api/exams/availability` | `getExamAvailability` | Ustawienia egzaminu: liczby pytań przy kartach źródeł (`all`, `ministry`, `authored`) |
| `GET /api/exams/sheets` | `getExamSheets` | Ustawienia egzaminu, karta „Egzaminy MS”: aplikacje i lata egzaminów z liczbą pytań (`ExamSheets`) |
| `POST /api/exams/submit` | `submitExam` | Wysłanie odpowiedzi po zakończeniu (ręcznym albo przez zegar). Ciało: `timeLimitMinutes`, `durationSeconds`, `timedOut`, `answers` oraz `source` albo `sheetId` (tylko do podpisu w historii); **bez zakresu i progu**, bo ocenia serwer |
| `GET /api/exams/history` | `getExamHistory` | Historia egzaminów (do 50) oraz karta „Egzamin próbny” na Pulpicie. Wpis ma `passPoints`; `null` oznacza podejście sprzed stałego formatu |

### Statystyki

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/statistics/overview` | `fetchOverview` (`features/statistics/api.ts`) | Sekcja „Fiszki” na Statystykach (zawsze z `mode=FLASHCARD`, opcjonalnie z `actId`); ekran Fiszki (czy są jakieś fiszki) |
| `GET /api/statistics/activity` | `fetchActivity` | Wykres „Aktywność” (Statystyki) i wiersz serii w „Na dziś” (Pulpit); w obu 28 dni |
| `GET /api/statistics/acts` | `fetchActMastery` | Sekcja „Opanowanie aktów prawnych” (Statystyki) |
| `GET /api/statistics/weak-questions` | `fetchWeakQuestions` | Tabela „Do poprawy” w sekcji „Fiszki” (10 pytań, `mode=FLASHCARD`) |
| `GET /api/statistics/tests` | `fetchTestStats` | Karta „Ostatnie 30 dni” (Statystyki); Pulpit: „Na dziś” i „Postęp” (liczba przerobionych pytań) |
| `GET /api/statistics/sources` | `fetchSourceStats` | Sekcja „Opanowanie pytań” w Statystykach (według grup źródeł i arkuszy). Pulpit tego nie pobiera |
| `GET /api/statistics/learning-summary` | `fetchLearningSummary` | Sekcja „Podsumowanie nauki” w Statystykach: odpowiedzi, egzaminy, własne testy, czas nauki, średnie czasy odpowiedzi |

### Ustawienia

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/me/settings` | `getLearningSettings` | Karta „Ustawienia nauki” w Koncie, Pulpit (wybrana aplikacja, odliczanie, cel na dziś), okno startowe i wygląd strony (`ThemeSync`, `OnboardingGate` w `AppShell`), Statystyki (domyślny zakres) |
| `PUT /api/me/settings` | `updateLearningSettings` | Zapis ustawień nauki (limity, retencja; bez daty egzaminu i bez wyglądu). `newTestQuestionsPerDay: null` oznacza limit automatyczny |
| `PUT /api/me/track` | `chooseTrack` (`api/settings.ts`) | Wybór ścieżki (aplikacja albo Student): obowiązkowe okno startowe i „Moja ścieżka” w Koncie. Backend układa pulę, a przy zmianie zdejmuje zawężenie do aktów |
| `GET /api/me/interface` | `getInterfaceSettings` (`api/interfaceSettings.ts`) | Ukrycie podpowiedzi skrótów (testy, fiszki), ukrycie licznika czasu i liczba dotychczasowych odpowiedzi (do 10). Gdy się nie uda, podpowiedź i licznik zostają widoczne |
| `PUT /api/me/interface` | `updateInterfaceSettings` (`api/interfaceSettings.ts`) | Zapis „×” przy podpowiedzi i kliknięcia w licznik czasu |
| `POST /api/me/study-time` | `sendToServer` (`features/studytime/useStudyTimeTracker.ts`), przy zamykaniu karty `postKeepalive` | Porcje **czasu nauki** (1–300 s) co ok. 30 s na ekranach nauki |
| `PUT /api/me/theme` | `chooseTheme` (`api/settings.ts`) | Wybór wyglądu strony (`DARK` albo `LIGHT`), zapisany na koncie: okno startowe (razem z wyborem ścieżki) i karta „Wygląd” w Koncie. Zwraca ustawienia nauki |
| `GET /api/exam-terms` | `getExamTerms` (`api/examTerms.ts`) | Terminy egzaminów pięciu aplikacji (każdy z obiektem `track`): okno startowe (wiersz terminu przy aplikacji), informacja o terminie w Koncie i karta „Terminy egzaminów” |
| `PUT /api/exam-terms/{trackId}` | `updateExamTerm` (`api/examTerms.ts`) | Zapis albo usunięcie terminu (karta administratora w Koncie; serwer sprawdza rolę) |

### Endpointy, których frontend nie używa

Endpointów, których frontend nie używa, jest 1:

| Wywołanie | Dlaczego nie |
|-----------|--------------|
| `GET /api/courses` | Lista przedmiotów. Student dostaje przedmioty w puli (`Pool.courses`) i w katalogu Testów (`TestCatalog.courses`), z liczbami pytań i zaznaczeniem, więc osobne pobieranie niczego nie daje |

Treść (akty prawne, przedmioty, pytania, zmiany w prawie) administrator wprowadza **skryptami SQL**, a nie przez API, więc
nie ma endpointów do jej dodawania.

W aplikacji nie ma panelu administratora. Funkcje administratora w interfejsie to przyciski „Ukryj pytanie” i „Ukryj
fiszkę” (`PUT /api/questions/{questionId}/hidden` i `/flashcard-hidden`) oraz karta „Terminy egzaminów” w Koncie
(`PUT /api/exam-terms/{trackId}`).

## Parametry zapytań, które łatwo pomylić

| Co | Jak to działa |
|----|---------------|
| Zakres nauki (`fieldId`, `actId`, `sourceId`) | Kolejki, licznik nowych pytań i zaległości przyjmują je od najwęższego: źródło (arkusz), akt prawny, dziedzina. Bez żadnego serwer bierze całą pulę użytkownika. Zakres liczy się razem z pulą (ścieżka, zawężenie do aktów) |
| `mode` (`FLASHCARD` albo `TEST`) | Fiszki i Testy liczą się osobno. Bez `mode` backend liczy **fiszki**, więc każde wywołanie dla Testów musi podać `TEST` (kod robi to w `getAvailableNewQuestionsCount`, `getDueCount`, `getBacklog`) |
| `extraNewCards`, `extraDueReviews` | Dokładanie nowych pytań („Dołóż nowe”, porcja 10) i zaległych powtórek („Powtórz jeszcze”, porcja 20) ponad dzienny limit; `extraNewCards=0` to sesja bez nowych |
| `questionIds` w kolejce ćwiczeń | Lista identyfikatorów zapisana po przecinku (`questionIds=1,2,3`), bo Spring tak ją czyta; axios domyślnie zapisałby `questionIds[]=1&questionIds[]=2` |
| `actId` w Statystykach | Brak oznacza „cała pula”: parametr nie jest wysyłany |
| `days`, `limit` | Wykres aktywności domyślnie 30 dni; tabela słabych pytań domyślnie 10 pozycji |
| Puste parametry | Axios pomija parametry równe `undefined`, więc funkcje mogą bezpiecznie przekazywać niewybrane filtry |

## Pamięć podręczna danych (React Query)

### Ustawienia domyślne

W `app/providers.tsx` jeden wspólny `QueryClient`: dane są **świeże 60 sekund** (`staleTime`), nieudane zapytanie jest
ponawiane **raz** (`retry: 1`). Przez „świeże” rozumiemy: w tym czasie ekran używa kopii z pamięci i nie pyta serwera.
Gdy dane są starsze, ekran pokazuje kopię od razu i w tle pobiera nowszą. React Query domyślnie odświeża też nieświeże
dane po powrocie do karty przeglądarki. Pamięć żyje tylko w otwartej karcie; po odświeżeniu strony i po wylogowaniu
(które przeładowuje stronę) jest pusta.

### Klucze i czasy ważności

| Klucz | Co przechowuje | Ważne | Gdzie zdefiniowane |
|-------|----------------|-------|--------------------|
| `["tracks"]` | Lista ścieżek (aplikacje i Student) | 10 min | `features/settings/hooks.ts` |
| `["pool"]` | Pula pytań użytkownika (ścieżka, zawężenie do aktów) | 30 s | `features/pool/hooks.ts` |
| `["tests","catalog"]` | Dziedziny, akty i rozdziały z licznikami (klucz ma na końcu źródło: `["tests","catalog",source]`) | **0** | `features/tests/hooks.ts` |
| `["review","due-count",mode]` | Liczba powtórek do zrobienia | 30 s | `features/review/hooks.ts` |
| `["review","mistakes-count"]` | Liczba błędów do powtórzenia | 30 s | j.w. |
| `["review","custom-test-counts",zakres]` | Liczby pytań w zakresie kreatora testu (klucz ma na końcu źródło i zakres; poprzednia odpowiedź zostaje na ekranie, dopóki nie przyjdzie nowa) | **0** | `features/customTest/hooks.ts` |
| `["review","backlog",mode,fieldId,actId,sourceId]` | Zaległości w zakresie sesji | **0**, brak przechowywania po zamknięciu ekranu (`gcTime: 0`), bez ponawiania i bez odświeżania po powrocie do karty przeglądarki | `features/review/useBacklog.ts` |
| `["review","new-available","FLASHCARD",fieldId,actId]` | Liczba nowych fiszek w zakresie (ekran Fiszki) | **0**, bez ponawiania | `features/flashcards/FlashcardsPage.tsx` |
| `["review","due-tomorrow",mode]` | „Jutro wróci N powtórek” na końcu sesji | **0** | `features/review/SessionSummary.tsx` |
| `["custom-test","sessions"]` i `[…,id]` | Lista „Moich testów” i szczegóły jednego testu | **0** | `features/customTest/sessionsHooks.ts` |
| `["statistics","overview",actId,mode]` | Przegląd nauki (fiszki) | 60 s | `features/statistics/hooks.ts` |
| `["statistics","activity",days,mode]` | Aktywność dzień po dniu | 60 s | j.w. |
| `["statistics","acts",mode]` | Opanowanie aktów prawnych | 60 s | j.w. |
| `["statistics","weak-questions",actId,mode,limit]` | Najsłabsze pytania | 60 s | j.w. |
| `["statistics","tests"]` | Statystyki Testów | 60 s | j.w. |
| `["statistics","sources"]` | Statystyki według grup źródeł i arkuszy | 60 s | j.w. |
| `["statistics","learning-summary"]` | „Podsumowanie nauki” | 60 s | j.w. |
| `["study-progress"]` | Liczby do zerowania postępów (pobierane dopiero w otwartym oknie) | **0** | `features/progress/hooks.ts` |
| `["difficult-questions"]` | Trudne i zawieszone pytania | 30 s | `features/difficult/hooks.ts` |
| `["settings","learning"]` | Ustawienia nauki (ze ścieżką, terminem i planem) | 60 s | `features/settings/hooks.ts` |
| `["settings","exam-terms"]` | Terminy egzaminów aplikacji | 60 s | j.w. |
| `["settings","interface"]` | Ustawienia interfejsu (podpowiedzi skrótów, licznik czasu) | **0** | `features/interface/hooks.ts` |
| `["exam","history"]` | Historia egzaminów | **0** | `features/exam/hooks.ts` |
| `["exam","availability"]` | Liczby pytań w źródłach egzaminu | **0** | j.w. |
| `["exam","sheets"]` | Egzaminy MS (aplikacje i lata) | **0** | j.w. |
| `["me"]` | Adres e-mail zalogowanego | 5 min | `features/account/hooks.ts`, `ExamPage.tsx` |

`staleTime` równy **0** znaczy: za każdym razem, gdy ekran się pojawia, dane są pobierane na nowo (stara kopia
pokazuje się od razu, nowa podmienia ją po chwili). Tak jest wszędzie tam, gdzie liczby zmieniają się po nauce, żeby
po powrocie z sesji paski postępu i liczniki były aktualne.

Zapytania z warunkiem `enabled` nie wysyłają się, dopóki brakuje parametru: np. liczby do zerowania postępów są pobierane
dopiero, gdy okno jest otwarte, a szczegóły zapisanego testu bez poprawnego numeru w adresie
(`parseId` zwraca wtedy `undefined`) się nie pobierają.

### Co jest odświeżane po czynnościach

Zapis do serwera „unieważnia” zapytania, które mogły się zmienić. Zapytania z unieważnionym kluczem są pobierane na nowo
przy następnym użyciu (aktywne od razu).

| Czynność | Co jest unieważniane lub podmieniane |
|----------|--------------------------------------|
| Wyjście z sesji Fiszek lub Testów (`useRefreshReviewDataOnExit`) | Liczniki powtórek (`["review","due-count"]`), licznik błędów, liczniki kreatora testu, wszystkie `["statistics",…]`. Dopiero przy wyjściu, nie po każdej odpowiedzi, żeby nie wysyłać zapytania co pytanie |
| „Dodaj do fiszek” / „Usuń z fiszek” | Jak wyżej (`invalidateReviewData`), od razu |
| Zapis ustawień nauki | Podmiana `["settings","learning"]` odpowiedzią serwera + `invalidateReviewData` |
| Zmiana wyglądu (`useChooseTheme`, okno startowe) | Podmiana `["settings","learning"]` odpowiedzią serwera; strona przełącza się od razu, a przy błędzie wraca do poprzedniego wyglądu |
| Wybór ścieżki (`useChooseTrack`, okno startowe) | Podmiana `["settings","learning"]` odpowiedzią serwera + unieważnienie puli (`["pool"]`) i wszystkiego, co liczy pytania: katalog Testów, liczniki powtórek, licznik błędów, liczniki kreatora testu, statystyki (backend zdejmuje przy tym zawężenie do aktów) |
| Zapis zakresu nauki (okno „Zakres nauki” w Koncie) | Podmiana `["pool"]` odpowiedzią serwera + unieważnienie: katalog Testów, liczniki powtórek, licznik błędów, liczniki kreatora testu, ustawienia nauki (plan do egzaminu) i **statystyki** |
| Zapis terminu egzaminu (administrator) | Podmiana wiersza w `["settings","exam-terms"]` odpowiedzią serwera + unieważnienie `["settings","learning"]` (zmienia się odliczanie i plan) |
| Zawieszenie pytania (w sesji nauki) albo zawieszenie i przywrócenie na liście w Koncie | `["difficult-questions"]` (z listy w Koncie także `invalidateReviewData`) |
| „Ukryj pytanie” / „Ukryj fiszkę” (administrator) | `invalidateReviewData` + katalog Testów (`["tests","catalog"]`) + pula (`["pool"]`) |
| Zakończenie egzaminu | `["exam","history"]` |
| Wylogowanie, usunięcie konta, wygaśnięcie sesji (401) | Pełne przeładowanie strony (`window.location.href`), więc cała pamięć danych znika |
| Zmiana hasła | Bez przeładowania: podmieniany jest tylko token (`login(nowyToken)`) |

Pomocnicza funkcja `invalidateReviewData(queryClient)` (`features/review/hooks.ts`) unieważnia cztery rzeczy naraz:
liczniki powtórek, licznik błędów, liczniki kreatora testu i statystyki. Po zmianie samej puli używa się
`invalidateAfterPoolChange` (`features/pool/hooks.ts`), która dokłada katalog Testów i ustawienia nauki. Używaj jej po każdej zmianie, która wpływa na to, ile jest do
powtórzenia albo jak wyglądają wykresy.

### Zapytania poza React Query

Część wywołań **nie** przechodzi przez pamięć podręczną, bo ich wynik jest częścią stanu sesji, a nie danymi do
pokazania:

- kolejki nauki (`getFlashcardQueue`, `getTestQueue`, `getMistakesQueue`, `getPracticeQueue`), ocena (`submitReview`),
  odpowiedź (`submitTestAnswer`), liczba nowych pytań do dołożenia w sesji (`getAvailableNewQuestionsCount`): sesja trzyma je w
  swoim stanie i pobiera raz na start (klucz odświeżenia pilnuje, żeby w trybie deweloperskim `StrictMode` nie wysłał
  zapytania dwa razy),
- wszystkie zapisy (`POST`, `PUT`, `DELETE`): idą przez `useMutation` albo bezpośrednio z funkcji obsługi zdarzenia.

## Obsługa błędów po stronie ekranu

Dwie funkcje w `lib/errors.ts` robią z błędu tekst dla użytkownika:

| Funkcja | Kiedy | Wynik |
|---------|-------|-------|
| `loadErrorMessage(błąd, co)` | Nie udało się **pobrać** danych | Brak odpowiedzi serwera: „Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.” Inaczej: „Nie udało się wczytać: …. Spróbuj ponownie.” |
| `serverMessage(błąd, komunikat zastępczy)` | Nie udał się **zapis** | Brak odpowiedzi serwera: ten sam komunikat o braku połączenia. Gdy serwer zwrócił pole `message`: pokazuje je (backend zwraca czytelne polskie komunikaty, np. „Hasło: musi mieć od 8 do 72 znaków”). W pozostałych przypadkach komunikat zastępczy |

Reguły dla ekranów:

- Pobieranie, które się nie powiodło, pokazuje `ErrorState` z przyciskiem „Spróbuj ponownie” (wywołuje `refetch`).
- Część zapytań pomocniczych celowo **nie blokuje** ekranu, gdy zawiodą: licznik błędów, pula pytań (znacznik) i zaległości.
  Odpowiedni element po prostu się nie pokazuje, a nauka działa dalej.
- Błąd `429` (zbyt wiele prób) przychodzi z komunikatem serwera i trafia na formularz tą samą drogą co inne błędy.
- Błąd `401` poza `/api/auth/` kończy sesję (patrz [03](03-logowanie-i-sesja.md)); błąd `403` nigdy.

## Typy odpowiedzi

Typy w `api/*.ts` są pisane ręcznie na podstawie odpowiedzi serwera, **nie** są generowane z OpenAPI. Gdy backend
zmienia pole, trzeba zmienić typ ręcznie; kompilator (`tsc`) wykryje użycie nieistniejącego pola, ale nie wykryje, że
serwer przestał je wysyłać. Najważniejsze typy:

| Typ | Plik | Zawartość |
|-----|------|-----------|
| `FlashcardQueueItem` | `api/review.ts` | Fiszka w kolejce: `questionId`, `front`, `back`, `explanation`, `legalBasis`, `validAsOf`, `actName`, `sourceName`, `sourceKind`, `examYear`, `lapses`, `leech` |
| `TestQueueItem` | `api/review.ts` | Pytanie testowe: `questionId`, treść (`body`), trzy odpowiedzi `optionA/B/C`, akt prawny i źródło (`actName`, `sourceName`, `sourceKind`, `examYear`); bez poprawnej odpowiedzi! |
| `ReviewScope` | `api/review.ts` | Zakres sesji: `fieldId`, `actId`, `sourceId` (wszystkie opcjonalne) |
| `TestAnswerResult` | `api/review.ts` | Wynik odpowiedzi: `correct`, `correctOption`, `explanation`, `legalBasis`, `lapses`, `leech`, `flashcardUnlocked`, `flashcard`, `newQuestion` |
| `FlashcardStatus` | `api/review.ts` | `UNAVAILABLE`, `AVAILABLE`, `ADDED_MANUALLY`, `ADDED_BY_MISTAKE` |
| `Backlog` | `api/review.ts` | `dueNow`, `deferred`, `dailyLimit`, `doneToday` |
| `ExamStart`, `ExamResult`, `ExamAttempt` | `api/exam.ts` | Losowanie (z `passPoints`), wynik z rozbiciem na źródła i pytania, wpis historii (z `passPoints`) |
| `ExamAvailability`, `ExamSheets` (`ExamSheetApplication`, `ExamSheet`) | `api/exam.ts` | Liczby pytań w źródłach egzaminu; aplikacje z egzaminami MS według lat (`trackId`, `slug`, `shortName`, `own`, `sheets[]` z `id`, `year`, `questionCount`) |
| `Track` | `api/tracks.ts` | Ścieżka: `id`, `slug`, `name`, `shortName`, `kind` (`EXAM` albo `STUDENT`) |
| `Pool` | `api/pool.ts` | Pula użytkownika: `track`, `narrowed`, `questionCount`, `fields` (dziedziny z aktami i polem `selected`), `sourceGroups` (grupa, `selected`, `questionCount`) |
| `TestCatalog` | `api/tests.ts` | `narrowed`, `fields` (dziedziny z aktami i licznikami `questionCount`, `solvedCount`), `sources` (arkusze i pytania autorskie z grupą i rokiem egzaminu) |
| `LearningSettings` | `api/settings.ts` | Limity (w tym `newFlashcardsPerDay`, `newTestQuestionsPerDay` obowiązujący teraz i `newTestQuestionsAuto`), retencja, wybrana ścieżka (`track`, `null` = jeszcze nie wybrano), termin (`examDate`, tylko do odczytu), wygląd (`theme`: `DARK`/`LIGHT`), plan do egzaminu (z `newTestQuestionsToday`, `requiredTestQuestionsPerDay` bez sufitu, `maxTestQuestionsPerDay` = 100 i `suggestedTestQuestionsPerDay` = mniejsze z nich) |
| `ExamTerm` | `api/examTerms.ts` | `track`, `examDate`, `daysToExam` |
| `SourceKind`, `SourceGroup` | `lib/source.ts` | Rodzaj źródła (`EXAM_SHEET`, `AUTHORED`) i grupa filtra (`OWN_SHEETS`, `OTHER_SHEETS`, `AUTHORED`) z polskimi etykietami |

Ważne: **poprawna odpowiedź nie jest wysyłana razem z pytaniem testowym**. `TestQueueItem` jej nie zawiera; poznaje się
ją dopiero z odpowiedzi na `POST /api/review/test-answer` (albo z wyniku egzaminu). Dzięki temu nie da się jej podejrzeć
w narzędziach przeglądarki przed udzieleniem odpowiedzi.
