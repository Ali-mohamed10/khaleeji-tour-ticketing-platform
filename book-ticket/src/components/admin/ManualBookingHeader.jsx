import { useTranslation } from 'react-i18next';
import { TicketPlus, Sparkles } from 'lucide-react';

export const ManualBookingHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <TicketPlus className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-sans text-foreground">
              {t('admin.manualBooking.title', 'Manual / Offline Booking')}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              {t('admin.manualBooking.badge', 'Cash & WhatsApp')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'admin.manualBooking.subtitle',
              'Register offline bookings for Cash or WhatsApp guests. Automatically updates tables, issues tickets, and emails official QR confirmations.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
