export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  checkEmail: "/check-email",
  verify: "/verify",

  app: "/app",
  dashboard: "/app/dashboard",

  flashcards: "/app/flashcards",
  flashcardsSubjects: (categoryId: string | number) => `/app/flashcards/${categoryId}/subjects`,
  flashcardsSources: (subjectId: string | number) => `/app/flashcards/${subjectId}/sources`,
  flashcardsChapters: (subjectId: string | number, sourceId: string | number) =>
    `/app/flashcards/${subjectId}/sources/${sourceId}/chapters`,

  tests: "/app/tests",

  study: (subjectId: string | number, sourceId?: string | number) =>
    sourceId !== undefined ? `/app/study/${subjectId}?sourceId=${sourceId}` : `/app/study/${subjectId}`,

  test: (subjectId: string | number, sourceId?: string | number) =>
    sourceId !== undefined ? `/app/test/${subjectId}?sourceId=${sourceId}` : `/app/test/${subjectId}`,

  statistics: "/app/statistics",
} as const;