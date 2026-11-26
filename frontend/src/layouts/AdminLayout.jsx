import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile } = useAuth();
  const currentRole = profile?.role || 'customer';

  const allNavItems = [
    { name: t('admin.title', 'Overview'), path: '/admin', exact: true, roles: ['admin'] },
    { name: t('admin.registrations.title', 'Registrations'), path: '/admin/registrations', roles: ['admin'] },
    { name: t('admin.events.title', 'Events'), path: '/admin/events', roles: ['admin', 'editor'] },
    { name: t('admin.seatMaps.title', 'Seat Maps'), path: '/admin/seat-maps', roles: ['admin', 'editor'] },
    { name: t('admin.scanner.title', 'Ticket Scanner'), path: '/admin/scanner', roles: ['admin', 'gate_staff'] },
  ];

  // Filter visible tabs based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  // Smart redirect if landing directly on /admin root
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    if (currentRole === 'editor') {
      return <Navigate to="/admin/events" replace />;
    }
    if (currentRole === 'gate_staff') {
      return <Navigate to="/admin/scanner" replace />;
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      {/* Admin Navigation */}
      <nav className="flex gap-4 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Content */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
