import type { ReviewScope } from "../api/review";

/** Zakres sesji w adresie: ?fieldId=1&actId=2&sourceId=3 (tylko podane pola); bez zakresu pusty napis. */
export function scopeQuery(scope: ReviewScope): string {
  const params = new URLSearchParams();
  if (scope.fieldId !== undefined) params.set("fieldId", String(scope.fieldId));
  if (scope.actId !== undefined) params.set("actId", String(scope.actId));
  if (scope.sourceId !== undefined) params.set("sourceId", String(scope.sourceId));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  checkEmail: "/check-email",
  verify: "/verify",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  terms: "/regulamin",
  privacy: "/polityka-prywatnosci",

  app: "/app",
  dashboard: "/app/dashboard",

  // Fiszki: ekran startowy (zaległe, nowe, zakres) i sesja. Fiszka to tryb pytania, a nie osobna karta.
  flashcards: "/app/flashcards",

  // Testy: strona główna z losowaniem, rodzajami testu i szybkimi zestawami. Nauka i Powtórki mają własne podstrony
  // z kreatorem (źródło, przepisy, rozdziały, liczba pytań w jednym widoku).
  tests: "/app/tests",
  testsStudy: "/app/tests/nauka",
  testsReview: "/app/tests/powtorki",

  // Sesje z całej puli użytkownika albo z zakresu podanego w adresie (?fieldId=, ?actId=, ?sourceId=).
  studyAll: "/app/study",
  testAll: "/app/test",
  studyScope: (scope: ReviewScope) => `/app/study${scopeQuery(scope)}`,
  testScope: (scope: ReviewScope) => `/app/test${scopeQuery(scope)}`,
  // Sesja z pytań, w których ostatnia odpowiedź w teście była błędna.
  testMistakes: "/app/test/mistakes",
  // Sesja z samych zaległych powtórek testowych (bez nowych pytań).
  testDue: "/app/test/due",
  // Sesja testowa z podanych pytań (np. błędy z egzaminu próbnego).
  testPractice: (questionIds: readonly number[]) => `/app/test/practice?questionIds=${questionIds.join(",")}`,
  // Przedrostek „Moich testów" (dawny ekran układania testu przekierowuje do Testów) i sesja z wylosowanych pytań.
  customTest: "/app/custom-test",
  testCustomBase: "/app/test/custom",
  testCustom: (questionIds: readonly number[], sessionId?: number) =>
    `/app/test/custom?questionIds=${questionIds.join(",")}${sessionId !== undefined ? `&sessionId=${sessionId}` : ""}`,
  // „Moje testy": zapisane własne testy i egzaminy próbne (lista z przełącznikiem Testy / Egzaminy i szczegóły). Pod
  // /app/custom-test, więc menu dalej świeci „Testy".
  myTests: "/app/custom-test/history",
  myTest: (id: string | number) => `/app/custom-test/history/${id}`,
  // Ta sama lista, zakładka Egzaminy (wyniki podejść do egzaminu próbnego), i raport jednego podejścia.
  myExams: `/app/custom-test/history?tab=exams`,
  myExam: (id: string | number) => `/app/custom-test/history/exams/${id}`,
  // Egzamin próbny: ustawienia, egzamin i raport zaraz po zakończeniu (historia jest w „Moich testach").
  exam: "/app/exam",

  statistics: "/app/statistics",
  account: "/app/account",

  // Panel administratora (tylko rola ADMIN, poza szkieletem aplikacji): aplikacje, przedmioty Studenta, akty prawne
  // z rozdziałami, arkusze egzaminów i terminy egzaminów.
  admin: "/admin",
  adminOverview: "/admin/przeglad",
  adminTracks: "/admin/aplikacje",
  adminCourses: "/admin/przedmioty",
  adminActs: "/admin/akty",
  adminAct: (id: string | number) => `/admin/akty/${id}`,
  adminSheets: "/admin/arkusze",
  adminTerms: "/admin/terminy",
} as const;