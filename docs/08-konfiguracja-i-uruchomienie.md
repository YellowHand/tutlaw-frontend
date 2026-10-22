# 08. Konfiguracja i uruchomienie

[← Spis treści](README.md)

Jak uruchomić frontend lokalnie, co ustawia się w plikach `.env.*`, jak zbudować wersję produkcyjną i jak zbudować
podgląd tej dokumentacji.

## Czego potrzebujesz

| Narzędzie | Po co |
|-----------|-------|
| **Node.js** w wersji `^20.19` lub `22.12` i nowszej (npm jest w pakiecie) | Uruchomienie Vite 8 i budowanie. Starsze wersje Node nie zadziałają, bo wymaga ich Vite |
| Działający **backend** (repozytorium `gradusiuris-backend`, domyślnie `http://localhost:8080`) | Bez niego ekrany logowania się wyświetlą, ale nic nie zapiszą ani nie pobiorą |
| Nowoczesna przeglądarka | Vite buduje domyślnie pod cel `baseline-widely-available` (w Vite 8: Chrome i Edge 111, Firefox 114, Safari i iOS 16.4 oraz nowsze); starszych przeglądarek aplikacja nie wspiera |

## Szybki start (lokalnie)

```bash
npm ci          # instaluje dokładnie te wersje bibliotek, które są w package-lock.json
npm run dev     # serwer deweloperski, domyślnie http://localhost:5173
```

Port **5173** jest ważny: lokalny backend (profil `dev`) dopuszcza w CORS adres `http://localhost:5173` i taki adres wstawia do
linków w mailach (zmienna `FRONTEND_URL`). Jeśli Vite uruchomi się na innym porcie, bo 5173 jest zajęty, logowanie przestanie
działać z powodu CORS (ustaw wtedy `FRONTEND_URL` backendu na ten port albo zwolnij 5173).

Kolejność uruchamiania: najpierw baza i backend z profilem `dev` (patrz jego `docs/05-konfiguracja-i-uruchomienie.md`), potem
`npm run dev`. Maile z linkiem aktywacyjnym zobaczysz lokalnie w Mailpit (`http://localhost:8025`).

Na świeżej bazie aplikacja działa, ale **nie ma w niej jeszcze pytań**: akty prawne i pytania wczytuje się skryptami SQL (opis w
tym samym dokumencie backendu, część „Wczytywanie treści skryptami SQL”). Dopóki ich nie wczytasz, Testy pokażą puste dziedziny.

## Zmienne środowiskowe

Jedyna **obowiązkowa** zmienna to `VITE_API_BASE_URL`: adres backendu, do którego idą wszystkie wywołania `/api/...`
(użycie: `import.meta.env.VITE_API_BASE_URL` w `src/api/axiosInstance.ts`). Pozostałe są opcjonalne i włączają usługi
zewnętrzne tylko w wersji produkcyjnej (opis w części „Usługi zewnętrzne” niżej). Dwa środowiska to dwa pliki, które Vite
wybiera sam według trybu:

| Plik | Kiedy obowiązuje | Zawartość |
|------|------------------|-----------|
| `.env.development` | `npm run dev` (praca lokalna) | `VITE_API_BASE_URL=http://localhost:8080` (nic więcej: bez Sentry, analityki i Turnstile) |
| `.env.production` | `npm run build` (wersja na serwer) | `VITE_API_BASE_URL=https://api.gradusiuris.pl` oraz klucze usług zewnętrznych (tabela niżej) |
| `.env.example` | Wzór; własne nadpisania trzymaj w `.env.local` | `VITE_API_BASE_URL=http://localhost:8080` i komentarze o opcjonalnych zmiennych |

| Zmienna | Do czego | Gdy pusta |
|---------|----------|-----------|
| `VITE_API_BASE_URL` | Adres backendu | Wymagana (patrz niżej) |
| `VITE_TURNSTILE_SITE_KEY` | Klucz strony widgetu Cloudflare Turnstile („Potwierdź, że nie jesteś robotem”) | Nie ma widgetu, formularze działają jak dawniej |
| `VITE_GA_MEASUREMENT_ID` | Identyfikator Google Analytics 4 (`G-...`) | Nie ma analityki ani banera zgody |
| `VITE_SENTRY_DSN` | Adres projektu w Sentry (raportowanie błędów w przeglądarce) | Nic nie jest wysyłane |
| `VITE_SENTRY_RELEASE` | Opcjonalna nazwa wydania w Sentry | Brak nazwy wydania |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Wysyłka map źródeł przy buildzie (**sekret**: tylko w `.env.production.local`, poza gitem) | Brak map źródeł |

Co trzeba wiedzieć:

- **Zmienna jest wpisywana w kod w momencie budowania**, nie odczytywana w przeglądarce w czasie działania. Zmiana adresu
  backendu wymaga ponownego `npm run build`.
- Tylko zmienne zaczynające się od `VITE_` trafiają do przeglądarki. Wszystko, co tam trafia, jest jawne dla każdego, kto
  otworzy stronę; **nie wpisuj tu żadnych sekretów**. Adres backendu, klucz strony Turnstile, identyfikator GA4 i DSN Sentry
  nie są sekretami. **Sekret Turnstile (`TURNSTILE_SECRET`) jest tylko na serwerze**, w pliku środowiskowym backendu, nigdy w
  frontendzie.
- **Pusta wartość** (`VITE_API_BASE_URL=`) oznacza „ten sam adres co strona”, o ile serwer WWW przekazuje `/api/...` do
  backendu (tak zwany reverse proxy). W naszym wdrożeniu strona i API mają osobne adresy, więc wartość jest pełnym adresem.
- Pliki `.env.development` i `.env.production` są w repozytorium (zawierają tylko adresy, nie hasła). W `.gitignore` są wpisy
  `*.local`, więc osobiste nadpisania można trzymać w `.env.local` albo `.env.development.local`. Zwykły plik
  o nazwie .env (bez przyrostka) nie jest już używany.
- Skrypt wdrożenia (`npm run deploy`) odmawia pracy, jeśli `.env.production` nie zawiera adresu zaczynającego się od `https://`.

## Polecenia npm

| Polecenie | Co robi | Efekt |
|-----------|---------|-------|
| `npm run dev` | Serwer deweloperski Vite z odświeżaniem na żywo | `http://localhost:5173` |
| `npm run build` | `tsc -b` (sprawdza typy w całym `src/`), potem `vite build` | Katalog `dist/` |
| `npm run lint` | ESLint na plikach `.ts` i `.tsx` | Lista uwag albo cisza |
| `npm run preview` | Serwuje zbudowany `dist/` do sprawdzenia przed wdrożeniem | `http://localhost:4173` |
| `npm run deploy` | Buduje i wysyła `dist/` na S3, potem odświeża CloudFront (`deploy/deploy-frontend.sh`) | Nowa wersja pod `https://gradusiuris.pl` |
| `npm run docs:check` | Sprawdza, czy dokumentacja zgadza się z kodem | „OK” albo lista rozbieżności |
| `npm run docs:build` | Buduje `docs/dokumentacja.html` | Jeden plik HTML |

`npm run build` **zatrzymuje się na błędzie typów**: jeśli `tsc` znajdzie błąd, `vite build` w ogóle się nie uruchomi.
Kompilator ma włączone dodatkowe kontrole `noUnusedLocals` i `noUnusedParameters`, więc nieużywana zmienna lub parametr
też przerywa build.

## Wersja produkcyjna

### Budowanie

1. Sprawdź adres backendu w `.env.production` (`VITE_API_BASE_URL=https://api.gradusiuris.pl`).
2. Uzupełnij dane administratora serwisu w `src/config/legal.ts` (opis niżej).
3. Uruchom `npm run build`.
4. W katalogu `dist/` powstaje cała strona: `index.html`, katalog `assets/` (JavaScript, CSS i czcionki z
   zakodowanymi w nazwie sumami kontrolnymi, więc przeglądarka może je bezpiecznie trzymać w pamięci podręcznej) i pliki z
   `public/` (ikony, `robots.txt`, manifest).

### Usługi zewnętrzne

Wszystkie są **wyłączone, dopóki odpowiednia zmienna jest pusta** (tak jest lokalnie), więc praca nad aplikacją nie wysyła
nic do internetu.

| Usługa | Co robi | Kod | Uwagi |
|--------|---------|-----|-------|
| Cloudflare Turnstile | Pole „Potwierdź, że nie jesteś robotem” na rejestracji, logowaniu, resecie hasła i ponownej wysyłce maila. Token jest jednorazowy i idzie do backendu w nagłówku `X-Turnstile-Token` | `lib/turnstile.ts`, `lib/useTurnstile.ts`, `components/TurnstileWidget.tsx` | Skrypt Cloudflare ładuje się dopiero na ekranie z widgetem. Do prób lokalnych Cloudflare daje klucz testowy (patrz `.env.example`). Backend musi mieć `TURNSTILE_SECRET`; najpierw wdróż frontend z kluczem, potem ustaw sekret |
| Google Analytics 4 | Statystyki odwiedzin, **tylko po zgodzie** użytkownika (baner `ConsentBanner`, link „Ustawienia cookies”). Do Google trafia adres strony bez zapytania i fragmentu | `lib/analytics.ts`, `lib/consent.ts`, `components/AnalyticsController.tsx` | Decyzja leży w `localStorage` pod `gradus.consent.v1` i przeżywa wylogowanie |
| Sentry | Raportowanie błędów z przeglądarki (serwer w UE). Bez nagrywania sesji, bez danych osobowych, adresy bez tokenów | `lib/monitoring.ts` (`initMonitoring()` w `main.tsx`) | Błędy zapytań do serwera są pomijane (5xx zgłasza backend) |

Polityka prywatności (`features/legal/PrivacyPage.tsx`) wymienia te usługi; `config/legal.ts` ma pole `botProtectionProvider`.

### Wdrożenie

`dist/` to zwykłe pliki statyczne. Docelowo leżą w prywatnym buckecie **Amazon S3**, a przed nim stoi **CloudFront** (HTTPS,
certyfikat, cache) pod adresem `https://gradusiuris.pl`; backend działa osobno pod `https://api.gradusiuris.pl`. Konfigurację
AWS opisują osobne instrukcje wdrożenia; same wysyłki dokonuje `npm run deploy`:

```bash
AWS_PROFILE=gradusiuris S3_BUCKET=<nazwa-bucketa> CLOUDFRONT_DISTRIBUTION_ID=<id-dystrybucji> npm run deploy
```

Nazwę bucketa i identyfikator dystrybucji (zaczyna się od `E`) pokazują konsole S3 i CloudFront. Nie wpisuj ich do plików w
repozytorium (ono bywa publiczne); trzymaj je we własnej notatce albo w historii powłoki.

Skrypt `deploy/deploy-frontend.sh` buduje stronę, wysyła pliki z haszem w nazwie (`assets/`, cache na rok), potem resztę, na końcu
`index.html` (bez cache, żeby przeglądarka zawsze dostała aktualną wersję), i unieważnia pamięć podręczną CloudFront. Stare
pliki z `assets/` zostają na S3 celowo, żeby karty otwarte na starej wersji dociągnęły swoje fragmenty.

**Jeden wymóg jest obowiązkowy: przekierowanie wszystkich adresów na `index.html`.** Aplikacja używa
`BrowserRouter`, czyli adresów bez `#` (np. `/app/dashboard`). Gdyby serwer szukał pliku `app/dashboard`, po odświeżeniu
strony albo po wejściu z linku z maila dostałbyś błąd serwera. W CloudFront robi to reguła „własne strony błędów”:
błędy 403 i 404 z S3 zamieniane są na odpowiedź 200 ze stroną `/index.html`. Dla zwykłego serwera WWW (np. nginx) wzór to:

```nginx
location / {
    try_files $uri /index.html;
}
```

Po stronie **backendu** wdrożona aplikacja potrzebuje (ustawia się je zmiennymi środowiskowymi na serwerze, opis w
`docs/05-konfiguracja-i-uruchomienie.md` backendu):

| Sprawa | Dlaczego dotyczy frontendu |
|--------|----------------------------|
| `FRONTEND_URL=https://gradusiuris.pl` | Backend dopuszcza ten adres w CORS i składa z niego linki aktywacji konta i resetu hasła (`/verify?token=`, `/reset-password?token=`) |
| HTTPS | Token logowania jest wysyłany w nagłówku każdego żądania; przez zwykłe HTTP byłby widoczny w sieci. Zapewniają go CloudFront (strona) i Caddy (API) |

Limit czasu żądań: zwykłe wywołania API kończą się błędem po 30 sekundach, import pytań po 120 sekundach
(`REQUEST_TIMEOUT_MS` w `src/api/axiosInstance.ts`), odświeżanie sesji po 15 sekundach.

## Dane administratora serwisu: `src/config/legal.ts`

Regulamin (`/regulamin`, plik `features/legal/TermsPage.tsx`) i polityka prywatności (`/polityka-prywatnosci`,
`PrivacyPage.tsx`) to teksty wpisane w kodzie, a dane konkretnej firmy czy osoby wstawia do nich obiekt `LEGAL`. Pola w nawiasach kwadratowych **trzeba uzupełnić przed publicznym
startem**:

| Pole | Co wpisać |
|------|-----------|
| `operatorName` | Imię i nazwisko albo nazwa administratora serwisu |
| `operatorAddress` | Adres do korespondencji |
| `contactEmail` | Adres e-mail do kontaktu |
| `hostingProvider` | Nazwa dostawcy hostingu |
| `mailProvider` | Nazwa dostawcy poczty wychodzącej |
| `backupRetention`, `logsRetention` | Jak długo przechowywane są kopie zapasowe i logi (np. „30 dni”) |
| `termsUpdatedAt`, `privacyUpdatedAt` | Daty ostatniej zmiany dokumentów (obecnie 12 października 2026) |

Teksty regulaminu i polityki prywatności są **wersją roboczą** i przed startem powinien je przejrzeć prawnik (tak samo
mówi komentarz w pliku). Backend zapisuje przy rejestracji, że użytkownik zaakceptował regulamin.

## Budowanie podglądu dokumentacji (`dokumentacja.html`)

Plik `docs/dokumentacja.html` to jedna strona z całą dokumentacją frontendu i backendu: spis treści, wyszukiwarka,
diagramy, tryb jasny i ciemny. Otwiera się go dwuklikiem, bez serwera i bez internetu. Powstaje z plików Markdown.

```bash
npm run docs:build
```

Polecenie robi dwie rzeczy: instaluje narzędzia do budowania (`npm --prefix docs/tools ci`, biblioteki `marked`,
`mermaid` i czcionka; pierwszy raz potrzebny jest internet), a potem uruchamia `docs/tools/build-viewer.mjs`.

| Sprawa | Szczegóły |
|--------|-----------|
| Skąd bierze dokumentację backendu | Z katalogu `../gradusiuris-backend/docs` (repozytorium backendu leży obok frontendu; narzędzie rozpoznaje też nazwy `tutlaw-backend`, `port-be` i `backend`). Inny katalog: `node docs/tools/build-viewer.mjs --backend ścieżka/do/docs` |
| Co, jeśli backendu nie ma | Narzędzie przerywa z czytelnym komunikatem. Z parametrem `--frontend-only` buduje podgląd tylko z dokumentacji frontendu |
| Gdzie zapisuje wynik | `docs/dokumentacja.html` (inną ścieżkę podaje `--out`) |
| Kiedy budować od nowa | Po każdej zmianie w plikach `.md` frontendu albo backendu. Plik jest wynikiem budowania, nie edytuje się go ręcznie |
| Gdzie są narzędzia | `docs/tools/` ma własny `package.json`; jego zależności nie są częścią aplikacji i nie trafiają do `dist/` |

Plik HTML zawiera **kopię** dokumentacji backendu z chwili budowania. Po zmianie dokumentacji backendu zbuduj podgląd
jeszcze raz.

### Sprawdzanie zgodności dokumentacji z kodem: `npm run docs:check`

Skrypt `docs/tools/check-docs.mjs` (bez żadnych dodatkowych bibliotek, sam Node.js) porównuje to, co jest opisane w
dokumentacji, z tym, co jest w kodzie, i wypisuje rozbieżności. Sprawdza:

| Co | Z czym porównuje |
|----|------------------|
| Adresy aplikacji (routing) | `src/app/router.tsx` i `src/config/routes.ts` z tabelami w `02` |
| Wywołania serwera | Wszystkie `api.get/post/put/delete` w `src/` z tabelami w `05` |
| Klucze w `localStorage` | Użycia w kodzie z tabelą w `03` |
| Wersje bibliotek i polecenia npm | `package.json` z `01` i `08` |
| Zmienne środowiskowe | Wszystkie `import.meta.env.VITE_*` w `src/` z tabelą w tym dokumencie i plikami `.env*` |
| Odnośniki i kotwice | Czy każdy odnośnik w plikach `.md` prowadzi do istniejącego pliku i nagłówka |
| Zgodność z dokumentacją backendu (jeśli leży obok) | Czy każde wywołanie frontendu istnieje na liście endpointów backendu |

Skrypt kończy się kodem błędu, gdy coś się nie zgadza, więc można go podpiąć pod dowolną automatyczną kontrolę. Po
zmianie kodu uruchom go i popraw dokumentację tam, gdzie wskaże rozbieżność.

## Typowe problemy

| Objaw | Przyczyna | Co zrobić |
|-------|-----------|-----------|
| Logowanie kończy się błędem „Brak połączenia z serwerem” | Backend nie działa albo `VITE_API_BASE_URL` wskazuje zły adres | Uruchom backend, sprawdź `.env.development`, zrestartuj `npm run dev` (zmiany w plikach `.env*` czytane są przy starcie) |
| W konsoli przeglądarki błąd CORS | Adres strony różni się od `FRONTEND_URL` (albo `CORS_ALLOWED_ORIGINS`) ustawionego w backendzie, np. inny port lub `www` | Ustaw w backendzie dokładnie ten adres, z którego otwierasz stronę (lokalnie `http://localhost:5173`) i uruchom backend ponownie |
| Po wdrożeniu odświeżenie strony pokazuje błąd serwera (403/404 XML) | Brak przekierowania błędów na `index.html` w CloudFront | Dodaj własne strony błędów 403 i 404 → `/index.html`, kod 200 (patrz sekcja „Wdrożenie”) |
| Po wdrożeniu widać starą wersję strony | Cache przeglądarki albo CloudFront | Odśwież bez cache (Ctrl+Shift+R); skrypt `npm run deploy` sam unieważnia cache CloudFront |
| Link aktywacyjny z maila prowadzi na `localhost` | Backend działa z profilem `dev` albo ma zły `FRONTEND_URL` | Na serwerze nie ustawiaj profilu `dev` i wpisz `FRONTEND_URL=https://gradusiuris.pl` |
| `npm run build` zatrzymuje się na błędzie TypeScript | Błąd typów albo nieużywana zmienna | Popraw wskazany plik; `npm run lint` pokaże resztę uwag |
| `npm run dev` nie startuje, błąd wersji Node | Zbyt stary Node.js | Zainstaluj Node.js 20.19+ albo 22.12+ |
