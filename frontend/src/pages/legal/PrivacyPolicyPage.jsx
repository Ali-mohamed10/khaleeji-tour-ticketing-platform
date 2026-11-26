/**
 * Privacy Policy Page
 *
 * Purpose: Official privacy policy for Khaleeji Tour ticketing platform.
 * Core statement: "جميع بياناتكم محفوظة بخصوصية وحماية تامة."
 * Features:
 *   - Clear commitment to customer data confidentiality and payment security
 *   - Bilingual support (Arabic & English)
 *   - Semantic styling using theme tokens
 *   - Direct link to Terms & Conditions
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../../components/common/SEO';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export const PrivacyPolicyPage = memo(() => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const principles = [
    {
      icon: ShieldCheck,
      titleAr: 'حماية وتشفير البيانات',
      titleEn: 'Data Protection & Encryption',
      descAr:
        'جميع بياناتكم الشخصية، بما فيها الأسماء وأرقام الهواتف والبريد الإلكتروني، مشفرة بأحدث بروتوكولات الأمان ولا يمكن الوصول إليها إلا للأغراض التشغيلية المتعلقة بحجزك.',
      descEn:
        'All your personal information, including names, contact numbers, and email addresses, is encrypted using state-of-the-art security standards and accessed strictly for booking fulfillment.',
    },
    {
      icon: Lock,
      titleAr: 'أمان المدفوعات والبطاقات',
      titleEn: 'Payment & Card Security',
      descAr:
        'تتم معالجة كافة المدفوعات المالية عبر خوادم شركة Stripe المعتمدة بمعيار PCI-DSS للمدفوعات العالمية. لا يقوم موقع خليجي تور بتخزين أي أرقام بطاقات ائتمانية أو بيانات بنكية على خوادمه نهائياً.',
      descEn:
        'All financial payments are handled via Stripe servers complying with the highest PCI-DSS global standards. Khaleeji Tour does not store credit card or banking credentials on its servers.',
    },
    {
      icon: EyeOff,
      titleAr: 'عدم مشاركة البيانات مع أطراف ثالثة',
      titleEn: 'Zero Third-Party Sharing',
      descAr:
        'نلتزم التزاماً تاماً بعدم بيع أو تأجير أو مشاركة أي من بيانات العملاء مع أي شركات إعلانية أو جهات خارجية غير مصرح لها.',
      descEn:
        'We strictly commit to never selling, renting, or disclosing customer information to advertising networks or unauthorized third parties.',
    },
    {
      icon: Server,
      titleAr: 'استخدام البيانات لإصدار التذاكر فقط',
      titleEn: 'Operational Ticket Usage',
      descAr:
        'تُستخدم بيانات التواصل المسجلة حصرياً لإرسال تأكيدات الحجز والتذاكر الرقمية ورموز الدخول (QR Code) أو لإبلاغكم بأي تحديثات تنظيمية طارئة للفعالية.',
      descEn:
        'Contact details are used exclusively to deliver booking confirmations, digital entry passes with QR codes, or to communicate vital operational updates regarding the event.',
    },
  ];

  return (
    <div className="py-8 md:py-12 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEO
        title={isAr ? 'سياسة الخصوصية — خليجي تور' : 'Privacy Policy — Khaleeji Tour'}
        description={
          isAr
            ? 'سياسة الخصوصية وحماية بيانات العملاء في منصة خليجي تور. جميع بياناتكم محفوظة بخصوصية وحماية تامة.'
            : 'Privacy Policy of Khaleeji Tour. All customer data is secured with absolute privacy, high-grade encryption, and safe Stripe payment processing.'
        }
        canonical="https://www.khaleejitour.com/privacy"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-card to-card/60 border border-border rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'حماية وأمان معتمد' : 'Verified Security'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight font-serif">
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'نحن نقدر ثقتكم ونحرص على توفير أعلى معايير الخصوصية والأمان لبياناتكم الشخصية ومعاملاتكم المالية.'
            : 'We respect your trust and are dedicated to providing the highest standards of confidentiality and security for your personal data.'}
        </p>

        <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>khaleejitour.com</span>
          <span>&bull;</span>
          <span>{isAr ? 'تحديث: أكتوبر 2026' : 'Last Updated: October 2026'}</span>
        </div>
      </div>

      {/* Core Privacy Promise Callout */}
      <div className="rounded-2xl bg-primary/10 border-2 border-primary/40 p-6 sm:p-8 text-center space-y-3 shadow-sm relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/30">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-serif">
          {isAr ? 'عهد الخصوصية والأمان' : 'Our Privacy Pledge'}
        </h2>
        <p className="text-base sm:text-lg text-primary font-bold max-w-xl mx-auto leading-relaxed">
          {isAr
            ? '« جميع بياناتكم محفوظة بخصوصية وحماية تامة. »'
            : '"All your data is protected with utmost privacy and absolute security."'}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          {isAr
            ? 'لا نقوم بمشاركة أي من بياناتك مع أطراف خارجية، ونلتزم بأعلى معايير الحماية الرقمية وتشفير المعاملات.'
            : 'We never sell or distribute your data. All transactions are securely processed according to rigorous digital protection standards.'}
        </p>
      </div>

      {/* Security Commitments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {principles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-xl bg-card border border-border p-5 sm:p-6 space-y-2.5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isAr ? item.descAr : item.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PrivacyPolicyPage.displayName = 'PrivacyPolicyPage';
export default PrivacyPolicyPage;
