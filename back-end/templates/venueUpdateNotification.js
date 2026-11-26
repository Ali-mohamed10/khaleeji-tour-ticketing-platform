/**
 * Venue Update Notification Email Template
 *
 * Subject: تحديث مهم لموقع المؤتمر الصحفي الرابع – خليجي تور | 23 سبتمبر 2026
 *
 * Designed with Khaleeji Tour luxury gold branding (#C9A96B / #D4AF37),
 * full mobile responsiveness, RTL Arabic support, and Google Maps CTA button.
 */

/**
 * Generate plain-text version of the venue update email
 */
function generateVenueUpdateText({
  recipientName = 'السادة الضيوف الكرام',
} = {}) {
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Holiday+Inn+%26+Suites+Mississauga+West+2565+Argentia+Road+Mississauga+ON+L5N+5V4';

  return [
    `==================================================`,
    `تحديث مهم لموقع المؤتمر الصحفي الرابع – خليجي تور`,
    `Important Venue Update – Khaleeji Tour`,
    `==================================================`,
    ``,
    recipientName && recipientName !== 'السادة الضيوف الكرام'
      ? `${recipientName} المحترم/ة،`
      : `السادة الضيوف الكرام،`,
    ``,
    `تحية طيبة،`,
    ``,
    `نود إحاطتكم علمًا بوجود تحديث على موقع إقامة المؤتمر الصحفي الرابع لـ KHALEEJI TOUR – THE TITAN EDITION، والمقرر انعقاده غدًا، الأربعاء 23 سبتمبر 2026.`,
    ``,
    `نود التأكيد أن تاريخ ووقت المؤتمر لم يتغيرا، والتغيير يقتصر فقط على موقع إقامة الفعالية.`,
    ``,
    `--------------------------------------------------`,
    `تفاصيل الفعالية المحدثة:`,
    `--------------------------------------------------`,
    `الفعالية: KHALEEJI TOUR – THE TITAN EDITION`,
    `         المؤتمر الصحفي الرابع (The 4th Press Conference)`,
    ``,
    `التاريخ: الأربعاء 23 سبتمبر 2026 (Wednesday, Sep 23, 2026)`,
    `الوقت: 7:15 مساءً – 9:00 مساءً (7:15 PM – 9:00 PM)`,
    ``,
    `الموقع الجديد (New Venue):`,
    `Holiday Inn & Suites Mississauga West / Meadowvale`,
    `2565 Argentia Road, Mississauga, ON L5N 5V4`,
    `رابط خرائط جوجل: ${mapsUrl}`,
    ``,
    `--------------------------------------------------`,
    `نرجو التكرم بتجاهل معلومات الموقع التي تم إرسالها سابقًا، واعتماد الموقع الجديد الموضح أعلاه.`,
    ``,
    `الدخول بالدعوة والتسجيل المؤكد فقط.`,
    ``,
    `نعتذر عن أي إزعاج قد ينتج عن تغيير الموقع، ونقدّر لكم تفهمكم وتعاونكم.`,
    ``,
    `نتطلع بكل سرور إلى استقبالكم غدًا، ونسعد بحضوركم ومشاركتكم معنا في هذه المناسبة.`,
    ``,
    `مع خالص التحية والتقدير،`,
    `آيات ال ربح`,
    `جمعية الثقافة والفنون الخليجية بكندا`,
    `KHALEEJI TOUR – THE TITAN EDITION`,
    ``,
    `---`,
    `Khaleeji Tour - Experience the Heritage`,
    `Website: https://www.khaleejitour.com`,
    `Support: support@khaleejitour.com`,
  ].join('\n');
}

/**
 * Generate rich responsive HTML version of the venue update email
 */
function generateVenueUpdateHtml({
  recipientName = 'السادة الضيوف الكرام',
} = {}) {
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Holiday+Inn+%26+Suites+Mississauga+West+2565+Argentia+Road+Mississauga+ON+L5N+5V4';
  const preheaderText = 'تحديث مهم لموقع إقامة المؤتمر الصحفي الرابع غداً الأربعاء 23 سبتمبر 2026 - الموقع الجديد: Holiday Inn & Suites Mississauga West';

  const greetingLine = recipientName && recipientName !== 'السادة الضيوف الكرام'
    ? `${recipientName} المحترم/ة`
    : `السادة الضيوف الكرام`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>تحديث مهم لموقع المؤتمر الصحفي الرابع – خليجي تور</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #0E0908;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'Segoe UI Arabic', Tahoma, Arial, sans-serif;
      color: #E6E1DF;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 12px 6px !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 12px !important;
      }
      .mobile-padding {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .mobile-btn {
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        padding: 16px 20px !important;
        font-size: 15px !important;
      }
      .mobile-h1 {
        font-size: 20px !important;
        line-height: 1.4 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0E0908; direction: rtl; text-align: right;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheaderText}
    ${'&zwnj;&nbsp;'.repeat(30)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper" style="background-color: #0E0908; padding: 30px 12px;">
    <tr>
      <td align="center" style="vertical-align: top;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 620px; background-color: #19110E; border: 1px solid #38271E; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 36px 24px; text-align: center; background: linear-gradient(180deg, #241814 0%, #19110E 100%); border-bottom: 1px solid #2B1D16;">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #D4AF37; text-transform: uppercase;">
                KHALEEJI TOUR
              </div>
              <div style="font-size: 12px; letter-spacing: 1.5px; color: #BDAF9D; margin-top: 4px; font-weight: 600;">
                THE TITAN EDITION
              </div>
              <div style="font-size: 13px; color: #A69188; margin-top: 6px;">
                جمعية الثقافة والفنون الخليجية بكندا
              </div>
            </td>
          </tr>

          <!-- Alert Badge & Title -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 36px 12px; text-align: center;">
              
              <div style="display: inline-block; padding: 6px 18px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 50px; color: #D4AF37; font-size: 12.5px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px;">
                ⚠️ تحديث مهم / IMPORTANT NOTICE
              </div>

              <h1 class="mobile-h1" style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0 0 10px; line-height: 1.45;">
                تحديث موقع المؤتمر الصحفي الرابع
              </h1>
              <div style="color: #A69188; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 6px;">
                The 4th Press Conference &bull; Venue Update
              </div>

            </td>
          </tr>

          <!-- Greeting & Main Message -->
          <tr>
            <td class="mobile-padding" style="padding: 12px 36px 20px; font-size: 15px; line-height: 1.85; color: #E6E1DF;">
              
              <p style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #D4AF37;">
                ${greetingLine}،
              </p>

              <p style="margin: 0 0 14px; color: #D1D5DB;">
                تحية طيبة،
              </p>

              <p style="margin: 0 0 16px; color: #F3F4F6;">
                نود إحاطتكم علمًا بوجود <strong>تحديث على موقع إقامة المؤتمر الصحفي الرابع</strong> لـ <strong>KHALEEJI TOUR – THE TITAN EDITION</strong>، والمقرر انعقاده غدًا، <strong>الأربعاء 23 سبتمبر 2026</strong>.
              </p>

              <!-- Highlight Note Box -->
              <div style="background-color: rgba(212, 175, 55, 0.08); border-right: 4px solid #D4AF37; border-radius: 8px; padding: 14px 18px; margin: 18px 0; color: #F7F1E8; font-size: 14.5px; line-height: 1.7;">
                <strong>نود التأكيد</strong> أن <strong>تاريخ ووقت المؤتمر لم يتغيرا</strong> إطلاقاً، والتغيير يقتصر فقط على <strong>موقع إقامة الفعالية</strong>.
              </div>

            </td>
          </tr>

          <!-- Venue & Event Details Card -->
          <tr>
            <td class="mobile-padding" style="padding: 0 36px 24px;">
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #211612; border: 1px solid #3D2B21; border-radius: 14px; overflow: hidden;">
                
                <tr>
                  <td colspan="2" style="background-color: #281B15; padding: 14px 20px; border-bottom: 1px solid #3D2B21; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; color: #D4AF37;">
                    📍 تفاصيل الفعالية المحدثة / UPDATED DETAILS
                  </td>
                </tr>

                <!-- Event Name -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #A8A29E; font-size: 13.5px; width: 32%; vertical-align: top;">
                    الفعالية
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #FFFFFF; font-weight: 700; font-size: 14px; vertical-align: top;">
                    KHALEEJI TOUR – THE TITAN EDITION<br />
                    <span style="color: #D4AF37; font-weight: 600; font-size: 13px;">المؤتمر الصحفي الرابع</span>
                  </td>
                </tr>

                <!-- Date -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #A8A29E; font-size: 13.5px; vertical-align: top;">
                    التاريخ
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #FFFFFF; font-weight: 700; font-size: 14px; vertical-align: top;">
                    الأربعاء 23 سبتمبر 2026<br />
                    <span style="color: #9CA3AF; font-size: 12.5px; font-weight: 500;">Wednesday, September 23, 2026</span>
                  </td>
                </tr>

                <!-- Time -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #A8A29E; font-size: 13.5px; vertical-align: top;">
                    الوقت
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #2F1F17; color: #D4AF37; font-weight: 800; font-size: 15px; vertical-align: top;">
                    7:15 مساءً – 9:00 مساءً<br />
                    <span style="color: #9CA3AF; font-size: 12.5px; font-weight: 500;">7:15 PM – 9:00 PM</span>
                  </td>
                </tr>

                <!-- New Venue -->
                <tr>
                  <td style="padding: 16px 20px; color: #D4AF37; font-size: 13.5px; font-weight: 800; vertical-align: top;">
                    الموقع الجديد<br />
                    <span style="color: #9CA3AF; font-size: 11.5px; font-weight: normal;">NEW VENUE</span>
                  </td>
                  <td style="padding: 16px 20px; color: #FFFFFF; font-weight: 700; font-size: 14.5px; line-height: 1.6; vertical-align: top;">
                    <div style="font-size: 15.5px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">
                      Holiday Inn &amp; Suites Mississauga West / Meadowvale
                    </div>
                    <div style="color: #D1D5DB; font-size: 13.5px; font-weight: 500; direction: ltr; text-align: right;">
                      2565 Argentia Road, Mississauga, ON L5N 5V4
                    </div>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Google Maps Button CTA -->
          <tr>
            <td class="mobile-padding" style="padding: 6px 36px 26px; text-align: center;">
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #D4AF37;">
                    <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="mobile-btn" style="background-color: #D4AF37; border: 1px solid #D4AF37; font-family: inherit; font-size: 15px; font-weight: 800; line-height: 1.2; text-decoration: none; padding: 15px 36px; color: #140E0C; border-radius: 12px; display: inline-block; letter-spacing: 0.5px;">
                      🗺️ فتح الموقع على خرائط Google &larr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Important Instructions & Politeness -->
          <tr>
            <td class="mobile-padding" style="padding: 0 36px 28px; font-size: 14px; line-height: 1.8; color: #D1D5DB;">
              
              <ul style="margin: 0 0 16px; padding-right: 20px; color: #E5E7EB;">
                <li style="margin-bottom: 8px;">
                  <strong>نرجو التكرم بتجاهل معلومات الموقع التي تم إرسالها سابقًا</strong>، واعتماد الموقع الجديد الموضح أعلاه.
                </li>
                <li style="margin-bottom: 8px; color: #D4AF37; font-weight: 700;">
                  الدخول بالدعوة والتسجيل المؤكد فقط.
                </li>
                <li>
                  نعتذر عن أي إزعاج قد ينتج عن تغيير الموقع، ونقدّر لكم عاليًا تفهمكم وتعاونكم.
                </li>
              </ul>

              <p style="margin: 0 0 20px; color: #FFFFFF; font-weight: 600;">
                نتطلع بكل سرور إلى استقبالكم غدًا، ونسعد بحضوركم ومشاركتكم معنا في هذه المناسبة المميزة.
              </p>

              <!-- Signature -->
              <div style="border-top: 1px solid #2B1D16; padding-top: 18px; color: #F3F4F6;">
                <div style="font-size: 14px; color: #9CA3AF; margin-bottom: 4px;">مع خالص التحية والتقدير،</div>
                <div style="font-size: 16px; font-weight: 800; color: #D4AF37;">آيات ال ربح</div>
                <div style="font-size: 13.5px; color: #E5E7EB; margin-top: 2px;">جمعية الثقافة والفنون الخليجية بكندا</div>
                <div style="font-size: 12px; color: #A8A29E; letter-spacing: 1px; margin-top: 2px;">KHALEEJI TOUR – THE TITAN EDITION</div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="background-color: #140D09; padding: 22px 36px; border-top: 1px solid #2B1D16; text-align: center;">
              <p style="margin: 0 0 6px; color: #FFFFFF; font-size: 12.5px; font-weight: 700;">
                Khaleeji Tour &mdash; Experience the Heritage
              </p>
              <p style="margin: 0 0 8px; color: #78716C; font-size: 11px; line-height: 1.5; direction: ltr;">
                2565 Argentia Road, Mississauga, ON L5N 5V4 &bull; <a href="mailto:support@khaleejitour.com" style="color: #D4AF37; text-decoration: none;">support@khaleejitour.com</a>
              </p>
              <p style="margin: 0; color: #57534E; font-size: 10.5px; line-height: 1.4;">
                رسالة إشعار رسمية موجهة لضيوف والمشاركين المسجلين في المؤتمر الصحفي الرابع.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = {
  generateVenueUpdateText,
  generateVenueUpdateHtml,
};
