/**
 * SeatMapLegend Component
 *
 * Purpose: Display legend showing table categories & pricing as well as table status visual treatments.
 *          Dynamically adapts pricing labels based on the active seat map (Hillm vs Gul Gul).
 * Input: seatMapSlug (string) — the slug of the active seat map
 * Output: Legend card with category swatches and status indicators
 * Dependencies: react-i18next, seatMapConstants
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TABLE_STATUSES } from '../../utils/seatMapConstants';

/**
 * Pricing configurations per venue.
 * Hillm Venues: VIP Room $1500, VIP Premium $110, VIP Standard $100, General $90
 * Gul Gul: VIP Premium $75, VIP Standard $65, General $55
 */
const HILLM_PRICING = {
  hasVipRoom: true,
  vipRoom: { labelKey: 'seatMap.hillmVipRoom', fallback: 'VIP Room ($125)' },
  vipPremium: { labelKey: 'seatMap.hillmVipPremium', fallback: 'VIP Premium ($110)' },
  vipStandard: { labelKey: 'seatMap.hillmVipStandard', fallback: 'VIP Standard ($100)' },
  general: { labelKey: 'seatMap.hillmGeneral', fallback: 'General ($90)' },
};

const GULGUL_PRICING = {
  hasVipRoom: false,
  vipPremium: { labelKey: 'seatMap.gulgulVipPremium', fallback: 'VIP Premium ($75)' },
  vipStandard: { labelKey: 'seatMap.gulgulVipStandard', fallback: 'VIP Standard ($65)' },
  general: { labelKey: 'seatMap.gulgulGeneral', fallback: 'General ($55)' },
};

export const SeatMapLegend = ({ seatMapSlug = '' }) => {
  const { t } = useTranslation();

  const isGulGul = useMemo(() => {
    const slug = (seatMapSlug || '').toLowerCase();
    return slug.includes('gul') || slug.includes('windsor');
  }, [seatMapSlug]);

  const pricing = isGulGul ? GULGUL_PRICING : HILLM_PRICING;

  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
      <h3 className="font-bold font-sans text-sm mb-3 text-foreground">{t('seatMap.legend', 'Legend & Pricing')}</h3>
      
      <div className="space-y-4">
        {/* Categories Section */}
        <div>
          <span className="text-xs text-muted-foreground font-semibold block mb-2 uppercase tracking-wider">
            {t('seatMap.categoriesLabel', 'Categories & Pricing')}
          </span>
          <div className={`grid grid-cols-2 ${pricing.hasVipRoom ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
            {/* VIP Room - Red (Hillm only) */}
            {pricing.hasVipRoom && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border-2 border-seat-vip-room bg-transparent shrink-0" />
                <span className="text-xs text-foreground font-medium">{t(pricing.vipRoom.labelKey, pricing.vipRoom.fallback)}</span>
              </div>
            )}

            {/* VIP Premium - Yellow */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border-2 border-seat-vip-premium bg-transparent shrink-0" />
              <span className="text-xs text-foreground font-medium">{t(pricing.vipPremium.labelKey, pricing.vipPremium.fallback)}</span>
            </div>

            {/* VIP Standard - Green */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border-2 border-seat-vip-standard bg-transparent shrink-0" />
              <span className="text-xs text-foreground font-medium">{t(pricing.vipStandard.labelKey, pricing.vipStandard.fallback)}</span>
            </div>

            {/* General - Grey */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border-2 border-seat-general bg-transparent shrink-0" />
              <span className="text-xs text-foreground font-medium">{t(pricing.general.labelKey, pricing.general.fallback)}</span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="border-t border-border/40 pt-3">
          <span className="text-xs text-muted-foreground font-semibold block mb-2 uppercase tracking-wider">
            {t('seatMap.statusLabel', 'Status')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* Available */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border-2 border-seat-vip-premium bg-transparent" />
              <span className="text-xs text-foreground">{t(TABLE_STATUSES.available.label)}</span>
            </div>

            {/* Reserved */}
            {/* <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-primary shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
              <span className="text-xs text-foreground">{t(TABLE_STATUSES.reserved.label)}</span>
            </div> */}

            {/* Sold */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-border bg-black/80 saturate-[0.3]" />
              <span className="text-xs text-foreground">{t(TABLE_STATUSES.sold.label)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
