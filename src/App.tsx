import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppShell } from '@/components/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { BillingPage } from '@/pages/BillingPage';
import { OnboardingPage } from '@/pages/OnboardingPage';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-48">
        <div className="h-1.5 rounded-full bg-edge overflow-hidden">
          <div className="fuse-fill h-full w-2/3 rounded-full bg-safe" />
        </div>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { session, loading, needsOnboarding } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <OnboardingPage />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="/"
              element={
                <PublicOnly>
                  <LandingPage />
                </PublicOnly>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <AuthPage mode="login" />
                </PublicOnly>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnly>
                  <AuthPage mode="signup" />
                </PublicOnly>
              }
            />
            <Route path="/app" element={<ProtectedLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
