import { useState, useId, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Mail,
  User,
  Share2,
  AlertCircle,
  Download,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import PhoneInput from '../../components/common/PhoneInput';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormButton } from '../../components/ui/FormButton';
import { registrationService } from '../../services/registrationService';
import pressConferencePoster from '../../assets/The 4th Press Conference.webp';
import { ConferenceQuestionSection } from '../../components/press-conference/ConferenceQuestionSection';
import { AttendanceGuidelinesSection } from '../../components/press-conference/AttendanceGuidelinesSection';
import { AttendanceGuidelinesModal } from '../../components/press-conference/AttendanceGuidelinesModal';
import { ConferenceHighlightsSection } from '../../components/press-conference/ConferenceHighlightsSection';

const FORM_STORAGE_KEY = 'kt_press_conference_form_draft';

const getInitialDraft = () => {
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('[PressConferenceRegister] Failed to read localStorage draft:', err);
  }
  return null;
};

export const PressConferenceRegisterPage = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const confirmationCheckboxId = useId();

  // Form State initialized from localStorage draft if present
  const [formData, setFormData] = useState(() => {
    const draft = getInitialDraft();
    return {
      fullName: draft?.formData?.fullName || '',
      email: draft?.formData?.email || '',
      phone: draft?.formData?.phone || '',
      city: draft?.formData?.city || '',
      category: draft?.formData?.category || '',
      organizationName: draft?.formData?.organizationName || '',
      jobTitle: draft?.formData?.jobTitle || '',
      discoverySource: draft?.formData?.discoverySource || '',
      preferredLanguage: draft?.formData?.preferredLanguage || (isRtl ? 'ar' : 'en'),
      confirmationAgreed: draft?.formData?.confirmationAgreed || false,
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const [questionTopic, setQuestionTopic] = useState(() => {
    const draft = getInitialDraft();
    return draft?.questionTopic || '';
  });

  const [questionText, setQuestionText] = useState(() => {
    const draft = getInitialDraft();
    return draft?.questionText || '';
  });

  const [guidelinesAccepted, setGuidelinesAccepted] = useState(() => {
    const draft = getInitialDraft();
    return draft?.guidelinesAccepted || false;
  });

  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);

  // Auto-save form draft to localStorage whenever user modifies any field
  useEffect(() => {
    if (registrationResult) return;

    try {
      const draft = {
        formData,
        questionTopic,
        questionText,
        guidelinesAccepted,
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage quota exceeded or disabled
    }
  }, [formData, questionTopic, questionText, guidelinesAccepted, registrationResult]);

  // Field change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhoneChange = (phone) => {
    setFormData((prev) => ({ ...prev, phone }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData((prev) => ({ ...prev, confirmationAgreed: e.target.checked }));
    if (errors.confirmationAgreed) {
      setErrors((prev) => ({ ...prev, confirmationAgreed: null }));
    }
  };

  // Client Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('pressConference.errors.fullNameRequired', 'Please enter your full name');
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = t('pressConference.errors.emailRequired', 'Please enter a valid email address');
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 7) {
      newErrors.phone = t('pressConference.errors.phoneRequired', 'Please enter a valid phone number');
    }

    if (!formData.category) {
      newErrors.category = t('pressConference.errors.categoryRequired', 'Please select your attendance category');
    }

    if (!formData.confirmationAgreed) {
      newErrors.confirmationAgreed = t(
        'pressConference.errors.agreementRequired',
        'You must confirm that the information is correct'
      );
    }

    if (!guidelinesAccepted) {
      newErrors.guidelines = t(
        'pressConference.errors.guidelinesRequired',
        'You must review and agree to the Attendance Guidelines & Protocol before completing registration'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registrationService.submitRegistration({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        city: formData.city,
        category: formData.category,
        organizationName: formData.organizationName,
        jobTitle: formData.jobTitle,
        discoverySource: formData.discoverySource,
        preferredLanguage: formData.preferredLanguage,
        eventTitle: 'The 4th Press Conference',
        questionTopic: questionTopic.trim() || undefined,
        questionText: questionText.trim() || undefined,
      });

      setRegistrationResult(response.registration);
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch {
        // Storage clearing error ignored
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Registration submission failed:', err);
      setSubmitError(err.message || 'An error occurred while submitting your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Registration ID helper
  const handleCopyRegId = () => {
    if (registrationResult?.registration_number) {
      navigator.clipboard.writeText(registrationResult.registration_number);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Download .ics calendar event
  const handleDownloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Khaleeji Tour//Press Conference 2026//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:khaleeji-press-conference-4@khaleejitour.com',
      'DTSTAMP:20260915T000000Z',
      'DTSTART:20260923T231500Z',
      'DTEND:20260924T010000Z',
      'SUMMARY:The 4th Press Conference - Khaleeji Tour 2026',
      'DESCRIPTION:Official Press Conference for Khaleeji Tour 2026 announcements. Advance registration required.',
      'LOCATION:Holiday Inn & Suites Mississauga West / Meadowvale, 2565 Argentia Road, Mississauga, ON L5N 5V4, Canada',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Khaleeji-Tour-Press-Conference-4.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQr = async () => {
    const qrUrl = registrationResult?.qr_code_url || registrationService.getQrCodeUrl(registrationResult);
    if (!qrUrl) return;

    try {
      const filename = `KhaleejiTour-Pass-${registrationResult?.registration_number || 'QR'}.png`;

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
      console.error('Failed to download QR code image:', err);
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background text-foreground transition-colors">
      <SEO
        title={t('pressConference.title', 'Official Registration – The 4th Press Conference')}
        description={t('pressConference.description', 'Official registration for The 4th Press Conference — Khaleeji Tour 2026 at Holiday Inn & Suites Mississauga West.')}
        image={pressConferencePoster}
      />

      <div className="container max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* ======================================================== */}
        {/* SUCCESS VIEW */}
        {/* ======================================================== */}
        {registrationResult ? (
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-premium animate-fade-in space-y-8 text-center">
            {/* Success Icon */}
            <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
              <div className="relative w-full h-full rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
            </div>

            {/* Header Titles */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                {t('pressConference.badge', 'Official Registration')}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-sans text-foreground">
                {t('pressConference.successTitle', 'Registration Received Successfully')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t(
                  'pressConference.successMessage',
                  'Thank you for registering for The 4th Press Conference. A confirmation email with attendance details will be sent to your email address.'
                )}
              </p>
            </div>

            {/* Registration ID Highlight Card */}
            <div className="max-w-md mx-auto p-5 sm:p-6 bg-secondary/30 border border-primary/30 rounded-2xl space-y-2 relative group hover:border-primary transition-colors">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('pressConference.regIdLabel', 'Registration ID')}
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-primary">
                  {registrationResult.registration_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRegId}
                  className="p-2 rounded-lg bg-background border border-border hover:bg-secondary text-foreground transition-all cursor-pointer"
                  title="Copy Registration ID"
                  aria-label="Copy Registration ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('pressConference.fullNameLabel', 'Attendee')}: <strong className="text-foreground">{registrationResult.full_name}</strong>
              </p>
            </div>

            {/* QR Code Pass Card */}
            {(() => {
              const qrUrl = registrationResult.qr_code_url || registrationService.getQrCodeUrl(registrationResult);
              return (
                <div className="max-w-md mx-auto p-4 sm:p-6 bg-card/90 border-2 border-primary/40 rounded-3xl shadow-xl space-y-4 text-center relative overflow-hidden backdrop-blur transition-all duration-300 hover:border-primary/70">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>{t('pressConference.passTitle', 'Official Entry Pass')}</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 max-w-full text-center">
                      {registrationResult.category || 'Guest'}
                    </span>
                  </div>

                  {/* QR Image Box */}
                  <div className="relative mx-auto w-48 h-48 sm:w-60 sm:h-60 bg-white p-3 rounded-2xl shadow-inner border border-stone-200 flex items-center justify-center">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR Code Pass - ${registrationResult.registration_number}`}
                        className="w-full h-full object-contain select-none"
                      />
                    ) : (
                      <div className="text-muted-foreground text-xs font-medium">Generating QR...</div>
                    )}
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-muted-foreground leading-relaxed px-1">
                    {t(
                      'pressConference.qrNotice',
                      'Please present this QR code at the entrance or download it for offline access.'
                    )}
                  </p>

                  {/* Download QR Button */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('pressConference.downloadQr', 'Download QR Code as Image')}</span>
                  </button>

                  {/* Email Sent Confirmation Badge - Brand Gold Theme */}
                  <div className="flex items-start sm:items-center justify-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/25 text-primary text-xs font-medium text-start sm:text-center leading-relaxed">
                    <div className="p-1.5 rounded-lg bg-primary/15 shrink-0 mt-0.5 sm:mt-0">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    <span className="flex-1 text-foreground/90 font-medium">
                      {t(
                        'pressConference.emailSentNote',
                        'A copy of this QR code and registration details has also been sent to your email.'
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Event Summary Card */}
            <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 sm:p-4 bg-background/50 border border-border rounded-2xl text-start text-xs divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-border/60">
              <div className="flex items-center gap-2.5 p-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block font-medium">
                    {t('pressConference.summaryDate', 'Date')}
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {isRtl ? '23 سبتمبر 2026' : 'Sept 23, 2026'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 pt-3 sm:pt-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block font-medium">
                    {t('pressConference.summaryTime', 'Time')}
                  </span>
                  <span dir="ltr" className="font-semibold text-foreground inline-block">
                    7:15 PM – 9:00 PM
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 pt-3 sm:pt-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block font-medium">
                    {t('pressConference.summaryVenue', 'Venue')}
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {t('pressConference.summaryVenueName', 'Holiday Inn & Suites')}
                  </span>
                </div>
              </div>
            </div>

            {/* View Guidelines Link in Confirmation */}
            <div className="pt-2 flex justify-center w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setIsGuidelinesModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary transition-all cursor-pointer shadow-xs hover:border-primary/45 group"
              >
                <div className="p-1.5 rounded-lg bg-primary/15 text-primary shrink-0 group-hover:bg-primary/25 transition-colors">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:gap-2 leading-snug text-center">
                  <span className="text-xs font-bold text-foreground">
                    {isRtl ? 'عرض إرشادات الحضور والبروتوكول' : 'View Attendance Guidelines'}
                  </span>
                  <span className="text-[11px] text-primary font-medium sm:before:content-['|'] sm:before:mx-1.5 sm:before:text-primary/40">
                    {isRtl ? 'View Attendance Guidelines' : 'عرض إرشادات الحضور والبروتوكول'}
                  </span>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-sm font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-primary" />
                <span>{t('pressConference.calendarBtn', 'Add to Calendar')}</span>
              </button>

              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 transition-colors"
              >
                <span>{t('pressConference.backHome', 'Back to Home')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 2-COLUMN RESPONSIVE LAYOUT */
          /* ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-fade-in">
            {/* ======================================================== */}
            {/* LEFT COLUMN: FULL UNCLIPPED POSTER & EVENT HIGHLIGHTS */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              {/* Full Unclipped Poster Container */}
              <div className="rounded-3xl max-w-[400px] max-h-[600px] mx-auto border border-primary/30 shadow-2xl overflow-hidden bg-card/60 backdrop-blur group relative transition-all duration-300 hover:border-primary/60 hover:shadow-primary/10">
                <img
                  src={pressConferencePoster}
                  alt="The 4th Press Conference Official Poster - Khaleeji Tour"
                  className="w-full h-auto object-contain block rounded-3xl select-none"
                  loading="eager"
                />
              </div>

              {/* Event Quick Info Card */}
              <div className="p-5 rounded-2xl bg-card border border-border shadow-md space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Khaleeji Tour 2026
                  </span>
                  
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 text-foreground/90">
                    <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Wednesday, September 23, 2026</span>
                      <span className="text-muted-foreground">الأربعاء 23 سبتمبر 2026</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-foreground/90">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">7:15 PM – 9:00 PM (Doors open at 6:45 PM)</span>
                      <span className="text-muted-foreground">7:15 مساءً – 9:00 مساءً (فتح الأبواب 6:45 م)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-foreground/90">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Holiday Inn & Suites Mississauga West / Meadowvale</span>
                      <span className="text-muted-foreground">2565 Argentia Road, Mississauga, ON L5N 5V4</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Add to Calendar</span>
                  </button>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Holiday+Inn+%26+Suites+Mississauga+West+2565+Argentia+Road+Mississauga+ON+L5N+5V4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary text-foreground text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Map</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: REGISTRATION DETAILS & FORM */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header Title Box */}
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-premium space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-primary/15 text-primary border border-primary/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('pressConference.badge', 'Official Registration')}
                  </span>
                 
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans text-foreground leading-tight">
                    {t('pressConference.title', 'Official Registration – The 4th Press Conference')}
                  </h1>
                  <p className="text-lg sm:text-xl font-bold text-primary mt-1" dir="rtl">
                    {t('pressConference.titleAr', 'التسجيل الرسمي – المؤتمر الصحفي الرابع')}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    {t(
                      'pressConference.description',
                      'We are pleased to welcome your registration for The 4th Press Conference, featuring official announcements related to upcoming media and cultural initiatives, including Khaleeji Tour 2026. Advance registration is required.'
                    )}
                  </p>
                  <p className="text-xs text-foreground/80 bg-secondary/30 p-3 rounded-xl border border-border/80" dir="rtl">
                    يشهد المؤتمر الإطلاق الرسمي للهيئة العامة للإعلام المرئي والمسموع الخليجي والعربي في كندا، والإعلان عن تفاصيل الأمسية الشعرية المرتقبة للشاعر القطري ناصر الوبير المقررة في 11 أكتوبر 2026.
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {submitError && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-3 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Registration Form Box */}
              <form
                onSubmit={handleSubmit}
                className="p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-premium space-y-6 sm:space-y-8"
                noValidate
              >
                {/* Section 1: Attendee Information */}
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-base sm:text-lg font-bold font-sans text-foreground flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <span>{t('pressConference.formSectionTitle', 'Attendee Information')}</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <FormInput
                      label={`${t('pressConference.fullNameLabel', 'Full Name')} *`}
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={t('pressConference.fullNamePlaceholder', 'Enter your full name')}
                      error={errors.fullName}
                      required
                    />

                    {/* Email */}
                    <FormInput
                      label={`${t('pressConference.emailLabel', 'Email Address')} *`}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t('pressConference.emailPlaceholder', 'example@email.com')}
                      error={errors.email}
                      required
                    />

                    {/* Phone / WhatsApp with PhoneInput */}
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-sm font-medium text-foreground">
                        {t('pressConference.phoneLabel', 'Phone / WhatsApp')} *
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        error={errors.phone}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    {/* City */}
                    <FormInput
                      label={t('pressConference.cityLabel', 'City')}
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder={t('pressConference.cityPlaceholder', 'e.g. Mississauga, Toronto, Oakville...')}
                    />
                  </div>

                  {/* Registration Category Select */}
                  <div className="pt-2">
                    <FormSelect
                      label={`${t('pressConference.categoryLabel', 'Registration Category')} *`}
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      error={errors.category}
                      required
                    >
                      <option value="">{t('pressConference.categoryPlaceholder', 'Select from the list...')}</option>
                      <option value="Guest">{t('pressConference.categories.guest', 'Guest | ضيف')}</option>
                      <option value="Media / Press">
                        {t('pressConference.categories.media', 'Media / Press | إعلامي / صحفي')}
                      </option>
                      <option value="Photographer / Content Creator">
                        {t(
                          'pressConference.categories.photographer',
                          'Photographer / Content Creator | مصور / صانع محتوى'
                        )}
                      </option>
                      <option value="Organization Representative">
                        {t(
                          'pressConference.categories.orgRepresentative',
                          'Organization Representative | ممثل جهة أو مؤسسة'
                        )}
                      </option>
                      <option value="Artist / Cultural Guest">
                        {t(
                          'pressConference.categories.artist',
                          'Artist / Cultural Guest | فنان / شخصية ثقافية'
                        )}
                      </option>
                      <option value="Sponsor / Partner">
                        {t('pressConference.categories.sponsor', 'Sponsor / Partner | راعٍ / شريك')}
                      </option>
                      <option value="Volunteer">{t('pressConference.categories.volunteer', 'Volunteer | متطوع')}</option>
                      <option value="Other">{t('pressConference.categories.other', 'Other | أخرى')}</option>
                    </FormSelect>
                  </div>
                </div>

                {/* Section 2: Organization / Company */}
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-base sm:text-lg font-bold font-sans text-foreground flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span>{t('pressConference.organizationSection', 'Organization / Company')}</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label={t('pressConference.organizationLabel', 'Organization / Company Name')}
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      placeholder={t('pressConference.organizationPlaceholder', 'Optional')}
                    />

                    <FormInput
                      label={t('pressConference.jobTitleLabel', 'Position / Title')}
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      placeholder={t('pressConference.jobTitlePlaceholder', 'Optional')}
                    />
                  </div>
                </div>

                {/* Section 3: Additional Information */}
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-base sm:text-lg font-bold font-sans text-foreground flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-primary" />
                      <span>{t('pressConference.additionalSection', 'Additional Information')}</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* How did you hear about event? */}
                    <FormSelect
                      label={t('pressConference.discoveryLabel', 'How did you hear about the event?')}
                      name="discoverySource"
                      value={formData.discoverySource}
                      onChange={handleInputChange}
                    >
                      <option value="">{t('pressConference.discoveryPlaceholder', 'Select source...')}</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Website">{t('pressConference.discoverySources.website', 'Website')}</option>
                      <option value="Invitation">{t('pressConference.discoverySources.invitation', 'Invitation | دعوة')}</option>
                      <option value="Media">{t('pressConference.discoverySources.media', 'Media | وسائل الإعلام')}</option>
                      <option value="Friend / Colleague">
                        {t('pressConference.discoverySources.friend', 'Friend / Colleague | صديق / زميل')}
                      </option>
                      <option value="Other">{t('pressConference.discoverySources.other', 'Other | أخرى')}</option>
                    </FormSelect>

                    {/* Preferred Language */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        {t('pressConference.languageLabel', 'Preferred Language')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'ar', label: t('pressConference.languages.ar', 'العربية') },
                          { id: 'en', label: t('pressConference.languages.en', 'English') },
                          { id: 'both', label: t('pressConference.languages.both', 'Both | كلاهما') },
                        ].map((lang) => (
                          <label
                            key={lang.id}
                            className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              formData.preferredLanguage === lang.id
                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                                : 'border-input hover:border-border text-muted-foreground'
                            }`}
                          >
                            <input
                              type="radio"
                              name="preferredLanguage"
                              value={lang.id}
                              checked={formData.preferredLanguage === lang.id}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <span>{lang.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Confirmation Agreement */}
                <div className="p-4 sm:p-5 rounded-2xl bg-secondary/20 border border-border/80 space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={confirmationCheckboxId}
                      checked={formData.confirmationAgreed}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 mt-1 text-primary bg-background border-input rounded focus:ring-primary cursor-pointer accent-primary"
                    />
                    <label
                      htmlFor={confirmationCheckboxId}
                      className="text-xs sm:text-sm text-foreground/90 leading-relaxed cursor-pointer select-none"
                    >
                      {t(
                        'pressConference.confirmationAgreement',
                        'I confirm that the information provided is correct and understand that registration confirmation and event details will be sent to my registered email address.'
                      )}
                    </label>
                  </div>
                  {errors.confirmationAgreed && (
                    <p className="text-xs text-destructive font-medium pl-7">
                      {errors.confirmationAgreed}
                    </p>
                  )}
                </div>

                {/* Section 5: Optional Question Submission */}
                <ConferenceQuestionSection
                  topic={questionTopic}
                  question={questionText}
                  onTopicChange={setQuestionTopic}
                  onQuestionChange={setQuestionText}
                />

                {/* Section 6: Attendance Guidelines & Protocol Card */}
                <div className="space-y-2">
                  <AttendanceGuidelinesSection
                    isAccepted={guidelinesAccepted}
                    onOpenModal={() => setIsGuidelinesModalOpen(true)}
                  />
                  {errors.guidelines && (
                    <p className="text-xs text-destructive font-medium px-2">
                      {errors.guidelines}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2 space-y-2">
                  <FormButton
                    type="submit"
                    disabled={isSubmitting || !guidelinesAccepted}
                    className="w-full py-4 text-base font-extrabold tracking-wide uppercase shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {isSubmitting
                      ? t('pressConference.submitting', 'Submitting Registration...')
                      : t('pressConference.submitBtn', 'REGISTER NOW | سجّل الآن')}
                  </FormButton>

                  {!guidelinesAccepted && (
                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                      {isRtl
                        ? 'يرجى الاطلاع على إرشادات الحضور والموافقة عليها لتفعيل زر التسجيل'
                        : 'Please review and accept attendance guidelines to enable registration'}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CONFERENCE HIGHLIGHTS (FULL-WIDTH BELOW REGISTRATION AREA) */}
        {/* ======================================================== */}
        <ConferenceHighlightsSection />

        {/* Attendance Guidelines Interactive Modal */}
        <AttendanceGuidelinesModal
          isOpen={isGuidelinesModalOpen}
          onClose={() => setIsGuidelinesModalOpen(false)}
          onAgree={() => {
            setGuidelinesAccepted(true);
            if (errors.guidelines) {
              setErrors((prev) => ({ ...prev, guidelines: null }));
            }
          }}
          isAlreadyAccepted={guidelinesAccepted}
        />
      </div>
    </div>
  );
};

export default PressConferenceRegisterPage;
