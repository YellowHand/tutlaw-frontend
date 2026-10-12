import { LEGAL } from "../../config/legal";
import { LegalList, LegalPage, LegalSection } from "./LegalPage";

export function TermsPage() {
  return (
    <LegalPage title="Regulamin serwisu" updatedAt={LEGAL.termsUpdatedAt}>
      <LegalSection heading="1. Postanowienia ogólne">
        <p>
          {LEGAL.serviceName} to serwis internetowy do nauki prawa i przygotowań do egzaminów prawniczych: fiszki z
          algorytmem powtórek interwałowych oraz testy jednokrotnego wyboru. Serwis prowadzi {LEGAL.operatorName}{" "}
          (adres: {LEGAL.operatorAddress}, kontakt: {LEGAL.contactEmail}), zwany dalej „Operatorem”.
        </p>
        <p>Korzystanie z serwisu oznacza akceptację niniejszego regulaminu.</p>
      </LegalSection>

      <LegalSection heading="2. Konto">
        <LegalList
          items={[
            "Do założenia konta potrzebny jest prywatny adres e-mail (służy do logowania) oraz adres uczelniany, na który wysyłamy link aktywacyjny. Konto działa po kliknięciu tego linku.",
            "Podajesz prawdziwe dane i dbasz o poufność hasła. Jedno konto jest przeznaczone dla jednej osoby i nie wolno go udostępniać innym.",
            "Możesz w każdej chwili przestać korzystać z serwisu i samodzielnie usunąć konto w zakładce „Konto”.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Zakres usługi i opłaty">
        <p>
          Na dzień publikacji regulaminu serwis jest bezpłatny. Operator może zmieniać zakres funkcji, a w przyszłości
          wprowadzić płatne elementy. O takich zmianach poinformuje w serwisie z odpowiednim wyprzedzeniem, a
          zmiana nie obejmie rozliczeń za okresy, za które nie pobrano opłat.
        </p>
      </LegalSection>

      <LegalSection heading="4. Charakter treści">
        <LegalList
          items={[
            "Materiały w serwisie (fiszki, pytania testowe, wyjaśnienia) są pomocą w nauce. Nie są poradą prawną ani oficjalnym źródłem prawa.",
            "Prawo się zmienia. Treści mogą być niepełne, uproszczone lub nieaktualne, dlatego przed egzaminem i w praktyce zawsze sprawdzaj obowiązujący tekst aktu prawnego.",
            "Serwis nie jest powiązany z organizatorami egzaminów ani z instytucjami publicznymi i nie gwarantuje wyniku egzaminu.",
            "Zauważyłeś błąd w pytaniu lub wyjaśnieniu? Napisz na adres kontaktowy. Poprawiamy treści tak szybko, jak to możliwe.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Zasady korzystania">
        <p>Nie wolno w szczególności:</p>
        <LegalList
          items={[
            "masowo pobierać treści z serwisu w sposób zautomatyzowany ani odtwarzać z nich własnej bazy pytań,",
            "obchodzić zabezpieczeń, zakłócać pracy serwisu ani próbować uzyskać dostępu do cudzych kont,",
            "rozpowszechniać treści serwisu w celach zarobkowych bez zgody Operatora.",
          ]}
        />
        <p>
          Treści stworzone przez Operatora możesz wykorzystywać do własnej nauki. Prawa autorskie do nich pozostają
          przy ich autorach.
        </p>
      </LegalSection>

      <LegalSection heading="6. Odpowiedzialność">
        <p>
          Serwis udostępniamy w stanie, w jakim jest, i dokładamy starań, by działał nieprzerwanie, ale mogą się zdarzać
          przerwy techniczne. W granicach dozwolonych przez prawo Operator nie odpowiada za skutki oparcia się wyłącznie
          na materiałach z serwisu, np. za wynik egzaminu. Regulamin nie ogranicza uprawnień, które przysługują
          konsumentom z mocy bezwzględnie obowiązujących przepisów.
        </p>
      </LegalSection>

      <LegalSection heading="7. Reklamacje i kontakt">
        <p>
          Uwagi, zgłoszenia błędów i reklamacje wysyłaj na adres {LEGAL.contactEmail}. Odpowiadamy w rozsądnym terminie,
          nie później niż w ciągu 14 dni.
        </p>
      </LegalSection>

      <LegalSection heading="8. Zmiany regulaminu">
        <p>
          Regulamin możemy zmienić z ważnych powodów, np. przy zmianie funkcji serwisu lub przepisów. O istotnych
          zmianach poinformujemy w serwisie lub e-mailem, z wyprzedzeniem co najmniej 14 dni. Jeśli zmiana Ci nie
          odpowiada, możesz usunąć konto. W sprawach nieuregulowanych stosuje się prawo polskie.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
