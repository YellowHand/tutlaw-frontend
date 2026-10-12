import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { CheckEmailPage } from "../pages/CheckEmailPage";
import { VerifyPage } from "../pages/VerifyPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { SubjectsPage } from "../pages/SubjectsPage";
import { SourcesPage } from "../pages/SourcesPage";
import { ChaptersPage } from "../pages/ChaptersPage";
import { StudySessionPage } from "../pages/StudySessionPage";
import { TestSessionPage } from "../pages/TestSessionPage";
import { TestsComingSoonPage } from "../features/tests/TestsComingSoonPage";
import { StatisticsPage } from "../features/statistics/StatisticsPage";
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

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="flashcards" element={<CategoriesPage />} />
            <Route path="flashcards/:categoryId/subjects" element={<SubjectsPage />} />
            <Route path="flashcards/:subjectId/sources" element={<SourcesPage />} />
            <Route path="flashcards/:subjectId/sources/:sourceId/chapters" element={<ChaptersPage />} />
            <Route path="study/:subjectId" element={<StudySessionPage />} />
            <Route path="test/:subjectId" element={<TestSessionPage />} />

            <Route path="tests" element={<TestsComingSoonPage />} />

            <Route path="statistics" element={<StatisticsPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}