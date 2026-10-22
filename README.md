# Gradus iuris: frontend

Strona internetowa aplikacji **Gradus iuris**: darmowej nauki do egzaminów na aplikacje prawnicze i dla studentów prawa. Wybierasz
ścieżkę (jedną z pięciu aplikacji albo Student), rozwiązujesz pytania ABC (dokładnie jedna poprawna odpowiedź) i uczysz się z
fiszek, a algorytm FSRS-6 po stronie serwera sam układa powtórki.

To aplikacja jednostronicowa napisana w React 19, TypeScript, Vite 8 i Tailwind CSS 4. Serwer (Java, Spring) leży w
osobnym repozytorium `gradusiuris-backend`.

## Szybki start

Potrzebny jest Node.js w wersji `^20.19` albo `22.12` i nowszej oraz uruchomiony backend (domyślnie
`http://localhost:8080`).

```bash
npm ci          # instaluje dokładnie te wersje bibliotek, które są w package-lock.json
npm run dev     # serwer deweloperski: http://localhost:5173
```

Port 5173 jest ważny: lokalny backend (profil `dev`) dopuszcza w CORS właśnie ten adres.

## Polecenia

| Polecenie | Co robi |
|-----------|---------|
| `npm run dev` | Serwer deweloperski |
| `npm run build` | Sprawdza typy i buduje wersję produkcyjną do `dist/` |
| `npm run preview` | Uruchamia zbudowaną wersję lokalnie |
| `npm run lint` | Sprawdza kod regułami ESLint |
| `npm run deploy` | Buduje i wysyła stronę na AWS (S3 + CloudFront), patrz `docs/08` |
| `npm run docs:check` | Sprawdza, czy dokumentacja zgadza się z kodem |
| `npm run docs:build` | Buduje `docs/dokumentacja.html` (frontend i backend w jednym pliku z wyszukiwarką) |

Adres backendu to zmienna `VITE_API_BASE_URL` w plikach `.env.development` (lokalnie, `http://localhost:8080`) i
`.env.production` (build na serwer, `https://api.gradusiuris.pl`). Opcjonalne usługi (Cloudflare Turnstile, Google Analytics,
Sentry) włączają zmienne `VITE_TURNSTILE_SITE_KEY`, `VITE_GA_MEASUREMENT_ID` i `VITE_SENTRY_DSN`; opis w `docs/08`.

## Dokumentacja

Cała dokumentacja jest po polsku w katalogu [`docs/`](docs/README.md):

- **[`docs/dokumentacja.html`](docs/dokumentacja.html)**: jedna strona do otwarcia dwuklikiem w przeglądarce, z
  dokumentacją frontendu i backendu, spisem treści, wyszukiwarką (klawisz `/` albo `Ctrl+K`), diagramami i trybem
  jasnym i ciemnym. Najwygodniejszy sposób czytania.
- [`docs/README.md`](docs/README.md): spis treści dokumentacji frontendu w Markdown (architektura, routing, logowanie i
  sesja, nauka, warstwa API, wygląd, strona główna, konfiguracja, słownik, znane ograniczenia).

Po zmianie kodu albo opisów uruchom `npm run docs:check`, a po zmianie plików Markdown w `docs/` także
`npm run docs:build`, żeby podgląd `dokumentacja.html` był aktualny. `docs:build` wymaga, żeby repozytorium backendu
leżało obok frontendu (katalog `gradusiuris-backend` obok `gradusiuris-frontend`).

## Przed wdrożeniem na prawdziwy serwer

Zostały rzeczy wymagające Twojej decyzji (m.in. dane administratora w regulaminie i przegląd prawnika). Pełna lista jest w
[`docs/10-znane-ograniczenia.md`](docs/10-znane-ograniczenia.md).
