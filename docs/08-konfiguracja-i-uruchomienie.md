# 08. Konfiguracja i uruchomienie

[← Spis treści](README.md)

Jak uruchomić frontend lokalnie, co ustawia się w plikach `.env`, jak zbudować wersję produkcyjną i jak zbudować
podgląd tej dokumentacji.

## Czego potrzebujesz

| Narzędzie | Po co |
|-----------|-------|
| **Node.js** w wersji `^20.19` lub `22.12` i nowszej (npm jest w pakiecie) | Uruchomienie Vite 8 i budowanie. Starsze wersje Node nie zadziałają, bo wymaga ich Vite |
| Działający **backend** (repozytorium `port-be`, domyślnie `http://localhost:8080`) | Bez niego ekrany logowania się wyświetlą, ale nic nie zapiszą ani nie pobiorą |
| Nowoczesna przeglądarka | Vite buduje domyślnie pod cel `baseline-widely-available` (w Vite 8: Chrome i Edge 111, Firefox 114, Safari i iOS 16.4 oraz nowsze); starszych przeglądarek aplikacja nie wspiera |

## Szybki start (lokalnie)

```bash
npm ci          # instaluje dokładnie te wersje bibliotek, które są w package-lock.json
npm run dev     # serwer deweloperski, domyślnie http://localhost:5173
```

Port **5173** jest ważny: backend ma na razie na stałe wpisane to źródło w ustawieniach CORS i w linku aktywacyjnym z
maila (patrz [Znane ograniczenia](10-znane-ograniczenia.md) oraz dokumentacja backendu). Jeśli Vite uruchomi się na
innym porcie, bo 5173 jest zajęty, logowanie przestanie działać z powodu CORS.

Kolejność uruchamiania: najpierw baza i backend (patrz jego `docs/05-konfiguracja-i-uruchomienie.md`), potem `npm run dev`.

## Zmienne środowiskowe

Frontend czyta **jedną** zmienną, `VITE_API_BASE_URL`: adres backendu, do którego idą wszystkie wywołania `/api/...`
(użycie: `import.meta.env.VITE_API_BASE_URL` w `src/api/axiosInstance.ts`).

| Plik | Kiedy obowiązuje | Zawartość |
|------|------------------|-----------|
| `.env` | Praca lokalna (`npm run dev`) i każdy build, jeśli nie ma nadpisania | `VITE_API_BASE_URL=http://localhost:8080` |
| `.env.example` | Wzór dla nowego środowiska (kopiujesz do `.env`) | To samo co `.env` |
| `.env.production` | Tylko `npm run build` (tryb produkcyjny); nadpisuje `.env` | **Wartość zastępcza** `https://WPISZ-ADRES-BACKENDU.example`; trzeba wpisać prawdziwy adres przed wdrożeniem |

Co trzeba wiedzieć:

- **Zmienna jest wpisywana w kod w momencie budowania**, nie odczytywana w przeglądarce w czasie działania. Zmiana adresu
  backendu wymaga ponownego `npm run build`.
- Tylko zmienne zaczynające się od `VITE_` trafiają do przeglądarki. Wszystko, co tam trafia, jest jawne dla każdego, kto
  otworzy stronę; **nie wpisuj tu żadnych sekretów**. Adres backendu nie jest sekretem.
- **Pusta wartość** (`VITE_API_BASE_URL=`) oznacza „ten sam adres co strona”, o ile serwer WWW przekazuje `/api/...` do
  backendu (tak zwany reverse proxy). Przy wartości zastępczej z pliku `.env.production` build się uda, ale
  aplikacja nie będzie mogła połączyć się z serwerem.
- Pliki `.env` i `.env.production` są w repozytorium (zawierają tylko adresy, nie hasła). W `.gitignore` są wpisy
  `*.local`, więc osobiste nadpisania można trzymać w `.env.local` albo `.env.production.local`.

## Polecenia npm

| Polecenie | Co robi | Efekt |
|-----------|---------|-------|
| `npm run dev` | Serwer deweloperski Vite z odświeżaniem na żywo | `http://localhost:5173` |
| `npm run build` | `tsc -b` (sprawdza typy w całym `src/`), potem `vite build` | Katalog `dist/` |
| `npm run lint` | ESLint na plikach `.ts` i `.tsx` | Lista uwag albo cisza |
| `npm run preview` | Serwuje zbudowany `dist/` do sprawdzenia przed wdrożeniem | `http://localhost:4173` |
| `npm run docs:check` | Sprawdza, czy dokumentacja zgadza się z kodem | „OK” albo lista rozbieżności |
| `npm run docs:build` | Buduje `docs/dokumentacja.html` | Jeden plik HTML |

`npm run build` **zatrzymuje się na błędzie typów**: jeśli `tsc` znajdzie błąd, `vite build` w ogóle się nie uruchomi.
Kompilator ma włączone dodatkowe kontrole `noUnusedLocals` i `noUnusedParameters`, więc nieużywana zmienna lub parametr
też przerywa build.

## Wersja produkcyjna

### Budowanie

1. Wpisz prawdziwy adres backendu w `.env.production` (`VITE_API_BASE_URL=https://api.twojadomena.pl`).
2. Uzupełnij dane administratora serwisu w `src/config/legal.ts` (opis niżej).
3. Uruchom `npm run build`.
4. W katalogu `dist/` powstaje cała strona: `index.html`, katalog `assets/` (JavaScript, CSS i czcionki z
   zakodowanymi w nazwie sumami kontrolnymi, więc przeglądarka może je bezpiecznie trzymać w pamięci podręcznej) i pliki z
   `public/` (ikony).

### Wdrożenie

`dist/` to zwykłe pliki statyczne; można je położyć na dowolnym hostingu plików (serwer WWW, bucket z CDN, hosting
statyczny). **Jeden wymóg jest obowiązkowy: przekierowanie wszystkich adresów na `index.html`.** Aplikacja używa
`BrowserRouter`, czyli adresów bez `#` (np. `/app/dashboard`). Gdyby serwer szukał pliku `app/dashboard`, po odświeżeniu
strony albo po wejściu z linku z maila dostałbyś błąd 404 serwera. Przykład dla nginx (nie był uruchamiany w tym
projekcie, to standardowy wzór):

```nginx
location / {
    try_files $uri /index.html;
}
```

Trzeba też pamiętać o rzeczach po stronie **backendu**, bez których wdrożona aplikacja nie zadziała (są odłożone na
koniec i opisane w jego dokumentacji, `docs/07-znane-ograniczenia.md`):

| Sprawa | Dlaczego dotyczy frontendu |
|--------|----------------------------|
| CORS | Backend musi dopuszczać adres, pod którym stoi frontend. Dziś ma na stałe `http://localhost:5173` |
| Adres w mailu aktywacyjnym | Link z maila prowadzi dziś na `http://localhost:5173/verify?token=...`; na produkcji musi wskazywać adres frontendu |
| `FRONTEND_URL` | Backend składa z niego linki resetu hasła, które prowadzą na stronę `/reset-password?token=` tego frontendu |
| HTTPS | Token logowania jest wysyłany w nagłówku każdego żądania; przez zwykłe HTTP byłby widoczny w sieci |

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
| Skąd bierze dokumentację backendu | Z katalogu `../port-be/docs` (repozytorium backendu leży obok frontendu). Inny katalog: `node docs/tools/build-viewer.mjs --backend ścieżka/do/docs` |
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
| Zmienna środowiskowa | `VITE_API_BASE_URL` w kodzie i w plikach `.env*` |
| Odnośniki i kotwice | Czy każdy odnośnik w plikach `.md` prowadzi do istniejącego pliku i nagłówka |
| Zgodność z dokumentacją backendu (jeśli leży obok) | Czy każde wywołanie frontendu istnieje na liście endpointów backendu |

Skrypt kończy się kodem błędu, gdy coś się nie zgadza, więc można go podpiąć pod dowolną automatyczną kontrolę. Po
zmianie kodu uruchom go i popraw dokumentację tam, gdzie wskaże rozbieżność.

## Typowe problemy

| Objaw | Przyczyna | Co zrobić |
|-------|-----------|-----------|
| Logowanie kończy się błędem „Brak połączenia z serwerem” | Backend nie działa albo `VITE_API_BASE_URL` wskazuje zły adres | Uruchom backend, sprawdź `.env`, zrestartuj `npm run dev` (zmiany w `.env` czytane są przy starcie) |
| W konsoli przeglądarki błąd CORS | Frontend działa na innym porcie niż `5173` albo pod innym adresem | Uruchom na porcie 5173 (backend ma go na stałe) |
| Po wdrożeniu odświeżenie strony pokazuje 404 serwera | Brak przekierowania na `index.html` | Dodaj regułę z sekcji „Wdrożenie” |
| Po wdrożeniu aplikacja woła `…example` | Zostawiona wartość zastępcza w `.env.production` | Wpisz prawdziwy adres i zbuduj od nowa |
| Link aktywacyjny z maila prowadzi na `localhost` | Adres wpisany na stałe w backendzie | Patrz dokumentacja backendu (znane ograniczenia) |
| `npm run build` zatrzymuje się na błędzie TypeScript | Błąd typów albo nieużywana zmienna | Popraw wskazany plik; `npm run lint` pokaże resztę uwag |
| `npm run dev` nie startuje, błąd wersji Node | Zbyt stary Node.js | Zainstaluj Node.js 20.19+ albo 22.12+ |
