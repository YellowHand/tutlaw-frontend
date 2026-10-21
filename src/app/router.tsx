import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RouteFallback } from "../components/RouteFallback";
import { AppShell } from "../components/layout/AppShell";
import { AdminRoute } from "../features/admin/AdminRoute";
import { AdminShell } from "../features/admin/AdminShell";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { CheckEmailPage } from "../pages/CheckEmailPage";
import { VerifyPage } from "../pages/VerifyPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { NotFoundPage, PublicNotFoundPage } from "../features/misc/NotFoundPage";

// Ekrany aplikacji i dokumenty prawne ładują się dopiero przy pierwszym wejściu, żeby strona główna i logowanie
// pobierały się szybko. Strony wejściowe (powyżej) zostają w głównym pakiecie.
const TermsPage = lazy(() => import("../features/legal/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("../features/legal/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const FlashcardsPage = lazy(() =>
  import("../features/flashcards/FlashcardsPage").then((m) => ({ default: m.FlashcardsPage }))
);
const StudySessionPage = lazy(() => import("../pages/StudySessionPage").then((m) => ({ default: m.StudySessionPage })));
const TestSessionPage = lazy(() => import("../pages/TestSessionPage").then((m) => ({ default: m.TestSessionPage })));
const ExamPage = lazy(() => import("../features/exam/ExamPage").then((m) => ({ default: m.ExamPage })));
const MyTestsPage = lazy(() => import("../features/customTest/MyTestsPage").then((m) => ({ default: m.MyTestsPage })));
const MyTestDetailPage = lazy(() =>
  import("../features/customTest/MyTestDetailPage").then((m) => ({ default: m.MyTestDetailPage }))
);
const MyExamPage = lazy(() => import("../features/customTest/MyExamPage").then((m) => ({ default: m.MyExamPage })));
const TestsPage = lazy(() => import("../features/tests/TestsPage").then((m) => ({ default: m.TestsPage })));
const TestBuilderPage = lazy(() =>
  import("../features/customTest/TestBuilderPage").then((m) => ({ default: m.TestBuilderPage }))
);
const StatisticsPage = lazy(() => import("../features/statistics/StatisticsPage").then((m) => ({ default: m.StatisticsPage })));
const AccountPage = lazy(() => import("../features/account/AccountPage").then((m) => ({ default: m.AccountPage })));
// Panel administratora ładuje się dopiero administratorowi, który do niego wejdzie.
const AdminOverviewPage = lazy(() => import("../features/admin/AdminOverviewPage").then((m) => ({ default: m.AdminOverviewPage })));
const AdminTracksPage = lazy(() => import("../features/admin/AdminTracksPage").then((m) => ({ default: m.AdminTracksPage })));
const AdminCoursesPage = lazy(() => import("../features/admin/AdminCoursesPage").then((m) => ({ default: m.AdminCoursesPage })));
const AdminActsPage = lazy(() => import("../features/admin/AdminActsPage").then((m) => ({ default: m.AdminActsPage })));
const AdminActPage = lazy(() => import("../features/admin/AdminActPage").then((m) => ({ default: m.AdminActPage })));
const AdminSheetsPage = lazy(() => import("../features/admin/AdminSheetsPage").then((m) => ({ default: m.AdminSheetsPage })));
const AdminTermsPage = lazy(() => import("../features/admin/AdminTermsPage").then((m) => ({ default: m.AdminTermsPage })));
const AdminQuestionsPage = lazy(() => import("../features/admin/AdminQuestionsPage").then((m) => ({ default: m.AdminQuestionsPage })));
const AdminImportPage = lazy(() => import("../features/admin/AdminImportPage").then((m) => ({ default: m.AdminImportPage })));
const AdminMarksPage = lazy(() => import("../features/admin/AdminMarksPage").then((m) => ({ default: m.AdminMarksPage })));
const AdminReportsPage = lazy(() => import("../features/admin/AdminReportsPage").then((m) => ({ default: m.AdminReportsPage })));

export function Router() {
  return (
    <BrowserRouter>
      <ErrorBoundary fullScreen>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/regulamin" element={<TermsPage />} />
            <Route path="/polityka-prywatnosci" element={<PrivacyPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                <Route path="flashcards" element={<FlashcardsPage />} />
                {/* Zakres sesji (dziedzina, akt, źródło) jest w adresie: ?fieldId=, ?actId=, ?sourceId=; bez niego cała pula */}
                <Route path="study" element={<StudySessionPage />} />
                <Route path="test" element={<TestSessionPage />} />
                <Route path="test/mistakes" element={<TestSessionPage mode="mistakes" />} />
                <Route path="test/due" element={<TestSessionPage mode="due" />} />
                <Route path="test/practice" element={<TestSessionPage mode="practice" />} />
                <Route path="test/custom" element={<TestSessionPage mode="custom" />} />
                {/* Dawny ekran „Własny test": kreator jest teraz w Testach (stare zakładki i linki trafiają tam) */}
                <Route path="custom-test" element={<Navigate to="/app/tests" replace />} />
                <Route path="custom-test/history" element={<MyTestsPage />} />
                <Route path="custom-test/history/:id" element={<MyTestDetailPage />} />
                {/* Raport zapisanego podejścia do egzaminu próbnego (z listy „Moje testy" → Egzaminy) */}
                <Route path="custom-test/history/exams/:id" element={<MyExamPage />} />
                <Route path="exam" element={<ExamPage />} />

                <Route path="tests" element={<TestsPage />} />
                {/* Kreator testu: osobne podstrony Nauki i Powtórek (źródło, przepisy, rozdziały i liczba pytań w jednym widoku) */}
                <Route path="tests/nauka" element={<TestBuilderPage flavor="STUDY" />} />
                <Route path="tests/powtorki" element={<TestBuilderPage flavor="REVIEW" />} />
                {/* Dawne strony dziedziny i przedmiotu: wybór zakresu jest w kreatorze */}
                <Route path="tests/*" element={<Navigate to="/app/tests" replace />} />

                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="account" element={<AccountPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Panel administratora: tylko rola ADMIN (inni wracają na Pulpit), własny szkielet z menu panelu */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminShell />}>
                  <Route index element={<Navigate to="przeglad" replace />} />
                  <Route path="przeglad" element={<AdminOverviewPage />} />
                  <Route path="aplikacje" element={<AdminTracksPage />} />
                  <Route path="przedmioty" element={<AdminCoursesPage />} />
                  <Route path="akty" element={<AdminActsPage />} />
                  <Route path="akty/:id" element={<AdminActPage />} />
                  <Route path="arkusze" element={<AdminSheetsPage />} />
                  <Route path="terminy" element={<AdminTermsPage />} />
                  <Route path="pytania" element={<AdminQuestionsPage />} />
                  <Route path="import" element={<AdminImportPage />} />
                  <Route path="oznaczenia" element={<AdminMarksPage />} />
                  <Route path="zgloszenia" element={<AdminReportsPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<PublicNotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}