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
            "dane o nauce: odpowiedzi w testach, oceny powtórek, terminy kolejnych powtórek, zaznaczone rozdziały i statystyki,",
            "datę akceptacji regulaminu,",
            "dane techniczne: adres IP używany krótkotrwale do ograniczania liczby prób logowania oraz w dziennikach błędów serwera.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Po co i na jakiej podstawie">
        <LegalList
          items={[
            "świadczenie usługi: konto, nauka, planowanie powtórek, statystyki (art. 6 ust. 1 lit. b RODO),",
            "bezpieczeństwo serwisu i ochrona przed nadużyciami, np. zgadywaniem haseł (art. 6 ust. 1 lit. f RODO, czyli nasz uzasadniony interes),",
            "obowiązki wynikające z przepisów, jeśli takie wystąpią (art. 6 ust. 1 lit. c RODO).",
          ]}
        />
        <p>Nie sprzedajemy danych i nie używamy ich do reklam. Nie podejmujemy decyzji, które wywołują wobec Ciebie skutki prawne wyłącznie automatycznie. Algorytm powtórek tylko ustala, kiedy pokazać Ci pytanie.</p>
      </LegalSection>

      <LegalSection heading="4. Komu możemy przekazać dane">
        <p>
          Dane przetwarzają wyłącznie podmioty, które pomagają nam prowadzić serwis, na podstawie umów powierzenia:
          dostawca hostingu ({LEGAL.hostingProvider}) i dostawca poczty wychodzącej ({LEGAL.mailProvider}). Dane
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
          Nie używamy plików cookie reklamowych ani analitycznych. Po zalogowaniu zapisujemy w pamięci przeglądarki
          (localStorage) token sesji. Jest on niezbędny do działania serwisu i znika po wylogowaniu.
        </p>
      </LegalSection>

      <LegalSection heading="8. Zmiany polityki">
        <p>O istotnych zmianach poinformujemy w serwisie. Aktualna wersja jest zawsze pod tym adresem.</p>
      </LegalSection>
    </LegalPage>
  );
}
