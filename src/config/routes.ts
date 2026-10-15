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

  flashcards: "/app/flashcards",
  flashcardsSubjects: (categoryId: string | number) => `/app/flashcards/${categoryId}/subjects`,
  flashcardsSources: (subjectId: string | number) => `/app/flashcards/${subjectId}/sources`,
  flashcardsChapters: (subjectId: string | number, sourceId: string | number) =>
    `/app/flashcards/${subjectId}/sources/${sourceId}/chapters`,

  // Testy: rodzaj (kategoria) → przedmiot / akt prawny → źródło
  tests: "/app/tests",
  testsCategory: (categoryId: string | number) => `/app/tests/${categoryId}`,
  testsSubject: (categoryId: string | number, subjectId: string | number) => `/app/tests/${categoryId}/${subjectId}`,

  // Sesje z całego materiału użytkownika (bez wybranego przedmiotu).
  studyAll: "/app/study",
  testAll: "/app/test",
  // Sesja z pytań, w których ostatnia odpowiedź w teście była błędna.
  testMistakes: "/app/test/mistakes",
  // Sesja z samych zaległych powtórek testowych (bez nowych pytań).
  testDue: "/app/test/due",
  // Sesja testowa z podanych pytań (np. błędy z egzaminu próbnego).
  testPractice: (cardIds: readonly number[]) => `/app/test/practice?cardIds=${cardIds.join(",")}`,
  // Własny test: ekran układania (to NIE sesja, więc zostaje z menu) i sesja z wylosowanych pytań.
  customTest: "/app/custom-test",
  testCustomBase: "/app/test/custom",
  testCustom: (cardIds: readonly number[], sessionId?: number) =>
    `/app/test/custom?cardIds=${cardIds.join(",")}${sessionId !== undefined ? `&sessionId=${sessionId}` : ""}`,
  // „Moje testy": zapisane własne testy (lista i szczegóły). Pod /app/custom-test, więc menu dalej świeci „Testy".
  myTests: "/app/custom-test/history",
  myTest: (id: string | number) => `/app/custom-test/history/${id}`,
  // Egzamin próbny: ustawienia, egzamin, raport i historia.
  exam: "/app/exam",

  study: (subjectId: string | number, sourceId?: string | number) =>
    sourceId !== undefined ? `/app/study/${subjectId}?sourceId=${sourceId}` : `/app/study/${subjectId}`,

  test: (subjectId: string | number, sourceId?: string | number) =>
    sourceId !== undefined ? `/app/test/${subjectId}?sourceId=${sourceId}` : `/app/test/${subjectId}`,

  // Test z całego rodzaju (działu prawa / kategorii).
  testCategory: (categoryId: string | number) => `/app/test?categoryId=${categoryId}`,

  statistics: "/app/statistics",
  account: "/app/account",
} as const;