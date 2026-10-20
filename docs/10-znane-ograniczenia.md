# 10. Znane ograniczenia

[← Spis treści](README.md)

Ta strona mówi wprost, czego w frontendzie jeszcze nie ma, co zostało odłożone na koniec, co jest niedoskonałe i czego
nie sprawdzono. Podzielona jest na cztery części:

1. [Zostawione na koniec, przed wdrożeniem na prawdziwy serwer](#1-zostawione-na-koniec-przed-wdrożeniem-na-prawdziwy-serwer)
2. [Niedoskonałości w kodzie, znalezione przy pisaniu dokumentacji](#2-niedoskonałości-w-kodzie)
3. [Ograniczenia funkcjonalne](#3-ograniczenia-funkcjonalne)
4. [Czego nie sprawdzono](#4-czego-nie-sprawdzono)

Nic z poniższego nie zostało zmienione w kodzie: dokumentacja tylko opisuje stan faktyczny. (W Etapie 31 zniknęły z listy dwie pozycje: tokeny są czytane i zapisywane przez bezpieczne funkcje `tokenStorage.ts`, a aplikacja ma granicę błędów `ErrorBoundary`. W Etapie 32 lista została przeczytana od nowa pod model z pulą pytań i ścieżkami.)

---

## 1. Zostawione na koniec, przed wdrożeniem na prawdziwy serwer

To są rzeczy, które celowo odkładamy na sam koniec prac. Lokalnie nie przeszkadzają, ale **nie wolno wystawiać
aplikacji pod publiczny adres, dopóki się ich nie załatwi**. Większość leży po stronie backendu (opis w jego
dokumentacji, `docs/07-znane-ograniczenia.md`), ale wpływa na działanie frontendu.

| # | Co | Stan dziś | Co trzeba zrobić |
|---|----|-----------|------------------|
| 1 | **Pliki `.env` w repozytorium** | We frontendzie `.env` i `.env.production` są śledzone przez git. Zawierają tylko adresy backendu, bez sekretów. W backendzie `.env` też jest w repozytorium (opis w jego dokumentacji) | Frontend: nic krytycznego. Backend: usunąć z repozytorium i zmienić hasła, które w nim były |
| 2 | **Adres backendu w buildzie produkcyjnym** | `.env.production` ma wartość zastępczą `https://WPISZ-ADRES-BACKENDU.example` | Wpisać prawdziwy adres i zbudować od nowa ([08](08-konfiguracja-i-uruchomienie.md)) |
| 3 | **Dane administratora w regulaminie i polityce prywatności** | `config/legal.ts` ma pola `[uzupełnij: …]`; teksty to wersja robocza | Uzupełnić dane, a teksty dać do przejrzenia prawnikowi |
| 4 | **CORS w backendzie** | Na stałe `http://localhost:5173` | Dopuścić adres produkcyjnego frontendu |
| 5 | **Link aktywacyjny w mailu** | Backend wpisał na stałe `http://localhost:5173/verify?token=...` | Użyć adresu frontendu z konfiguracji |
| 6 | **Sekret JWT, `show-sql`, szczegóły Actuatora, otwarty Swagger** | Opisane w dokumentacji backendu | Załatwić po stronie backendu |
| 7 | **Nazwa i znak: rejestry i adres** | Nazwa „Gradus iuris” i znak nie były sprawdzane w rejestrach (UPRP, EUIPO/TMview, klasy 9, 41 i 42) ani pod kątem domen (NASK). `index.html` nie ma meta `og:image`, bo wymaga ona pełnego adresu strony, którego jeszcze nie ma (plik `public/og-image.png` jest gotowy). `site.webmanifest` ma `display: browser`, czyli samą ikonę na ekranie głównym bez trybu aplikacji | Przed wdrożeniem: sprawdzić rejestry i domeny, dodać `og:image` z adresem produkcyjnym (przykład w [`brand/README.md`](brand/README.md)) |
| 8 | **Tokeny w `localStorage`** | Token dostępu (30 minut) i token odświeżający (30 dni) leżą w `localStorage` przeglądarki, więc skrypt wstrzyknięty do strony (atak XSS) mógłby je odczytać; token odświeżający jest groźniejszy, bo żyje dłużej. To świadoma decyzja na ten etap, w kodzie nie ma miejsc wstawiających surowy HTML (`dangerouslySetInnerHTML`), co ogranicza ryzyko takiego ataku. Rotacja tokenów i wykrywanie kradzieży po stronie serwera skracają skutki wycieku | Przed szerokim startem przenieść token odświeżający do ciasteczka `HttpOnly; Secure; SameSite` (wymaga zmian w backendzie, CORS i wspólnej domeny frontendu i backendu) |

---

## 2. Niedoskonałości w kodzie

Drobne rzeczy znalezione podczas czytania kodu. Żadna nie psuje zwykłego działania, ale warto o nich wiedzieć.

| # | Gdzie | Co | Skutek |
|---|-------|----|--------|
| 1 | `api/axiosInstance.ts` | Brak limitu czasu (`timeout`) żądań | Serwer, który przyjął połączenie i nie odpowiada, zostawia ekran w ładowaniu bez końca |
| 2 | `features/flashcards/FlashcardsPage.tsx`, `features/tests/groups.ts` | Student w Fiszkach wybiera akt (pod nazwą przedmiotu), bo sesja fiszek przyjmuje zakres tylko jako dziedzinę, akt albo źródło | Nie da się zacząć fiszek z całego przedmiotu jednym kliknięciem (w Testach i we Własnym teście przedmiot jest zakresem) |
| 3 | `app/router.tsx`, `ProtectedRoute.tsx`, `VerifyPage.tsx`, `AuthLayout.tsx` | Adresy (`/login`, `/`) wpisane na sztywno obok obiektu `ROUTES` | Zmiana adresu wymaga poprawek w kilku miejscach, kompilator ich nie wskaże |
| 4 | `package.json` | Nazwa projektu `temp-frontend`, wersja `0.0.0`; w `devDependencies` jest `@tailwindcss/postcss`, którego nic nie używa (nie ma konfiguracji PostCSS, Tailwind działa przez wtyczkę Vite) | Kosmetyka i zbędna zależność |
| 5 | `public/icons.svg` | Plik nie jest nigdzie przywoływany, a trafia do `dist/` | Zbędny plik w paczce |
| 6 | `pages/TestSessionPage.tsx` (1026 linii), `pages/StudySessionPage.tsx` (672 linie) | Bardzo duże pliki: kolejka, odpowiedzi, podgląd, skróty, ekran końca w jednym komponencie | Trudniejsze czytanie i zmiany; zaletą jest to, że cała logika sesji jest w jednym miejscu |
| 7 | `pages/LoginPage.tsx` | Po zalogowaniu wraca się na zapamiętaną **ścieżkę bez parametrów po `?`** | Adres w rodzaju `/app/test/practice?questionIds=1,2,3`, który przerwało wylogowanie, wraca bez `questionIds` |
| 8 | `LoginPage`, `RegisterPage` | Zalogowany użytkownik, który wejdzie na `/login` lub `/register`, widzi formularz zamiast przekierowania do aplikacji | Niewielka niedogodność |
| 9 | `features/legal/PrivacyPage.tsx` | Polityka prywatności wspomina o tokenie w `localStorage`, ale nie wymienia szkicu egzaminu, zapamiętanych ustawień egzaminu (`gradus.exam.*`) ani wyboru zwiniętego panelu menu (`gradus.nav.*`) | Do uzupełnienia razem z przeglądem prawnika |
| 10 | `components/ui/Button.tsx` | Nie ustawia domyślnego `type="button"` | Przycisk w formularzu bez jawnego `type` wyśle formularz |
| 11 | `api/*.ts` | Typy odpowiedzi są pisane ręcznie, nie generowane z opisu API | Zmiana pola w backendzie nie zostanie wykryta przez kompilator |
| 12 | Komentarze w kodzie | Komentarze są po polsku, a część (np. `tokenStorage.ts`, `plural.ts`) po angielsku, niektóre z odwołaniami do numerów etapów | Kosmetyka |
| 13 | `components/icons/togaTrim.ts` | Kolory togi notariusza i komornika dobrane przez autora, bo w sprawdzonych źródłach nie znaleziono ich koloru | Do potwierdzenia, jeśli ma to być wierne |

---

## 3. Ograniczenia funkcjonalne

| Obszar | Ograniczenie |
|--------|--------------|
| Zarządzanie treścią | W aplikacji **nie ma panelu administratora ani importu pytań**, a backend nie ma endpointów do dodawania treści: akty prawne i pytania wczytuje się skryptami SQL (opis w dokumentacji backendu). Frontend używa wszystkich endpointów backendu ([05](05-warstwa-api-i-dane.md)). Administrator ma w interfejsie przyciski „Ukryj pytanie” i „Ukryj fiszkę” oraz kartę „Terminy egzaminów” w Koncie |
| Testy automatyczne | Repozytorium frontendu **nie zawiera testów** (jednostkowych, komponentów ani end-to-end). Kontrolę zapewniają kompilator TypeScript i ESLint |
| Język | Tylko po polsku; teksty są wpisane w komponentach, nie ma systemu tłumaczeń |
| Praca offline | Brak. Aplikacja nie ma service workera ani trybu offline; bez połączenia z serwerem nie pobierze ani nie zapisze niczego (przy trwającym egzaminie odpowiedzi zostają w przeglądarce, więc po powrocie połączenia można wysłać egzamin ponownie) |
| Dłuższa sesja | Token dostępu żyje 30 minut i jest odnawiany po cichu tokenem odświeżającym (ważnym 30 dni od ostatniego użycia). Aplikacja nie odnawia go „na zapas” w tle: odświeżenie następuje przy pierwszym żądaniu po wygaśnięciu. Po 30 dniach bez wizyty trzeba zalogować się ponownie. Gdy odświeżenie nie dojdzie do serwera, użytkownik nie jest wylogowywany (zobaczy błąd, a po powrocie sieci wszystko działa) |
| Wyszukiwarki i podglądy w komunikatorach | Aplikacja jest SPA z jednym `index.html`: wszystkie adresy mają ten sam tytuł i opis, a `og:image` nie ma. Strona główna nie jest prerenderowana (zawartość pojawia się po uruchomieniu JavaScriptu). Brak elementu `<noscript>` |
| Menu w sesjach i w egzaminie | Sesje fiszek i testów nie mają menu (celowo, tryb skupienia): wyjście to „Zakończ sesję” u góry albo przycisk „wstecz” przeglądarki. Egzamin próbny (`/app/exam`) menu zachowuje, także podczas egzaminu na czas |
| Pula pytań | (1) Zawężenie puli do wybranych aktów **nie dotyczy egzaminu próbnego**; filtr źródeł nie dotyczy Fiszek. (2) Gdy pula jest zawężona, ekran egzaminu nie podaje, ile pytań jest do wylosowania, bo serwer nie zwraca liczby pytań całej ścieżki: frontend niczego nie zgaduje i nie blokuje startu. (3) Zmiana ścieżki zdejmuje zawężenie i przywraca filtr źródeł (okno ostrzega o tym podpisem pod listą). (4) Statystyki według źródła zawsze pokazują całą pulę ścieżki, więc nie zgadzają się z liczbami w Testach przy zawężonej puli |
| Własny test: kilka uwag | (1) Liczba pytań to tylko 10, 20, 50, 100 albo 150 (oraz „Wszystkie (N)” przy małym zakresie); wyboru lat egzaminu i własnej liczby już nie ma. (2) Dzienny limit nowych pytań go nie obejmuje: użytkownik sam wybiera liczbę pytań. (3) Ostatni wybór ustawień jest pamiętany w przeglądarce (kasowany przy wylogowaniu); zapisane są też same testy („Moje testy”, na koncie, ostatnie 50). (4) Liczby „Dostępnych: N” dla „Moich błędów” serwer liczy z dziennika odpowiedzi (do 20 tys. ostatnich) przy każdej zmianie zakresu. (5) Test zapisuje się w chwili rozpoczęcia, więc porzucony pojawia się w „Moich testach” jako „Nieukończony”; do niego nie można wrócić, można go tylko ułożyć ponownie z tymi samymi ustawieniami (losowane są nowe pytania). Powtórki, „Popraw błędy” i egzamin nie są zapisywane jako własne testy |
| Egzamin próbny: stały format | (1) Zawsze 150 pytań i próg 100 punktów, ustalane przez serwer; użytkownik wybiera tylko limit czasu (który też nie odtwarza prawdziwego czasu egzaminu: domyślnie minuta na pytanie). (2) Stałe proporcje działów prawdziwego egzaminu nie są odtworzone: serwer losuje 150 pytań ze wszystkich aktów ścieżki (po filtrze źródeł, bez zawężenia do aktów), a nie warstwowo wg działów (tych proporcji w projekcie nie ma, więc ich nie zgadujemy). (3) Przy mniej niż 150 dostępnych pytaniach egzamin jest krótszy, a próg proporcjonalnie niższy (w górę do pełnego punktu). (4) Serwer nie pamięta, jaki zestaw wydał w „start”, i ocenia to, co przyjdzie w „submit”: to ćwiczenie dla samego użytkownika, nie egzamin z uprawnieniami. (5) Ćwiczenie jednego działu to Własny test, który niczego nie zalicza |
| Pulpit i egzaminy: co jest uproszczone | (1) „Przerobione” na Pulpicie to pytania z choć jedną odpowiedzią, a nie „opanowane”; „opanowane” (stabilność powyżej 21 dni, zwykle trzy poprawne odpowiedzi w terminie, około dwóch tygodni) jest tylko w Statystykach, bo na Pulpicie przez pierwsze dwa tygodnie byłoby 0. (2) Cel „Nowe pytania dziś” jest informacją z planu serwera; dzienny limit (automatyczny albo własny) pozostaje górną granicą i nic nie blokuje. Limit automatyczny idzie za planem, ale nie wyżej niż 100 dziennie: powyżej tego powtórki rosną szybciej, niż da się je robić, więc przy zbyt dużej puli do egzaminu aplikacja mówi wprost, że wszystkiego nie uda się zacząć, a nie prosi o podniesienie limitu. Plan nie uwzględnia powtórek, które dojdą w tym czasie. (3) W ostatnich 14 dniach przed egzaminem cel nowych pytań wynosi 0 (rezerwa na same powtórki). (4) Nie ma „prognozy gotowości do egzaminu”: nie ma na to danych ani uczciwego wzoru. (5) Wiersze według rodzajów na Pulpicie można zdjąć bez straty, bo te same liczby są w Testach. (6) Własna data egzaminu użytkownika nie istnieje: terminy ustawia administrator (karta „Terminy egzaminów” w Koncie), a użytkownik wybiera ścieżkę. (7) Wybór w oknie startowym jest obowiązkowy: okno nie daje się zamknąć, dopóki nie wybrano ścieżki (aplikacji albo Studenta; jedyne inne wyjście to wylogowanie). Student nie ma odliczania ani planu dnia, a ścieżkę może zmienić później w Koncie. Konta, które już dokonały wyboru, nie widzą okna. (8) Każda zmiana ścieżki zdejmuje zawężenie puli do aktów i przywraca filtr źródeł. (9) Historia egzaminów pokazuje także podejścia bez progu w punktach (próg w procentach), jeśli takie są w bazie; w bazie założonej od nowa ich nie ma. (10) Główny przycisk „Na dziś” wybiera krok sam (zaległe pytania, potem fiszki, potem nowe pytania); „Popraw moje błędy” jest osobnym linkiem. (11) Pulpit wysyła kilka zapytań naraz (każda karta ma własny stan ładowania i błędu) |
| Wygląd jasny i ciemny | (1) Wygląd obowiązuje tylko wewnątrz aplikacji (`/app`); strona główna, logowanie, rejestracja i strony prawne są zawsze ciemne (to osobna oprawa graficzna). (2) Na nowym urządzeniu albo po wyczyszczeniu danych przeglądarki, gdy konto ma jasny wygląd, pierwsza klatka może mignąć ciemnością, bo kopia w przeglądarce jest pusta; po odpowiedzi serwera strona się poprawia. (3) Jasny wygląd sprawdzono automatycznym audytem dostępności (axe) i zrzutami w Chromium, nie na prawdziwych urządzeniach. (4) Wykresy, odznaki i kolory stanów (zielony, pomarańczowy, czerwony) mają w jasnym wyglądzie ciemniejsze odcienie, żeby zachować kontrast |
| Wylogowanie na telefonie | Dolna belka ma pięć pozycji i nie ma wylogowania: na telefonie jest ono na ekranie Konto (poniżej 768 px) |
| Przeglądarki | Cel budowania to współczesne przeglądarki (Chrome i Edge 111, Firefox 114, Safari 16.4 i nowsze), starsze nie są wspierane |
| Dane przykładowe na stronie głównej | Przykładowe statystyki w sekcji funkcji są oznaczone jako przykład; prawdziwych liczb o użytkownikach i pytaniach nie ma celowo (patrz [07](07-strona-glowna.md)) |

---

## 4. Czego nie sprawdzono

Ta dokumentacja powstała z czytania kodu i z przebiegów kontrolnych. Uczciwy bilans tego, co **nie** zostało
potwierdzone:

- **Backend nie był uruchamiany razem z tym frontendem.** Prawdziwy Spring i Hibernate nie były uruchamiane w trakcie
  tych prac (schemat `V1`/`V2` i skrypty SQL sprawdzono na lokalnym PostgreSQL, ale bez aplikacji). Ekrany sprawdzano w przeglądarce Chromium na **atrapie odpowiedzi serwera**
  (mock API), nie na prawdziwym backendzie. Opisy kształtu odpowiedzi pochodzą z typów w kodzie i z dokumentacji
  backendu.
- **Tylko jedna przeglądarka.** Testowe przebiegi szły w Chromium. Firefox, Safari i prawdziwe telefony nie były
  sprawdzane. Dotyczy to też dolnej belki: dopełnienie `env(safe-area-inset-bottom)` (pasek gestów w iPhone'ach) nie było
  oglądane na prawdziwym urządzeniu.
- **Czytniki ekranu.** Dostępność opisana w [06](06-wyglad-i-komponenty.md) wynika z przyjętych reguł w kodzie
  (etykiety, role, fokus, kontrasty), a nie z testu z prawdziwym czytnikiem ekranu.
- **Wdrożenie.** Budowanie `npm run build` było sprawdzane, ale wdrożenie na prawdziwy hosting nie. Przykład dla nginx
  w [08](08-konfiguracja-i-uruchomienie.md) to standardowy wzór, nieuruchamiany w tym projekcie.
- **Dokumentacja a kod.** Narzędzie `npm run docs:check` pilnuje zgodności adresów, wywołań serwera, kluczy
  przeglądarki, wersji, poleceń i odnośników. **Nie sprawdza opisów słownych**: zdania o zachowaniu ekranów były
  weryfikowane z kodem przy pisaniu, ale po kolejnych zmianach w kodzie trzeba je przeglądać ręcznie.
- **Dwie karty jednocześnie.** Zachowanie trwającego egzaminu otwartego w dwóch kartach tej samej przeglądarki
  (wspólny szkic w `localStorage`) nie było badane.
