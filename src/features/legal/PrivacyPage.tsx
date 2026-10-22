import { LEGAL } from "../../config/legal";
import { LegalList, LegalPage, LegalSection } from "./LegalPage";

export function PrivacyPage() {
  return (
    <LegalPage title="Polityka prywatności" updatedAt={LEGAL.privacyUpdatedAt}>
      <LegalSection heading="1. Kto jest administratorem danych">
        <p>
          Administratorem Twoich danych osobowych jest {LEGAL.operatorName} (adres: {LEGAL.operatorAddress}, kontakt:{" "}
          {LEGAL.contactEmail}), prowadzący serwis {LEGAL.serviceName}.
        </p>
      </LegalSection>

      <LegalSection heading="2. Jakie dane przetwarzamy">
        <LegalList
          items={[
            "prywatny adres e-mail (login) i adres uczelniany (potwierdzenie konta, odzyskiwanie dostępu),",
            "hasło, które zapisujemy wyłącznie jako zaszyfrowany skrót (nie znamy Twojego hasła),",
            "dane o nauce: odpowiedzi w testach, oceny powtórek, terminy kolejnych powtórek, wybraną ścieżkę, akty prawne w puli i statystyki,",
            "datę akceptacji regulaminu,",
            "dane techniczne: adres IP używany krótkotrwale do ograniczania liczby prób logowania oraz w dziennikach błędów serwera,",
            "wynik sprawdzenia, czy formularz wypełnia człowiek (rejestracja, logowanie, reset hasła): w tym celu Cloudflare Turnstile otrzymuje adres IP i podstawowe informacje o przeglądarce; cały ruch do serwera aplikacji przechodzi też przez sieć Cloudflare, która odfiltrowuje ataki,",
            "dane statystyczne, wyłącznie za Twoją zgodą (Google Analytics): losowy identyfikator w pliku cookie, odwiedzane podstrony (bez parametrów w adresie), przybliżona lokalizacja (kraj, miasto), typ urządzenia i przeglądarki, czas wizyty,",
            "informacje o błędach aplikacji: rodzaj błędu, ślad techniczny, adres podstrony (bez parametrów), typ przeglądarki i system, czas oraz numer Twojego konta (liczba, np. „5”). Nie zawierają treści Twoich odpowiedzi, hasła ani adresu e-mail.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Po co i na jakiej podstawie">
        <LegalList
          items={[
            "świadczenie usługi: konto, nauka, planowanie powtórek, statystyki (art. 6 ust. 1 lit. b RODO),",
            "bezpieczeństwo serwisu i ochrona przed nadużyciami, np. zgadywaniem haseł i automatycznym zakładaniem kont przez roboty (art. 6 ust. 1 lit. f RODO, czyli nasz uzasadniony interes),",
            "statystyki odwiedzin, żeby ulepszać serwis (art. 6 ust. 1 lit. a RODO oraz art. 173 Prawa telekomunikacyjnego, czyli Twoja zgoda; możesz ją wycofać w każdej chwili),",
            "wykrywanie i naprawianie błędów w serwisie (art. 6 ust. 1 lit. f RODO, czyli nasz uzasadniony interes),",
            "obowiązki wynikające z przepisów, jeśli takie wystąpią (art. 6 ust. 1 lit. c RODO).",
          ]}
        />
        <p>Nie sprzedajemy danych i nie używamy ich do reklam. Nie podejmujemy decyzji, które wywołują wobec Ciebie skutki prawne wyłącznie automatycznie. Algorytm powtórek tylko ustala, kiedy pokazać Ci pytanie.</p>
      </LegalSection>

      <LegalSection heading="4. Komu możemy przekazać dane">
        <p>
          Dane przetwarzają wyłącznie podmioty, które pomagają nam prowadzić serwis, na podstawie umów powierzenia:
          dostawca hostingu ({LEGAL.hostingProvider}), dostawca poczty wychodzącej ({LEGAL.mailProvider}), dostawca ochrony przed robotami i atakami ({LEGAL.botProtectionProvider}) i dostawca
          narzędzia do wykrywania błędów aplikacji ({LEGAL.errorMonitoringProvider}) oraz, tylko jeśli wyrazisz zgodę na statystyki,
          dostawca analityki ({LEGAL.analyticsProvider}). Dane
          przekazujemy poza Europejski Obszar Gospodarczy tylko wtedy, gdy dostawca zapewnia odpowiednie zabezpieczenia
          prawne, o czym informujemy w tym miejscu.
        </p>
      </LegalSection>

      <LegalSection heading="5. Jak długo przechowujemy dane">
        <p>
          Przez czas, gdy masz konto. Po jego usunięciu dane kasujemy niezwłocznie, a ewentualne kopie zapasowe wygasają
          w ciągu {LEGAL.backupRetention}. Dzienniki techniczne przechowujemy nie dłużej niż {LEGAL.logsRetention}.
        </p>
      </LegalSection>

      <LegalSection heading="6. Twoje prawa">
        <p>Masz prawo do:</p>
        <LegalList
          items={[
            "dostępu do swoich danych i otrzymania ich kopii,",
            "sprostowania danych oraz ich usunięcia (usunięcia konta),",
            "ograniczenia przetwarzania i sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie,",
            "przeniesienia danych,",
            "wycofania zgody na statystyki w dowolnym momencie (link „Ustawienia cookies” w stopce i na ekranie Konto); wycofanie nie wpływa na zgodność z prawem wcześniejszego przetwarzania,",
            "wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).",
          ]}
        />
        <p>
          Kopię swoich danych pobierzesz i konto usuniesz samodzielnie po zalogowaniu, w zakładce „Konto”. W pozostałych
          sprawach napisz na adres {LEGAL.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection heading="7. Pliki cookie i pamięć przeglądarki">
        <p>
          Nie używamy plików cookie reklamowych. W pamięci przeglądarki (localStorage) zapisujemy to, co niezbędne do
          działania serwisu: po zalogowaniu token sesji (znika po wylogowaniu), wybrany wygląd i Twoją decyzję o zgodzie na
          statystyki. Do tego nie potrzebujemy zgody.
        </p>
        <p>
          Za Twoją zgodą (przycisk „Akceptuję” na pasku u dołu strony) używamy Google Analytics, który zapisuje pliki cookie
          z identyfikatorem (nazwy zaczynają się od „_ga”) i zlicza odwiedziny. Funkcje reklamowe Google są wyłączone. Dane
          statystyczne przechowujemy {LEGAL.analyticsRetention}. Dopóki nie klikniesz „Akceptuję”, niczego nie zapisujemy i nic
          nie wysyłamy do Google. Zgodę możesz wycofać w „Ustawieniach cookies”, a pliki cookie usuniemy.
        </p>
        <p>
          Na ekranach rejestracji, logowania i resetu hasła wczytujemy z Cloudflare pole „Potwierdź, że nie jesteś robotem”. To
          zabezpieczenie niezbędne do ochrony serwisu, więc działa bez zgody; Cloudflare może zapisać w przeglądarce krótkotrwałe dane
          techniczne potrzebne do sprawdzenia i nie używa ich do reklam. Gdy blokujesz to pole (np. blokadą reklam), nie zalogujesz się
          ani nie założysz konta.
        </p>
      </LegalSection>

      <LegalSection heading="8. Zmiany polityki">
        <p>O istotnych zmianach poinformujemy w serwisie. Aktualna wersja jest zawsze pod tym adresem.</p>
      </LegalSection>
    </LegalPage>
  );
}
