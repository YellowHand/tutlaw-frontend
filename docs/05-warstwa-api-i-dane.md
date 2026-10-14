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
| Nagłówek `Authorization` | Dokładany do **każdego** żądania, jeśli w `localStorage` jest token: `Bearer <token>` |
| Czas oczekiwania, ponawianie | Brak własnych ustawień. Ponawianie robi tylko React Query (raz) |
| Obsługa odpowiedzi `401` | Wylogowanie i przejście na `/login`. Szczegóły i wyjątki: [03](03-logowanie-i-sesja.md) |

Wywołania do `/api/auth/...` (logowanie, rejestracja, reset hasła) nie wylogowują po `401`, bo błąd tam znaczy „złe dane
logowania”, a nie „sesja wygasła”.

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

Frontend używa **53 z 63** endpointów backendu (łącznie 54 wywołań w kodzie, bo `GET /api/statistics/chapters` jest
wołany z dwóch miejsc). Endpointów, których frontend nie używa, jest 10; lista jest [niżej](#endpointy-których-frontend-nie-używa).
Kolumna „Funkcja” podaje nazwę w kodzie, żeby można ją było znaleźć wyszukiwarką.

### Konto i logowanie (bez tokenu)

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/auth/register` | `pages/RegisterPage.tsx` | Formularz rejestracji (mail prywatny, mail uczelniany, hasło, zgoda na regulamin) |
| `GET /api/auth/verify` | `pages/VerifyPage.tsx` | Link aktywacyjny z maila (`/verify?token=`); jedno wywołanie na wejście dzięki `useRef` |
| `POST /api/auth/login` | `pages/LoginPage.tsx` | Logowanie; odpowiedź zawiera `accessToken` |
| `POST /api/auth/resend-verification` | `features/auth/ResendVerification.tsx` | „Wyślij link ponownie” (na ekranach logowania i weryfikacji) |
| `POST /api/auth/forgot-password` | `pages/ForgotPasswordPage.tsx` | Prośba o link do zmiany hasła |
| `POST /api/auth/reset-password` | `pages/ResetPasswordPage.tsx` | Ustawienie nowego hasła tokenem z maila |

### Konto zalogowanego

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/me` | `fetchMe` (`features/account/api.ts`) | Konto (adres e-mail) i Egzamin (adres jest „właścicielem” zapisanego szkicu egzaminu); klucz `["me"]` |
| `GET /api/users/me/export` | `fetchAccountExport` | Karta „Pobierz moje dane” w Koncie (plik JSON) |
| `PUT /api/users/me/password` | `changePassword` | Karta „Zmień hasło”; zwraca nowy token, który zastępuje stary |
| `DELETE /api/users/me` | `deleteAccount` | Karta „Usuń konto”; hasło idzie w treści żądania (`data: { password }`) |

### Struktura materiału (Fiszki, Testy)

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/categories` | `getCategories` (`api/categories.ts`) | Fiszki: wybór rodzaju (`useNonEmptyCategories`) |
| `GET /api/categories/{categoryId}/subjects` | `getSubjectsByCategory` | Fiszki: wybór przedmiotu |
| `GET /api/subjects` | `getSubjects` | Statystyki: lista rozwijana „Przedmiot” |
| `GET /api/subjects/{subjectId}/sources` | `getSourcesBySubject` | Fiszki: wybór źródła; Statystyki (szukanie podręcznika) |
| `GET /api/sources/{sourceId}/chapters` | `getChaptersBySource` | Fiszki: lista rozdziałów |
| `PUT /api/chapters/{chapterId}/progress` | `setChapterProgress` | Przełącznik „Przeczytany” przy rozdziale |
| `GET /api/tests/catalog` | `getTestCatalog` | Testy: drzewo rodzaj → przedmiot → źródło z licznikami; Pulpit: wiersze postępu według rodzajów |

### Nauka: kolejki, odpowiedzi, liczniki

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/review/queue` | `getReviewQueue` | Sesja Fiszek (`StudySessionPage`) |
| `GET /api/review/test-queue` | `getTestQueue` | Sesja Testów w trybach zakres i powtórki (`TestSessionPage`) |
| `GET /api/review/practice-queue` | `getPracticeQueue` (`api/exam.ts`) | Sesja „Przećwicz błędy z egzaminu” i sesja Własnego testu (`?cardIds=`) |
| `GET /api/review/mistakes-queue` | `getMistakesQueue` | Sesja „Powtórz moje błędy” |
| `GET /api/review/mistakes-count` | `getMistakesCount` | Przycisk „Moje błędy” (z liczbą) w „Szybkim starcie” na ekranie Testy, wiersz „Moje błędy” w „Do poprawy” na Pulpicie |
| `GET /api/review/custom-test/counts` | `getCustomTestCounts` (`api/customTest.ts`) | Własny test: „Dostępnych: N” przy każdym rodzaju pytań w wybranym zakresie |
| `POST /api/review/custom-test` | `drawCustomTest` (`api/customTest.ts`) | Własny test: losowanie numerów pytań po „Rozpocznij test” |
| `GET /api/review/queue/new-cards-available` | `getAvailableNewCardsCount` | Przycisk „Dołóż nowe” na końcu sesji |
| `GET /api/review/queue/backlog` | `getBacklog` | Informacja o zaległościach i przycisk „Powtórz jeszcze” |
| `GET /api/review/due-count` | `getDueCount` | Odznaki w menu, karta „Na dziś” na Pulpicie (osobno dla pytań i fiszek), ekran Testy |
| `POST /api/review` | `submitReview` | Ocena fiszki (1–4) |
| `POST /api/review/test-answer` | `submitTestAnswer` | Odpowiedź w teście (A/B/C, „Nie jestem pewien”) |

### Fiszki z pytań, zgłoszenia, ukrywanie, zawieszanie

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/questions/{questionId}/flashcard` | `addToFlashcards` | „Dodaj do fiszek” pod odpowiedzią w teście |
| `DELETE /api/questions/{questionId}/flashcard` | `removeFromFlashcards` | „Usuń z fiszek” (cofnięcie) |
| `POST /api/cards/{cardId}/reports` | `reportCard` (`api/reports.ts`) | „Zgłoś błąd w pytaniu” |
| `PUT /api/cards/{cardId}/hidden` | `setCardHidden` (`api/flashcards.ts`) | „Ukryj” (tylko administrator) |
| `GET /api/me/difficult-cards` | `getDifficultCards` | Konto: lista trudnych i zawieszonych pytań |
| `PUT /api/me/suspended-cards/{cardId}` | `suspendCard` | „Zawieś pytanie” |
| `DELETE /api/me/suspended-cards/{cardId}` | `unsuspendCard` | „Przywróć” na liście w Koncie |

### Egzamin próbny

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `POST /api/exams/start` | `startExam` (`api/exam.ts`) | Przycisk „Rozpocznij egzamin” w ustawieniach egzaminu. **Bez ciała**: format jest stały, serwer losuje 150 pytań i zwraca `passPoints` |
| `POST /api/exams/submit` | `submitExam` | Wysłanie odpowiedzi po zakończeniu (ręcznym albo przez zegar). Ciało: `timeLimitMinutes`, `durationSeconds`, `timedOut`, `answers`; **bez zakresu i progu**, bo ocenia serwer |
| `GET /api/exams/history` | `getExamHistory` | Historia egzaminów (do 50) oraz karta „Egzamin próbny” na Pulpicie. Wpis ma `passPoints`; `null` oznacza podejście sprzed stałego formatu |

### Statystyki

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/statistics/overview` | `fetchOverview` | Sekcja „Fiszki” na Statystykach (zawsze z `mode=FLASHCARD`, opcjonalnie z `subjectId`) |
| `GET /api/statistics/activity` | `fetchActivity` | Wykres „Aktywność” (Statystyki) i wiersz serii w „Na dziś” (Pulpit); w obu 28 dni |
| `GET /api/statistics/chapters` | `fetchChapterMastery`, `getChapterMastery` | Opanowanie rozdziałów (Statystyki) i paski w widoku rozdziałów Fiszek (z `mode=FLASHCARD`) |
| `GET /api/statistics/sources` | `getSourceProgress` | Paski postępu przy źródłach Fiszek (`mode=FLASHCARD`) |
| `GET /api/statistics/weak-cards` | `fetchWeakCards` | Tabela „Karty, które najłatwiej zapomnisz” |
| `GET /api/statistics/tests` | `fetchTestStats` | Karta „Ostatnie 30 dni” (Statystyki); Pulpit: „Na dziś” i „Postęp” (liczba rozpoczętych pytań) |
| `GET /api/statistics/origins` | `fetchOriginStats` | Sekcja „Opanowanie” w Statystykach (według aplikacji i roku egzaminu). Pulpit tego nie pobiera |

### Ustawienia

| Wywołanie | Funkcja / plik | Gdzie używane |
|-----------|----------------|---------------|
| `GET /api/me/settings` | `getLearningSettings` | Karta „Ustawienia nauki” w Koncie, Pulpit (wybrana aplikacja, odliczanie, cel na dziś i kafelek wyboru egzaminu), Statystyki (domyślny zakres), a także jednorazowo przy starcie sesji Testów (czy tasować odpowiedzi) |
| `PUT /api/me/settings` | `updateLearningSettings` | Zapis ustawień nauki (limity, retencja, tasowanie; bez daty egzaminu) |
| `PUT /api/me/exam` | `chooseExam` (`api/settings.ts`) | Wybór aplikacji, do której użytkownik się przygotowuje: kafelek na Pulpicie i sekcja „Egzamin” w Koncie. Backend jednorazowo ustawia też filtr pochodzenia |
| `GET /api/exam-terms` | `getExamTerms` (`api/examTerms.ts`) | Terminy egzaminów pięciu aplikacji: kafelek wyboru egzaminu, informacja o terminie w Koncie i karta „Terminy egzaminów” |
| `PUT /api/exam-terms/{origin}` | `updateExamTerm` (`api/examTerms.ts`) | Zapis albo usunięcie terminu (karta administratora w Koncie; serwer sprawdza rolę) |
| `GET /api/me/origin-filter` | `getOriginFilter` | Znacznik filtra pochodzenia w Testach |
| `PUT /api/me/origin-filter` | `saveOriginFilter` | Zapis filtra (okno wyboru aplikacji) |

### Endpointy, których frontend nie używa

Są to endpointy do **zarządzania treścią**, z których korzysta się spoza aplikacji (administrator wprowadza materiał do
bazy innym sposobem, patrz [10](10-znane-ograniczenia.md)):

| Endpoint | Do czego służy w backendzie |
|----------|-----------------------------|
| `POST /api/categories` | Dodanie kategorii |
| `POST /api/subjects` | Dodanie przedmiotu |
| `POST /api/sources` | Dodanie źródła |
| `POST /api/chapters` | Dodanie rozdziału |
| `GET /api/tags` | Lista tagów |
| `POST /api/tags` | Dodanie tagu |
| `GET /api/chapters/{chapterId}/cards` | Karty rozdziału (administrator) |
| `GET /api/sources/{sourceId}/cards` | Karty źródła (administrator) |
| `POST /api/cards` | Dodanie jednej karty |
| `POST /api/cards/bulk` | Import zbiorczy kart |

W aplikacji nie ma panelu administratora. Jedyną funkcją administratora w interfejsie jest przycisk „Ukryj”
(`PUT /api/cards/{cardId}/hidden`).

## Parametry zapytań, które łatwo pomylić

| Co | Jak to działa |
|----|---------------|
| Zakres nauki (`categoryId`, `subjectId`, `sourceId`) | Kolejki, licznik nowych kart i zaległości przyjmują je od najwęższego: źródło, przedmiot, kategoria. Bez żadnego serwer bierze cały dostępny materiał użytkownika |
| `mode` (`FLASHCARD` albo `TEST`) | Fiszki i Testy liczą się osobno. Bez `mode` backend liczy **fiszki**, więc każde wywołanie dla Testów musi podać `TEST` (kod robi to w `getAvailableNewCardsCount`, `getDueCount`, `getBacklog`) |
| `extraNewCards`, `extraDueReviews` | Dokładanie nowych kart („Dołóż nowe”, porcja 10) i zaległych powtórek („Powtórz jeszcze”, porcja 20) ponad dzienny limit |
| `cardIds` w kolejce ćwiczeń | Lista identyfikatorów zapisana po przecinku (`cardIds=1,2,3`), bo Spring tak ją czyta; axios domyślnie zapisałby `cardIds[]=1&cardIds[]=2` |
| `subjectId` w Statystykach | Pusta wartość (`0` albo brak) oznacza „wszystkie przedmioty”: kod zamienia ją na `undefined`, więc parametr nie jest wysyłany |
| `days`, `limit` | Wykres aktywności domyślnie 30 dni; tabela słabych kart domyślnie 10 pozycji |
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
| `["catalog","categories"]` | Rodzaje materiału | 60 s (domyślnie) | `features/flashcards/hooks.ts` |
| `["catalog","subjects",categoryId]` | Przedmioty rodzaju | 60 s | j.w. |
| `["catalog","sources",subjectId]` | Źródła przedmiotu z postępem | **0** | j.w. |
| `["catalog","chapters",sourceId]` | Rozdziały źródła z opanowaniem | **0** | j.w. |
| `["tests","catalog"]` | Drzewo Testów z licznikami | **0** | `features/tests/hooks.ts` |
| `["tests","origin-filter"]` | Filtr pochodzenia pytań | 30 s | `features/tests/originFilter.ts` |
| `["review","due-count",mode]` | Liczba powtórek do zrobienia | 30 s | `features/review/hooks.ts` |
| `["review","mistakes-count"]` | Liczba błędów do powtórzenia | 30 s | j.w. |
| `["review","custom-test-counts",zakres]` | Liczby pytań w zakresie Własnego testu (poprzednia odpowiedź zostaje na ekranie, dopóki nie przyjdzie nowa) | **0** | `features/customTest/hooks.ts` |
| `["review","backlog",mode,subjectId,sourceId,categoryId]` | Zaległości w zakresie sesji | **0**, brak przechowywania po zamknięciu ekranu (`gcTime: 0`), bez ponawiania i bez odświeżania po powrocie do karty przeglądarki | `features/review/useBacklog.ts` |
| `["statistics","overview",subjectId,mode]` | Podsumowanie nauki | 60 s | `features/statistics/hooks.ts` |
| `["statistics","activity",days,mode]` | Aktywność dzień po dniu | 60 s | j.w. |
| `["statistics","chapters",sourceId]` | Opanowanie rozdziałów | 60 s (tylko gdy wybrano źródło) | j.w. |
| `["statistics","weak-cards",subjectId,limit]` | Słabe karty | 60 s | j.w. |
| `["statistics","tests"]` | Statystyki Testów | 60 s | j.w. |
| `["statistics","origins"]` | Statystyki według aplikacji | 60 s | j.w. |
| `["difficult-cards"]` | Trudne i zawieszone pytania | 30 s | `features/difficult/hooks.ts` |
| `["settings","learning"]` | Ustawienia nauki (z wybraną aplikacją, terminem i planem) | 60 s | `features/settings/hooks.ts` |
| `["settings","exam-terms"]` | Terminy egzaminów aplikacji | 60 s | j.w. |
| `["exam","history"]` | Historia egzaminów | **0** | `features/exam/hooks.ts` |
| `["me"]` | Adres e-mail zalogowanego | 5 min | `AccountPage.tsx`, `ExamPage.tsx` |
| `["subjects"]` | Wszystkie przedmioty (lista rozwijana w Statystykach) | 60 s | `features/statistics/SubjectFilter.tsx` |
| `["sources",subjectId]` | Źródła wybranego przedmiotu (Statystyki) | 60 s | `features/statistics/StatisticsPage.tsx` |

`staleTime` równy **0** znaczy: za każdym razem, gdy ekran się pojawia, dane są pobierane na nowo (stara kopia
pokazuje się od razu, nowa podmienia ją po chwili). Tak jest wszędzie tam, gdzie liczby zmieniają się po nauce, żeby
po powrocie z sesji paski postępu i liczniki były aktualne.

Zapytania z warunkiem `enabled` nie wysyłają się, dopóki brakuje parametru: np. rozdziały bez poprawnego `sourceId`
w adresie (`parseId` zwraca wtedy `undefined`, a ekran pokazuje 404).

### Co jest odświeżane po czynnościach

Zapis do serwera „unieważnia” zapytania, które mogły się zmienić. Zapytania z unieważnionym kluczem są pobierane na nowo
przy następnym użyciu (aktywne od razu).

| Czynność | Co jest unieważniane lub podmieniane |
|----------|--------------------------------------|
| Wyjście z sesji Fiszek lub Testów (`useRefreshReviewDataOnExit`) | Liczniki powtórek (`["review","due-count"]`), licznik błędów, liczniki Własnego testu, wszystkie `["statistics",…]`. Dopiero przy wyjściu, nie po każdej odpowiedzi, żeby nie wysyłać zapytania co pytanie |
| „Dodaj do fiszek” / „Usuń z fiszek” | Jak wyżej (`invalidateReviewData`), od razu |
| Zapis ustawień nauki | Podmiana `["settings","learning"]` odpowiedzią serwera + `invalidateReviewData` |
| Wybór egzaminu (`useChooseExam`) | Podmiana `["settings","learning"]` odpowiedzią serwera + unieważnienie: filtr pochodzenia, katalog Testów, liczniki powtórek, licznik błędów i liczniki Własnego testu (backend zmienia filtr) |
| Zapis terminu egzaminu (administrator) | Podmiana wiersza w `["settings","exam-terms"]` odpowiedzią serwera + unieważnienie `["settings","learning"]` (zmienia się odliczanie i plan) |
| Zapis filtra pochodzenia | Podmiana `["tests","origin-filter"]` + unieważnienie: katalog Testów, liczniki powtórek, licznik błędów, liczniki Własnego testu, ustawienia nauki (plan do egzaminu). Statystyk i Fiszek nie dotyka, bo filtr ich nie dotyczy |
| Zawieszenie pytania (w sesji nauki) albo zawieszenie i przywrócenie na liście w Koncie | `["difficult-cards"]` |
| „Ukryj” (administrator) | `invalidateReviewData` + wszystkie `["catalog",…]` |
| Zakończenie egzaminu | `["exam","history"]` |
| Zmiana „Przeczytany” przy rozdziale | Od razu bezpośrednia podmiana `["catalog","chapters",id]` w pamięci (bez czekania na serwer); przy błędzie zapisu wartość wraca. Po udanym zapisie `invalidateReviewData`, bo od przeczytanych rozdziałów zależy, które fiszki trafiają do nauki |
| Wylogowanie, usunięcie konta, wygaśnięcie sesji (401) | Pełne przeładowanie strony (`window.location.href`), więc cała pamięć danych znika |
| Zmiana hasła | Bez przeładowania: podmieniany jest tylko token (`login(nowyToken)`) |

Pomocnicza funkcja `invalidateReviewData(queryClient)` (`features/review/hooks.ts`) unieważnia trzy rzeczy naraz:
liczniki powtórek, licznik błędów i statystyki. Używaj jej po każdej zmianie, która wpływa na to, ile jest do
powtórzenia albo jak wyglądają wykresy.

### Zapytania poza React Query

Część wywołań **nie** przechodzi przez pamięć podręczną, bo ich wynik jest częścią stanu sesji, a nie danymi do
pokazania:

- kolejki nauki (`getReviewQueue`, `getTestQueue`, `getMistakesQueue`, `getPracticeQueue`), ocena (`submitReview`),
  odpowiedź (`submitTestAnswer`), liczba nowych kart do dołożenia (`getAvailableNewCardsCount`): sesja trzyma je w
  swoim stanie i pobiera raz na start (klucz odświeżenia pilnuje, żeby w trybie deweloperskim `StrictMode` nie wysłał
  zapytania dwa razy),
- odczyt ustawienia tasowania odpowiedzi na początku sesji Testów (`getLearningSettings`),
- wszystkie zapisy (`POST`, `PUT`, `DELETE`): idą przez `useMutation` albo bezpośrednio z funkcji obsługi zdarzenia.

## Obsługa błędów po stronie ekranu

Dwie funkcje w `lib/errors.ts` robią z błędu tekst dla użytkownika:

| Funkcja | Kiedy | Wynik |
|---------|-------|-------|
| `loadErrorMessage(błąd, co)` | Nie udało się **pobrać** danych | Brak odpowiedzi serwera: „Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.” Inaczej: „Nie udało się wczytać: …. Spróbuj ponownie.” |
| `serverMessage(błąd, komunikat zastępczy)` | Nie udał się **zapis** | Brak odpowiedzi serwera: ten sam komunikat o braku połączenia. Gdy serwer zwrócił pole `message`: pokazuje je (backend zwraca czytelne polskie komunikaty, np. „Hasło: musi mieć od 8 do 72 znaków”). W pozostałych przypadkach komunikat zastępczy |

Reguły dla ekranów:

- Pobieranie, które się nie powiodło, pokazuje `ErrorState` z przyciskiem „Spróbuj ponownie” (wywołuje `refetch`).
- Część zapytań pomocniczych celowo **nie blokuje** ekranu, gdy zawiodą: licznik błędów, filtr pochodzenia i zaległości.
  Odpowiedni element po prostu się nie pokazuje, a nauka działa dalej.
- Błąd `429` (zbyt wiele prób) przychodzi z komunikatem serwera i trafia na formularz tą samą drogą co inne błędy.
- Błąd `401` poza `/api/auth/` kończy sesję (patrz [03](03-logowanie-i-sesja.md)); błąd `403` nigdy.

## Typy odpowiedzi

Typy w `api/*.ts` są pisane ręcznie na podstawie odpowiedzi serwera, **nie** są generowane z OpenAPI. Gdy backend
zmienia pole, trzeba zmienić typ ręcznie; kompilator (`tsc`) wykryje użycie nieistniejącego pola, ale nie wykryje, że
serwer przestał je wysyłać. Najważniejsze typy:

| Typ | Plik | Zawartość |
|-----|------|-----------|
| `ReviewQueueItem` | `api/review.ts` | Fiszka w kolejce: `front`, `back`, `legalBasis`, `validAsOf`, `lapses`, `leech`, `origin`, `examYear` |
| `TestQueueItem` | `api/review.ts` | Pytanie testowe: treść, trzy odpowiedzi `optionA/B/C`, `sourceName`, `origin`, `examYear` (bez poprawnej odpowiedzi!) |
| `TestAnswerResult` | `api/review.ts` | Wynik odpowiedzi: `correct`, `correctOption`, `explanation`, `legalBasis`, `lapses`, `leech`, `flashcardUnlocked`, `flashcard` |
| `FlashcardStatus` | `api/review.ts` | `UNAVAILABLE`, `AVAILABLE`, `ADDED_MANUALLY`, `ADDED_BY_MISTAKE` |
| `Backlog` | `api/review.ts` | `dueNow`, `deferred`, `dailyLimit`, `doneToday` |
| `ExamStart`, `ExamResult`, `ExamAttempt` | `api/exam.ts` | Losowanie (z `passPoints`), wynik z rozbiciem na źródła i pytania, wpis historii (`passPoints` albo `null` dla starych podejść) |
| `LearningSettings` | `api/settings.ts` | Limity, retencja, wybrana aplikacja (`examOrigin`), termin (`examDate`, tylko do odczytu), tasowanie, plan do egzaminu (z `newTestQuestionsToday`) |
| `ExamTerm` | `api/examTerms.ts` | `origin`, `examDate`, `daysToExam` |
| `OriginFilter` | `api/originFilter.ts` | `selected`, `all`, `options` z liczbą pytań |
| `QuestionOrigin` | `lib/origin.ts` | Skąd pochodzi pytanie (sześć wartości, patrz [04](04-nauka-w-aplikacji.md)) |

Ważne: **poprawna odpowiedź nie jest wysyłana razem z pytaniem testowym**. `TestQueueItem` jej nie zawiera; poznaje się
ją dopiero z odpowiedzi na `POST /api/review/test-answer` (albo z wyniku egzaminu). Dzięki temu nie da się jej podejrzeć
w narzędziach przeglądarki przed udzieleniem odpowiedzi.
