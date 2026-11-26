import { ShieldCheck, CheckCircle2, ArrowUpRight, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AttendanceGuidelinesSection = ({
  isAccepted,
  onOpenModal,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isAccepted
          ? 'bg-primary/10 border-primary/50 shadow-sm'
          : 'bg-secondary/30 border-border hover:border-primary/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Text & Icon */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
              isAccepted
                ? 'bg-primary/20 text-primary border-primary/35'
                : 'bg-primary/15 text-primary border-primary/25'
            }`}
          >
            {isAccepted ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-primary" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {isAr
                  ? 'إرشادات الحضور والبروتوكول'
                  : 'Attendance Guidelines & Protocol'}
              </h3>
              {isAccepted && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {isAr ? 'تمت الموافقة ✔' : 'Completed ✔'}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-primary/85">
              {isAr
                ? 'Attendance Guidelines & Protocol'
                : 'إرشادات الحضور والبروتوكول'}
            </p>

            {isAccepted ? (
              <p className="text-xs text-primary font-bold leading-relaxed pt-0.5 flex items-center gap-1.5">
                <span>
                  {isAr
                    ? '✔ تم الاطلاع والموافقة على إرشادات الحضور والبروتوكول'
                    : '✔ Attendance Guidelines reviewed and accepted'}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                {isAr
                  ? 'يرجى الاطلاع على إرشادات الحضور قبل إتمام التسجيل.'
                  : 'Please review the attendance guidelines before completing your registration.'}
              </p>
            )}
          </div>
        </div>

        {/* Action Button: full width on mobile for easy tapping without text wrap */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenModal}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isAccepted
                ? 'bg-secondary/60 hover:bg-secondary text-foreground border border-border'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isAccepted ? (
              <>
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>{isAr ? 'مراجعة الإرشادات' : 'Review Guidelines'}</span>
              </>
            ) : (
              <>
                <span>{isAr ? 'عرض الإرشادات' : 'View Guidelines'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGuidelinesSection;
