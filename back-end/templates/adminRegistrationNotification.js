/**
 * Admin New Registration Notification Email Template
 *
 * Dispatched to configured event administrators (via ADMIN_NOTIFICATION_EMAILS)
 * whenever a new attendee registers for The 4th Press Conference or other events.
 */

/**
 * Generate plain text version of the admin notification email.
 */
function generateAdminRegistrationNotificationText({
  fullName = 'New Attendee',
  registrationNumber = 'PC4-2026-XXXX',
  email = '',
  phoneNumber = '',
  category = 'Guest',
  city = '',
  organizationName = '',
  jobTitle = '',
  discoverySource = '',
  preferredLanguage = 'ar',
  questionTopic = '',
  questionText = '',
  eventTitle = 'The 4th Press Conference',
  registeredAt = new Date().toISOString(),
}) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

  return [
    `========================================`,
    `Khaleeji Tour - New Event Registration`,
    `إشعار تسجيل جديد في الفعالية`,
    `========================================`,
    ``,
    `Event / الفعالية: ${eventTitle}`,
    `Registration ID / رقم التسجيل: ${registrationNumber}`,
    `Registered At / وقت التسجيل: ${registeredAt}`,
    ``,
    `--- ATTENDEE DETAILS / بيانات الحاضر ---`,
    `Full Name / الاسم: ${fullName}`,
    `Email / البريد الإلكتروني: ${email}`,
    `Phone / الهاتف: ${phoneNumber}${waLink ? ` (WhatsApp: ${waLink})` : ''}`,
    `Category / الفئة: ${category}`,
    city ? `City / المدينة: ${city}` : '',
    organizationName ? `Organization / المؤسسة: ${organizationName}` : '',
    jobTitle ? `Job Title / المسمى الوظيفي: ${jobTitle}` : '',
    discoverySource ? `Source / مصدر المعرفة: ${discoverySource}` : '',
    `Preferred Language / اللغة: ${preferredLanguage === 'ar' ? 'العربية' : preferredLanguage === 'en' ? 'English' : 'Both'}`,
    ``,
    (questionTopic || questionText) ? [
      `--- SUBMITTED Q&A QUESTION / سؤال المؤتمر المقدم ---`,
      questionTopic ? `Topic / الموضوع: ${questionTopic}` : '',
      questionText ? `Question / نص السؤال:\n${questionText}` : '',
      ``,
    ].filter(Boolean).join('\n') : '',
    `Review in Admin Dashboard: ${(process.env.FRONTEND_URL || 'https://www.khaleejitour.com').replace(/\/+$/, '')}/admin/registrations`,
    `Reply directly to this email to contact the attendee.`,
  ].filter(Boolean).join('\n');
}

/**
 * Generate HTML version of the admin notification email.
 */
function generateAdminRegistrationNotificationHtml({
  fullName = 'New Attendee',
  registrationNumber = 'PC4-2026-XXXX',
  email = '',
  phoneNumber = '',
  category = 'Guest',
  city = '',
  organizationName = '',
  jobTitle = '',
  discoverySource = '',
  preferredLanguage: _preferredLanguage = 'ar',
  questionTopic = '',
  questionText = '',
  eventTitle = 'The 4th Press Conference',
  registeredAt: _registeredAt = new Date().toISOString(),
  adminUrl: customAdminUrl,
}) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
  const baseUrl = (process.env.FRONTEND_URL || 'https://www.khaleejitour.com').replace(/\/+$/, '');
  const adminUrl = customAdminUrl || `${baseUrl}/admin/registrations`;

  const hasQuestion = Boolean(questionTopic || questionText);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>New Registration - ${fullName} (${registrationNumber})</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Base reset & typography */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }

    /* Responsive Mobile Overrides (Screen width <= 600px) */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 12px 6px !important;
      }
      .email-card {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 14px !important;
      }
      .mobile-padding {
        padding-left: 14px !important;
        padding-right: 14px !important;
      }
      .mobile-header-padding {
        padding: 24px 14px 18px 14px !important;
      }
      .mobile-tag {
        font-size: 13px !important;
        letter-spacing: 2px !important;
      }
      .mobile-h1 {
        font-size: 24px !important;
        line-height: 1.35 !important;
      }
      .mobile-subtitle {
        font-size: 16px !important;
      }
      .mobile-badge-box {
        padding: 16px 18px !important;
      }
      .mobile-reg-label {
        font-size: 13px !important;
      }
      .mobile-reg-num {
        font-size: 23px !important;
        letter-spacing: 1px !important;
      }
      .mobile-category-chip {
        font-size: 13px !important;
        padding: 6px 14px !important;
      }
      /* Stack table cells on narrow screens to prevent text crushing & awkward wrapping */
      .stack-row {
        display: block !important;
        width: 100% !important;
        margin-bottom: 10px !important;
      }
      .stack-cell-label {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        border-radius: 10px 10px 0 0 !important;
        border-bottom: none !important;
        padding: 10px 14px 4px 14px !important;
        font-size: 13.5px !important;
      }
      .stack-cell-value {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        border-radius: 0 0 10px 10px !important;
        border-top: none !important;
        padding: 4px 14px 12px 14px !important;
        font-size: 17px !important;
        font-weight: 700 !important;
      }
      .mobile-wa-link {
        display: inline-block !important;
        margin-top: 6px !important;
        white-space: nowrap !important;
        font-size: 13px !important;
      }
      .mobile-btn-container {
        width: 100% !important;
      }
      .mobile-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 16px 20px !important;
        font-size: 17px !important;
        font-weight: 800 !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #120C0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; word-break: break-word; overflow-wrap: anywhere;">

  <!-- Outer Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #120C0A; padding: 24px 12px;" class="email-wrapper">
    <tr>
      <td align="center">

        <!-- Main Card (Max 600px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-card" style="max-width: 600px; background-color: #1B120F; border: 1px solid #3A2820; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">

          <!-- Gold Accent Bar -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #8C6D32, #C9A96B, #E2CA97, #C9A96B, #8C6D32); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="mobile-header-padding" style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #2D1E18;">
              <div class="mobile-tag" style="font-size: 13px; font-weight: 800; letter-spacing: 2.5px; color: #C9A96B; text-transform: uppercase; margin-bottom: 8px;">
                KHALEEJI TOUR &bull; ADMIN NOTIFICATION
              </div>
              <h1 class="mobile-h1" style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #F7F1E8; letter-spacing: 0.3px; line-height: 1.35; word-break: break-word;">
                New Event Registration Received
              </h1>
              <p class="mobile-subtitle" style="margin: 0; font-size: 16px; color: #BDAF9D; line-height: 1.5; text-align: center;">
                <span dir="rtl" style="unicode-bidi: isolate;">تسجيل حضور جديد في:</span> <span dir="ltr" style="unicode-bidi: isolate; color: #C9A96B; font-weight: 800;">${eventTitle}</span>
              </p>
            </td>
          </tr>

          <!-- Quick Highlight Badge -->
          <tr>
            <td class="mobile-padding" style="padding: 20px 32px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mobile-badge-box" style="background-color: #241814; border: 1px solid #3E2A22; border-radius: 14px; padding: 16px 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div class="mobile-reg-label" style="font-size: 13px; color: #BDAF9D; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px;">
                      Registration ID / رقم التسجيل
                    </div>
                    <div class="mobile-reg-num" style="font-size: 23px; font-weight: 800; color: #C9A96B; font-family: monospace; letter-spacing: 1px; margin-top: 3px; white-space: nowrap;">
                      ${registrationNumber}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span class="mobile-category-chip" style="display: inline-block; background-color: rgba(201, 169, 107, 0.15); border: 1px solid rgba(201, 169, 107, 0.35); color: #C9A96B; font-size: 13px; font-weight: 800; padding: 7px 15px; border-radius: 20px; text-transform: uppercase; white-space: nowrap;">
                      ${category}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attendee Information Table -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 0 8px;">

                <!-- Full Name -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; width: 34%; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Full Name / الاسم
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17.5px; font-weight: 800; color: #FFFFFF; word-break: break-word; overflow-wrap: anywhere; vertical-align: middle;">
                    ${fullName}
                  </td>
                </tr>

                <!-- Email Address -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Email / البريد
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 600; word-break: break-word; overflow-wrap: anywhere; vertical-align: middle;">
                    <a href="mailto:${email}" style="color: #C9A96B; text-decoration: none; font-family: monospace; word-break: break-all;">${email}</a>
                  </td>
                </tr>

                <!-- Phone / WhatsApp -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Phone / الهاتف
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17.5px; font-weight: 700; color: #FFFFFF; vertical-align: middle;">
                    <span style="font-family: monospace; white-space: nowrap;">${phoneNumber}</span>
                    ${waLink ? `
                      <span class="mobile-wa-link" style="margin-left: 8px;">
                        <a href="${waLink}" target="_blank" style="display: inline-block; background-color: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.4); color: #25D366; text-decoration: none; font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 7px; white-space: nowrap;">
                          WhatsApp &rarr;
                        </a>
                      </span>
                    ` : ''}
                  </td>
                </tr>

                <!-- City -->
                ${city ? `
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    City / المدينة
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17px; font-weight: 600; color: #FFFFFF; word-break: break-word; vertical-align: middle;">
                    ${city}
                  </td>
                </tr>
                ` : ''}

                <!-- Organization -->
                ${organizationName ? `
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Organization / الجهة
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17px; font-weight: 600; color: #FFFFFF; word-break: break-word; overflow-wrap: anywhere; vertical-align: middle;">
                    ${organizationName} ${jobTitle ? `&bull; <span style="color: #BDAF9D; font-size: 15.5px; font-weight: normal;">${jobTitle}</span>` : ''}
                  </td>
                </tr>
                ` : ''}

                <!-- Discovery Source -->
                ${discoverySource ? `
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Source / المصدر
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 600; color: #E0D4C5; word-break: break-word; vertical-align: middle;">
                    ${discoverySource}
                  </td>
                </tr>
                ` : ''}

              </table>
            </td>
          </tr>

          <!-- Q&A Question Highlight Box (if attendee submitted a question) -->
          ${hasQuestion ? `
          <tr>
            <td class="mobile-padding" style="padding: 0 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(201, 169, 107, 0.08); border: 1px solid rgba(201, 169, 107, 0.35); border-radius: 14px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 14.5px; font-weight: 800; color: #C9A96B; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                      &#x1F4AC; Conference Question (Q&amp;A) &bull; سؤال المؤتمر
                    </div>
                    ${questionTopic ? `
                    <div style="display: inline-block; background-color: #C9A96B; color: #1B120F; font-size: 12.5px; font-weight: 800; padding: 5px 12px; border-radius: 6px; text-transform: uppercase; margin-bottom: 8px;">
                      Topic: ${questionTopic}
                    </div>
                    ` : ''}
                    ${questionText ? `
                    <div style="font-size: 16px; color: #F7F1E8; line-height: 1.6; background-color: #1B120F; border: 1px solid #3E2A22; border-radius: 8px; padding: 14px; margin-top: 4px; font-style: italic; word-break: break-word; overflow-wrap: anywhere;">
                      &ldquo;${questionText}&rdquo;
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Admin Call to Action Buttons -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 28px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="mobile-btn-container" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: #C9A96B; text-align: center;">
                    <a href="${adminUrl}" target="_blank" class="mobile-btn" style="background: #C9A96B; border: 1px solid #C9A96B; font-family: sans-serif; font-size: 17px; font-weight: 800; line-height: 1.2; text-decoration: none; padding: 16px 36px; color: #1B120F; border-radius: 12px; display: inline-block; letter-spacing: 0.5px; white-space: nowrap;">
                      Open in Admin Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 13.5px; color: #BDAF9D; line-height: 1.5; word-break: break-word;">
                You can reply directly to this email to contact the attendee (<a href="mailto:${email}" style="color: #C9A96B; text-decoration: none; font-weight: 700;">${email}</a>).
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="padding: 16px 32px; background-color: #140E0C; border-top: 1px solid #2D1E18; text-align: center; font-size: 13px; color: #88746B; line-height: 1.5;">
              Khaleeji Tour Automated Event Dispatcher &bull; 5165 Dixie Rd, Mississauga, ON
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
  generateAdminRegistrationNotificationText,
  generateAdminRegistrationNotificationHtml,
};
