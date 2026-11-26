import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useEvents } from '../../hooks/useEvents';
import { useAdminTables } from '../../hooks/useAdminTables';
import { useCreateManualBooking } from '../../hooks/useManualBooking';
import { ManualBookingHeader } from './ManualBookingHeader';
import { ManualBookingFormInputs } from './ManualBookingFormInputs';
import { ManualBookingSummaryCard } from './ManualBookingSummaryCard';
import { ManualBookingSuccessModal } from './ManualBookingSuccessModal';

const isPhoneValid = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return false;
  try {
    return isValidPhoneNumber(phone);
  } catch {
    return true;
  }
};

export const AdminManualBookingSection = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data: events = [], isLoading: isEventsLoading } = useEvents();
  const createBookingMutation = useCreateManualBooking();

  const [selectedEventId, setSelectedEventId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [seatsCount, setSeatsCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customAmount, setCustomAmount] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      const defaultEvt = events.find((e) => e.seat_map_id) || events[0];
      if (defaultEvt) setSelectedEventId(defaultEvt.id);
    }
  }, [events, selectedEventId]);

  const currentEvent = useMemo(() => events.find((e) => e.id === selectedEventId), [events, selectedEventId]);
  const { data: tables = [], isLoading: isTablesLoading } = useAdminTables(currentEvent?.seat_map_id);
  const selectedTable = useMemo(() => tables.find((t) => t.id === selectedTableId), [tables, selectedTableId]);

  const maxAvailableSeats = useMemo(() => {
    if (!selectedTable) return 10;
    return Math.max(1, selectedTable.capacity - (selectedTable.booked_seats || 0));
  }, [selectedTable]);

  useEffect(() => {
    if (tables.length > 0) {
      const firstAvailable = tables.find((t) => (t.capacity - (t.booked_seats || 0)) > 0) || tables[0];
      if (firstAvailable) {
        setSelectedTableId(firstAvailable.id);
        setSeatsCount(1);
      }
    } else {
      setSelectedTableId('');
    }
  }, [tables]);

  const HST_RATE = 0.13;
  const { subtotal, taxAmount, calculatedTotal } = useMemo(() => {
    if (customAmount !== '' && !isNaN(Number(customAmount))) {
      const custom = Number(customAmount);
      return { subtotal: custom, taxAmount: 0, calculatedTotal: custom };
    }
    const unitPrice = selectedTable?.price || 0;
    const sub = unitPrice * seatsCount;
    const tax = Math.round(sub * HST_RATE * 100) / 100;
    return { subtotal: sub, taxAmount: tax, calculatedTotal: sub + tax };
  }, [selectedTable, seatsCount, customAmount]);

  const isFormIncomplete =
    !selectedEventId || !selectedTableId || !customerEmail.trim() ||
    !customerName.trim() || !isPhoneValid(customerPhone);

  const handleSubmit = async () => {
    setValidationError('');
    if (!selectedEventId) return setValidationError(t('admin.manualBooking.validationEvent', 'Please select an event'));
    if (!selectedTableId) return setValidationError(t('admin.manualBooking.validationTable', 'Please select a table'));
    if (seatsCount < 1 || seatsCount > maxAvailableSeats) {
      return setValidationError(t('admin.manualBooking.validationSeats', 'Seats count exceeds available capacity'));
    }
    if (!customerName || !customerName.trim()) {
      return setValidationError(t('admin.manualBooking.validationName', 'Please provide customer name'));
    }
    if (!isPhoneValid(customerPhone)) {
      return setValidationError(t('admin.manualBooking.validationPhone', 'Please provide a valid phone number'));
    }
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail.trim())) {
      return setValidationError(t('admin.manualBooking.validationEmail', 'Please provide a valid email address'));
    }

    try {
      const response = await createBookingMutation.mutateAsync({
        eventId: selectedEventId,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tableId: selectedTableId,
        tableCode: selectedTable?.table_code,
        seatsCount: Number(seatsCount),
        paymentMethod,
        customAmount: customAmount !== '' ? Number(customAmount) : null,
      });

      setSuccessData({ ...response, customerEmail: customerEmail.trim() });
      setCustomerEmail('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomAmount('');
      setSeatsCount(1);
    } catch (err) {
      setValidationError(err?.response?.data?.error || err.message || t('admin.manualBooking.errorGeneric', 'Failed to create manual booking'));
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-0">
      <ManualBookingHeader />
      <div className="p-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ManualBookingFormInputs
            events={events} isEventsLoading={isEventsLoading}
            selectedEventId={selectedEventId} onSelectEventId={setSelectedEventId}
            tables={tables} isTablesLoading={isTablesLoading}
            selectedTableId={selectedTableId} onSelectTableId={setSelectedTableId}
            seatsCount={seatsCount} onChangeSeatsCount={setSeatsCount}
            maxAvailableSeats={maxAvailableSeats}
            customerEmail={customerEmail} onChangeCustomerEmail={setCustomerEmail}
            customerName={customerName} onChangeCustomerName={setCustomerName}
            customerPhone={customerPhone} onChangeCustomerPhone={setCustomerPhone}
            phoneError={validationError && !isPhoneValid(customerPhone) ? validationError : ''}
            paymentMethod={paymentMethod} onChangePaymentMethod={setPaymentMethod}
            customAmount={customAmount} onChangeCustomAmount={setCustomAmount}
            showOptionalFields={showOptionalFields}
            onToggleOptionalFields={() => setShowOptionalFields((prev) => !prev)}
            isAr={isAr}
          />
        </div>
        <ManualBookingSummaryCard
          event={currentEvent} table={selectedTable}
          seatsCount={seatsCount} subtotal={subtotal}
          taxAmount={taxAmount} totalAmount={calculatedTotal}
          currency={currentEvent?.currency || 'CAD'}
          customerEmail={customerEmail}
          paymentMethod={paymentMethod}
          isSubmitting={createBookingMutation.isPending}
          onSubmit={handleSubmit} disabled={isFormIncomplete}
          error={validationError}
        />
      </div>
      <ManualBookingSuccessModal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        bookingData={successData}
        isAr={isAr}
      />
    </div>
  );
};

export default AdminManualBookingSection;


