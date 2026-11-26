import { MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ConferenceQuestionSection = ({
  topic,
  question,
  onTopicChange,
  onQuestionChange,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const TOPIC_OPTIONS = [
    { id: 'GACAM', label: isAr ? 'الهيئة • GACAM' : 'GACAM • الهيئة' },
    { id: 'Khaleeji Tour', label: isAr ? 'خليجي تور • Khaleeji Tour' : 'Khaleeji Tour • خليجي تور' },
    { id: 'Media & Culture', label: isAr ? 'الإعلام والثقافة • Media' : 'Media & Culture • الإعلام' },
    { id: 'Volunteering & Participation', label: isAr ? 'التطوع والمشاركة • Volunteers' : 'Volunteering & Participation' },
    { id: 'Other', label: isAr ? 'أخرى • Other' : 'Other • أخرى' },
  ];

  const handleTopicClick = (topicId) => {
    // Toggle selection if clicked again
    if (topic === topicId) {
      onTopicChange('');
    } else {
      onTopicChange(topicId);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {/* Section Header with neat stacked titles preventing BiDi wrapping */}
      <div className="border-b border-border pb-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/25 shrink-0 mt-0.5">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold font-sans text-foreground leading-snug">
              {isAr ? 'سؤالك للمؤتمر' : 'Your Question for the Conference'}
            </h2>
            <p className="text-xs font-semibold text-primary/90 mt-0.5">
              {isAr ? 'Your Question for the Conference' : 'سؤالك للمؤتمر'}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {isAr
            ? 'يمكنك تقديم سؤال مسبق ليتم النظر في طرحه خلال جلسة الأسئلة والأجوبة.'
            : 'You may submit a question in advance for consideration during the Q&A session.'}
        </p>
      </div>

      {/* Topic Chips (Optional) */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold text-foreground">
              {isAr ? 'موضوع السؤال' : 'Question Topic'}
            </span>
            <span className="text-[11px] text-muted-foreground font-normal mx-1">
              ({isAr ? 'اختياري' : 'Optional'})
            </span>
          </div>

          {topic && (
            <button
              type="button"
              onClick={() => onTopicChange('')}
              className="text-[11px] text-primary hover:underline transition-colors cursor-pointer shrink-0 font-medium"
            >
              {isAr ? 'إلغاء التحديد' : 'Clear selection'}
            </button>
          )}
        </div>

        {/* Chips with clean wrapping & no text break */}
        <div className="flex flex-wrap gap-2 pt-0.5">
          {TOPIC_OPTIONS.map((opt) => {
            const isSelected = topic === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleTopicClick(opt.id)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'border-primary bg-primary/20 text-primary font-bold shadow-xs ring-1 ring-primary/40'
                    : 'border-border/80 bg-secondary/30 hover:bg-secondary/60 hover:border-border text-foreground/85'
                }`}
              >
                {isSelected && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Text Area (Optional) */}
      <div className="space-y-1.5">
        <label
          htmlFor="conference-question-input"
          className="text-xs sm:text-sm font-semibold text-foreground block leading-snug"
        >
          {isAr
            ? 'هل لديك سؤال تود طرحه خلال المؤتمر؟'
            : 'Do you have a question you would like to ask during the conference?'}
        </label>
        <textarea
          id="conference-question-input"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          rows={3}
          placeholder={
            isAr
              ? 'اكتب سؤالك هنا...'
              : 'Type your question here...'
          }
          className="w-full px-4 py-3 rounded-2xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y placeholder:text-muted-foreground/60 leading-relaxed shadow-xs"
        />
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
          <span>
            {isAr
              ? 'اختياري — قد يتم اختيار بعض الأسئلة لطرحها خلال جلسة الأسئلة والأجوبة.'
              : 'Optional — Selected questions may be addressed during the Q&A session.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConferenceQuestionSection;
