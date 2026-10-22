/**
 * Dane administratora serwisu pokazywane w regulaminie i polityce prywatności.
 *
 * UZUPEŁNIJ PRZED PUBLICZNYM STARTEM: wartości w nawiasach kwadratowych to miejsca do wpisania.
 * Teksty obu dokumentów to wersja robocza i powinien je przejrzeć prawnik.
 */
export const LEGAL = {
  serviceName: "Gradus iuris",
  operatorName: "[uzupełnij: imię i nazwisko lub nazwa administratora]",
  operatorAddress: "[uzupełnij: adres do korespondencji]",
  contactEmail: "[uzupełnij: adres e-mail do kontaktu]",
  hostingProvider: "Amazon Web Services EMEA SARL (region Europa, Frankfurt)",
  mailProvider: "Amazon Simple Email Service (Amazon SES, region Europa, Frankfurt)",
  errorMonitoringProvider: "Sentry (Functional Software, Inc.), serwery w Unii Europejskiej (Niemcy)",
  backupRetention: "[uzupełnij: np. 30 dni]",
  logsRetention: "[uzupełnij: np. 30 dni]",
  termsUpdatedAt: "12 października 2026",
  privacyUpdatedAt: "12 października 2026",
} as const;
