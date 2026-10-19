# Gradus iuris: znak i pliki marki

[← Spis treści dokumentacji](../README.md)

W tym katalogu są gotowe pliki znaku: do wgrania na stronę, na telefon (ikona na ekranie głównym), do profili w mediach
społecznościowych i do dokumentów. Nic tu nie trzeba przerysowywać: wystarczy wybrać plik z tabeli poniżej.

## Który plik gdzie wgrać

| Do czego | Plik | Uwagi |
|----------|------|-------|
| Ikona karty w przeglądarce (favicon) | `public/favicon.svg` i `public/favicon.ico` (kopie: `svg/znak.svg`, `favicon.ico`) | Już podpięte w `index.html`. Czytelne nawet przy 16 px |
| Ikona na ekranie głównym iPhone'a | `public/apple-touch-icon.png` (kopia: `png/ikona-ios-180.png`) | Pełny złoty kwadrat; iOS sam zaokrągla rogi. Podpięta w `index.html`. Nazwa pod ikoną: „Gradus iuris” |
| Ikona na ekranie głównym Androida | `public/icon-192.png`, `public/icon-512.png` oraz `public/site.webmanifest` | Podpięte w `index.html`. Znak mieści się w „bezpiecznym polu”, więc nie zostanie obcięty przy okrągłych i zaokrąglonych maskach |
| Podgląd linku (Messenger, Facebook, LinkedIn, Slack, iMessage) | `png/social-podglad-linku-1200x630.png` (kopia: `public/og-image.png`) | Wymaga adresu strony: patrz „Podgląd linku po wdrożeniu” niżej |
| Awatar profilu (Instagram, Facebook, LinkedIn, X, TikTok, YouTube) | `png/social-awatar-zloty-1024.png` albo `png/social-awatar-ciemny-1024.png` | Znak leży w środku, więc okrągłe przycięcie go nie ucina. Złoty jest bardziej wyrazisty, ciemny spokojniejszy |
| Okładka X i LinkedIn | `png/social-okladka-x-linkedin-1500x500.png` | Tekst jest przesunięty w prawo: awatar na X zasłania lewy dolny róg |
| Okładka Facebooka | `png/social-okladka-facebook-1640x624.png` | Facebook przycina brzegi, dlatego treść jest bliżej środka |
| Nagłówek strony, prezentacje, PDF-y (ciemne tło) | `svg/poziomo-na-ciemnym.svg` (albo PNG o tej samej nazwie) | SVG jest wektorowy: skaluje się bez utraty ostrości |
| Dokumenty, faktury, wydruk (jasne tło) | `svg/poziomo-na-jasnym.svg` | |
| Okładki, pionowe układy, okładki w sklepach | `svg/pionowo-na-ciemnym.svg`, `svg/pionowo-na-jasnym.svg` | Znak nad napisem |
| Mało miejsca | `svg/sam-gradus-na-ciemnym.svg`, `svg/sam-gradus-na-jasnym.svg` | Znak i samo „Gradus” |
| Pieczątka, haft, grawer, druk jednokolorowy | `svg/jednokolorowe-biale.svg`, `svg/jednokolorowe-czarne.svg`, `svg/znak-jednokolorowy-*.svg` | Jeden kolor, stopnie wycięte w znaku (przezroczyste) |

Wszystkie pliki PNG mają przezroczyste tło, poza ikonami aplikacji i grafikami do mediów społecznościowych (te są
pełnymi kwadratami lub prostokątami, bo platformy nie lubią przezroczystości). W plikach SVG napisy są zamienione na
ścieżki, więc wyglądają tak samo na każdym komputerze, także bez zainstalowanych czcionek.

## Jak pisać nazwę

- **Pełna nazwa: „Gradus iuris”**: duże „G”, małe „iuris”, ze spacją. W tytułach, nagłówkach, stopce, mailach i regulaminie.
- **Skrót: „Gradus”**: w zdaniach, gdy nazwa pada często („Gradus zapisuje, co zgadłeś”).
- **Nie odmieniamy „iuris”**: „w Gradus iuris”, „konto w Gradus iuris”.
- **Nigdy**: „Gradus Iuris”, „GradusIuris”, „GRADUS IURIS” w tekście ciągłym. Wielkie „I” w czcionce Manrope wygląda jak
  małe „l” („Gradus luris”), a zlepek z wielką literą w środku czyta się źle.
- **Adres internetowy** zapisuje się małymi literami bez spacji (`gradusiuris`), ale to adres, a nie zapis nazwy.
- **Opis w profilach i sklepach:** „Testy z egzaminów na aplikacje prawnicze i fiszki z powtórkami.” (ten sam co w `index.html`).

## Znak i napis

- **Znak:** złoty kwadrat z zaokrąglonymi rogami i pięć stopni w ciemnym kolorze. Pięć stopni to pięć lat studiów;
  łacińskie *gradus* znaczy „stopień, krok”.
- **Napis:** „Gradus” czcionką **Manrope Bold**, „iuris” **Newsreader Medium Italic** w rozmiarze 1,12 raza większym,
  oba w tym samym kolorze tekstu. Odstęp między literami −0,025 em.
- **Układ poziomy:** znak i napis obok siebie, wysokość napisu 79% wysokości znaku, odstęp 21% wysokości znaku.
- **Pole ochronne:** wokół logo zostaw pusty margines równy połowie wysokości znaku.
- **Najmniejsze rozmiary:** znak 16 px, logo poziome 20 px wysokości (w nagłówku strony znak ma 28 px).
- **Czego nie robić:** nie rozciągać, nie obracać, nie zmieniać kolorów, nie dodawać cieni ani konturów, nie stawiać
  na tle o słabym kontraście (ciemne logo na ciemnym tle i odwrotnie), nie zmieniać kolejności stopni.

## Kolory marki

| Rola | Kolor |
|------|-------|
| Złoto (znak, przyciski) | `#d8b13a` |
| Stopnie w znaku (ciemny brąz) | `#211804` |
| Tło ciemne (strona główna, logowanie) | `#121214` |
| Tekst na ciemnym | `#f2efe9` |
| Tło jasne („papier”) | `#fbfaf6` |
| Tekst na jasnym | `#1b1a17` |

To te same wartości co w `src/index.css` (blok `@theme`, zmienne `--color-accent`, `--color-accent-fg`, `--color-canvas`,
`--color-fg`).

## Kształt znaku (gdyby trzeba było narysować go od nowa)

Płótno 32 × 32, kwadrat z promieniem rogów 10, wypełnienie `#d8b13a`. Stopnie to jeden wielokąt wypełniony `#211804`
o wierzchołkach:

```
7,24.5  7,21.3  10.6,21.3  10.6,18.1  14.2,18.1  14.2,14.9
17.8,14.9  17.8,11.7  21.4,11.7  21.4,8.5  25,8.5  25,24.5
```

W aplikacji ten sam kształt jest w `src/components/layout/Logo.tsx`.

## Podgląd linku po wdrożeniu

Obraz podglądu (`public/og-image.png`) jest gotowy i serwowany przez stronę, ale znaczniki `og:image` wymagają **pełnego
adresu**, którego jeszcze nie ma, więc nie są dodane. Po wdrożeniu dodaj do `<head>` w `index.html` (z prawdziwym adresem):

```html
<meta property="og:image" content="https://TWOJA-DOMENA/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

Facebook i LinkedIn zapamiętują podgląd linku. Po zmianie obrazu odśwież go w ich narzędziach (Sharing Debugger,
Post Inspector).

## Czego tu nie sprawdzono

Nazwy „Gradus iuris” i znaku nie sprawdzono w rejestrach znaków towarowych (UPRP, EUIPO/TMview) ani pod kątem dostępności
domen. Przed zgłoszeniem znaku lub zakupem domeny trzeba to zrobić, najlepiej z rzecznikiem patentowym.
