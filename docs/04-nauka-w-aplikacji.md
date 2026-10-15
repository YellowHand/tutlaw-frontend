# 04. Nauka w aplikacji

[← Spis treści](README.md)

To najważniejszy dokument frontendu: opisuje, co dzieje się na ekranie podczas nauki. Przypominam podział pracy:
**frontend pokazuje i zbiera odpowiedzi, a o tym, kiedy pytanie wróci, decyduje serwer** (algorytm FSRS-6; jego opis jest
w dokumentacji backendu, rozdział „Nauka: testy, fiszki, FSRS”). Dlatego tu nie ma żadnych wzorów ani dat powtórek,
są tylko ekrany, stany i reguły interfejsu.

## Dwa rodzaje kart i trzy rodzaje sesji

| | Pytanie testowe (Testy) | Fiszka (Fiszki) |
|---|---|---|
| Wygląd | Pytanie i trzy odpowiedzi A, B, C, dokładnie jedna poprawna | Przód z pytaniem, po kliknięciu tył z odpowiedzią |
| Kto ocenia | Serwer (porównuje wybraną odpowiedź z poprawną) | Użytkownik, czterema przyciskami |
| Pole „Nie jestem pewien” | Tak | Nie dotyczy |
| Plik sesji | `pages/TestSessionPage.tsx` | `pages/StudySessionPage.tsx` |
| Skąd się biorą | Z materiału (Testy) | Z błędów w testach i z „Dodaj do fiszek” |

Fiszki **zaczynają puste**: każde pytanie testowe ma w bazie własną fiszkę, ale użytkownik dostaje ją dopiero po
**pewnym błędzie** w teście (błędna odpowiedź bez „Nie jestem pewien”) albo po kliknięciu „Dodaj do fiszek”.

## Sesja testowa (`TestSessionPage`)

### Pięć trybów tej samej strony

Ta sama strona obsługuje pięć trybów (parametr `mode`, ustawiany w `app/router.tsx`):

| Tryb | Adres | Skąd pytania | Co jeszcze |
|------|-------|--------------|------------|
| `scope` (domyślny) | `/app/test`, `/app/test/:subjectId` (`?sourceId=`, `?categoryId=`) | `GET /api/review/test-queue` (zaległe + dzienna porcja nowych) | Informacja o zaległościach, „Rozwiąż jeszcze”, „Powtórz jeszcze” |
| `due` | `/app/test/due` | To samo, ale z `extraNewCards=0`: same zaległe, bez nowych | Jak wyżej; gdy nic nie zalega, ekran „Nie masz zaległych powtórek” |
| `mistakes` | `/app/test/mistakes` | `GET /api/review/mistakes-queue` | Zamknięta lista, bez dokładania nowych |
| `practice` | `/app/test/practice?cardIds=1,2,3` | `GET /api/review/practice-queue` | Zamknięta lista (np. błędy z egzaminu); numery z adresu: tylko dodatnie liczby całkowite, bez powtórzeń, do 200 |
| `custom` | `/app/test/custom?cardIds=1,2,3` | `GET /api/review/practice-queue` | To samo co `practice`, ale numery pochodzą z ekranu „Własny test”; własne podpisy („Własny test”, „Brawo! Własny test zakończony.”), a przycisk powrotu prowadzi do ekranu układania |

W trybach `mistakes`, `practice` i `custom` (lista zamknięta) nie ma informacji o zaległościach ani przycisku „Rozwiąż
jeszcze”, a przycisk powrotu prowadzi do Testów (dla `practice` do Egzaminu, dla `custom` do ekranu „Własny test”).

### Przebieg jednego pytania

```mermaid
stateDiagram-v2
    [*] --> Pytanie
    Pytanie --> Wysyłanie: wybór A, B lub C<br/>(kliknięcie albo klawisz)
    Pytanie --> Pytanie: G / przełącznik<br/>„Nie jestem pewien"
    Wysyłanie --> Wynik: serwer odpowiada
    Wysyłanie --> Pytanie: błąd sieci<br/>(komunikat, można spróbować znowu)
    Wynik --> Pytanie: „Dalej" / Enter<br/>(następne pytanie)
    Wynik --> Koniec: „Zakończ test"<br/>(ostatnie pytanie)
    Koniec --> [*]
```

1. Użytkownik widzi pytanie, trzy odpowiedzi i przełącznik **„Nie jestem pewien”** (skrót `G`). Przełącznik zaznacza się
   **przed** odpowiedzią i znika po jej wybraniu. Gdy to jego **pierwsze pytanie w życiu** (`testAnswers === 0` w ustawieniach
   interfejsu), pod przełącznikiem stoi jednorazowa podpowiedź „Zaznacz, jeśli zgadujesz. Takie pytanie wróci szybciej, nawet
   przy dobrej odpowiedzi.” (`data-testid="guess-hint"`); po pierwszej odpowiedzi licznik rośnie i podpowiedź już się nie pokazuje.
   Nad pytaniem, obok strzałek podglądu, jest mały [licznik czasu](#licznik-czasu-przy-pytaniu).
2. Wybór odpowiedzi blokuje pozostałe i wysyła `POST /api/review/test-answer` z numerem karty, wybraną opcją (A, B lub C), czasem
   odpowiedzi w sekundach, znacznikiem `guessed` i (w sesji własnego testu) numerem sesji `sessionId`. Czas liczy się od
   pokazania pytania, ale tylko przy widocznej karcie przeglądarki, a podgląd poprzednich pytań go wstrzymuje. Odpowiedź
   serwera niesie też `newQuestion` (czy to pierwsze zobaczenie tego pytania), z czego frontend liczy „nowe pytania w tej sesji”.
3. Odpowiedź serwera (`TestAnswerResult`) steruje wynikiem:
   - poprawna odpowiedź podświetla się na zielono, wybrana błędna na czerwono, pozostałe wyszarzają;
   - nagłówek „Poprawnie!” albo „Niepoprawnie” i zdanie o zapisanej ocenie (tabela niżej);
   - wyjaśnienie (jeśli jest), podstawa prawna i data stanu prawnego (`LegalBasisLine`);
   - podpowiedź o trudnym pytaniu, jeśli `leech` jest prawdą (patrz niżej);
   - informacja o fiszce: „Dodałem fiszkę do tego pytania w Fiszkach.” przy pierwszym pewnym błędzie.
4. Pod wynikiem są przyciski: **Dodaj do fiszek / Usuń z fiszek**, **Ukryj** (tylko administrator),
   **Zawieś pytanie** (tylko przy trudnym pytaniu) oraz **Dalej** albo **Zakończ test**. **Zgłoś błąd** leży w prawym górnym
   rogu panelu wyniku i pojawia się dopiero po odpowiedzi (patrz [Zgłoś błąd](#zgłoś-błąd)).
5. Gdy zapis się nie uda (np. brak internetu), odpowiedzi odblokowują się i pojawia się komunikat „Nie udało się zapisać
   odpowiedzi. Spróbuj ponownie.”: nic nie przepada.

Jaką ocenę zapisuje serwer, pokazuje zdanie w panelu wyniku (to, co widzi użytkownik, a nie osobna logika frontendu):

| Wynik | „Nie jestem pewien” | Zdanie w panelu | Skutek |
|-------|---------------------|-----------------|--------|
| poprawna | nie | „Zapisano jako „Znam”.” | Pytanie wraca po dłuższej przerwie |
| poprawna | tak | „Zaznaczone jako niepewne: zapisano jako „Nie pamiętam”, pytanie wróci w powtórkach.” | Wraca szybko |
| błędna | nie (pewny błąd) | „Zapisano jako „Nie pamiętam”…” + informacja o fiszce | Wraca szybko, a fiszka trafia do Fiszek |
| błędna | tak | „Zapisano jako „Nie pamiętam”…” | Wraca szybko, bez fiszki |

### Mieszanie odpowiedzi

Domyślnie kolejność odpowiedzi A, B, C jest losowana przy każdym ułożeniu kolejki, żeby użytkownik uczył się treści, a nie
pozycji („zawsze B”). Zasady (`features/tests/shuffle.ts`):

- Litery A, B, C na ekranie to **pozycje**. Serwer zna odpowiedzi pod oryginalnymi kluczami, więc przed wysłaniem litera z
  ekranu jest zamieniana z powrotem (`originalKeyOf`), a poprawna odpowiedź z serwera jest przeliczana na pozycję
  (`displayKeyOf`).
- Pytania, w których odpowiedzi odwołują się do siebie („A i B”, „Żadna z powyższych”, „Obie odpowiedzi są poprawne”,
  „odpowiedź B”), **zostają w oryginalnej kolejności**. Wykrywanie jest ostrożne: lepiej raz nie wymieszać, niż
  wymieszać pytanie, które przestaje mieć sens.
- Ustawienie „Mieszaj kolejność odpowiedzi w testach” jest w Koncie (`shuffleOptions`) i jest pobierane razem z kolejką;
  gdy nie uda się go pobrać, odpowiedzi są mieszane.
- **Egzamin próbny nie miesza odpowiedzi** (zawsze kolejność z bazy).

### Cofanie (podgląd)

Strzałki `←` i `→` (albo przyciski nad pytaniem) pozwalają obejrzeć poprzednie pytania tej sesji w trybie tylko do odczytu
z oznaczeniem „Podgląd”. Historia siedzi **tylko w pamięci strony**: niczego nie wysyła do serwera i znika po wyjściu z
sesji. Z podglądu wraca się przyciskiem „Kontynuuj” (albo „Wróć do podsumowania”).

### Koniec sesji

Ekran „Brawo!” pokazuje liczbę poprawnych odpowiedzi i, zależnie od sytuacji:

| Przycisk | Kiedy | Co robi |
|----------|-------|---------|
| **Powtórz teraz (N)** | Są pytania błędne albo z „Nie jestem pewien” (poza zawieszonymi w tej sesji) | Zaczyna od razu drugi przebieg przez te pytania. Każda odpowiedź jest znowu wysyłana do serwera |
| **Powtórz jeszcze N pytań** | Serwer mówi, że część zaległości nie zmieściła się w dziennym limicie (`deferred > 0`) | Dokłada kolejną porcję zaległych ponad limit: `N = min(20, zaległe)` |
| **Rozwiąż jeszcze N pytań** | Są jeszcze nowe pytania do dołożenia | Dokłada nowe pytania: `N = min(10, dostępne)` |
| **Wróć do Testów** | zawsze | Powrót do listy |
| **Przejrzyj odpowiedzi** | Sesja miała odpowiedzi | Wejście w podgląd |

Dodatkowe porcje („Rozwiąż jeszcze”, „Powtórz jeszcze”, „Powtórz teraz”) są traktowane jak nowa, mniejsza sesja: informacja o
zaległościach z początku znika, bo jej już nie dotyczy.

**Podsumowanie sesji** (`features/review/SessionSummary.tsx`, `data-testid="session-summary"`) stoi na ekranie „Brawo!” pod
wynikiem, w testach i w fiszkach. Ma najwyżej dwa zdania: „Nowe pytania w tej sesji: N” (w fiszkach „Nowe fiszki w tej sesji: N”;
liczone z `newQuestion` / `newCard` z odpowiedzi serwera, pokazywane tylko gdy N > 0) i „Jutro wróci N powtórek.” albo „Na jutro nie
masz żadnych powtórek.” (`GET /api/review/due-tomorrow?mode=TEST|FLASHCARD`, liczba powtórek wypadających do końca jutra, razem z tymi, które czekają już teraz). Błąd
pobrania liczby jutrzejszych powtórek nie psuje ekranu: ten wiersz po prostu się nie pokazuje.

## Sesja fiszek (`StudySessionPage`)

```mermaid
stateDiagram-v2
    [*] --> Przód
    Przód --> Tył: kliknięcie karty / Spacja / Enter
    Tył --> Zapis: ocena 1–4 (przycisk albo klawisz)
    Zapis --> Przód: następna karta
    Zapis --> Tył: błąd zapisu (można ocenić jeszcze raz)
    Zapis --> Koniec: ostatnia karta
    Koniec --> [*]
```

- Kolejka to `GET /api/review/queue` (zaległe fiszki od tych, które najłatwiej zapomnieć, plus dzienna porcja nowych).
- Karta ma **przód** (pytanie) i **tył** (odpowiedź), a odwracanie to animacja 3D (obrót o 180°). Strona, która jest
  schowana, ma `aria-hidden`, żeby czytnik ekranu czytał tylko widoczną.
- Cztery oceny, wysyłane przez `POST /api/review` jako liczby 1–4:

| Klawisz | Przycisk | Liczba | Kolor |
|---------|----------|--------|-------|
| 1 | Nie pamiętam | 1 | czerwony |
| 2 | Trudne | 2 | pomarańczowy |
| 3 | Znam | 3 | zielony |
| 4 | Łatwe | 4 | złoty (kolor akcentu) |

- **„Nie pamiętam” (1) odkłada kartę na koniec tej samej sesji**, zamiast czekać do następnego dnia. Pod pytaniem pojawia się
  wtedy oznaczenie, że to powtórka. Wyjątek: karta zawieszona w tej sesji nie wraca.
- Jeśli zapis oceny się nie uda, karta zostaje na ekranie z odkrytą odpowiedzią i komunikatem; można ocenić ją jeszcze raz.
- Koniec sesji i przyciski dodatkowe działają jak w teście: „Ucz się jeszcze N fiszek” (max 10 nowych), „Powtórz jeszcze N fiszek”
  (zaległe ponad limit, max 20), „Wróć do Fiszek”, „Przejrzyj powtórki”.
- Pod kartą są przyciski pomocnicze „Zawieś” (przy trudnej fiszce) i „Ukryj” (administrator). „Zgłoś błąd” leży w prawym
  górnym rogu **odwróconej** karty (dopiero po odsłonięciu odpowiedzi), tak samo jak w teście.
- Nad kartą jest ten sam mały [licznik czasu](#licznik-czasu-przy-pytaniu); w fiszkach pokazuje czas do odsłonięcia odpowiedzi,
  a na serwer z oceną idzie łączny czas od pokazania karty do oceny (`timeSpentSeconds`, też tylko przy widocznej karcie). Odpowiedź na ocenę niesie `newCard`
  (pierwsze zobaczenie fiszki), z czego powstaje „Nowe fiszki w tej sesji” na ekranie końcowym.

## Skróty klawiszowe

Skróty działają na całym oknie, ale **nie** wtedy, gdy użytkownik pisze w polu tekstowym, gdy trzyma `Ctrl`, `Alt` albo
`Cmd`, ani w obszarach oznaczonych `data-no-shortcuts` (formularz zgłoszenia, przyciski pomocnicze). Reguła jest w
`features/review/keyboard.ts` (`isTyping`). Podpowiedź skrótów (`KeyboardHint`) pokazuje się tylko na szerokich ekranach (od `md`);
na telefonie jej nie ma, a klawiatury i tak nie ma (przy ocenach fiszek i odpowiedziach testu cyfry i litery zostają na
samych przyciskach).

| Ekran | Klawisze | Działanie |
|-------|----------|-----------|
| Test | `A` `B` `C` albo `1` `2` `3` | Wybór odpowiedzi |
| Test | `G` | Przełączenie „Nie jestem pewien” (przed odpowiedzią) |
| Test | `Enter` | Następne pytanie (po odpowiedzi) |
| Test, fiszki | `←` `→` | Poprzednie i następne (podgląd) |
| Fiszki | `Spacja` albo `Enter` | Odsłonięcie odpowiedzi |
| Fiszki | `1` `2` `3` `4` | Ocena |
| Egzamin | `A` `B` `C` albo `1` `2` `3` | Wybór odpowiedzi (ponowny wybór tej samej ją odznacza) |
| Egzamin | `←` `→` | Poprzednie i następne pytanie |
| Egzamin | `F` | Oznaczenie pytania „do sprawdzenia” |

W fiszkach, gdy widać przyciski ocen albo podgląd, `Spacja` jest zablokowana i niczego nie robi (żeby nie oceniać przez
przypadek).

### Podpowiedź skrótów: kiedy znika

Podpowiedź (`features/review/KeyboardHint.tsx`) jest dla początkujących, więc po nauczeniu się skrótów ustępuje:

- **Znika sama po 10 odpowiedziach**, osobno w testach (`testAnswers`) i w fiszkach (`flashcardReviews`). Liczy serwer na koncie,
  więc nie wraca na innym urządzeniu; frontend po każdej zapisanej odpowiedzi zwiększa swoją kopię licznika
  (`useCountAnswer`), żeby podpowiedź zniknęła od razu po dziesiątej, bez kolejnego zapytania.
- Mały przycisk **„×”** obok podpowiedzi chowa ją na stałe w danym trybie (`PUT /api/me/interface`: `testHintHidden` albo
  `flashcardHintHidden`). Ukrycie działa od razu, nawet gdy zapis na koncie się nie uda.
- Klawisz **`?`** (albo mały okrągły przycisk „?” w miejscu podpowiedzi) pokazuje ją z powrotem **na chwilę**: w tej wizycie
  na ekranie, z przyciskiem zamknięcia. Nie zmienia to zapisanego ustawienia.
- **W Koncie nie ma przełącznika** tej podpowiedzi: celowo, żeby nie rozbudowywać ustawień. Przy braku odpowiedzi serwera
  (`GET /api/me/interface` zwraca błąd) frontend niczego nie chowa, bo lepiej pokazać podpowiedź niż ją zgubić.
- Same skróty działają zawsze, niezależnie od tego, czy podpowiedź jest widoczna. Cyfry **1–4** na przyciskach ocen fiszek i litery
  **A, B, C** na odpowiedziach zostają na przyciskach.

## Licznik czasu przy pytaniu

Przy każdym pytaniu testowym i każdej fiszce stoi mały, dyskretny licznik („0:07”, „1:15”; `QuestionTimer`, `data-testid="question-timer"`).
Pokazuje, ile użytkownik myśli nad tym pytaniem.

- **Liczy tylko przy widocznej karcie przeglądarki** (`useQuestionClock` + `QuestionClock`): po przełączeniu na inną kartę stoper
  staje, po powrocie rusza dalej. Zatrzymuje go też odpowiedź, podgląd poprzednich pytań i ekran końcowy. Nowe pytanie albo nowa
  porcja pytań („Powtórz teraz”) zaczyna od zera.
- **Ten sam czas idzie na serwer** z odpowiedzią (`timeSpentSeconds`) i jest podstawą statystyki „średni czas na pytanie”.
- **Kliknięcie licznika go chowa**, a kliknięcie samej ikony pokazuje go z powrotem. Ukrycie zapisuje się na koncie
  (`PUT /api/me/interface`, pole `questionTimerHidden`), więc obowiązuje na każdym urządzeniu. Domyślnie licznik jest widoczny.
  Chowanie nie zatrzymuje pomiaru: serwer dostaje czas także wtedy, gdy licznik jest schowany.
- Czytnik ekranu nie odczytuje kolejnych sekund (czas w przycisku jest `aria-hidden`); przycisk ma opis „Ukryj licznik czasu” /
  „Pokaż licznik czasu”. Przycisk ma wysokość jak sąsiednie strzałki (44 px na telefonie), żeby rząd się nie przesuwał.

## Czas nauki

To **osobna miara** od czasu odpowiedzi na pojedyncze pytanie: ile w sumie użytkownik spędził na nauce, razem z czytaniem wyjaśnień
i zastanawianiem się między pytaniami. Mierzy go `StudyTimeTracker` (w `AppShell`, `features/studytime`), a pokazuje sekcja
„Podsumowanie nauki” w Statystykach.

- Liczy, **gdy bieżący ekran jest ekranem nauki** (`isStudyPath` w `config/navigation.ts`: testy, powtórki, błędy, własny test,
  fiszki i egzamin), karta przeglądarki jest widoczna i w ciągu ostatnich **3 minut** był jakiś ruch (mysz, klawisz, dotyk,
  przewijanie). Po 3 minutach bez ruchu liczenie pauzuje do następnego ruchu.
- Czysta klasa `StudyTimeMeter` nie dotyka przeglądarki, więc jej zasady da się sprawdzić na zmyślonym zegarze. Jedno tyknięcie
  nie doliczy więcej niż 2 sekundy: po uśpieniu komputera nie dopisują się godziny.
- Zebrane sekundy idą na serwer co około **30 sekund** (`POST /api/me/study-time`, najwyżej 300 s w jednym zgłoszeniu), przy
  wyjściu z ekranu nauki i przy zamknięciu strony (`pagehide`, żądanie `keepalive`, `api/keepalive.ts`). Gdy wysłanie się nie
  uda, sekundy wracają do licznika (najwyżej godzina) i idą przy następnym zgłoszeniu. Serwer zapisuje je w podziale na dni.

## Zaległości i dzienny limit

Serwer ogranicza liczbę zaległych powtórek na dzień (limit użytkownika, osobny dla fiszek i testów). Frontend tylko to
pokazuje (`features/review/useBacklog.ts`, `BacklogNotice.tsx`):

- Na początku sesji, jeśli `deferred > 0`: „Na dziś najpilniejsze: zaczynasz od tego, co najłatwiej zapomnieć. Jeszcze N
  zaległych powtórek poczeka na kolejne dni.” (nie pokazuje się w dodatkowych porcjach, w podglądzie ani w listach zamkniętych).
- Na końcu sesji dane są pobierane od nowa, a komunikat „Dzienny limit zaległych powtórek wykonany…” zawiera przycisk
  „Powtórz jeszcze”.
- Zapytanie o zaległości **zawsze jest świeże** (bez pamięci podręcznej), nie ponawia się, a jego błąd nie przeszkadza w
  nauce: po prostu nie pokazuje się informacja o zaległościach.

## Fiszka z pytania: „Dodaj do fiszek”

Odpowiedź serwera niesie stan fiszki tego pytania (`FlashcardStatus`):

| Stan | Znaczenie | Co widać pod odpowiedzią |
|------|-----------|--------------------------|
| `UNAVAILABLE` | Pytanie nie ma widocznej fiszki | Nic |
| `AVAILABLE` | Fiszkę można dodać | Przycisk **Dodaj do fiszek** |
| `ADDED_MANUALLY` | Użytkownik sam ją dodał | „W fiszkach” i przycisk **Usuń z fiszek** (cofnięcie) |
| `ADDED_BY_MISTAKE` | Trafiła do Fiszek po pewnym błędzie | Zdanie w panelu wyniku; przycisku nie ma (tego nie da się cofnąć) |

Zmiany w tej sesji są pamiętane (`flashcardOverrides`), więc podgląd poprzednich pytań pokazuje aktualny stan. Po zmianie
odświeżane są liczniki (patrz [05](05-warstwa-api-i-dane.md)).

## Trudne pytania i zawieszanie

- Serwer oznacza pytanie jako **trudne** (`leech`), gdy liczba błędów osiągnie próg (domyślnie 8). Wtedy pod odpowiedzią
  pojawia się `LeechHint`: „To pytanie sprawia Ci trudność: pomyliłeś się w nim już N razy. Jeśli jest niejasne albo
  nieaktualne, zgłoś błąd. Możesz też zawiesić je na jakiś czas.”
- **Zawieś pytanie** (`SuspendCardButton`): `PUT /api/me/suspended-cards/{id}`. Pytanie znika z powtórek i testów, postęp
  zostaje. Przycisk zmienia tylko opis na „Zawieszone” i podpowiada „Przywrócisz je w Koncie.”
- W **Koncie** (`DifficultCardsCard`) są dwie listy: „Zawieszone” (z przyciskiem „Przywróć”) i trudne pytania, które nadal
  są w nauce (z przyciskiem „Zawieś”). Każda lista ma limit 200 pozycji (limit serwera). Po akcji lista się odświeża, a
  fokus przechodzi na nagłówek sekcji, z której wiersz zniknął.

## Zgłoś błąd

`ReportCardButton` otwiera **okno na środku ekranu** (`Dialog`), a nie formularz wstawiony pod pytaniem. Przycisk jest **tylko po
odpowiedzi**: w teście w prawym górnym rogu panelu wyniku (obok „Poprawnie!” / „Niepoprawnie”, poza obszarem `role="status"`,
żeby czytnik nie czytał go razem z wynikiem), w fiszkach w prawym górnym rogu odwróconej karty (`variant="corner"`). Przed
odpowiedzią go nie ma, bo wtedy użytkownik nie widzi jeszcze, co jest poprawne. W oknie: powód (cztery do wyboru: „Zaznaczona odpowiedź jest błędna”, „Przepis się zmienił”,
„Literówka albo niejasne sformułowanie”, „Coś innego”; żaden nie jest zaznaczony z góry, a „Wyślij zgłoszenie” jest nieaktywne
bez wyboru) i komentarz do 1000 znaków (przy „Coś innego” wymagany). Wysyła `POST /api/cards/{id}/reports`.

- Esc, „Anuluj” i kliknięcie w tło zamykają okno; **kliknięcie w tło nie zamyka okna, gdy jest w nim wpisany komentarz**
  (nie ginie od przypadkowego kliknięcia). Każde otwarcie zaczyna od pustego formularza.
- Po wysłaniu okno pokazuje podziękowanie („Dziękujemy! Zgłoszenie zapisane, sprawdzimy tę kartę.”) i przycisk „Zamknij”; po
  jego zamknięciu w miejscu przycisku zostaje informacja z fokusem, żeby fokus nie przepadł: w rogu panelu krótka „Zgłoszono.
Dziękujemy!”, a w wariancie pod kartą (`inline`) pełna „Zgłoszenie wysłane. Dziękujemy!”.
  Przy następnej karcie wszystko zaczyna od zera (`key={cardId}`).
- Jeśli użytkownik miał już otwarte zgłoszenie tego pytania, serwer je uzupełnia (`updated: true`) i okno mówi o tym osobnym
  zdaniem („Uzupełniliśmy Twoje wcześniejsze zgłoszenie tej karty. Dziękujemy!”).
- Błąd serwera pokazuje komunikat w oknie, które zostaje otwarte, z zachowanym wyborem i komentarzem; można ponowić.
- Skróty klawiszowe sesji nie działają, gdy okno jest otwarte (m.in. Enter w polu komentarza nie przechodzi do następnego pytania).

Zgłoszenia nie mają ekranu do przeglądania: administrator rozpatruje je w bazie.

## Ukrywanie kart (administrator)

`HideCardButton` jest widoczny tylko dla roli `ADMIN` (patrz [03](03-logowanie-i-sesja.md)). Wymaga potwierdzenia „Ukryć dla
wszystkich użytkowników?”, wysyła `PUT /api/cards/{id}/hidden` i odświeża liczniki oraz katalog. Karta znika wszystkim, a
historia zostaje. Przywrócenie jest tylko w bazie (nie ma przycisku).

## Filtr pochodzenia pytań

Znacznik „Pochodzenie pytań” (`features/tests/OriginFilterChip.tsx`) stoi przy tytule na wszystkich ekranach Testów, w
ustawieniach egzaminu i na ekranie „Własny test”. Pokazuje, co jest wybrane („wszystkie”, jedna lub dwie nazwy albo „3 z 6 pochodzeń”). Gdy filtr
coś zawęża, znacznik ma złotą ramkę i kropkę, a podpowiedź (atrybut `title` i tekst dla czytnika ekranu) podaje łączną
liczbę pytań. Kliknięcie otwiera okno z sześcioma polami wyboru (pięć aplikacji prawniczych i pytania autorskie, każde
z liczbą pytań).

- Trzeba zaznaczyć co najmniej jedno pochodzenie; „Zaznacz wszystkie” przywraca stan domyślny.
- Zapis: `PUT /api/me/origin-filter`. Filtr jest na koncie, więc działa też na innym urządzeniu.
- **Filtr stosuje serwer**: katalog Testów, kolejki, powtórki, błędy, własny test i egzamin. Frontend niczego nie filtruje u siebie, a
  po zapisie unieważnia tylko dane Testów (katalog, liczniki powtórek, błędów i własnego testu, ustawienia/plan). **Fiszek i statystyk
  filtr nie dotyczy.**
- Gdy filtr zawęża, puste pozycje katalogu mają napis „Brak w filtrze” zamiast „Wkrótce”.
- Gdy filtru nie uda się pobrać, znacznika po prostu nie ma, a Testy działają normalnie.

## Ustawienia nauki (Konto)

`features/settings/LearningSettingsCard.tsx` ↔ `GET` i `PUT /api/me/settings`.

| Pole | Zakres sprawdzany we frontendzie | Uwagi |
|------|----------------------------------|-------|
| Najwięcej nowych fiszek dziennie | liczba całkowita 0–200 | Domyślną wartość podaje serwer |
| Nowe pytania dziennie | „Automatycznie (zalecane)” albo „Własny limit” 0–500 | Patrz niżej: limit automatyczny |
| Najwięcej powtórek dziennie | 10–1000 | Osobno dla fiszek i testów; nadmiar czeka do jutra |
| Docelowa retencja | 70%–97% (lista: 80, 85, 90, 95, 97%) | Wartość spoza listy (ustawiona innym kanałem) jest dodawana do listy |
| Mieszaj kolejność odpowiedzi | pole wyboru | Domyślnie włączone |

- Wartość równa domyślnej jest wysyłana jako `null` („użyj domyślnej serwera”), więc późniejsza zmiana domyślnych wartości na serwerze
  obejmie takiego użytkownika. Wyjątek: **limit nowych pytań** ma dwa tryby, a `null` oznacza tu „Automatycznie”; własny limit, także
  równy domyślnemu (40), wysyłany jest jako liczba.
- **Limit nowych pytań: automatyczny albo własny.** Po co jest limit: żeby nowe pytania nie wypierały powtórek (każde nowe
  pytanie wraca później kilka razy). „Automatycznie” (zalecane, nic nie trzeba ustawiać) to co najmniej 40 dziennie, a gdy wybrana
  aplikacja ma termin, limit idzie za planem: tyle nowych pytań, ile trzeba, żeby zdążyć przed ostatnimi dwoma tygodniami, ale
  **nie więcej niż 100** (`maxTestQuestionsPerDay` z planu). „Własny limit” obowiązuje wprost (0–500). Obliczenia robi serwer od
  stanu z początku dnia, więc limit nie zmienia się w trakcie dnia. Ustawienia zwracają limit obowiązujący teraz
  (`newTestQuestionsPerDay`) i znacznik `newTestQuestionsAuto`.
- **Uczciwy komunikat zamiast „podnieś limit”** (`LimitNotice`, reguły w `newQuestionsLimit.ts`; ten sam na Pulpicie i w Koncie,
  w Koncie bez linku do samego siebie): (a) własny limit niższy niż potrzeba, a potrzeba mieści się w maksimum: „Zmień go w
  Ustawieniach albo wybierz limit automatyczny”; (b) potrzeba więcej niż maksimum: „Wszystkich nowych pytań nie zdążysz zacząć
  przed ostatnimi dwoma tygodniami…”, bez prośby o podniesienie limitu (to nic by nie dało), z podpowiedzią zawężenia zakresu
  filtrem pochodzenia; przy limicie automatycznym dopisek „Limit ustawiliśmy na 100.”; (c) własny limit co najmniej tak duży jak potrzeba: brak
  komunikatu.
- **Egzamin.** Użytkownik nie wpisuje już własnej daty. W sekcji „Egzamin” (testid `exam-choice-settings`) wybiera aplikację,
  do której się przygotowuje („Aplikacja, do której się przygotowuję”, przycisk „Wybierz egzamin” albo „Zmień egzamin”), a
  termin ustawia administrator (niżej). Wybór woła `PUT /api/me/exam` (`chooseExam`, hook `useChooseExam` w
  `features/settings/examChoice.ts`). **Backend przy tym jednorazowo ustawia filtr pochodzenia** na wybraną aplikację i pytania
  autorskie, więc po wyborze frontend unieważnia także filtr pochodzenia, katalog Testów, liczniki powtórek i błędów oraz liczniki
  Własnego testu. Każdy kolejny wybór filtr nadpisuje; poza wyborem filtr zmienia się osobno.
- **Plan do egzaminu**: gdy wybrana aplikacja ma przyszły termin, serwer zwraca plan (ile nowych pytań i fiszek zostało, ile
  dni na ich zaczęcie, sugerowane limity dzienne), a sugerowane limity są tylko informacją (limit nowych pytań robi się sam w trybie „Automatycznie”).
- Ostatnie **14 dni** przed egzaminem serwer zostawia na same powtórki; to stąd bierze się `planningDays`
  (dni do egzaminu − 14, najmniej 0). W tym czasie cel nowych pytań wynosi 0, a Pulpit pokazuje „Ostatnie dwa tygodnie: skup
  się na powtórkach.” Plan jest tylko informacją, nie blokuje nauki, a górną granicą pozostaje dzienny limit.
- Po zapisie unieważniane są liczniki powtórek i statystyki, bo limity zmieniają liczbę powtórek na dziś.
- Przycisk „Wstaw wartości domyślne” tylko wypełnia formularz (limit nowych pytań wraca do „Automatycznie”); zapis wymaga „Zapisz ustawienia”.

### Terminy egzaminów (administrator)

`features/settings/ExamTermsCard.tsx` ↔ `GET /api/exam-terms`, `PUT /api/exam-terms/{origin}` (`api/examTerms.ts`,
hook `useExamTerms`). Karta w Koncie jest widoczna tylko dla administratora: rolę czyta `useIsAdmin()` z tokenu, ale to
tylko wygoda interfejsu, bo naprawdę chroni `403` z serwera. Dla każdej z pięciu aplikacji jest pole daty i przyciski
„Zapisz” oraz „Usuń termin”. Serwer odrzuca datę z przeszłości i oddaloną o więcej niż 3 lata; komunikat błędu jest pokazany
przy wierszu. Zmiana działa od razu u wszystkich, którzy wybrali daną aplikację, ale wyznaczone już terminy powtórek nie
są przeliczane wstecz.

## Okno startowe i wygląd strony

### Okno startowe (`features/onboarding/OnboardingDialog.tsx`)

`OnboardingGate` stoi w `AppShell` i czyta ustawienia nauki. Gdy `startChoiceMade` jest dokładnie `false` (nowe konto, które nie
zrobiło wyboru), otwiera okno modalne „Witaj w Tutlaw”. **Wybór jest obowiązkowy**: okno można zamknąć tylko wybierając aplikację
albo „Jestem studentem” i klikając „Zacznij naukę” (albo wylogowując się).

- Dwie grupy wyboru: „Do jakiego egzaminu się przygotowujesz?” (pięć aplikacji z wierszem terminu oraz szósta pozycja
  **„Jestem studentem / jeszcze nie wybrałem”**) i „Wygląd strony” (Ciemny zaznaczony z góry, Jasny). Z aplikacji biorą się
  odliczanie, plan dnia i zawężenie pytań w Testach (backend ustawia przy wyborze filtr pochodzenia na wybraną aplikację i
  pytania autorskie). **Student** nie ma aplikacji, terminu ani odliczania, a filtr pytań obejmuje wszystkie pochodzenia
  (`PUT /api/me/exam` z `{"student": true}`; w ustawieniach wtedy `startChoiceMade = true`, `examOrigin = null`). Tę samą
  pozycję ma lista „Aplikacja, do której się przygotowuję” w Koncie, więc wybór można zmienić.
- „Zacznij naukę” jest nieaktywne, dopóki nic nie wybrano, a pod przyciskiem stoi podpowiedź „Wybierz aplikację albo opcję dla
  studentów, żeby przejść dalej.” Okno nie ma przycisku zamknięcia, Esc i kliknięcie w tło nic nie robią (`Dialog` z `dismissible={false}`; gdyby
  przeglądarka mimo to zamknęła okno, otworzy się z powrotem).
- Wybór wyglądu działa od razu jako **podgląd** (zmienia całą stronę), ale niczego nie zapisuje. Zapis dzieje się dopiero po
  „Zacznij naukę”: najpierw `PUT /api/me/theme` (tylko gdy wygląd się zmienił), potem `PUT /api/me/exam`. Błąd któregokolwiek
  kroku zostaje w oknie jako komunikat z serwera i można ponowić (gdy zawiedzie zapis wyglądu, aplikacja nie jest wysyłana).
- Okno nie blokuje aplikacji, gdy nie wiadomo, czy wybór zrobiono: błąd pobrania ustawień, ładowanie albo odpowiedź bez
  `startChoiceMade` nie otwierają go. Konta, które aplikację już wybrały, nie widzą okna wcale; stare konta bez wyboru zobaczą je
  przy najbliższym wejściu do aplikacji.
- Okno jest `Dialog`em, więc skróty klawiszowe sesji pod nim nie działają, a fokus jest uwięziony w oknie.

### Wygląd: ciemny i jasny (`features/settings`)

- Karta „Wygląd” w Koncie (`AppearanceCard`, `ThemePicker`, `testid="appearance-card"`) ma dwie duże opcje z próbką koloru:
  Ciemny (domyślny) i Jasny („kolory papieru, jak w dokumentacji”). Wybór zapisuje się od razu na koncie
  (`PUT /api/me/theme`, hook `useChooseTheme`); strona przełącza się natychmiast, a przy błędzie zapisu wraca do poprzedniego
  wyglądu i pokazuje komunikat. Karta działa także wtedy, gdy ustawienia nauki się nie wczytały.
- **Źródłem prawdy jest konto.** `ThemeSync` (w `AppShell`) stosuje wygląd z ustawień, zapisuje jego kopię w przeglądarce
  (`tutlaw.theme.v1`, patrz [03](03-logowanie-i-sesja.md)) i przy opuszczeniu aplikacji przywraca ciemny. Skrypt w `index.html`
  ustawia jasny wygląd przed pierwszą klatką, ale tylko na ścieżkach `/app`; strona główna, logowanie i strony prawne są
  zawsze ciemne.
- Szczegóły kolorów w [06](06-wyglad-i-komponenty.md#paleta-kolorów-aplikacja).

## Własny test (`features/customTest`)

Sesja nauki ułożona przez użytkownika: wybiera rodzaje i akty prawne, rodzaj pytań (wszystkie, nowe, „Moje błędy”, zaległe) i liczbę
pytań. Opis ekranu jest w [02](02-routing-i-strony.md). Zasady:

- **To nauka, nie egzamin.** Nie ma progu, wyniku „zdał / nie zdał” ani zegara. Sesja kończy się zwykłym ekranem
  „Brawo! Własny test zakończony.”.
- **Odpowiedzi liczą się jak w zwykłym teście.** Idą przez `POST /api/review/test-answer` (z numerem sesji `sessionId`), dostają
  ocenę pamięci (FSRS), a błędne trafiają do „Moich błędów”.
- **Liczba pytań to tylko 10, 20, 50, 100 albo 150** (stała `COUNT_CHOICES`; serwer odrzuca inne liczby komunikatem
  „Wybierz liczbę pytań: 10, 20, 50, 100 albo 150.”). Nie ma pola „Inna liczba” ani wyboru lat egzaminu. Ekran pokazuje
  **tylko te liczby, które się mieszczą** w dostępnych pytaniach (`countOptions` w `selection.ts`): przy 35 pytaniach są 10 i 20,
  a na końcu „Wszystkie (35)”; przy mniej niż 10 pytaniach jest jedna opcja „Wszystkie (N)”. „Wszystkie (N)”, gdy N nie jest
  jedną z liczb, wysyła na serwer najmniejszą dozwoloną liczbę nie mniejszą niż N (dla N do 150), więc serwer daje tyle, ile jest.
- **Co jest wybrane domyślnie** (`pickCountOption`): zapamiętana liczba, a gdy jej nie ma wśród dostępnych, **największa
  dostępna nieprzekraczająca zapamiętanej** (kto prosił o 100, a ma 35 pytań, dostaje „Wszystkie (35)”). Bez zapamiętanego
  wyboru proponujemy 20. Zapamiętywane są rodzaj pytań i liczba (`customTestStorage.ts`).
- **Dwa kroki.** Ekran pyta serwer o liczby pytań (`GET /api/review/custom-test/counts`), a po „Rozpocznij test”
  losuje numery i **zapisuje sesję** (`POST /api/review/custom-test` zwraca `cardIds` i `sessionId`). Sesja
  `/app/test/custom?cardIds=…&sessionId=…` pobiera te pytania kolejką ćwiczeń.
- **Filtr pochodzenia obowiązuje automatycznie** (serwer), a drzewo wyboru pokazuje tylko działy, w których po filtrze
  jest co rozwiązywać. Zawieszone, ukryte i niedostępne pytania nie wchodzą do testu.
- **Dzienny limit nowych pytań go nie dotyczy.** Użytkownik sam wybiera, ile pytań chce rozwiązać.
- W podsumowaniu nad przyciskiem opis zakresu i rodzaju łączą się przecinkiem („Cały materiał, Wszystkie”), bez środkowych kropek.

### Moje testy

Każdy własny test jest **zapisywany w chwili startu**, nie dopiero po ukończeniu (`MyTestsPage`, `MyTestDetailPage`; adresy
`/app/custom-test/history` i `/app/custom-test/history/:id`, link „Moje testy” na ekranie układania; menu dalej świeci „Testy”).

- **Lista** (`GET /api/custom-tests/sessions`) pokazuje od najnowszego: oznaczenie „Ukończony” albo **„Nieukończony”**, wynik
  („poprawne / pytania”), nazwę zakresu, rodzaj pytań, datę i czas; przy nieukończonym też „odpowiedzi: N z M”. Test zaczęty
  i porzucony zostaje na liście. Gdy testów nie ma, jest zaproszenie „Ułóż test”.
- **Szczegóły** (`GET /api/custom-tests/sessions/{id}`): wynik, rodzaj pytań, data startu, liczba odpowiedzi (i ile z „Nie jestem
  pewien”), czas odpowiadania oraz lista pytań z odpowiedziami, wyjaśnieniami i oznaczeniem, jak poszły; przełącznik „Wszystkie /
  Błędne i bez odpowiedzi”. Do nieukończonego testu nie da się wrócić, ekran mówi o tym wprost. Gdy test nie istnieje albo nie
  należy do użytkownika, ekran pokazuje błąd z linkiem „Wróć do listy testów”.
- **„Ułóż ponownie z tymi ustawieniami”** otwiera ekran układania ze wstępnie zaznaczonymi tymi samymi działami, rodzajem pytań
  i liczbą (ustawienia jadą w stanie nawigacji, `CustomTestPrefill`). Działy, których już nie ma w drzewie (np. po zmianie
  filtra pochodzenia), są pomijane z komunikatem; komunikat jest też, gdy od tamtego czasu zmienił się filtr pochodzenia.
  Przycisk niczego nie uruchamia sam: użytkownik klika „Rozpocznij test”, więc powstaje nowa sesja.
- Do **Moich testów nie trafiają** zwykłe powtórki, „Popraw błędy” ani „Powtórz zaległe”; to osobne sesje.
- W Statystykach („Podsumowanie nauki”) liczba testów to liczba własnych testów, a egzaminy próbne są liczone osobno.

## Egzamin próbny (`features/exam`)

Egzamin ma **stały format**: zawsze **150 pytań** z całego dostępnego materiału, a zaliczenie jest od **100 punktów**
(1 punkt za poprawną odpowiedź, bez punktów ujemnych). Użytkownik niczego z tego nie wybiera: ani zakresu, ani liczby pytań,
ani progu. Pytania losuje serwer, a serwer też ocenia egzamin i sam ustala próg, więc frontend tylko wyświetla to, co dostał.
Ćwiczenie jednego działu to osobna funkcja, [Własny test](#własny-test-featurescustomtest), który niczego nie zalicza.

Egzamin ma trzy fazy na jednym adresie `/app/exam`: **ustawienia → przebieg → raport**. Nie zmienia harmonogramu powtórek
(odpowiedzi z egzaminu nie trafiają do FSRS), dopóki użytkownik nie przerobi błędów zwykłą sesją.

```mermaid
flowchart LR
    S["Ustawienia<br/>ExamSetup"] -->|"Rozpocznij egzamin<br/>POST /api/exams/start"| R["Przebieg<br/>ExamRunner"]
    R -->|"Zakończ i sprawdź albo koniec czasu<br/>POST /api/exams/submit"| W["Raport<br/>ExamResultView"]
    R -->|Porzuć| S
    W -->|"Nowy egzamin"| S
    W -->|"Przerób błędne i pominięte"| P["/app/test/practice"]
    S -->|"Wznów egzamin<br/>(szkic z przeglądarki)"| R
```

### Ustawienia

- **Format** pokazują dwa kafelki: „150 pytań z całego materiału” i „100 punktów do zaliczenia”. To opis, a nie pola
  formularza (stałe `EXAM_QUESTION_COUNT` i `EXAM_PASS_POINTS` w `features/exam/format.ts` służą tylko do wyświetlania;
  prawdziwy próg przychodzi z serwera).
- **Pochodzenie pytań:** znacznik filtra pochodzenia (jak w Testach) i informacja, ile pytań jest do wylosowania
  (z katalogu Testów, bez zawieszonych i z nieodblokowanych rozdziałów).
- **Limit czasu:** 1–600 minut albo „Bez limitu czasu”. Dopóki użytkownik nie ustawi własnego, czas jest równy liczbie pytań w
  minutach (minuta na pytanie, czyli 150 min). Prawdziwy czas egzaminu nie jest tu odtwarzany, to wybór użytkownika.
- Zapamiętywany jest tylko ostatnio użyty limit czasu (`tutlaw.exam.settings.v1`).
- **Mniej niż 150 pytań w materiale:** egzamin ma tyle pytań, ile jest, a próg jest proporcjonalnie niższy
  (100 z 150, w górę do pełnego punktu, np. 12 pytań to 8 punktów). Ekran uprzedza o tym przed startem.
- Obok przycisku „Rozpocznij egzamin” jest link „Chcesz poćwiczyć jeden dział? Ułóż własny test” do `/app/custom-test`.
- Pod formularzem jest **historia** ostatnich podejść (do 50; `GET /api/exams/history`): wynik, zakres, data, próg, czas.
  Podejścia sprzed stałego formatu zostają w historii: mają nazwę wybranego wtedy zakresu i próg w procentach (zob. „Raport”).

### Przebieg

- Serwer losuje pytania (`POST /api/exams/start`, bez ciała) i zwraca też próg w punktach (`passPoints`), a frontend od razu
  zapisuje **szkic** w przeglądarce. Termin końca
  (`deadlineMs`) jest liczony raz, przy starcie, więc czas płynie dalej także po odświeżeniu strony (jak na prawdziwym egzaminie).
- **Zegar** liczy od terminu końca, a nie od licznika: nie „dryfuje” i nie staje w ukrytej karcie. Czytniki ekranu dostają
  zapowiedzi przy 10, 5 i 1 minucie do końca (nie co sekundę). Ostatnia minuta jest czerwona.
- Użytkownik wybiera odpowiedzi, może **oznaczać pytania „do sprawdzenia”** i skakać po pytaniach przez paletę (lista numerów z
  oznaczeniem odpowiedzianych i oznaczonych) albo strzałkami. Ponowny wybór tej samej odpowiedzi ją odznacza.
- Gdy w materiale jest mniej niż 150 pytań, pod paskiem górnym jest informacja „Wylosowano N z 150 pytań” i o niższym progu.
- Każda zmiana zapisuje szkic. Zamknięcie karty w trakcie egzaminu pokazuje ostrzeżenie przeglądarki.
- **Zakończenie:** okno „Zakończyć egzamin?” podaje liczbę pytań bez odpowiedzi (liczą się jako błędne) i oznaczonych.
  „Porzuć egzamin” kasuje szkic bez oceniania.
- **Koniec czasu** kończy egzamin sam, dokładnie raz.
- **Wysłanie:** `POST /api/exams/submit` z limitem czasu, czasem trwania (ucięty do limitu i do 48 godzin), znacznikiem
  `timedOut` i odpowiedziami (pusta odpowiedź to `null`). Zakresu ani progu klient nie wysyła: ocenia serwer. **Szkic kasuje się dopiero po udanym wysłaniu**: przy
  błędzie ekran mówi, że odpowiedzi są zapisane w tej przeglądarce, i pozwala spróbować jeszcze raz.

### Wznawianie

Szkic ma numer wersji i adres konta właściciela. Przy wejściu na `/app/exam` aplikacja czyta go z pamięci i sprawdza kształt
danych: uszkodzony, nieznanej wersji albo cudzy (inne konto w tej przeglądarce) szkic jest po prostu pomijany. Szkic w wersji 1
(z czasów własnego zakresu i progu) da się wznowić: jego zakres i próg są odrzucane, bo ocenia serwer, a próg w punktach
bywa wtedy nieznany (ekran go po prostu nie pokazuje). Jeśli szkic jest
poprawny, ekran ustawień oferuje „Wznów egzamin” (a gdy czas minął, „Zakończ i sprawdź”) albo „Porzuć”.

### Raport

`ExamResultView`: werdykt „Zaliczony” lub „Niezaliczony”, wynik (poprawne / wszystkie i procent), próg w punktach
(„100 z 150 pkt”, z dopiskiem „Zabrakło N pkt do zaliczenia”, gdy zabrakło), czas, liczba odpowiedzi udzielonych i pominiętych,
zakres i data. Zaliczenie rozstrzyga serwer (`passed`: poprawne ≥ `passPoints`), frontend niczego nie przelicza.
Podejście **sprzed stałego formatu** (`passPoints: null`) ma w raporcie i w historii stary próg w procentach z liczbą
poprawnych odpowiedzi, której wtedy wymagał (`pointsNeeded`), i nazwę wybranego wtedy zakresu.
Dodatkowo: informacja o automatycznym zakończeniu po czasie, informacja o pytaniach, których nie dało się ocenić (usunięte
albo już niedostępne; nie wliczają się do wyniku), wyniki według źródeł (gdy źródeł jest więcej niż jedno) oraz przegląd
pytań z poprawnymi odpowiedziami, wyjaśnieniami i podstawą prawną (domyślnie tylko błędne, z przełącznikiem na wszystkie).
Przycisk **„Przerób błędne i pominięte”** otwiera zwykłą sesję testową z tych pytań (`/app/test/practice?cardIds=...`);
dopiero ta sesja zapisuje odpowiedzi w powtórkach.

## Statystyki i Pulpit

Ekrany statystyk tylko wyświetlają liczby policzone przez serwer. Frontend liczy sam wyłącznie rzeczy czysto prezentacyjne:
ograniczenie procentów do 0–100 i podział „opanowane / w nauce / nowe” z klamrami (`masterySplit` w
`features/statistics/originStats.ts`), 28 słupków aktywności i porównanie ostatnich 7 dni z poprzednimi (`selectors.ts`),
serię dni i liczbę odpowiedzi w tym tygodniu. Definicje liczb („Opanowane”, „Skuteczność”, „Pewne błędy”) są w dokumentacji
backendu, rozdział o statystykach.

**„Przerobione” a „opanowane”.** Pulpit pokazuje „Przerobione”: pytania, które miały choć jedną odpowiedź. „Opanowane” jest
w Statystykach i oznacza pytanie, którego stabilność w modelu FSRS przekracza 21 dni (backend: `MATURE_STABILITY_THRESHOLD`).
Przy odpowiedziach w terminie stabilność rośnie mniej więcej 2,3 → 11 → 46 dni, więc trzy poprawne odpowiedzi w terminie
(około dwóch tygodni nauki) wystarczą. Błędna odpowiedź albo „Nie jestem pewien” zwykle cofa pytanie do „W nauce”. W pierwszych
dwóch tygodniach „0 opanowanych” jest więc normalne, dlatego tej liczby nie ma na Pulpicie.
