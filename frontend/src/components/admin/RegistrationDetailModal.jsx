import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Share2,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Download,
  QrCode,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { registrationService } from '../../services/registrationService';

export const RegistrationDetailModal = ({
  registration,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [selectedStatus, setSelectedStatus] = useState(registration?.status || 'registered');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sync state when registration prop updates
  useEffect(() => {
    if (registration?.status) {
      setSelectedStatus(registration.status);
    }
  }, [registration?.status]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !registration) return null;

  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      setFeedback(null);
      await onStatusChange(registration.id, newStatus);
      setSelectedStatus(newStatus);
      setFeedback({
        type: 'success',
        text: t('admin.registrations.statusUpdated', 'Status updated successfully.'),
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || t('common.error', 'An error occurred.'),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formattedDate = registration.created_at
    ? new Date(registration.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : t('admin.registrations.modal.notProvided', 'N/A');

  const emailSentDate = registration.confirmation_email_sent_at
    ? new Date(registration.confirmation_email_sent_at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  const qrUrl = registration.qr_code_url || registrationService.getQrCodeUrl(registration);

  const handleDownloadModalQr = async () => {
    if (!qrUrl) return;
    try {
      const filename = `KhaleejiTour-Pass-${registration.registration_number || 'QR'}.png`;
      if (qrUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download QR failed:', err);
      window.open(qrUrl, '_blank');
    }
  };

  const getStatusLabel = (st) => {
    switch (st?.toLowerCase()) {
      case 'registered':
        return t('admin.registrations.statusRegistered', 'Registered');
      case 'attended':
        return t('admin.registrations.statusAttended', 'Attended');
      case 'cancelled':
        return t('admin.registrations.statusCancelled', 'Cancelled');
      default:
        return st;
    }
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

  const getDiscoveryLabel = (src) => {
    if (!src) return t('admin.registrations.modal.notProvided', 'Unknown');
    return t(`admin.registrations.discoverySources.${src}`, src);
  };

  const getLanguageLabel = (lang) => {
    if (!lang) return t('admin.registrations.languages.ar', 'العربية');
    const l = lang.toLowerCase();
    if (l === 'ar') return t('admin.registrations.languages.ar', 'العربية');
    if (l === 'en') return t('admin.registrations.languages.en', 'English');
    if (l === 'both') return t('admin.registrations.languages.both', 'كلاهما (Both)');
    return lang.toUpperCase();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-foreground animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {registration.full_name}
                </h2>
                <span
                  dir="ltr"
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 shrink-0"
                >
                  {registration.registration_number}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {registration.event_title || t('admin.registrations.modal.title', 'Event Registration')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer shrink-0"
            aria-label={t('admin.registrations.modal.close', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
          {/* Status & Delivery Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Attendance Status Control */}
            <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('admin.registrations.modal.attendanceStatus', 'Attendance Status')}
                </span>
                <StatusBadge status={selectedStatus} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {['registered', 'attended', 'cancelled'].map((st) => {
                  const isActive = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-background hover:bg-secondary border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {getStatusLabel(st)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Confirmation Info */}
            <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/80 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t('admin.registrations.modal.emailConfirmation', 'Confirmation Email')}
              </span>
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    registration.confirmation_email_status === 'sent'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : registration.confirmation_email_status === 'failed'
                      ? 'bg-destructive/15 text-destructive border border-destructive/30'
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {getEmailStatusLabel(registration.confirmation_email_status)}
                </span>
                {emailSentDate && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-primary shrink-0" />
                    <span dir="ltr" className="font-mono">{emailSentDate}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attendee Details 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Email */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.email', 'Email')}
                </span>
                <a
                  href={`mailto:${registration.email}`}
                  dir="ltr"
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block text-start font-mono"
                >
                  {registration.email}
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.phone', 'Phone / WhatsApp')}
                </span>
                <a
                  href={`https://wa.me/${registration.phone_number?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span dir="ltr" className="font-mono">{registration.phone_number}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </a>
              </div>
            </div>

            {/* City */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.city', 'City')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {registration.city || t('admin.registrations.modal.notProvided', 'Not provided')}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.category', 'Category')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {getCategoryLabel(registration.category)}
                </span>
              </div>
            </div>

            {/* Organization */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.organization', 'Organization / Company')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {registration.organization_name || t('admin.registrations.modal.individual', 'Individual / None')}
                </span>
              </div>
            </div>

            {/* Job Title */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Briefcase className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.jobTitle', 'Position / Title')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {registration.job_title || t('admin.registrations.modal.notProvided', 'N/A')}
                </span>
              </div>
            </div>

            {/* Discovery Source */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Share2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.discoverySource', 'Discovery Source')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {getDiscoveryLabel(registration.discovery_source)}
                </span>
              </div>
            </div>

            {/* Preferred Language */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t('admin.registrations.modal.preferredLanguage', 'Preferred Language')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {getLanguageLabel(registration.preferred_language)}
                </span>
              </div>
            </div>
          </div>

          {/* Submitted Q&A Section (if provided) */}
          {(registration.question_text || registration.question_topic) && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? 'سؤال المؤتمر المقدم (Q&A)' : 'Submitted Conference Question (Q&A)'}</span>
                </div>
                {registration.question_topic && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                    {registration.question_topic}
                  </span>
                )}
              </div>
              {registration.question_text ? (
                <p className="text-xs text-foreground/90 bg-background/60 p-3 rounded-lg border border-border leading-relaxed whitespace-pre-wrap">
                  {registration.question_text}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {isAr ? 'لم يقم الحاضر بكتابة نص السؤال (حدد الموضوع فقط).' : 'No question text provided (topic only).'}
                </p>
              )}
            </div>
          )}

          {/* QR Code Pass Section */}
          {qrUrl && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-primary/30 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 bg-white p-2 rounded-xl shadow border border-stone-200 shrink-0 flex items-center justify-center">
                <img
                  src={qrUrl}
                  alt={`QR Code - ${registration.registration_number}`}
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex-1 text-center sm:text-start space-y-1.5 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-primary">
                  <QrCode className="w-4 h-4" />
                  <span>{t('admin.registrations.modal.qrTitle', 'Official Gate Pass QR Code')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'admin.registrations.modal.qrDesc',
                    'Encodes registration ID, attendee name, and check-in tokens for fast gate entry.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleDownloadModalQr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('admin.registrations.modal.downloadQr', 'Download QR Image')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Registration Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>
              {t('admin.registrations.modal.submittedAt', 'Registration Submitted:')}{' '}
              <span dir="ltr" className="font-mono inline-block">{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 flex items-center justify-end px-6 py-3.5 border-t border-border bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('admin.registrations.modal.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RegistrationDetailModal;
