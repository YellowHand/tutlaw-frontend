# 06. Wygląd i komponenty

[← Spis treści](README.md)

Ten dokument opisuje, jak aplikacja wygląda i z czego jest złożona wizualnie: paleta kolorów, czcionki, układ ekranu,
wspólne komponenty i zasady dostępności. Wygląd **strony głównej** (landing) ma własne reguły i jest w osobnym
dokumencie: [07](07-strona-glowna.md).

## Jak działa stylowanie

Aplikacja używa **Tailwind CSS 4**: styl zapisuje się jako klasy bezpośrednio w kodzie komponentu
(`className="rounded-2xl border border-line bg-surface p-4"`). Nie ma osobnych plików CSS dla komponentów.
Jedyny plik ze stylami to `src/index.css`, a w nim:

1. `@import "tailwindcss"`: dołącza Tailwinda.
2. `@source not "../docs"`: Tailwind sam przeszukuje projekt w poszukiwaniu nazw klas, więc ta linia wyłącza z
   przeszukiwania katalog `docs/` (Markdown i podgląd HTML to zwykły tekst). Bez niej do zbudowanego CSS trafiałyby
   klasy z samych opisów (np. `container`, `table`).
3. Blok `@theme { … }`: **wszystkie kolory, czcionki, rozmiary tekstu i animacje projektu**. Tailwind 4 robi z każdej
   zmiennej `--color-xxx` klasy `bg-xxx`, `text-xxx`, `border-xxx` itd. Dlatego `--color-accent` daje `bg-accent`,
   `text-accent`, `border-accent`.
4. Kilka zasad globalnych: ciemny schemat kolorów, tło i czcionka `body`, obwódka fokusu, wyłączanie animacji.

Żeby zmienić kolor w całej aplikacji, zmień **jedną wartość** w bloku `@theme`. Nie wpisuje się kolorów szesnastkowo
w komponentach aplikacji. Wyjątek to ikona togi (`togaTrim.ts`) i kilka miejsc na stronie głównej (krzywa zapominania, demo pytania, chipy aplikacji), gdzie kolory są wpisane na sztywno.

Do składania klas służy funkcja `cn(...)` z `lib/cn.ts` (opakowanie `clsx`): `cn("a", warunek && "b", className)`.

## Paleta kolorów (aplikacja)

Aplikacja ma **dwa wyglądy: ciemny (domyślny) i jasny**. Wybiera go użytkownik w oknie startowym i potem w Koncie
(karta „Wygląd”), a zapisuje się on **na koncie w backendzie** (`PUT /api/me/theme`), więc działa tak samo na każdym
urządzeniu. Jasny wygląd to atrybut `data-theme="light"` na `<html>`, który nadpisuje tokeny kolorów (blok
`:root[data-theme="light"]` w `index.css`, kolory „papieru” jak w dokumentacji). Ustawia go tylko `ThemeSync` (w `AppShell`),
więc **tylko wewnątrz `/app`**: strona główna, logowanie, rejestracja i strony prawne są zawsze ciemne. Od pierwszej klatki
atrybut ustawia skrypt w `index.html` z kopii w przeglądarce (klucz `gradus.theme.v1`, opis w [03](03-logowanie-i-sesja.md)),
a gdy ustawienia z serwera dotrą, wygrywa konto. Tabela niżej podaje wartości ciemnego wyglądu; jasny zmienia tylko te,
które są podane w kolumnie „Jasny”.

| Zmienna | Kolor (ciemny) | Jasny | Do czego |
|---------|----------------|-------|----------|
| `canvas` | `#121214` | `#fbfaf6` | Tło całej strony |
| `surface` | `#1a1a1d` | `#f2efe9` | Karty, menu boczne, okna |
| `surface-2` | `#242428` | `#e9e4d8` | Wyższy poziom: pola, przyciski drugorzędne, szkielety ładowania |
| `line` | `#313136` | `#d6d0c2` | Cienkie obramowania kart i separatory |
| `field` | `#74737a` | `#807b6c` | Obramowanie pól formularza (jaśniejsze niż `line`, żeby spełnić kontrast 3:1 dla elementów interfejsu) |
| `fg` | `#f2efe9` | `#1b1a17` | Główny tekst |
| `fg-muted` | `#a6a5ab` | `#5b574f` | Tekst pomocniczy, podpisy, nieaktywne menu |
| `accent` | `#d8b13a` | bez zmiany | Złote **wypełnienia**: główne przyciski, paski postępu, odznaki |
| `accent-fg` | `#211804` | bez zmiany | Tekst na złotym tle |
| `accent-ink` | `#d8b13a` | `#7a5c00` | Złoty **tekst, obwódki, fokus i znaczniki wyboru**: w jasnym wyglądzie ciemny brąz, bo złoto na papierze ma kontrast poniżej 2:1 |
| `accent-2` | `#e8649f` | bez zmiany | Różowy akcent drugorzędny (słupki na wykresie powtórek) |
| `success` | `#4fd68a` | `#17703d` | Poprawna odpowiedź, potwierdzenia |
| `warning` | `#f08c3c` | `#9a4d00` | Ostrzeżenia, pytania oznaczone „do sprawdzenia” w egzaminie, średni poziom opanowania na paskach |
| `danger` | `#f0565e` | `#b3261e` | Błędy, błędna odpowiedź, usuwanie |

Zasada doboru: wypełnienie złotem (`bg-accent` z `text-accent-fg`) zostaje w obu wyglądach, a **tekst, ramka i fokus w kolorze
akcentu używają `accent-ink`** (`text-accent-ink`, `border-accent-ink`, `outline-accent-ink`, `accent-accent-ink` dla pól wyboru).

Reguła: **kolor nigdy nie jest jedyną informacją**. Poprawna i błędna odpowiedź mają też ikonę i opis słowny, a stan
aktywny w menu ma inne tło, nie tylko inny odcień.

### Dodatkowe tokeny tylko dla strony głównej

W tym samym bloku `@theme` są kolory, rozmiary tekstu (`text-lp-h1`, `text-lp-h2`, `text-lp-body` i inne) i animacja,
których używa wyłącznie strona główna (`fg-soft`, `accent-hover`, `band`, cała rodzina `paper-*` i `ink-*` dla
„arkusza egzaminacyjnego” w demo, `on-accent-soft`). Reszta aplikacji ich nie dotyka. Opis w [07](07-strona-glowna.md).

## Czcionki

| Czcionka | Gdzie | Jak ładowana |
|----------|-------|--------------|
| **Manrope** (zmienna, wszystkie wagi) | Cała aplikacja i strona główna. Zmienna `--font-sans` | `import "@fontsource-variable/manrope"` w `main.tsx` |
| **Newsreader** (tylko waga 500) | Nagłówki wyróżnione na stronie głównej oraz słowo „iuris” w logo (kursywa). Zmienna `--font-display` (klasa `font-display`) | Prosta: `import "@fontsource/newsreader/500.css"` w `pages/LandingPage.tsx` (tylko ze stroną główną). Kursywa: `import "@fontsource/newsreader/500-italic.css"` w `components/layout/Logo.tsx`, więc ładuje się w całej aplikacji. Przeglądarka pobiera tylko plik z potrzebnymi znakami (łacińskimi), ok. 25 KB |

Obie czcionki są dołączone do paczki z pakietów npm (`@fontsource…`), więc **aplikacja nie łączy się z Google Fonts
ani z żadnym innym zewnętrznym serwerem czcionek** (ważne dla prywatności i działania offline w sieci lokalnej).
Zapasowe czcionki systemowe: `system-ui, sans-serif` dla Manrope oraz `Georgia, "Times New Roman", serif` dla
Newsreader.

## Układ ekranu aplikacji (po zalogowaniu)

Szkielet zdefiniowany jest w `components/layout/AppShell.tsx`:

```mermaid
flowchart LR
    subgraph "Sesja nauki, każda szerokość"
        G["Zakończ sesję<br/>(pasek u góry)"] --- H["main<br/>przewijana treść"]
    end
    subgraph "Ekran < 768 px"
        E["main<br/>przewijana treść"] --- F["BottomNav<br/>5 pozycji, przyklejona do dołu"]
    end
    subgraph "Ekran 768 – 1279 px (md)"
        C["SideNav rail<br/>84 px, ikona i podpis"] --- D["main<br/>przewijana treść"]
    end
    subgraph "Ekran ≥ 1280 px (xl)"
        A["SideNav full<br/>248 px, ikony i napisy<br/>(można zwinąć)"] --- B["main<br/>przewijana treść"]
    end
```

- Cały szkielet ma wysokość okna (`h-dvh`); przewija się tylko `<main>`, menu stoi w miejscu. Na telefonie `<main>` ma
  na dole dopełnienie wysokości dolnej belki (`pb-[calc(4.25rem+env(safe-area-inset-bottom))]`), żeby belka nie
  zasłaniała końca ekranu.
- Postać menu wybierają klasy w `AppShell`: `hidden xl:flex` (panel), `hidden md:flex xl:hidden` (wąski pasek) i
  `md:hidden` (dolna belka). Panel można zwinąć do wąskiego paska przyciskiem u góry; wybór pamięta `useNavCollapsed`
  (klucz `gradus.nav.collapsed.v1`, patrz [03](03-logowanie-i-sesja.md)).
- Menu jest zdefiniowane raz w `config/navigation.ts` (`NAV_ITEMS`): Pulpit, Testy, Fiszki, Statystyki, Konto.
  `BottomNav` pokazuje całą listę, a `SideNav` listę `SIDE_NAV_ITEMS` (te same pozycje bez Konta, bo Konto jest w bloku
  użytkownika na dole panelu). Reguła aktywnej pozycji (`isNavItemActive`) leży w tym samym pliku i jest wspólna dla obu
  menu: pozycja jest aktywna, gdy adres jest jej adresem lub podadresem, albo zaczyna się od jednego z `activePrefixes`
  (np. egzamin próbny `/app/exam` zapala „Testy”). Aktywny link ma `aria-current="page"`.
- Wygląd aktywnej pozycji: ciemna płytka (`surface-2`) ze złotą kreską przy krawędzi i złotą ikoną, w dolnej belce jasna
  pastylka za ikoną. Złote wypełnienie zostaje dla przycisków na ekranach, żeby menu z nimi nie konkurowało.
- `NavBadge`: złota odznaka z liczbą powtórek przy „Testy” i „Fiszki”. Nic nie rysuje, gdy liczba wynosi 0, a od 100
  pokazuje „99+”. Ma `role="status"` i opis dla czytników ekranu („5 powtórek do zrobienia”). Nałożona na ikonę (wąski
  pasek, dolna belka) ma pełne złote tło (`solid`), w szerokim panelu jest półprzezroczysta.
- `LogoutButton`: odmiana `icon` (panel boczny) i `text` (ekran Konto, widoczna tylko poniżej 768 px). Wylogowuje i przenosi
  na stronę główną (pełne przeładowanie).
- Sesje fiszek i testów (adresy z `sessionExitRoute`) nie mają menu: `AppShell` pokazuje zamiast niego pasek z przyciskiem
  „Zakończ sesję” (patrz [02](02-routing-i-strony.md)).

Szerokości progów (Tailwind): `sm` 640 px, `md` 768 px, `lg` 1024 px, `xl` 1280 px. W kodzie najczęściej występuje
`sm:` (odstępy `px-4 sm:px-8`, układy kolumnowe), a `md:` i `xl:` służą m.in. do przełączania postaci menu.

Nagłówek strony (`PageHeader`): tytuł `h1` (24 px, pogrubiony), opcjonalny podtytuł i miejsce na akcje po prawej (na
wąskim ekranie pod tytułem, a gdy się nie mieszczą, zawijają się do następnej linii). Ekrany logowania i rejestracji używają `AuthLayout`: wyśrodkowana karta o szerokości
najwyżej 24 rem z logo nad nią.

## Wspólne komponenty (`components/ui/`)

| Komponent | Opis | Ważne szczegóły |
|-----------|------|-----------------|
| **`Button`** | Przycisk w czterech odmianach (`variant`): `primary` (złoty), `secondary` (szary), `ghost` (przezroczysty), `danger` (czerwony) | Zaokrąglony do końca, minimalna wysokość 44 px (`min-h-11`), przyjmuje wszystkie atrybuty `<button>`. **Domyślnie `variant="primary"`, ale typ przycisku (`type`) nie jest ustawiany**, więc w formularzu trzeba podać `type="button"`, jeśli przycisk nie ma wysyłać formularza |
| **`Card`** | Ramka z zaokrąglonymi rogami i tłem `surface` | Zwykły `div` z klasami; dodatkowe klasy przez `className` |
| **`Dialog`** | Okno modalne | Oparte na natywnym elemencie `<dialog>` i `showModal()`: przeglądarka sama pilnuje fokusu, Esc i zasłania resztę strony przed czytnikami. Trafia do `<body>` przez portal (fiszka ma obrót 3D, który psułby położenie okna). Domyślnie zamyka się na Esc, kliknięcie tła i przycisk „Zamknij okno”; po zamknięciu fokus wraca na element, który je otworzył. Dwie właściwości zmieniają to zachowanie: `closeOnBackdrop={false}` (okno zgłoszenia z wpisanym komentarzem nie ginie od przypadkowego kliknięcia w tło) i `dismissible={false}` (okno startowe: Esc nic nie robi, okno nie ma przycisku zamknięcia ani zamykania tłem; gdyby przeglądarka mimo to je zamknęła, otwiera się z powrotem). Okno ma `data-no-shortcuts`, więc skróty klawiszowe sesji (odpowiedzi, Enter, strzałki) nie działają, gdy jest otwarte Montowane tylko, gdy ma być widoczne, więc zawsze zaczyna od czystego stanu |
| **`Field`** | Pole tekstowe z etykietą | Etykieta jest powiązana z polem (`useId`), opcjonalna podpowiedź (`hint`) jest podpięta jako `aria-describedby`. Wysokość min. 44 px |
| **`EmptyState`** | Pusty widok: ikona, tytuł, opis, przycisk | Dla list bez wyników i dla sytuacji „nie ma jeszcze czego pokazać” |
| **`ErrorState`** | Błąd ładowania: ikona ostrzeżenia, komunikat, „Spróbuj ponownie” | Przycisk pojawia się, gdy podano `onRetry`. Komunikat domyślny: „Coś poszło nie tak.” |
| **`Skeleton`** | Szary pulsujący prostokąt na czas ładowania | Pulsowanie wyłącza się przy ustawieniu systemowym „ogranicz ruch” (`motion-reduce:animate-none`) |

### Komponenty układu (`components/layout/`)

`AppShell` (szkielet z menu), `SideNav` (panel boczny i wąski pasek), `BottomNav` (dolna belka na telefonie),
`useNavCollapsed` (zapamiętane zwinięcie panelu), `NavBadge`, `LogoutButton` (odmiany `icon` i `text`), `PageHeader`,
`AuthLayout`, `Logo` (odmiany `wordmark` z napisem i `monogram`: pięć stopni w złotym kwadracie; napis „Gradus” pogrubiony, „iuris” kursywą szeryfową; zasady zapisu i pliki marki w [`brand/README.md`](brand/README.md)).

### Ikony

- **Ikony interfejsu**: biblioteka `lucide-react` (np. `LayoutDashboard`, `ClipboardList`, `Layers`, `BarChart3`).
  Ikony ozdobne mają `aria-hidden="true"`.
- **`TogaIcon`** (`components/icons/`): własna ikona togi w stylu lucide (siatka 24 × 24, kreska 2). Obrys ma kolor
  tekstu (`currentColor`), a „żabot” (kołnierz) kolor zawodu. Kolory są w `togaTrim.ts` (`TOGA_COLORS`): adwokat
  zielony, radca prawny niebieski, sędzia fioletowy, prokurator czerwony, pytania autorskie złoty, notariusz srebrny,
  komornik miedziany. Dwa kolory (np. adwokat + radca) rysują żabot podzielony na pół. Kolory notariusza i komornika
  zostały dobrane, bo w sprawdzonych źródłach nie ma koloru ich togi. Toga występuje na stronie głównej (sekcja
  funkcji i chipy aplikacji).

## Dostępność (a11y)

Przyjęte w całej aplikacji zasady, które warto zachować przy zmianach:

| Zasada | Jak jest zrobiona |
|--------|-------------------|
| Widoczny fokus z klawiatury | Globalna zasada `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }` w `index.css` |
| Duże cele dotykowe | Przyciski, pola i pozycje menu mają minimum 44 px (`min-h-11`, `size-11`, `h-11 w-11`; w dolnej belce `min-h-16`) |
| Kontrast | Teksty i obramowania pól dobrane pod ciemne tło (m.in. `field` ma osobny jaśniejszy odcień dla ramek pól) |
| Ograniczenie ruchu | Globalna zasada `@media (prefers-reduced-motion: reduce)` skraca animacje i przejścia do ~0 ms; `Skeleton` wyłącza pulsowanie |
| Czytniki ekranu | Ikony ozdobne `aria-hidden`; aktywna pozycja menu `aria-current="page"`; odznaki i komunikaty stanu `role="status"`; pola formularzy mają etykiety i `aria-describedby`; okna to natywne `<dialog>` z `aria-labelledby` |
| Ogłoszenia na żywo | Zegar egzaminu ogłasza czas tylko przy progach 10, 5 i 1 minuta (żeby nie czytać każdej sekundy), patrz [04](04-nauka-w-aplikacji.md) |
| Skróty klawiszowe nie przeszkadzają | Wyłączają się, gdy fokus jest w polu tekstowym (`isTyping`) albo na elemencie z `data-no-shortcuts` |
| Język strony | `<html lang="pl">` w `index.html` |

## Animacje

Aplikacja używa animacji oszczędnie: obrót 3D fiszki po odsłonięciu odpowiedzi (`rotateY`, w `StudySessionPage`),
pulsowanie szkieletów ładowania, krótkie pojawienie się wyjaśnienia w demo na stronie głównej (`animate-rise`, zdefiniowane
w `@theme`) oraz płynne przejścia kolorów przy najechaniu. Wszystko to wyłącza ustawienie „ogranicz ruch”.

## Wykresy i wizualizacje

W projekcie **nie ma biblioteki wykresów**. Paski postępu, wykres podejść egzaminu na Pulpicie, rytm aktywności i krzywa
zapominania (strona główna) są rysowane zwykłymi elementami HTML i SVG z kolorami z palety (np. pasek „Opanowane” ma
`bg-accent`, a poprawne i niepoprawne podejścia na wykresie egzaminu `bg-success` i `bg-danger`). Wykresy są dostępne dla
czytników ekranu: blok wykresu ma `role="img"` i opis z liczbami. Liczby, które wykresy
pokazują, pochodzą z serwera (`/api/statistics/...`), a przeliczenia na kształt (wysokość słupka, wypełnienie kółka)
są w plikach `selectors.ts` i `*.tsx` w `features/statistics` i `features/dashboard`.

## Jak zmienić wygląd: ściąga

| Chcę zmienić… | Gdzie |
|---------------|-------|
| Kolor (np. złoty akcent) | `src/index.css`, blok `@theme`, zmienna `--color-accent` |
| Czcionkę całej aplikacji | `--font-sans` w `index.css` i import w `main.tsx` |
| Napis w menu albo kolejność pozycji | `src/config/navigation.ts` |
| Wygląd przycisków | `components/ui/Button.tsx` (`VARIANT_CLASSES`). Uwaga: część ekranów ma własne klasy przycisków wpisane w miejscu użycia |
| Szerokości, przy których zmienia się postać menu | `AppShell.tsx` (`xl:flex`, `md:flex`, `xl:hidden`, `md:hidden`) |
| Logo | `components/layout/Logo.tsx` |
| Ikonę karty w przeglądarce i ikony na telefon | `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` (pliki źródłowe i zasady: `docs/brand/`) |
| Tytuł i opis strony (karta przeglądarki, podgląd w komunikatorach) | `index.html` |
