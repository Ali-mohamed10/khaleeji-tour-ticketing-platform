/**
 * GuestRoute
 *
 * Purpose: Redirects authenticated users away from login/register pages.
 *
 * Dependencies: useAuth
 */
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRedirectTarget } from '../../utils/authRedirect';

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    const target = getRedirectTarget(location, searchParams, '/');
    return <Navigate to={target} replace />;
  }

  return children;
};

