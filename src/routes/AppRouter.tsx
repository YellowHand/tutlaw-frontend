import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { LandingPage } from '../pages/LandingPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CheckEmailPage } from '../pages/CheckEmailPage';
import { VerifyPage } from '../pages/VerifyPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../components/AppLayout'; // <-- Nowy import
import { SubjectsPage } from '../pages/SubjectsPage';
import { ChaptersPage } from '../pages/ChaptersPage';
import { StudySessionPage } from '../pages/StudySessionPage';
import { StatisticsPage } from '../pages/StatisticsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/subjects/:subjectId/chapters" element={<ChaptersPage />} />
              <Route path="/subjects/:subjectId/statistics" element={<StatisticsPage />} />
            </Route>
            <Route path="/study/:subjectId" element={<StudySessionPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
