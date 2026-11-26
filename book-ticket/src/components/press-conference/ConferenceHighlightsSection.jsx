import {
  Sparkles,
  Building2,
  Megaphone,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ConferenceHighlightsSection = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const HIGHLIGHTS = [
    {
      id: 1,
      icon: Building2,
      num: '01',
      titleAr: 'الإطلاق الرسمي للهيئة',
      titleEn: 'Official Commission Launch',
      descAr:
        'الإطلاق الرسمي للهيئة العامة للإعلام المرئي والمسموع الخليجي والعربي في كندا.',
      descEn:
        'Official launch of the Gulf & Arab General Commission for Audiovisual Media in Canada.',
    },
    {
      id: 2,
      icon: Megaphone,
      num: '02',
      titleAr: 'الإعلان الرسمي عن خليجي تور',
      titleEn: 'Official Khaleeji Tour Announcement',
      descAr: 'الكشف عن تفاصيل أمسية خليجي تور المرتقبة في Mississauga.',
      descEn: 'Official reveal of the upcoming Khaleeji Tour evening in Mississauga.',
    },
    {
      id: 3,
      icon: Users,
      num: '03',
      titleAr: 'التسجيل والتطوع',
      titleEn: 'Registration & Volunteer Opportunities',
      descAr: 'فتح باب التسجيل والتطوع والمشاركة في مبادرات الهيئة.',
      descEn:
        'Registration, volunteering, and participation opportunities will be announced.',
    },
    {
      id: 4,
      icon: MessageSquare,
      num: '04',
      titleAr: 'الحوار الإعلامي والأسئلة',
      titleEn: 'Media Dialogue & Q&A',
      descAr:
        'مساحة حوارية للإعلاميين والضيوف تتضمن الأسئلة والإجابات والإعلانات الرسمية.',
      descEn:
        'A dedicated media and guest dialogue session including Q&A and official announcements.',
    },
  ];

  return (
    <section className="w-full mt-12 sm:mt-16 space-y-6 pt-10 border-t border-border">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'برنامج الفعالية' : 'Event Program'}</span>
        </span>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans text-foreground">
          {isAr ? 'أبرز ما يتضمنه المؤتمر' : 'CONFERENCE HIGHLIGHTS'}
        </h2>

        <p className="text-sm font-semibold text-primary">
          {isAr ? 'CONFERENCE HIGHLIGHTS' : 'أبرز ما يتضمنه المؤتمر'}
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {HIGHLIGHTS.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className="relative p-6 rounded-3xl bg-card border border-border shadow-premium hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              {/* Top Accent & Icon */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComp className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground/60">
                    {item.num}
                  </span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold font-sans text-foreground leading-snug">
                    {item.titleAr}
                  </h3>
                  <p className="text-xs font-semibold text-primary">
                    {item.titleEn}
                  </p>
                </div>
              </div>

              {/* Descriptions */}
              <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
                <p className="text-xs text-foreground/85 leading-relaxed">
                  {item.descAr}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Information Bar below Conference Highlights */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>
              {isAr
                ? 'الأربعاء، 23 سبتمبر 2026'
                : 'Wednesday, September 23, 2026'}
            </span>
          </div>

          <span className="hidden sm:inline text-border">•</span>

          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>
              {isAr
                ? '7:15 مساءً – 9:00 مساءً'
                : '7:15 PM – 9:00 PM'}
            </span>
          </div>

          <span className="hidden sm:inline text-border">•</span>

          <div className="flex items-center gap-2 text-foreground font-semibold">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>Holiday Inn & Suites Mississauga West</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConferenceHighlightsSection;
