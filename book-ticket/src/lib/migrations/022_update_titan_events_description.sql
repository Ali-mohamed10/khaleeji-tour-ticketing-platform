-- ============================================================
-- Migration 022: Update Descriptions for THE TITAN EDITION Events
-- Updates description_ar and description_en in public.events
-- ============================================================

DO $$
DECLARE
  v_desc_ar TEXT;
  v_desc_en TEXT;
BEGIN
  v_desc_ar := 'خليجي تور 2026 – THE TITAN EDITION ✨

مو مجرد حفلة…
تذكرتك تشمل تجربة خليجي تور كاملة. 🎟️

بتذكرة واحدة تستمتع بجميع فقرات وتجارب الأمسية، بدون الحاجة لشراء تذاكر منفصلة لكل فقرة:

🎤 عروض موسيقية وفنية مباشرة
🎭 ستاند أب كوميدي
🎶 تجربة كاريوكي تفاعلية مع الجمهور
🥁 عروض من الفنون الخليجية
🏆 احتفال خاص ببطل كأس الخليج 27 – خليجي 27
🎉 احتفالات بالمناسبات الوطنية الخليجية
🎙️ مقدّمون على مستوى عالٍ
⭐ تشكيلة من النجوم والمواهب
🎁 مسابقات وجوائز وهدايا ومفاجآت خاصة
🍽️ بوفيه وضيافة خليجية فاخرة مشمولة ضمن التذكرة
✨ وفقرات ومفاجآت إضافية طوال الأمسية

كل هذا مشمول في تذكرتك. 🎟️

ومن لحظة وصولك وحتى نهاية الأمسية، تعيش تجربة خليجية متكاملة تجمع الموسيقى، الضحك، الثقافة، الترفيه، التفاعل والضيافة في ليلة واحدة.

تذكرة واحدة. ليلة واحدة. تجربة كاملة.
هذه مو مجرد حفلة… هذه KHALEEJI TOUR.

🎟️ احجز تذكرتك الآن
KHALEEJI TOUR 2026 – THE TITAN EDITION';

  v_desc_en := 'KHALEEJI TOUR 2026 – THE TITAN EDITION ✨

More than a concert.
Your ticket includes the complete Khaleeji Tour experience. 🎟️

With one ticket, you’ll enjoy all the entertainment and experiences throughout the evening — no separate tickets are required for each activity:

🎤 Live Music & Performances
🎭 Stand-Up Comedy
🎶 Interactive Karaoke Experience
🥁 Gulf Folk Performances
🏆 A Special Celebration for the Arabian Gulf Cup 27 Champion
🎉 Gulf National Celebrations
🎙️ Elite Hosts
⭐ A Lineup of Stars & Talents
🎁 Contests, Giveaways & Special Surprises
🍽️ Premium Khaleeji Buffet & Hospitality — included with your ticket
✨ Plus more entertainment and surprises throughout the night

Everything is included with your ticket. 🎟️

From the moment you arrive until the end of the evening, experience a complete Khaleeji night bringing together music, comedy, culture, interactive entertainment and premium Gulf hospitality.

One Ticket. One Night. The Full Experience.
More than a concert. This is KHALEEJI TOUR.

🎟️ Book your tickets now.
KHALEEJI TOUR 2026 – THE TITAN EDITION';

  -- Update both events by title pattern or slug
  UPDATE public.events
  SET description_ar = v_desc_ar,
      description_en = v_desc_en,
      updated_at = now()
  WHERE title_en ILIKE '%TITAN%'
     OR title_ar ILIKE '%تيتان%'
     OR slug ILIKE '%titan%';

END $$;

NOTIFY pgrst, 'reload schema';
