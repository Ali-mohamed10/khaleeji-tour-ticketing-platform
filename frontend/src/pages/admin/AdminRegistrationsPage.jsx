import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle2,
  Mail,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RegistrationDetailModal } from '../../components/admin/RegistrationDetailModal';
import { registrationService } from '../../services/registrationService';

export const AdminRegistrationsPage = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // State
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    attended: 0,
    cancelled: 0,
    emailsSent: 0,
    emailsFailed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailStatusFilter, setEmailStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [availableEvents, setAvailableEvents] = useState([]);
  const sortOrder = 'desc';
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load distinct events/conferences for dropdown filter
  useEffect(() => {
    registrationService
      .getDistinctEvents()
      .then((events) => setAvailableEvents(events))
      .catch((err) => console.error('Failed to load conferences:', err));
  }, []);

  // Fetch Registrations & Stats
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [regRes, statsRes] = await Promise.all([
        registrationService.getRegistrations({
          search: searchTerm,
          status: statusFilter,
          emailStatus: emailStatusFilter,
          category: categoryFilter,
          eventFilter,
          sortBy: 'created_at',
          sortOrder,
          page,
          limit: 15,
        }),
        registrationService.getStats(eventFilter).catch(() => null),
      ]);

      setRegistrations(regRes.data);
      setTotalCount(regRes.totalCount);
      setTotalPages(regRes.totalPages);

      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError(err.message || 'Failed to load event registrations.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, emailStatusFilter, categoryFilter, eventFilter, sortOrder, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show inline notification
  const showToast = (message, type = 'success') => {
    setNotification({ text: message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Status Change Handler
  const handleStatusChange = async (id, newStatus) => {
    await registrationService.updateStatus(id, newStatus);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    if (selectedRegistration && selectedRegistration.id === id) {
      setSelectedRegistration((prev) => ({ ...prev, status: newStatus }));
    }
    fetchData();
  };

  // Delete Handler
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await registrationService.deleteRegistration(deleteTarget.id);
      showToast(t('admin.registrations.deleteSuccess', 'Registration deleted successfully.'));
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete registration.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (registrations.length === 0) return;

    const headers = [
      'Registration ID',
      'Full Name',
      'Email',
      'Phone',
      'City',
      'Category',
      'Organization',
      'Position',
      'Status',
      'Email Status',
      'Created At',
    ];

    const rows = registrations.map((r) => [
      r.registration_number,
      `"${(r.full_name || '').replace(/"/g, '""')}"`,
      r.email,
      r.phone_number,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.organization_name || '').replace(/"/g, '""')}"`,
      `"${(r.job_title || '').replace(/"/g, '""')}"`,
      r.status,
      r.confirmation_email_status,
      r.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Event-Registrations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEmailStatusLabel = (st) => {
    switch (st?.toLowerCase()) {
      case 'sent':
        return t('admin.registrations.emailSent', 'Sent');
      case 'failed':
        return t('admin.registrations.emailFailed', 'Failed');
      case 'pending':
        return t('admin.registrations.emailPending', 'Pending');
      default:
        return st || t('admin.registrations.emailPending', 'Pending');
    }
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return t('admin.registrations.modal.notProvided', 'Not provided');
    return t(`admin.registrations.categories.${cat}`, cat);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <SEO title="Manage Event Registrations - Admin Portal" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-foreground">
              {t('admin.registrations.title', 'Registrations')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="w-3 h-3" />
              {t('admin.registrations.badge', 'Event Portal')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'admin.registrations.subtitle',
              'Manage event attendees, check-in status, and transactional confirmation emails.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>{t('admin.registrations.exportCsv', 'Export CSV')}</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-colors cursor-pointer"
            title={t('common.refresh', 'Refresh list')}
            aria-label={t('common.refresh', 'Refresh list')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registrations */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.registrations.statsTotal', 'Total Registrations')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-primary transition-colors">
              {stats.total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Attended */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.registrations.statsAttended', 'Attended')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-emerald-500 transition-colors">
              {stats.attended}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Emails Delivered */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.registrations.statsEmailsSent', 'Emails Delivered')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-foreground group-hover:text-blue-500 transition-colors">
              {stats.emailsSent}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* Emails Failed */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.registrations.statsEmailsFailed', 'Emails Failed')}
            </span>
            <p className="text-2xl sm:text-3xl font-bold font-sans text-destructive">
              {stats.emailsFailed}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={t(
                'admin.registrations.searchPlaceholder',
                'Search by attendee name, email, phone, ID...'
              )}
              className={`w-full bg-background border border-input rounded-xl ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
            />
          </div>

          {/* Conference / Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            aria-label={t('admin.registrations.filterConference', 'Filter by Conference / Event')}
          >
            <option value="all">
              {t('admin.registrations.allConferences', 'All Conferences / Events')}
            </option>
            {availableEvents.map((ev) => (
              <option key={ev.id || ev.title} value={ev.id || ev.title}>
                {ev.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">{t('admin.registrations.filterStatusAll', 'All Statuses')}</option>
            <option value="registered">{t('admin.registrations.statusRegistered', 'Registered')}</option>
            <option value="attended">{t('admin.registrations.statusAttended', 'Attended')}</option>
            <option value="cancelled">{t('admin.registrations.statusCancelled', 'Cancelled')}</option>
          </select>

          {/* Email Status Filter */}
          <select
            value={emailStatusFilter}
            onChange={(e) => {
              setEmailStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">{t('admin.registrations.filterEmailAll', 'All Email Statuses')}</option>
            <option value="sent">{t('admin.registrations.emailSent', 'Sent')}</option>
            <option value="failed">{t('admin.registrations.emailFailed', 'Failed')}</option>
            <option value="pending">{t('admin.registrations.emailPending', 'Pending')}</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">{t('admin.registrations.filterAll', 'All Categories')}</option>
            <option value="Guest">{t('admin.registrations.categories.Guest', 'Guest')}</option>
            <option value="Media / Press">{t('admin.registrations.categories.Media / Press', 'Media / Press')}</option>
            <option value="Photographer / Content Creator">{t('admin.registrations.categories.Photographer', 'Photographer / Content Creator')}</option>
            <option value="Organization Representative">{t('admin.registrations.categories.Organization Representative', 'Organization Representative')}</option>
            <option value="Artist / Cultural Guest">{t('admin.registrations.categories.Artist', 'Artist / Cultural Guest')}</option>
            <option value="Sponsor / Partner">{t('admin.registrations.categories.Sponsor', 'Sponsor / Partner')}</option>
            <option value="Volunteer">{t('admin.registrations.categories.Volunteer', 'Volunteer')}</option>
            <option value="Other">{t('admin.registrations.categories.Other', 'Other')}</option>
          </select>
        </div>
      </div>

      {/* Registrations Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{t('common.loading', 'Loading event registrations...')}</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="text-xs underline text-primary cursor-pointer"
            >
              {t('common.tryAgain', 'Try again')}
            </button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              {searchTerm || statusFilter !== 'all' || emailStatusFilter !== 'all' || categoryFilter !== 'all'
                ? t('admin.registrations.noMatches', 'No registrations match the selected filters.')
                : t('admin.registrations.noRegistrations', 'No event registrations found yet.')}
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              {t('admin.registrations.emptyDesc', 'New submissions from the public registration page will appear here instantly.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold uppercase tracking-wider text-start">
                  <th className="py-3.5 px-4">{t('admin.registrations.colRegId', 'Registration ID')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colAttendee', 'Attendee')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colContact', 'Contact Details')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colCategory', 'Category')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colStatus', 'Status')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colEmail', 'Email Delivery')}</th>
                  <th className="py-3.5 px-4">{t('admin.registrations.colDate', 'Registered At')}</th>
                  <th className="py-3.5 px-4 text-end">{t('admin.registrations.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-secondary/15 transition-colors group">
                    {/* Reg ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        dir="ltr"
                        className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 inline-block"
                      >
                        {reg.registration_number}
                      </span>
                    </td>

                    {/* Attendee */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-foreground text-sm block">
                          {reg.full_name}
                        </span>
                        {reg.organization_name && (
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[200px]">
                            {reg.organization_name}
                            {reg.job_title ? ` • ${reg.job_title}` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <a
                          href={`mailto:${reg.email}`}
                          dir="ltr"
                          className="text-foreground/90 hover:text-primary transition-colors block font-mono text-start"
                        >
                          {reg.email}
                        </a>
                        <span dir="ltr" className="text-[11px] text-muted-foreground block font-mono text-start">
                          {reg.phone_number}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
                        {getCategoryLabel(reg.category)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={reg.status} />
                    </td>

                    {/* Email Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.confirmation_email_status === 'sent'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : reg.confirmation_email_status === 'failed'
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        {getEmailStatusLabel(reg.confirmation_email_status)}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                      <span dir="ltr" className="font-mono inline-block">
                        {new Date(reg.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-end">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegistration(reg);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title={t('admin.registrations.viewDetails', 'View Details')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(reg)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title={t('admin.registrations.deleteTitle', 'Delete Registration')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && registrations.length > 0 && (
          <div className="p-4 border-t border-border bg-secondary/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {isAr
                ? `عرض ${registrations.length} من إجمالي ${totalCount} تسجيل (صفحة ${page} من ${totalPages})`
                : `Showing ${registrations.length} of ${totalCount} registrations (Page ${page} of ${totalPages})`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-colors disabled:opacity-40 cursor-pointer"
                aria-label="Previous page"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <span dir="ltr" className="px-3 font-semibold text-foreground font-mono inline-block">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-colors disabled:opacity-40 cursor-pointer"
                aria-label="Next page"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <RegistrationDetailModal
        registration={selectedRegistration}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRegistration(null);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTarget(null);
            }}
          >
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {t('admin.registrations.deleteTitle', 'Delete Registration')}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'admin.registrations.deleteConfirm',
                  'Are you sure you want to delete the registration for {{name}} ({{regNum}})? This action cannot be undone.',
                  {
                    name: deleteTarget.full_name,
                    regNum: deleteTarget.registration_number,
                  }
                )}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  {t('admin.registrations.modal.close', 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold transition-all hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting
                    ? t('common.deleting', 'Deleting...')
                    : t('admin.registrations.deleteTitle', 'Delete Registration')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminRegistrationsPage;
