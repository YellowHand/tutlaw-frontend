# 03. Logowanie i sesja

[← Spis treści](README.md)

Ten dokument opisuje, jak frontend trzyma sesję użytkownika, co robi po wygaśnięciu tokenu, jak działają formularze
konta (rejestracja, aktywacja, logowanie, reset hasła, zmiana hasła, usunięcie konta) i co aplikacja zapisuje w
przeglądarce. Po stronie serwera to samo opisuje dokumentacja backendu (rozdział „Bezpieczeństwo i konta”), dostępna
w repozytorium backendu i w podglądzie `dokumentacja.html`.

## Sesja w skrócie

- Po zalogowaniu serwer zwraca **token JWT** (`accessToken`). Frontend zapisuje go w `localStorage` pod kluczem
  `accessToken` i od tej pory dokleja do każdego żądania nagłówek `Authorization: Bearer <token>`.
- „Zalogowany” znaczy tu: w pamięci przeglądarki jest token. Frontend **nie sprawdza**, czy token jest ważny; robi to
  serwer przy każdym żądaniu. Token jest ważny 24 godziny, a odświeżania (refresh token) nie ma, więc po tym czasie
  trzeba zalogować się ponownie.
- Wylogowanie z własnej woli kasuje token i wszystko, co aplikacja zapisała w przeglądarce. Wygaśnięcie sesji kasuje
  tylko token (powód poniżej).

## Gdzie co jest w kodzie

| Plik | Rola |
|------|------|
| `auth/AuthContext.tsx` | `AuthProvider`: trzyma token w stanie Reacta, startuje od wartości z `localStorage`. Daje `login(token)` i `logout()` |
| `auth/context.ts` | Sam kontekst i jego typ (osobny plik, żeby nie mieszać go z komponentem) |
| `auth/useAuth.ts` | Hook `useAuth()` → `{ token, isAuthenticated, login, logout }`; poza `AuthProvider` rzuca błąd |
| `features/auth/tokenStorage.ts` | Odczyt i kasowanie tokenu z `localStorage` (z obsługą błędów pamięci), używane przez klienta HTTP |
| `features/auth/session.ts` | `clearSession()`: pełne czyszczenie po wylogowaniu lub usunięciu konta |
| `features/auth/role.ts` | `roleFromToken()` i `useIsAdmin()`: rola z tokenu (tylko do pokazywania przycisków) |
| `api/axiosInstance.ts` | Klient HTTP: dokleja token, reaguje na 401 |
| `components/ProtectedRoute.tsx` | Wpuszcza na `/app/...` tylko z tokenem |
| `components/layout/LogoutButton.tsx` | Przycisk „Wyloguj się”: ikona w panelu bocznym (odmiana `icon`), napis na ekranie Konto na telefonie (odmiana `text`) |

## Klient HTTP: token i błąd 401

Wszystkie wywołania serwera idą przez jeden obiekt `api` (`api/axiosInstance.ts`). Jego adres bazowy to
`VITE_API_BASE_URL` (patrz [08](08-konfiguracja-i-uruchomienie.md)).

**Przed każdym żądaniem** (interceptor żądań): jeśli w `localStorage` jest token, dopisuje `Authorization: Bearer ...`.

**Po każdej odpowiedzi** (interceptor odpowiedzi) reaguje na błąd tylko w jednym przypadku: **status 401 na adres
spoza `/api/auth/`**. Wtedy:

```mermaid
flowchart TD
    E["Odpowiedź 401"] --> A{"Adres zaczyna się od /api/auth/ ?"}
    A -- tak --> F["Nic nie robi.<br/>Formularz pokaże własny komunikat<br/>(np. złe hasło)"]
    A -- nie --> B{"Żądanie poszło ze starym tokenem?<br/>(token w pamięci jest już inny)"}
    B -- tak --> G["Nic nie robi.<br/>Nowa sesja zostaje"]
    B -- nie --> C["Kasuje sam token<br/>(clearStoredToken)"]
    C --> D{"Użytkownik jest na stronie publicznej?"}
    D -- tak --> H["Zostaje, gdzie jest"]
    D -- nie --> I["Przeładowanie na /login"]
```

Dlaczego tak:

- **Błędy 403 nie wylogowują.** 403 znaczy „nie masz uprawnień do tej czynności” (np. zwykły użytkownik próbuje ukryć
  kartę), a sesja jest w porządku.
- **Adresy `/api/auth/...`** (logowanie, rejestracja, reset hasła) zwracają 401 przy złych danych. Takie błędy pokazuje
  sam formularz, a nie wylogowanie.
- **Stary token.** Zmiana hasła daje nowy token i unieważnia stare. Żądanie wysłane tuż przed zmianą może wrócić z 401,
  ale nie może wylogować już nowej sesji, dlatego interceptor porównuje token wysłany z tym, który jest teraz w
  pamięci.
- **Tylko token.** Przy wygaśnięciu sesji nie czyścimy reszty danych aplikacji: użytkownik, który zaloguje się ponownie na
  to samo konto, nie traci rozpoczętego egzaminu próbnego (patrz [04](04-nauka-w-aplikacji.md)).
- Przekierowanie robi `window.location.href`, czyli **pełne przeładowanie** strony. Dzięki temu znika też pamięć
  podręczna danych (React Query) poprzedniej sesji.
- Strony publiczne, na których przekierowania nie ma, to: `/`, `/login`, `/register`, `/check-email`, `/verify`,
  `/forgot-password`, `/reset-password`, `/regulamin`, `/polityka-prywatnosci` (lista `PUBLIC_PATHS` w kliencie HTTP).

## Wylogowanie i czyszczenie danych

| Funkcja | Co kasuje | Kiedy jest używana |
|---------|-----------|--------------------|
| `clearStoredToken()` | Tylko token `accessToken` | Wygasła sesja (401) |
| `clearSession()` | Token oraz **wszystkie klucze zaczynające się od `tutlaw.`** (szkic egzaminu, zapamiętane ustawienia egzaminu, ostatni własny test, wybór zwiniętego panelu, odłożony wybór egzaminu) | Przycisk „Wyloguj się” i usunięcie konta |

Przycisk „Wyloguj się” (`LogoutButton`; w panelu bocznym, a na telefonie na ekranie Konto) wywołuje `logout()` z kontekstu (`clearSession()` i token w stanie na `null`),
a potem przenosi na stronę główną przez `window.location.href`, czyli również z pełnym przeładowaniem. Efekt: na
wspólnym komputerze nie zostają ślady po poprzednim użytkowniku (w szkicu egzaminu jest adres e-mail właściciela).

## Co aplikacja zapisuje w przeglądarce

| Gdzie | Klucz | Co | Kto zapisuje | Kiedy znika |
|-------|-------|----|--------------|-------------|
| `localStorage` | `accessToken` | Token sesji (JWT) | `AuthProvider.login` | Wylogowanie lub błąd 401 |
| `localStorage` | `tutlaw.exam.draft.v1` | Niedokończony egzamin próbny: pytania, odpowiedzi, termin końca, próg w punktach z serwera, adres konta właściciela (zapis w wersji 2; wersja 1 sprzed Etapu 28 też się wznawia) | `features/exam/examStorage.ts` | Po wysłaniu egzaminu, po porzuceniu, po wylogowaniu |
| `localStorage` | `tutlaw.exam.settings.v1` | Ostatnio użyty limit czasu egzaminu (zakres, liczbę pytań i próg ustala format egzaminu, więc ich nie zapamiętujemy; zapis ze starszych wersji ma je jeszcze w sobie i są pomijane) | `features/exam/examStorage.ts` | Po wylogowaniu |
| `localStorage` | `tutlaw.customTest.v1` | Ostatnio ułożony własny test: zaznaczone akty prawne (albo „wszystko”), rodzaj pytań, liczba pytań, lata egzaminu | `features/customTest/customTestStorage.ts` | Po wylogowaniu |
| `localStorage` | `tutlaw.nav.collapsed.v1` | Czy panel boczny jest zwinięty (`1`) czy rozwinięty (`0`) | `components/layout/useNavCollapsed.ts` | Po wylogowaniu |
| `localStorage` | `tutlaw.examPrompt.skipped.v1` | Czy użytkownik odłożył wybór egzaminu na Pulpicie („Wybiorę później”); gdy tak, kafelek wyboru się nie pokazuje, a w „Na dziś” jest tylko zaproszenie do Konta | `features/dashboard/examPromptSkip.ts` | Po wylogowaniu |

Aplikacja nie używa `sessionStorage`, plików cookie ani IndexedDB. Każdy odczyt i zapis jest w `try/catch`: gdy
pamięć jest niedostępna (np. tryb prywatny), aplikacja działa dalej, tylko bez zapamiętywania.

Token leży w `localStorage` (a nie w ciasteczku `HttpOnly`), co jest świadomą decyzją projektu, opisaną w
[Znanych ograniczeniach](10-znane-ograniczenia.md). Polityka prywatności w aplikacji wspomina o tokenie, a nie wymienia
szkicu egzaminu ani zapamiętanych ustawień (patrz tamże).

## Rola administratora

Token zawiera pole `role` (`STUDENT` albo `ADMIN`). Funkcja `roleFromToken()` dekoduje środkową część tokenu (zwykłe
base64, bez sprawdzania podpisu) i zwraca rolę, a hook `useIsAdmin()` mówi, czy to `ADMIN`. Służy to **wyłącznie do
pokazania lub ukrycia przycisków** dla administratora, dziś jedynego: „Ukryj” (`features/admin/HideCardButton.tsx`).
Prawdziwa kontrola jest w serwerze przy każdym żądaniu, więc podrobienie roli w przeglądarce niczego nie daje.

Zmiana roli w bazie działa dopiero po ponownym zalogowaniu, bo rola siedzi w tokenie.

## Rejestracja i aktywacja konta

```mermaid
sequenceDiagram
    participant U as Użytkownik
    participant F as Frontend
    participant S as Serwer
    participant M as Poczta uczelniana
    U->>F: Formularz /register (mail prywatny, uczelniany, hasło, regulamin)
    F->>S: POST /api/auth/register
    S-->>F: 200 (zawsze ta sama odpowiedź)
    F->>U: /check-email: „Jeśli ten adres nie miał jeszcze konta, wysłaliśmy link…”
    S->>M: Mail z linkiem aktywacyjnym
    U->>F: Klik w link → /verify?token=...
    F->>S: GET /api/auth/verify?token=...
    S-->>F: 200 (konto aktywne) albo błąd
    F->>U: „Konto zweryfikowane!” → przycisk do logowania
```

- **Rejestracja** (`pages/RegisterPage.tsx`) wymaga: mail prywatny (będzie loginem), mail uczelniany (tam przychodzą linki),
  hasło 8–72 znaków i zaznaczoną zgodę na regulamin i politykę prywatności. Po sukcesie przechodzi na `/check-email` i
  przekazuje adres w stanie nawigacji.
- Komunikat po rejestracji jest **taki sam dla każdego adresu**, żeby nie zdradzać, czy konto już istniało.
- **Aktywacja** (`pages/VerifyPage.tsx`) wywołuje serwer raz (strażnik `useRef` chroni przed podwójnym wywołaniem w trybie
  deweloperskim). Bez tokenu w adresie od razu pokazuje błąd. Przy błędzie („Link nieprawidłowy lub wygasł”) oferuje
  formularz wysłania linku ponownie.
- **„Wyślij link ponownie”** (`features/auth/ResendVerification.tsx`) jest na stronach `/check-email`, `/verify` (przy
  błędzie) i `/login` (po odpowiedzi 409). Odpowiedź serwera jest zawsze ta sama, a przycisk po wysłaniu jest zablokowany
  na 60 sekund. Serwer dodatkowo ogranicza liczbę wysyłek (patrz dokumentacja backendu).

## Logowanie

`pages/LoginPage.tsx` wysyła `POST /api/auth/login` z `privateEmail` i `password`.

| Odpowiedź | Co robi frontend |
|-----------|------------------|
| 200 | Zapisuje `accessToken` (`login(...)`) i przechodzi na adres, z którego użytkownik przyszedł, a bez niego na Pulpit |
| 409 | Hasło dobre, ale konto jeszcze nieaktywne: pokazuje komunikat serwera i formularz „wyślij link ponownie” |
| inne | Pokazuje komunikat serwera (`message`) albo „Logowanie nie powiodło się”; brak połączenia ma osobny komunikat |

Komunikaty błędów wyciąga funkcja `serverMessage` (`lib/errors.ts`): bierze pole `message` z odpowiedzi serwera, a gdy go
nie ma, tekst zastępczy podany przez ekran. Jeśli serwer w ogóle nie odpowiedział, mówi „Brak połączenia z serwerem”.

## Reset hasła

1. `/forgot-password` (`ForgotPasswordPage`): użytkownik podaje mail prywatny → `POST /api/auth/forgot-password`.
   Zawsze pokazuje ten sam komunikat („Jeśli konto o tym adresie istnieje i jest aktywne, wysłaliśmy link…”). Link idzie na
   mail uczelniany i jest ważny godzinę.
2. `/reset-password?token=...` (`ResetPasswordPage`): dwa pola hasła (muszą być takie same, 8–72 znaki) →
   `POST /api/auth/reset-password`. Bez `token` w adresie ekran mówi, że brakuje linku, i odsyła po nowy. Po sukcesie
   odsyła do logowania. Błąd (np. link wygasł) pokazuje komunikat serwera i odnośnik „Link wygasł? Poproś o nowy”.

## Zmiana hasła (w Koncie)

`features/account/ChangePasswordCard.tsx` → `PUT /api/users/me/password` z `currentPassword` i `newPassword`.

- Frontend sprawdza, czy oba nowe hasła są takie same i czy nowe różni się od obecnego.
- Serwer unieważnia wszystkie dotychczasowe tokeny konta i **zwraca nowy token**; frontend od razu go zapisuje
  (`login(newToken)`), więc ta przeglądarka zostaje zalogowana, a pozostałe urządzenia zostają wylogowane.

## Pobranie danych i usunięcie konta (RODO)

- **Pobierz moje dane** (`ExportCard`): `GET /api/users/me/export` → plik JSON zapisywany na dysku użytkownika
  (`saveTextFile`, nazwa `tutlaw-moje-dane-RRRR-MM-DD.json`). Dane nie są nigdzie indziej wysyłane.
- **Usuń konto** (`DeleteAccountCard`): wymaga hasła i zaznaczenia „Rozumiem, że usunięcia konta i danych nie można
  cofnąć”. `DELETE /api/users/me` z hasłem w treści. Po sukcesie `clearSession()` i przejście na `/?konto=usuniete`,
  gdzie strona główna pokazuje potwierdzenie.
