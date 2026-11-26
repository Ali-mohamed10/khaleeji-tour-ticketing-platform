import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Ticket, DollarSign, Users, Sparkles, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats } from '../../hooks/useUsers';
import { EventBookingsSection } from '../../components/admin/EventBookingsSection';
import { AdminManualBookingSection } from '../../components/admin/AdminManualBookingSection';
import { AdminCouponManager } from '../../components/admin/AdminCouponManager';
import { AdminTableBlocker } from '../../components/admin/AdminTableBlocker';
import { AdminVideoManager } from '../../components/admin/AdminVideoManager';
import { UsersTable } from '../../components/admin/UsersTable';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();

  const formattedRevenue = stats
    ? `$${Number(stats.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-foreground">
              {t('admin.title', 'Overview')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="w-3 h-3" />
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.welcomeUser', 'Welcome back, {{name}}! You are logged in as {{role}}.', {
              name: profile?.full_name || 'Admin',
              role: profile?.role || 'admin',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/registrations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{t('admin.registrations.title', 'View Event Registrations')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Events Managed */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/40 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.statsEvents', 'Events Managed')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-primary transition-colors">
              {isStatsLoading ? '...' : (stats?.eventsCount ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/40 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.statsBookings', 'Total Bookings')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-primary transition-colors">
              {isStatsLoading ? '...' : (stats?.bookingsCount ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/40 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.statsRevenue', 'Total Revenue')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-primary">
              {isStatsLoading ? '...' : formattedRevenue}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Users */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/40 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.statsUsers', 'Registered Users')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-primary transition-colors">
              {isStatsLoading ? '...' : (stats?.usersCount ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Manual / Offline Booking Section (Cash & WhatsApp) */}
      <div className="space-y-4">
        <AdminManualBookingSection />
      </div>

      {/* 2. Event Seat Capacity & Bookings Report Section */}
      <div className="space-y-4">
        <EventBookingsSection />
      </div>

      {/* 3. Discount Coupons & Promo Codes Management Section */}
      <div className="space-y-4">
        <AdminCouponManager />
      </div>

      {/* 4. Registered Users Management Section */}
      <div className="space-y-4">
        <UsersTable />
      </div>

      {/* 4. Event Promo Videos & Reels Management Section */}
      <div className="space-y-4">
        <AdminVideoManager />
      </div>

      {/* 1. Live Seat & Table Blocker / Availability Control Section */}
      <div className="space-y-4">
        <AdminTableBlocker />
      </div>
    </div>
  );
};

export default DashboardPage;
