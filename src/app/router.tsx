import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RouteFallback } from "../components/RouteFallback";
import { AppShell } from "../components/layout/AppShell";
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
const CustomTestPage = lazy(() => import("../features/customTest/CustomTestPage").then((m) => ({ default: m.CustomTestPage })));
const MyTestsPage = lazy(() => import("../features/customTest/MyTestsPage").then((m) => ({ default: m.MyTestsPage })));
const MyTestDetailPage = lazy(() =>
  import("../features/customTest/MyTestDetailPage").then((m) => ({ default: m.MyTestDetailPage }))
);
const TestsPage = lazy(() => import("../features/tests/TestsPage").then((m) => ({ default: m.TestsPage })));
const TestFieldPage = lazy(() => import("../features/tests/TestFieldPage").then((m) => ({ default: m.TestFieldPage })));
const StatisticsPage = lazy(() => import("../features/statistics/StatisticsPage").then((m) => ({ default: m.StatisticsPage })));
const AccountPage = lazy(() => import("../features/account/AccountPage").then((m) => ({ default: m.AccountPage })));

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
                <Route path="custom-test" element={<CustomTestPage />} />
                <Route path="custom-test/history" element={<MyTestsPage />} />
                <Route path="custom-test/history/:id" element={<MyTestDetailPage />} />
                <Route path="exam" element={<ExamPage />} />

                <Route path="tests" element={<TestsPage />} />
                <Route path="tests/:fieldId" element={<TestFieldPage />} />

                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="account" element={<AccountPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<PublicNotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}