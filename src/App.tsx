import { useCallback, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminSignInPage } from '@/pages/AdminSignInPage';

const ACCESS_TOKEN_KEY = 'kaaamnow_admin_access_token';

function AppRoutes() {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => window.sessionStorage.getItem(ACCESS_TOKEN_KEY),
  );
  const location = useLocation();
  const navigate = useNavigate();

  const signIn = useCallback((token: string) => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAccessToken(token);
    navigate(ROUTES.dashboard, { replace: true });
  }, [navigate]);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setAccessToken(null);
    navigate(ROUTES.login, { replace: true });
  }, [navigate]);

  return (
    <Routes>
      <Route
        path={ROUTES.login}
        element={accessToken
          ? <Navigate to={ROUTES.dashboard} replace />
          : <AdminSignInPage onSignedIn={signIn} />}
      />
      <Route
        path="*"
        element={accessToken
          ? <AdminLayout accessToken={accessToken} onSignOut={signOut} />
          : <Navigate to={ROUTES.login} replace state={{ from: location }} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
