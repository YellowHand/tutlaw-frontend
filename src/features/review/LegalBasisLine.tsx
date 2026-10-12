import { formatLegalDate } from "./legalDate";

interface LegalBasisLineProps {
  legalBasis: string | null;
  /** Data w formacie RRRR-MM-DD: na ten dzień sprawdzono stan prawny pytania. */
  validAsOf: string | null;
  className?: string;
}

/** „Podstawa prawna: art. 415 k.c. · stan prawny na 1 października 2026". Bez żadnej z wartości nic nie pokazuje. */
export function LegalBasisLine({ legalBasis, validAsOf, className }: LegalBasisLineProps) {
  const basis = legalBasis?.trim();
  const date = validAsOf ? formatLegalDate(validAsOf) : null;
  if (!basis && !date) return null;

  return (
    <p data-testid="legal-basis" className={className}>
      {basis && (
        <>
          <span>Podstawa prawna: </span>
          <span className="font-medium">{basis}</span>
        </>
      )}
      {basis && date && <span aria-hidden="true"> · </span>}
      {date && <span>stan prawny na {date}</span>}
    </p>
  );
}
