import { ROUTES } from "../../config/routes";

/** Parametr, po którym strona główna wie, że konto właśnie usunięto, i pokazuje potwierdzenie. */
export const ACCOUNT_DELETED_PARAM = "konto";
export const ACCOUNT_DELETED_VALUE = "usuniete";

/** Adres, na który trafia użytkownik po usunięciu konta. */
export const ACCOUNT_DELETED_URL = `${ROUTES.landing}?${ACCOUNT_DELETED_PARAM}=${ACCOUNT_DELETED_VALUE}`;
