/**
 * CheckoutCard
 *
 * Purpose: Checkout form UI for the Event Details page.
 *          Collects user info and creates a Stripe Checkout session.
 * Inputs: eventId, selectedTables, grandTotal, currency, disabled
 * Output: Rendered checkout form with Stripe redirect
 * Dependencies: react-hook-form, zod, react-i18next, useAuth, useCreateCheckout
 */
import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck, Loader2, User as UserIcon, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCreateCheckout } from '../../hooks/useBooking';
import { isValidPhoneNumber } from 'libphonenumber-js';
import PhoneInput from '../common/PhoneInput';
import { CouponInputSection } from './CouponInputSection';

// Checkout form validation schema
const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().refine((val) => {
    if (!val || typeof val !== 'string') return false;
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 15) return false;
    try {
      return isValidPhoneNumber(val) || cleanDigits.length >= 10;
    } catch {
      return cleanDigits.length >= 10;
    }
  }, 'Invalid phone number'),
});

const CheckoutCard = memo(({
  eventId,
  selectedTables = [],
  grandTotal = 0,
  currency = 'CAD',
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const location = useLocation();
  const createCheckoutMutation = useCreateCheckout();

  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: profile?.full_name || user?.user_metadata?.full_name || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || user?.user_metadata?.phone || '',
    },
  });

  // Sync profile details when auth/profile loads
  useEffect(() => {
    if (user || profile) {
      reset({
        fullName: profile?.full_name || user?.user_metadata?.full_name || '',
        email: profile?.email || user?.email || '',
        phone: profile?.phone || user?.user_metadata?.phone || '',
      });
    }
  }, [user, profile, reset]);

  // If user is not authenticated, show direct Login / Register requirement card
  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden p-6 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground uppercase tracking-wider">
            {t('checkout.loginRequiredTitle', 'Login Required to Book')}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
            {t(
              'checkout.loginRequiredDesc',
              'Please sign in or create an account to proceed with your ticket booking and receive your tickets.'
            )}
          </p>
        </div>
        {(() => {
          const currentSearch = new URLSearchParams(location.search);
          currentSearch.set('checkout', 'true');
          const returnTarget = `${location.pathname}?${currentSearch.toString()}`;

          return (
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                to={`/login?from=${encodeURIComponent(returnTarget)}`}
                state={{ from: returnTarget, isCheckingOut: true }}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('auth.loginButton', 'Sign In to Continue')}</span>
              </Link>
              <p className="text-xs text-muted-foreground">
                {t('auth.noAccount', "Don't have an account?")}{' '}
                <Link
                  to={`/register?from=${encodeURIComponent(returnTarget)}`}
                  state={{ from: returnTarget, isCheckingOut: true }}
                  className="text-primary font-semibold hover:underline"
                >
                  {t('auth.registerLink', 'Sign up')}
                </Link>
              </p>
            </div>
          );
        })()}
      </div>
    );
  }

  const onInvalid = (formErrors) => {
    console.warn('Checkout form validation error:', formErrors);
    if (formErrors.phone?.message) {
      setServerError(formErrors.phone.message);
    } else if (formErrors.email?.message) {
      setServerError(formErrors.email.message);
    } else if (formErrors.fullName?.message) {
      setServerError(formErrors.fullName.message);
    }
  };

  // Handle form submission & Stripe redirect
  const onSubmit = async (data) => {
    setServerError(null);

    if (!selectedTables || selectedTables.length === 0) {
      setServerError(t('checkout.noTablesSelected', 'Please select at least one table.'));
      return;
    }

    const tableSelections = selectedTables.map((tbl) => ({
      table_id: tbl.db_id || tbl.id || tbl.table_code,
      seats_count: Number(tbl.selectedSeatsCount || 1),
    }));

    // Debug: log the exact payload being sent
    console.log('[CheckoutCard] selectedTables raw:', JSON.stringify(selectedTables, null, 2));
    console.log('[CheckoutCard] tableSelections payload:', JSON.stringify(tableSelections, null, 2));
    console.log('[CheckoutCard] eventId:', eventId, '| userId:', user?.id);

    // Validate that all table_ids look valid before sending
    const hasInvalidId = tableSelections.some(
      (ts) => !ts.table_id || ts.table_id === 'undefined' || ts.table_id === 'null'
    );
    if (hasInvalidId) {
      console.error('[CheckoutCard] Invalid table_id detected in selections:', tableSelections);
      setServerError('Invalid table selection detected. Please re-select your tables and try again.');
      return;
    }

    try {
      const response = await createCheckoutMutation.mutateAsync({
        eventId,
        userId: user?.id || null,
        customerName: data.fullName,
        customerEmail: data.email,
        customerPhone: data.phone,
        tableSelections,
        couponCode: appliedCoupon?.code || null,
      });

      console.log('[CheckoutCard] Checkout response:', response);

      if (response?.checkoutUrl) {
        // Redirect user to Stripe Checkout
        window.location.href = response.checkoutUrl;
      } else {
        console.error('[CheckoutCard] No checkoutUrl in response:', response);
        setServerError('Checkout session created but no redirect URL was returned. Please try again.');
      }
    } catch (err) {
      console.error('[CheckoutCard] Checkout error full:', err);
      console.error('[CheckoutCard] Error response data:', err?.response?.data);
      console.error('[CheckoutCard] Error status:', err?.response?.status);

      // Extract the most specific error message available
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to initiate checkout. Table might already be reserved.';
      setServerError(msg);
    }
  };

  const isSubmitting = createCheckoutMutation.isPending;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold font-sans text-lg text-foreground uppercase tracking-wider">
          {t('checkout.title', 'Checkout')}
        </h3>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="mx-5 mt-4 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="px-5 py-4 space-y-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('checkout.fullName', 'Full Name')}
          </label>
          <input
            type="text"
            {...register('fullName')}
            placeholder={t('checkout.fullNamePlaceholder', 'Enter your full name')}
            className="w-full bg-background border border-input rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          {errors.fullName && (
            <span className="text-xs text-destructive">{errors.fullName.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('checkout.emailAddress', 'Email Address')}
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder={t('checkout.emailPlaceholder', 'Enter your email address')}
            className="w-full bg-background border border-input rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          {errors.email && (
            <span className="text-xs text-destructive">{errors.email.message}</span>
          )}
        </div>

        {/* Phone */}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('checkout.phoneNumber', 'Phone Number')}
              </label>
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                placeholder={t('checkout.phonePlaceholder', '+1 234 567 8900')}
                error={errors.phone?.message}
                disabled={disabled || isSubmitting}
              />
            </div>
          )}
        />

        {/* Payment method (visual only - Stripe handles card fields) */}
        {/* <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('checkout.paymentMethod', 'Payment Method')}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-background border border-input rounded-md px-3 py-2.5 text-sm text-muted-foreground/50 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span>{t('checkout.cardNumber', 'Stripe Hosted Checkout')}</span>
            </div>
          </div>
        </div> */}

        {/* Coupon Promo Code Input */}
        <div className="pt-1">
          <CouponInputSection
            eventId={eventId}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
            disabled={disabled || isSubmitting}
          />
        </div>

        {/* Prominent No-Refund Notice & Terms Disclosure (Clause 3 highlighted per legal requirement) */}
        <div className="rounded-lg p-3 sm:p-3.5 text-xs text-foreground/90 space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {t('checkout.noRefundsNoticeTitle', 'Important Notice: No Refunds or Exchanges')}
            </span>
          </div>
          <p className="leading-relaxed text-[11.5px] text-muted-foreground">
            {t(
              'checkout.noRefundsNoticeBody',
              'Purchased tickets are strictly non-refundable and non-exchangeable. Ticket value will not be refunded if the purchaser changes their mind, wishes to cancel, fails to attend, or arrives late.'
            )}
          </p>
          <div className="pt-1 text-[11px] text-muted-foreground/80 border-t border-amber-500/20 flex flex-wrap items-center gap-1">
            <span>{t('checkout.termsAgreementNotice', 'By proceeding with payment, you acknowledge and agree to the')}</span>
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>{t('checkout.termsLink', 'Terms & Conditions')}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </Link>
            <span>{t('checkout.and', 'and')}</span>
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>{t('checkout.privacyLink', 'Privacy Policy')}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </Link>
          </div>
        </div>

        {/* Pay button */}
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('checkout.processing', 'Reserving seats...')}</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                {t('checkout.payButton', 'PAY ${{amount}} {{currency}}', { amount: grandTotal.toFixed(2), currency })}
              </span>
            </>
          )}
        </button>

        {/* Security badges */}
        <div className="flex flex-col items-center gap-2 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>
              {t('checkout.secureCheckout', 'Secure Checkout powered by')}{' '}
              <span className="font-bold text-foreground">stripe</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>{t('checkout.securePayment', '100% secure payment')}</span>
          </div>
        </div>
      </form>
    </div>
  );
});

CheckoutCard.displayName = 'CheckoutCard';
export { CheckoutCard };
