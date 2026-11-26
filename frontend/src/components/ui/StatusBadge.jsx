import { useTranslation } from 'react-i18next';

export const StatusBadge = ({ status, className = '' }) => {
  const { t } = useTranslation();

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'attended':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'soon':
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'draft':
        return 'bg-muted/40 text-muted-foreground border-border';
      case 'registered':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-secondary/20 text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return t('common.unknown', 'Unknown');
    const lower = status.toLowerCase();
    switch (lower) {
      case 'registered':
        return t('admin.registrations.statusRegistered', 'Registered');
      case 'attended':
        return t('admin.registrations.statusAttended', 'Attended');
      case 'cancelled':
        return t('admin.registrations.statusCancelled', 'Cancelled');
      case 'published':
        return t('admin.events.statusPublished', 'Published');
      case 'draft':
        return t('admin.events.statusDraft', 'Draft');
      case 'completed':
        return t('admin.events.statusCompleted', 'Completed');
      case 'soon':
        return t('admin.events.statusSoon', 'Soon');
      case 'sent':
        return t('admin.registrations.emailSent', 'Sent');
      case 'failed':
        return t('admin.registrations.emailFailed', 'Failed');
      case 'pending':
        return t('admin.registrations.emailPending', 'Pending');
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
        ${getStatusStyles(status)}
        ${className}
      `}
    >
      {getStatusLabel(status)}
    </span>
  );
};
