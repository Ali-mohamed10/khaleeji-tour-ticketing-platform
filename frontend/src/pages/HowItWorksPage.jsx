/**
 * How It Works Page
 *
 * Purpose: Interactive guide explaining the end-to-end luxury ticketing journey on Khaleeji Tour.
 * Features:
 *   - 4-step visual workflow (Explore -> Select Map -> Secure Pay -> QR Gate Entry)
 *   - Key platform advantages & security guarantees
 *   - Interactive collapsible FAQ accordion
 *   - Responsive, accessible, supporting Light/Dark modes seamlessly via Tailwind tokens
 *
 * Dependencies: react-i18next, lucide-react, react-router-dom
 */
import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/common/SEO';
import {
  Sparkles,
  Compass,
  LayoutGrid,
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  Lock,
  Headphones,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Ticket,
  Calendar,
  Clock,
  Smartphone,
} from 'lucide-react';

const HowItWorksPage = memo(() => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // State for active FAQ accordion item
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // 4 Core Steps Configuration
  const steps = [
    {
      num: t('howItWorksPage.step1.number', '01'),
      tag: t('howItWorksPage.step1.tag', 'Step 1'),
      icon: Compass,
      title: t('howItWorksPage.step1.title', 'Discover & Choose Your Event'),
      desc: t(
        'howItWorksPage.step1.desc',
        'Browse curated premier concerts, live shows, and cultural galas. View rich details including venue maps, artist lineups, dates, and live remaining capacities.'
      ),
      highlight1: t('howItWorksPage.step1.highlight1', 'Curated Premier Shows'),
      highlight2: t('howItWorksPage.step1.highlight2', 'Live Seating Availability'),
      badgeIcon: Calendar,
    },
    {
      num: t('howItWorksPage.step2.number', '02'),
      tag: t('howItWorksPage.step2.tag', 'Step 2'),
      icon: LayoutGrid,
      title: t('howItWorksPage.step2.title', 'Select Seats on the Interactive Map'),
      desc: t(
        'howItWorksPage.step2.desc',
        'Pick your preferred table or seating section in real-time. Your selection is atomically locked for 15 minutes to guarantee no double-bookings while you checkout.'
      ),
      highlight1: t('howItWorksPage.step2.highlight1', 'Interactive Visual Map'),
      highlight2: t('howItWorksPage.step2.highlight2', '15-Minute Instant Hold'),
      badgeIcon: Clock,
    },
    {
      num: t('howItWorksPage.step3.number', '03'),
      tag: t('howItWorksPage.step3.tag', 'Step 3'),
      icon: CreditCard,
      title: t('howItWorksPage.step3.title', 'Instant & Secure Checkout'),
      desc: t(
        'howItWorksPage.step3.desc',
        'Pay effortlessly with bank-grade encryption powered by Stripe. No hidden surprises — transparent pricing with instant automatic payment confirmation.'
      ),
      highlight1: t('howItWorksPage.step3.highlight1', 'Stripe Encrypted Payments'),
      highlight2: t('howItWorksPage.step3.highlight2', 'Zero Hidden Fees'),
      badgeIcon: ShieldCheck,
    },
    {
      num: t('howItWorksPage.step4.number', '04'),
      tag: t('howItWorksPage.step4.tag', 'Step 4'),
      icon: QrCode,
      title: t('howItWorksPage.step4.title', 'Get Your QR Ticket & Enjoy the Show'),
      desc: t(
        'howItWorksPage.step4.desc',
        'Receive your official digital ticket instantly via email with an embedded QR code, or download it in high definition. Scan at the gate for fast, contactless entry.'
      ),
      highlight1: t('howItWorksPage.step4.highlight1', 'Direct Email & HD Download'),
      highlight2: t('howItWorksPage.step4.highlight2', 'Fast Contactless Gate Entry'),
      badgeIcon: Smartphone,
    },
  ];

  // Core Platform Highlights
  const features = [
    {
      icon: Lock,
      title: t('howItWorksPage.feat1Title', 'Anti-Double Booking'),
      desc: t(
        'howItWorksPage.feat1Desc',
        'Atomic database-level table locking ensures your chosen seat is exclusively reserved the instant you click.'
      ),
    },
    {
      icon: Zap,
      title: t('howItWorksPage.feat2Title', 'Instant Email Delivery'),
      desc: t(
        'howItWorksPage.feat2Desc',
        'Official admission passes delivered directly to your inbox with high-resolution QR codes powered by Resend.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('howItWorksPage.feat3Title', 'Bank-Grade Security'),
      desc: t(
        'howItWorksPage.feat3Desc',
        '100% PCI-DSS compliant checkout via Stripe ensures your card details never touch intermediate servers.'
      ),
    },
    {
      icon: Headphones,
      title: t('howItWorksPage.feat4Title', 'Dedicated 24/7 Support'),
      desc: t(
        'howItWorksPage.feat4Desc',
        'Our support concierge is always ready to assist you at support@khaleejitour.com for any inquiries.'
      ),
    },
  ];

  // FAQ list
  const faqs = [
    {
      q: t('howItWorksPage.faqs.q1', 'How do I receive my tickets after booking?'),
      a: t(
        'howItWorksPage.faqs.a1',
        'Immediately after payment is verified by Stripe, your digital ticket appears on screen with a high-resolution QR code. A confirmation email with the ticket pass is also dispatched instantly to your email address.'
      ),
    },
    {
      q: t('howItWorksPage.faqs.q2', 'How long are my selected seats held during checkout?'),
      a: t(
        'howItWorksPage.faqs.a2',
        'When you select tables or seats, our system locks them exclusively for you for 15 minutes. This gives you plenty of time to enter your details and complete payment safely without losing your seats.'
      ),
    },
    {
      q: t('howItWorksPage.faqs.q3', 'Can I download or print my ticket?'),
      a: t(
        'howItWorksPage.faqs.a3',
        'Yes! On the booking success page or in "My Tickets", you can download a crisp HD image of your ticket card with one click or use the clean Print/PDF option.'
      ),
    },
    {
      q: t('howItWorksPage.faqs.q4', 'What do I need to present at the venue entrance?'),
      a: t(
        'howItWorksPage.faqs.a4',
        "Simply show your ticket's QR code on your mobile phone screen (from your email, the website, or saved image) to our security gate staff for a quick 1-second scan."
      ),
    },
    {
      q: t('howItWorksPage.faqs.q5', 'What payment methods are supported?'),
      a: t(
        'howItWorksPage.faqs.a5',
        "We support all major credit and debit cards (Visa, MasterCard, American Express) through Stripe's secure checkout infrastructure."
      ),
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 animate-fade-in">
      <SEO
        title={isAr ? 'كيف يعمل حجز التذاكر' : 'How It Works - Ticket Booking Guide'}
        description={
          isAr
            ? 'تعرف على خطوات حجز تذاكر الحفلات واختيار المقاعد والدفع الآمن والدخول عبر رمز QR مع خليجي تور.'
            : 'Learn how to easily discover concerts, select your interactive table seats, complete secure checkout, and check in with your QR tickets.'
        }
      />

      {/* 1. Hero Section */}
      <section className="relative text-center pt-8 sm:pt-14 pb-4 max-w-4xl mx-auto px-4">
        {/* Decorative Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 shadow-xs">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span>{t('howItWorksPage.badge', 'Simple, Fast & Secure')}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-foreground uppercase tracking-wider mb-6 leading-tight drop-shadow-sm">
          {t('howItWorksPage.heroTitle', 'How Khaleeji Tour Works')}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          {t(
            'howItWorksPage.heroSubtitle',
            'From discovering elite live concerts to walking through the VIP entrance — your seamless ticketing journey in 4 effortless steps.'
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all duration-200 shadow-premium flex items-center gap-2 group"
          >
            <span>{t('howItWorksPage.exploreEventsBtn', 'Explore Events')}</span>
            <ArrowRight
              className={`w-4 h-4 transition-transform ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
            />
          </Link>
          <Link
            to="/my-tickets"
            className="bg-card hover:bg-muted/40 border border-border text-foreground px-6 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Ticket className="w-4 h-4 text-primary" />
            <span>{t('howItWorksPage.myTicketsBtn', 'View My Tickets')}</span>
          </Link>
        </div>
      </section>

      {/* 2. 4-Step Process Section */}
      <section className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 py-2 select-none">
            <div className="h-px w-10 md:w-16 bg-primary/40" />
            <h2 className="text-xl md:text-2xl font-serif text-primary tracking-widest font-extrabold uppercase text-center">
              {t('howItWorksPage.stepsSectionTitle', '4 Simple Steps to Your Experience')}
            </h2>
            <div className="h-px w-10 md:w-16 bg-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            {t(
              'howItWorksPage.stepsSectionSubtitle',
              'We crafted a friction-free booking platform designed for speed, clarity, and peace of mind.'
            )}
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const BadgeIcon = step.badgeIcon;
            return (
              <article
                key={idx}
                className="group relative bg-card border border-border/80 hover:border-primary/60 rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-premium flex flex-col justify-between overflow-hidden"
              >
                {/* Background Step Number Watermark */}
                <span className="absolute top-0 end-4 text-6xl sm:text-7xl font-serif font-black text-foreground/[0.04] group-hover:text-primary/[0.08] transition-colors pointer-events-none select-none">
                  {step.num}
                </span>

                <div>
                  {/* Step Title */}
                  <h3 className="text-xl font-bold font-sans text-foreground mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{step.desc}</p>
                </div>

                {/* Step Highlights Badges */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{step.highlight1}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/40 border border-border text-xs font-medium text-foreground/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{step.highlight2}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. Key Guarantees & Features */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-premium relative overflow-hidden">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground uppercase tracking-wider mb-2">
              {t('howItWorksPage.featuresTitle', 'Why Choose Khaleeji Tour')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'howItWorksPage.featuresSubtitle',
                'Engineered for excellence, reliability, and unforgettable entertainment memories.'
              )}
            </p>
          </div>

          {/* 4 Feature Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feat, idx) => {
              const FeatIcon = feat.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                    <FeatIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-foreground font-sans">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Interactive FAQs Accordion */}
      <section className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground uppercase tracking-wider mb-2">
            {t('howItWorksPage.faqTitle', 'Frequently Asked Questions')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'howItWorksPage.faqSubtitle',
              'Everything you need to know about booking and attending our events.'
            )}
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-border/80 rounded-xl bg-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-start flex items-center justify-between gap-4 font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Bottom Call to Action Banner */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl bg-radial from-card via-background to-card border-2 border-primary/40 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-md">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-foreground uppercase tracking-wider">
              {t('howItWorksPage.ctaTitle', 'Ready for an Unforgettable Night?')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                'howItWorksPage.ctaSubtitle',
                'Browse our upcoming events in Canada and reserve your premier seats today.'
              )}
            </p>
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-premium"
            >
              <span>{t('howItWorksPage.ctaButton', 'Explore Upcoming Events')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
});

HowItWorksPage.displayName = 'HowItWorksPage';
export default HowItWorksPage;
