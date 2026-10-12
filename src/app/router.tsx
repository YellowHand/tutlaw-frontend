import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { CheckEmailPage } from "../pages/CheckEmailPage";
import { VerifyPage } from "../pages/VerifyPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { TermsPage } from "../features/legal/TermsPage";
import { PrivacyPage } from "../features/legal/PrivacyPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { SubjectsPage } from "../pages/SubjectsPage";
import { SourcesPage } from "../pages/SourcesPage";
import { ChaptersPage } from "../pages/ChaptersPage";
import { StudySessionPage } from "../pages/StudySessionPage";
import { TestSessionPage } from "../pages/TestSessionPage";
import { TestsPage } from "../features/tests/TestsPage";
import { TestCategoryPage } from "../features/tests/TestCategoryPage";
import { TestSubjectPage } from "../features/tests/TestSubjectPage";
import { StatisticsPage } from "../features/statistics/StatisticsPage";
import { AccountPage } from "../features/account/AccountPage";
import { NotFoundPage } from "../features/misc/NotFoundPage";

export function Router() {
  return (
    <BrowserRouter>
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

            <Route path="flashcards" element={<CategoriesPage />} />
            <Route path="flashcards/:categoryId/subjects" element={<SubjectsPage />} />
            <Route path="flashcards/:subjectId/sources" element={<SourcesPage />} />
            <Route path="flashcards/:subjectId/sources/:sourceId/chapters" element={<ChaptersPage />} />
            {/* Bez :subjectId = sesja z całego materiału użytkownika */}
            <Route path="study" element={<StudySessionPage />} />
            <Route path="study/:subjectId" element={<StudySessionPage />} />
            <Route path="test" element={<TestSessionPage />} />
            <Route path="test/mistakes" element={<TestSessionPage mode="mistakes" />} />
            <Route path="test/:subjectId" element={<TestSessionPage />} />

            <Route path="tests" element={<TestsPage />} />
            <Route path="tests/:categoryId" element={<TestCategoryPage />} />
            <Route path="tests/:categoryId/:subjectId" element={<TestSubjectPage />} />

            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="account" element={<AccountPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}