/**
 * Email Confirmed Page
 *
 * Purpose: Dedicated celebratory confirmation screen displayed when a user clicks the
 *          verification link in their signup/confirmation email before navigating to the site.
 *
 * Features:
 *   - Auto-verifies Supabase session from hash/code URL parameters
 *   - Animated celebratory checkmark with luxury gold & emerald glow
 *   - 5-second automatic countdown redirect with visual progress bar
 *   - Instant action buttons: "Explore Events" or "Go to Login"
 *   - Bilingual (English / Arabic) via react-i18next
 *   - Responsive, accessible, and theme-compliant via Tailwind tokens
 *
 * Dependencies: react-router-dom, react-i18next, lucide-react, supabaseClient, AuthContext
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Loader2,
  Compass,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export const EmailConfirmedPage = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();

  // Status: 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        // 1. Check for error parameters in URL (e.g., error=access_denied&error_description=...)
        const errorDescription =
          searchParams.get('error_description') ||
          new URLSearchParams(window.location.hash.substring(1)).get('error_description');

        if (errorDescription) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
          }
          return;
        }

        // 2. Check for PKCE 'code' query parameter if present
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('PKCE exchange error (may already be exchanged):', exchangeError);
          }
        }

        // 3. Retrieve and refresh current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (sessionData?.session?.user) {
          if (refreshProfile) {
            await refreshProfile();
          }
          if (isMounted) {
            setStatus('success');
          }
        } else {
          // If no session is active, check hash or wait a brief moment for Supabase auth listener
          const hash = window.location.hash;
          if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=email_change'))) {
            // Wait brief moment for supabase listener to process hash
            setTimeout(async () => {
              const { data: delayedSession } = await supabase.auth.getSession();
              if (isMounted) {
                if (delayedSession?.session?.user) {
                  if (refreshProfile) await refreshProfile();
                  setStatus('success');
                } else {
                  // Email was likely confirmed on server side, let them proceed
                  setStatus('success');
                }
              }
            }, 800);
          } else {
            // Direct visit to this page
            setStatus('success');
          }
        }
      } catch (err) {
        console.error('Email verification error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || t('auth.emailConfirmFailedSubtitle', 'Invalid or expired verification link.'));
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [searchParams, refreshProfile, t]);

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  const handleContinue = () => {
    navigate('/', { replace: true });
  };

  const handleLoginRedirect = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col items-center text-center py-4 space-y-6 animate-fade-in">
      {/* 1. VERIFYING STATE */}
      {status === 'verifying' && (
        <div className="space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto text-primary animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-sans text-foreground">
              {t('auth.emailConfirmVerifying', 'Verifying your email...')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.emailConfirmVerifyingSubtitle', 'Please wait while we confirm your credentials.')}
            </p>
          </div>
        </div>
      )}

      {/* 2. SUCCESS STATE */}
      {status === 'success' && (
        <div className="space-y-6 w-full">
          {/* Animated Gold/Emerald Badge */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/60 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce-subtle" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{t('auth.emailConfirmedBadge', 'Account Activated')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-foreground tracking-wide">
              {t('auth.emailConfirmedTitle', 'Email Verified Successfully!')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {t(
                'auth.emailConfirmedSubtitle',
                'Your email address has been confirmed and your account is now fully active. Welcome to Khaleeji Tour!'
              )}
            </p>
            {user?.email && (
              <p className="text-xs font-mono font-bold text-primary mt-1">
                {user.email}
              </p>
            )}
          </div>

          {/* Countdown Progress Card */}
          <div className="bg-secondary/30 border border-border/80 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {t('auth.emailConfirmedRedirect', 'Redirecting to homepage in {{count}} seconds...', {
                count: countdown,
              })}
            </p>
            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all duration-200 shadow-premium flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Compass className="w-4 h-4" />
              <span>{t('auth.emailConfirmedContinue', 'Explore Events Now')}</span>
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 3. ERROR / EXPIRED STATE */}
      {status === 'error' && (
        <div className="space-y-6 w-full">
          <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-sans text-destructive">
              {t('auth.emailConfirmFailedTitle', 'Verification Link Expired')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {errorMessage ||
                t(
                  'auth.emailConfirmFailedSubtitle',
                  'This verification link is invalid or has expired. Please sign in or request a new confirmation email.'
                )}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoginRedirect}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              {t('auth.emailConfirmLoginBtn', 'Go to Login')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailConfirmedPage;
