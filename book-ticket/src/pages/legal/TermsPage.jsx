/**
 * Terms & Conditions Page
 *
 * Purpose: Official terms and conditions governing ticket purchases and event reservations on Khaleeji Tour.
 * Highlights:
 *   - Clause 3 (No Refunds / No Exchanges) prominently highlighted
 *   - Bilingual support (Arabic primary, English secondary)
 *   - Theme token styling (Light & Dark mode compatible)
 *   - SEO optimized with meta tags and structured breadcrumbs
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  QrCode,
  Users,
  Armchair,
  Bell,
  Headphones,
  ArrowRight,
} from 'lucide-react';

export const TermsPage = memo(() => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const sections = [
    {
      id: 'scope',
      num: '1',
      icon: FileText,
      titleAr: 'نطاق الشروط',
      titleEn: 'Scope of Terms',
      descAr:
        'تنظّم هذه الشروط شراء التذاكر وحجز الفعاليات عبر موقع خليجي تور. يرجى الاطلاع عليها وعلى تفاصيل الفعالية قبل إتمام الشراء.',
      descEn:
        'These terms govern the purchase of tickets and booking of events via the Khaleeji Tour website. Please review them and all event details carefully prior to completing your purchase.',
    },
    {
      id: 'purchase',
      num: '2',
      icon: CreditCard,
      titleAr: 'شراء التذاكر',
      titleEn: 'Ticket Purchase',
      descAr:
        'يتحمل المشتري مسؤولية التحقق من الفعالية وتاريخها وموقعها وفئة التذكرة وعدد التذاكر والمقاعد المختارة وصحة بيانات التواصل قبل إتمام الدفع.',
      descEn:
        'The purchaser is solely responsible for verifying the event, date, venue location, ticket tier, quantity, selected seats or tables, and accuracy of contact details before completing payment.',
    },
    {
      id: 'refunds',
      num: '3',
      icon: AlertTriangle,
      isHighlighted: true,
      titleAr: 'الاسترجاع والاستبدال',
      titleEn: 'No Refunds & No Exchanges',
      descAr:
        'التذاكر المشتراة لا تُسترجع ولا تُستبدل. ولا تُعاد قيمة التذكرة في حال تغيير المشتري رأيه، أو رغبته في إلغاء الحجز، أو عدم الحضور، أو التأخر عن موعد الفعالية.',
      descEn:
        'Purchased tickets are strictly non-refundable and non-exchangeable. Ticket value will not be refunded if the purchaser changes their mind, wishes to cancel, fails to attend, or arrives late to the event.',
    },
    {
      id: 'pricing',
      num: '4',
      icon: ShieldCheck,
      titleAr: 'الأسعار والدفع',
      titleEn: 'Prices & Payment',
      descAr:
        'تُعرض الأسعار بالدولار الكندي، مع بيان الضرائب والرسوم المطبقة وإجمالي قيمة الطلب. لا يُعد الحجز مؤكّدًا إلا بعد نجاح الدفع وإصدار تأكيد الحجز.',
      descEn:
        'All prices are displayed in Canadian Dollars (CAD), clearly itemizing applicable taxes, fees, and the grand order total. A booking is not confirmed until payment succeeds and official booking confirmation is issued.',
    },
    {
      id: 'validity',
      num: '5',
      icon: QrCode,
      titleAr: 'صلاحية التذكرة',
      titleEn: 'Ticket Validity',
      descAr:
        'تُستخدم التذكرة للفعالية والتاريخ والفئة المحددة فيها. يُشترط تقديم التذكرة ورمز الدخول للتحقق عند البوابة، ولا يجوز استخدامها أكثر من مرة أو نسخها أو التلاعب بها.',
      descEn:
        'Each ticket is valid solely for the specific event, date, and category stated on it. Presenting the valid ticket pass and QR entry code is required at the gate; duplicate use, copying, or tampering is strictly prohibited.',
    },
    {
      id: 'admission',
      num: '6',
      icon: Users,
      titleAr: 'الدخول والحضور',
      titleEn: 'Admission & Attendance',
      descAr:
        'يلتزم حامل التذكرة بشروط العمر والدخول المنشورة للفعالية وتعليمات الأمن والسلامة والمكان. يجوز رفض الدخول عند تقديم تذكرة غير صالحة، أو عدم استيفاء شروط الدخول المعلنة، أو الإخلال بسلامة الحضور.',
      descEn:
        'Ticket holders must strictly abide by published age restrictions, entry terms, security protocols, and venue guidelines. Admission may be denied for invalid passes, failure to meet entry criteria, or actions compromising attendee safety.',
    },
    {
      id: 'seating',
      num: '7',
      icon: Armchair,
      titleAr: 'المقاعد والخدمات',
      titleEn: 'Seating & Amenities',
      descAr:
        'يُعتمد المقعد أو الطاولة أو منطقة الحضور وفق بيانات الحجز. تقتصر مزايا التذكرة على الخدمات الموضحة في فئتها، ولا تشمل الخدمات الإضافية ما لم يُذكر ذلك صراحة.',
      descEn:
        'Seat, table, or attendance zones are assigned strictly per booking records. Ticket privileges are limited to the amenities specified within its tier and do not include extra services unless explicitly stated.',
    },
    {
      id: 'updates',
      num: '8',
      icon: Bell,
      titleAr: 'تحديثات الفعالية',
      titleEn: 'Event Updates',
      descAr:
        'يجوز تعديل ترتيب الفقرات أو توقيتها لأسباب تنظيمية. تُنشر التغييرات الجوهرية المتعلقة بالفعالية عبر الموقع أو تُرسل إلى بيانات التواصل المسجلة في الحجز.',
      descEn:
        'The program schedule or segment timing may be updated for operational reasons. Material changes will be published on the website or dispatched directly to contact information registered with the booking.',
    },
    {
      id: 'support',
      num: '9',
      icon: Headphones,
      titleAr: 'الدعم والاستفسارات',
      titleEn: 'Support & Inquiries',
      descAr:
        'تُقدَّم الاستفسارات المتعلقة بالحجز والتذاكر عبر وسائل التواصل الرسمية المنشورة في الموقع، مع إرفاق رقم الطلب والبيانات اللازمة للتحقق.',
      descEn:
        'Inquiries concerning reservations and tickets must be submitted through the official contact channels on the website, citing your order code and requisite verification details.',
    },
  ];

  return (
    <div className="py-8 md:py-12 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEO
        title={isAr ? 'الأحكام والشروط — خليجي تور' : 'Terms & Conditions — Khaleeji Tour'}
        description={
          isAr
            ? 'شروط وأحكام حجز وشراء تذاكر الفعاليات والحفلات عبر موقع خليجي تور. سياسة عدم الاسترجاع، الدفع، ودخول الفعاليات.'
            : 'Terms and conditions governing event ticket purchases on Khaleeji Tour. Refund policy, entry guidelines, and booking rules.'
        }
        canonical="https://www.khaleejitour.com/terms"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-card to-card/60 border border-border rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          <span>{isAr ? 'وثيقة رسمية' : 'Official Agreement'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight font-serif">
          {isAr ? 'الأحكام والشروط' : 'Terms & Conditions'}
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'تنظّم هذه الشروط كافة عمليات شراء التذاكر وحجز المقاعد عبر منصة خليجي تور. يرجى قراءتها بعناية قبل إتمام أي حجز.'
            : 'These terms govern all ticket purchases and seat reservations made through Khaleeji Tour. Please read them thoroughly prior to booking.'}
        </p>

        <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>khaleejitour.com</span>
          <span>&bull;</span>
          <span>{isAr ? 'تحديث: أكتوبر 2026' : 'Last Updated: October 2026'}</span>
        </div>
      </div>

      

      {/* Numbered Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              id={section.id}
              className={`rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
                section.isHighlighted
                  ? 'bg-card border-border hover:border-primary/30'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    section.isHighlighted
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {section.num}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      {isAr ? section.titleAr : section.titleEn}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {isAr ? section.descAr : section.descEn}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Cross-link to Privacy Policy */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-base">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Data Protection'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'اطلع على كيفية حماية بياناتك ومعلومات الدفع الخاصة بك بأعلى معايير الأمان.'
              : 'Learn how your personal information and transactions are safeguarded.'}
          </p>
        </div>
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <span>{isAr ? 'عرض سياسة الخصوصية' : 'View Privacy Policy'}</span>
          <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    </div>
  );
});

TermsPage.displayName = 'TermsPage';
export default TermsPage;
