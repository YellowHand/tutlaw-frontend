# Dokumentacja frontendu Gradus iuris

Ten katalog opisuje, jak działa strona internetowa (frontend) aplikacji **Gradus iuris**: z czego jest zbudowana, jakie ma
ekrany, jak rozmawia z serwerem, jak działa sesja nauki i gdzie w kodzie szukać konkretnej rzeczy. Wszystko jest po
polsku i pisane tak, żeby dało się to zrozumieć bez znajomości kodu.

> Stan dokumentacji: frontend po **Etapie 32** (pula pytań i ścieżki zamiast filtra pochodzenia, fiszka jako tryb pytania).
> Opisuje to, co faktycznie jest w kodzie. Tam, gdzie coś jest niedoskonałe albo celowo odłożone na koniec, jest to powiedziane wprost w
> [Znanych ograniczeniach](10-znane-ograniczenia.md).

Dokumentacja serwera (backendu) leży w osobnym repozytorium, w katalogu `docs/` tamtego projektu. Obie części (backend i
frontend) można czytać razem w jednym pliku z wyszukiwarką: [`dokumentacja.html`](dokumentacja.html) (patrz niżej).

## Czym jest frontend (w trzech zdaniach)

To aplikacja jednostronicowa (SPA) napisana w **React 19 i TypeScript**. Po wejściu pobiera z serwera tylko dane (JSON),
a ekrany rysuje sama w przeglądarce. Z serwerem rozmawia przez adres z zmiennej `VITE_API_BASE_URL`, a po zalogowaniu
dokleja do każdego żądania token JWT.

## Spis treści

| Plik | O czym jest | Kiedy czytać |
|------|-------------|--------------|
| [01. Architektura](01-architektura.md) | Technologie, układ katalogów, droga danych od serwera do ekranu, start aplikacji | Na początek, żeby wiedzieć, gdzie co leży |
| [02. Routing i strony](02-routing-i-strony.md) | Wszystkie adresy, które ekran pokazują, kto ma do nich dostęp, jakie dane pobierają | Gdy szukasz, który plik odpowiada za dany ekran |
| [03. Logowanie i sesja](03-logowanie-i-sesja.md) | Token, wylogowanie po błędzie 401, rejestracja, reset hasła, rola administratora, co leży w przeglądarce | Gdy ruszasz cokolwiek związanego z kontem |
| [04. Nauka w aplikacji](04-nauka-w-aplikacji.md) | Sesja testowa i fiszek, tasowanie odpowiedzi, skróty klawiszowe, pula pytań i filtr źródeł, egzamin próbny, ustawienia nauki i wybór ścieżki | Gdy chcesz zrozumieć, co się dzieje po kliknięciu odpowiedzi |
| [05. Warstwa API i dane](05-warstwa-api-i-dane.md) | Klient HTTP, wszystkie wywołania serwera, klucze pamięci podręcznej, odświeżanie danych | Gdy łączysz frontend z backendem |
| [06. Wygląd i komponenty](06-wyglad-i-komponenty.md) | Kolory, czcionki, układ, wspólne komponenty, dostępność | Gdy zmieniasz wygląd |
| [07. Strona główna](07-strona-glowna.md) | Sekcje strony głównej, teksty w jednym miejscu, demo pytania, hero | Gdy zmieniasz tekst albo wygląd strony głównej |
| [08. Konfiguracja i uruchomienie](08-konfiguracja-i-uruchomienie.md) | Zmienne środowiskowe, polecenia, build, wdrożenie, dane administratora serwisu | Gdy uruchamiasz projekt albo go wdrażasz |
| [09. Słownik](09-slownik.md) | Pojęcia z aplikacji i ich nazwy w kodzie | Gdy nie wiesz, co znaczy „pula pytań” albo „sesja dodatkowa” |
| [10. Znane ograniczenia](10-znane-ograniczenia.md) | Co jest odłożone na koniec, co jest niedoskonałe, czego nie sprawdzono | Przed wdrożeniem na prawdziwy serwer |
| [Znak i pliki marki](brand/README.md) | Logo, ikony na telefon, awatary i okładki do mediów społecznościowych, zasady zapisu nazwy | Gdy wgrywasz logo gdziekolwiek albo piszesz nazwę „Gradus iuris” |

## Jak szybko znaleźć odpowiedź

- **„Gdzie zmienię napis w menu?”** → [06](06-wyglad-i-komponenty.md) (menu) i `src/config/navigation.ts`.
- **„Gdzie zmienię hasło z głównej strony („Testy, które pamiętają…”)?”** → [07](07-strona-glowna.md), plik `copy.ts`.
- **„Skąd ekran wie, że sesja wygasła?”** → [03](03-logowanie-i-sesja.md), część o błędzie 401.
- **„Co robi klawisz G w teście?”** → [04](04-nauka-w-aplikacji.md), tabela skrótów.
- **„Dlaczego po odświeżeniu egzamin się nie zgubił?”** → [04](04-nauka-w-aplikacji.md), część o egzaminie.
- **„Z jakich endpointów korzysta frontend?”** → [05](05-warstwa-api-i-dane.md), tabela wywołań.
- **„Jak podłączyć frontend do innego serwera?”** → [08](08-konfiguracja-i-uruchomienie.md).

## Podgląd z wyszukiwarką: `dokumentacja.html`

Plik [`dokumentacja.html`](dokumentacja.html) to **jedna strona**, którą otwiera się dwuklikiem w przeglądarce (nie
potrzebuje internetu ani serwera). Zawiera całą dokumentację frontendu i backendu, spis treści po lewej, wyszukiwarkę
(skrót `/` albo `Ctrl+K`), diagramy i tryb jasny i ciemny. Jest zbudowana z plików Markdown z tego katalogu i z katalogu
`docs/` backendu, więc po zmianie dokumentacji trzeba ją zbudować od nowa:

```bash
npm run docs:build
```

Polecenie wymaga, żeby repozytorium backendu leżało obok frontendu (katalog `port-be` obok `port-fe`). Inną lokalizację
podajesz parametrem: `node docs/tools/build-viewer.mjs --backend ../ścieżka/do/backendu/docs`. Szczegóły są w
[08](08-konfiguracja-i-uruchomienie.md).

## Pliki pomocnicze w tym katalogu

| Plik | Do czego |
|------|----------|
| `tools/check-docs.mjs` | Sprawdza, czy dokumentacja zgadza się z kodem (trasy, wywołania serwera, klucze przeglądarki, odnośniki). Uruchomienie: `npm run docs:check` |
| `tools/build-viewer.mjs` | Buduje `dokumentacja.html` z plików Markdown obu projektów |
| `tools/viewer/` | Szablon strony podglądu (HTML, style, skrypt) używany przez budowanie |
| `tools/package.json` | Zależności samego budowania podglądu (`marked`, `mermaid`, czcionka). Nie są częścią aplikacji |
| `dokumentacja.html` | Gotowy podgląd (wynik budowania). Nie edytuj go ręcznie |

## Konwencje w tej dokumentacji

- Nazwy z kodu (pliki, funkcje, klucze) są pisane `takim fontem`. Ścieżki podane są względem katalogu `src/`, chyba że
  zaczynają się od `docs/` albo od nazwy pliku w głównym katalogu projektu.
- „Użytkownik” to zalogowane konto. „Administrator” to konto z rolą `ADMIN`.
- „Fiszki” z wielkiej litery to ekran i dział aplikacji; „fiszka” z małej to pojedyncza karta do nauki.
- Diagramy są w formacie Mermaid. GitHub i większość edytorów Markdown rysuje je automatycznie; w `dokumentacja.html`
  rysują się zawsze.
- Teksty widoczne dla użytkownika są po polsku, a kod, nazwy plików i zmiennych po angielsku.
