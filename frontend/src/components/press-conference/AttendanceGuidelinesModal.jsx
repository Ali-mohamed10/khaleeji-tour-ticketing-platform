import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  VolumeX,
  Camera,
  Shirt,
  Sparkles,
} from 'lucide-react';

export const AttendanceGuidelinesModal = ({
  isOpen,
  onClose,
  onAgree,
  _isAlreadyAccepted = false,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Prevent background body scroll & support Escape key
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

  if (!isOpen) return null;

  const GUIDELINES = [
    {
      id: 1,
      icon: UserCheck,
      titleAr: '1. التسجيل والدخول',
      titleEn: 'Registration & Entry',
      descAr: 'الدخول للمسجلين مسبقًا، ويُرجى إبراز تأكيد التسجيل عند الوصول.',
      descEn: 'Entry is available to pre-registered attendees. Please present your registration confirmation upon arrival.',
    },
    {
      id: 2,
      icon: Clock,
      titleAr: '2. الوصول',
      titleEn: 'Arrival',
      descAr: 'يرجى الحضور قبل بدء البرنامج بوقت كافٍ لإتمام إجراءات الاستقبال والتسجيل.',
      descEn: 'Please arrive early enough to complete the reception and check-in process.',
    },
    {
      id: 3,
      icon: Shirt,
      titleAr: '3. الزي',
      titleEn: 'Dress Code',
      descAr: 'الزي الرسمي أو شبه الرسمي هو المعتمد للمؤتمر.',
      descEn: 'Formal or business attire is requested for the conference.',
    },
    {
      id: 4,
      icon: ShieldCheck,
      titleAr: '4. تنظيم القاعة',
      titleEn: 'Venue Protocol',
      descAr: 'يرجى الالتزام بتوجيهات فريق التنظيم والمقاعد المحددة إن وجدت، وتجنب الحركة أثناء الكلمات والجلسات الرسمية.',
      descEn: 'Please follow the event team’s instructions and assigned seating, where applicable, and minimize movement during official sessions.',
    },
    {
      id: 5,
      icon: VolumeX,
      titleAr: '5. الهواتف والتدخين',
      titleEn: 'Phones & Smoking',
      descAr: 'يرجى ضبط الهواتف على الوضع الصامت. ويمنع التدخين والسجائر الإلكترونية داخل قاعة المؤتمر.',
      descEn: 'Please keep mobile phones on silent. Smoking and vaping are not permitted inside the conference hall.',
    },
    {
      id: 6,
      icon: Camera,
      titleAr: '6. التصوير والتغطية الإعلامية',
      titleEn: 'Photography & Media Coverage',
      descAr: 'يرجى العلم بأن المؤتمر سيشهد تصويرًا فوتوغرافيًا وتصوير فيديو وتغطية إعلامية، وقد يظهر الحضور ضمن المواد المنشورة الخاصة بالفعالية.',
      descEn: 'Please note that photography, video recording, and media coverage will take place during the conference, and attendees may appear in event-related published content.',
    },
  ];

  const handleAgreeClick = () => {
    onAgree?.();
    onClose?.();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-guidelines-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/15 text-primary border border-primary/25">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2
                id="attendance-guidelines-title"
                className="text-base sm:text-lg font-bold font-sans text-foreground"
              >
                {isAr
                  ? 'إرشادات الحضور والبروتوكول'
                  : 'Attendance Guidelines & Protocol'}
              </h2>
              <p className="text-xs text-primary font-semibold">
                {isAr
                  ? 'Attendance Guidelines & Protocol'
                  : 'إرشادات الحضور والبروتوكول'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Welcome/Intro Note */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-secondary/30 border border-border/80 text-xs sm:text-sm text-foreground/90 leading-relaxed">
            <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>المؤتمر الصحفي الرابع — The 4th Press Conference</span>
            </p>
            <p>
              حرصًا على تنظيم المؤتمر الصحفي الرابع بصورة مهنية تليق بضيوفنا والإعلاميين، نرجو مراعاة الإرشادات التالية:
            </p>
          </div>

          {/* Guidelines List */}
          <div className="space-y-3">
            {GUIDELINES.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-background/60 border border-border/70 hover:border-primary/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                        {item.titleAr}
                      </h3>
                      <p className="text-[11px] text-primary/80 font-medium mt-0.5">
                        {item.titleEn}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-border/40">
                    <p className="text-xs text-foreground/85 leading-relaxed">
                      {item.descAr}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thank You Note */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1">
            <p className="text-xs sm:text-sm font-bold text-primary">
              نشكر لكم تعاونكم، ونتطلع إلى حضوركم.
            </p>
            <p className="text-xs text-muted-foreground">
              Thank you for your cooperation. We look forward to welcoming you.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer order-2 sm:order-1"
          >
            {isAr ? 'إلغاء' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleAgreeClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold tracking-wide hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isAr
                ? 'قرأت الإرشادات وأوافق على الالتزام بها'
                : 'I Have Read and Agree to Follow the Guidelines'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AttendanceGuidelinesModal;
