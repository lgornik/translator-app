import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { QuizPage } from '@/features/quiz/pages/QuizPage';

// Placeholder pages for future features
function LeaderboardPage() {
  return <div>Leaderboard - Coming Soon</div>;
}

function ProfilePage() {
  return <div>Profile - Coming Soon</div>;
}

function LoginPage() {
  return <div>Login - Coming Soon</div>;
}

function RegisterPage() {
  return <div>Register - Coming Soon</div>;
}

function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Strona nie została znaleziona</p>
    </div>
  );
}

/**
 * Application router
 * Prepared for future auth and additional pages
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Main quiz route */}
      <Route path={ROUTES.HOME} element={<QuizPage />} />
      <Route path={ROUTES.QUIZ} element={<QuizPage />} />
      
      {/* Future pages - currently placeholders */}
      <Route path={ROUTES.LEADERBOARD} element={<LeaderboardPage />} />
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
