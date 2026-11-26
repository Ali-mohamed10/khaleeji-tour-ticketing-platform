import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import './lib/i18n'; // Initialize i18n

import MainLayout from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { GuestRoute } from './components/auth/GuestRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
// Eager homepage — removes Suspense waterfall on the primary landing route
import HomePage from './pages/HomePage';

// Lazy load auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'));
const EmailConfirmedPage = lazy(() => import('./pages/auth/EmailConfirmedPage'));

// Lazy load admin pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/admin/AdminRegistrationsPage'));
const SeatMapsListPage = lazy(() => import('./pages/admin/SeatMapsListPage'));
const SeatMapEditorPage = lazy(() => import('./pages/admin/SeatMapEditorPage'));
const EventsListPage = lazy(() => import('./pages/admin/EventsListPage'));
const EventFormPage = lazy(() => import('./pages/admin/EventFormPage'));
const TicketScannerPage = lazy(() => import('./pages/admin/TicketScannerPage'));

// Lazy load public pages (HomePage is eager above)
const EventDetailsPage = lazy(() => import('./pages/events/EventDetailsPage'));
const PressConferenceRegisterPage = lazy(() => import('./pages/events/PressConferenceRegisterPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const BookingSuccessPage = lazy(() => import('./pages/booking/BookingSuccessPage'));
const BookingCancelPage = lazy(() => import('./pages/booking/BookingCancelPage'));
const MyTicketsPage = lazy(() => import('./pages/tickets/MyTicketsPage'));

// Lazy load error pages
const UnauthorizedPage = lazy(() => import('./pages/errors/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Scroll to top helper on route change
const ScrollToTopOnRouteChange = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace("#", ""));
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTopOnRouteChange />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public & Protected Routes inside Main Layout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="how-it-works" element={<HowItWorksPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="terms-and-conditions" element={<Navigate to="/terms" replace />} />
                <Route path="privacy" element={<PrivacyPolicyPage />} />
                <Route path="privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="press-conference" element={<PressConferenceRegisterPage />} />
                <Route path="registration" element={<PressConferenceRegisterPage />} />
                <Route path="events/:slug" element={<EventDetailsPage />} />
                <Route path="events/:slug/register" element={<PressConferenceRegisterPage />} />
                <Route path="booking/success" element={<BookingSuccessPage />} />
                <Route path="booking/cancel" element={<BookingCancelPage />} />
                <Route
                  path="my-tickets"
                  element={
                    <ProtectedRoute>
                      <MyTicketsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route path="admin" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'editor', 'gate_staff']}>
                      <AdminLayout />
                    </RoleGuard>
                  </ProtectedRoute>
                }>
                  <Route index element={
                    <RoleGuard allowedRoles={['admin']}>
                      <DashboardPage />
                    </RoleGuard>
                  } />
                  <Route path="registrations" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <AdminRegistrationsPage />
                    </RoleGuard>
                  } />
                  <Route path="events" element={
                    <RoleGuard allowedRoles={['admin', 'editor']}>
                      <EventsListPage />
                    </RoleGuard>
                  } />
                  <Route path="events/create" element={
                    <RoleGuard allowedRoles={['admin', 'editor']}>
                      <EventFormPage />
                    </RoleGuard>
                  } />
                  <Route path="events/:id/edit" element={
                    <RoleGuard allowedRoles={['admin', 'editor']}>
                      <EventFormPage />
                    </RoleGuard>
                  } />
                  <Route path="seat-maps" element={
                    <RoleGuard allowedRoles={['admin', 'editor']}>
                      <SeatMapsListPage />
                    </RoleGuard>
                  } />
                  <Route path="seat-maps/:id" element={
                    <RoleGuard allowedRoles={['admin', 'editor']}>
                      <SeatMapEditorPage />
                    </RoleGuard>
                  } />
                  <Route path="scanner" element={
                    <RoleGuard allowedRoles={['admin', 'gate_staff']}>
                      <TicketScannerPage />
                    </RoleGuard>
                  } />
                </Route>
                
                {/* Route Aliases */}
                <Route path="dashboard/registrations" element={<Navigate to="/admin/registrations" replace />} />

                {/* Error Pages */}
                <Route path="unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Auth Routes inside Auth Layout */}
              <Route element={<AuthLayout />}>
                <Route path="login" element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                } />
                <Route path="register" element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                } />
                <Route path="forgot-password" element={
                  <GuestRoute>
                    <ForgotPasswordPage />
                  </GuestRoute>
                } />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="verify-email" element={<EmailVerificationPage />} />
                <Route path="email-confirmed" element={<EmailConfirmedPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
