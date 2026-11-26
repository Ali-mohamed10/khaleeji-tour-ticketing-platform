import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';

export const ManualBookingFormInputs = ({
  events = [],
  isEventsLoading,
  selectedEventId,
  onSelectEventId,
  tables = [],
  isTablesLoading,
  selectedTableId,
  onSelectTableId,
  seatsCount,
  onChangeSeatsCount,
  maxAvailableSeats,
  customerEmail,
  onChangeCustomerEmail,
  customerName,
  onChangeCustomerName,
  customerPhone,
  onChangeCustomerPhone,
  phoneError,
  paymentMethod,
  onChangePaymentMethod,
  customAmount,
  onChangeCustomAmount,
  showOptionalFields,
  onToggleOptionalFields,
  isAr,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Event Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t('admin.manualBooking.selectEvent', 'Select Event')} *
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => onSelectEventId(e.target.value)}
          disabled={isEventsLoading}
          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {(isAr ? evt.title_ar || evt.title_en : evt.title_en || evt.title_ar)} — {evt.venue_en || evt.venue_ar || 'Venue'}
            </option>
          ))}
        </select>
      </div>

      {/* Table Picker & Seats Count */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t('admin.manualBooking.tableNumber', 'Table Number / Code')} *
          </label>
          <select
            value={selectedTableId}
            onChange={(e) => onSelectTableId(e.target.value)}
            disabled={isTablesLoading || tables.length === 0}
            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
          >
            {tables.map((tbl) => {
              const rem = Math.max(0, tbl.capacity - (tbl.booked_seats || 0));
              const cleanCode = String(tbl.table_code || tbl.svg_element_id || '').replace(/^#+/, '');
              return (
                <option key={tbl.id} value={tbl.id} disabled={rem <= 0}>
                  #{cleanCode} ({tbl.category.toUpperCase()}) — ${tbl.price} · {rem}/{tbl.capacity} seats free
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t('admin.manualBooking.seatsCount', 'Seats Count')} *
          </label>
          <input
            type="number"
            min="1"
            max={maxAvailableSeats}
            value={seatsCount}
            onChange={(e) => onChangeSeatsCount(Math.min(maxAvailableSeats, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none font-mono"
          />
          <span className="text-[10px] text-muted-foreground block">
            {t('admin.manualBooking.seatsLimitHint', 'Maximum {{max}} seats available at this table', { max: maxAvailableSeats })}
          </span>
        </div>
      </div>

      {/* Required Customer Details: Name & Phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t('admin.manualBooking.customerName', 'Customer Name')} *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onChangeCustomerName(e.target.value)}
            placeholder={t('admin.manualBooking.customerNamePlaceholder', 'e.g. Mohammed Al-Mansoor')}
            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t('admin.manualBooking.customerPhone', 'Customer Phone / WhatsApp')} *
          </label>
          <PhoneInput
            value={customerPhone}
            onChange={onChangeCustomerPhone}
            error={phoneError}
            placeholder={t('admin.manualBooking.customerPhonePlaceholder', '+1 (647) 000-0000')}
          />
        </div>
      </div>

      {/* Customer Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t('admin.manualBooking.customerEmail', 'Customer Email')} *
        </label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => onChangeCustomerEmail(e.target.value)}
          placeholder={t('admin.manualBooking.customerEmailPlaceholder', 'e.g. guest@example.com')}
          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
        />
        <span className="text-[10px] text-muted-foreground block">
          {t('admin.manualBooking.customerEmailHint', 'The official ticket and QR code will be delivered to this email address.')}
        </span>
      </div>

      {/* Collapsible Optional Settings */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-secondary/5">
        <button
          type="button"
          onClick={onToggleOptionalFields}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <span>{t('admin.manualBooking.optionalDetails', 'Optional Settings (Payment Channel, Price Override)')}</span>
          {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptionalFields && (
          <div className="p-4 pt-1 border-t border-border/50 grid sm:grid-cols-2 gap-3 animate-fade-in text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {t('admin.manualBooking.paymentMethod', 'Payment Channel')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => onChangePaymentMethod(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground"
              >
                <option value="Cash">{t('admin.manualBooking.paymentCash', 'Cash')}</option>
                <option value="WhatsApp">{t('admin.manualBooking.paymentWhatsApp', 'WhatsApp')}</option>
                <option value="Bank Transfer">{t('admin.manualBooking.paymentBank', 'Bank Transfer')}</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                {t('admin.manualBooking.customAmount', 'Custom Total Amount (Optional)')}
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => onChangeCustomAmount(e.target.value)}
                placeholder={t('admin.manualBooking.customAmountPlaceholder', 'Override calculated price if needed')}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

