/**
 * Event Registration Confirmation Email Template
 *
 * Generates responsive HTML & plain-text confirmation email for Khaleeji Tour event registrations.
 * Features:
 *   - Khaleeji Tour branding with luxury gold accents (#D4AF37)
 *   - Unique Registration ID badge (PC4-2026-XXXX)
 *   - High-contrast QR Code for mobile & print scan verification
 *   - Key event details (Date, Time, Venue, Attendee Category)
 *   - Anti-spam compliance (CAN-SPAM, multipart text, physical address)
 */

/**
 * Generate plain text version of the registration confirmation email.
 */
function generateRegistrationConfirmationText({
  fullName = "Valued Guest",
  registrationNumber = "PC4-2026-0001",
  eventTitle = "Official Registration – The 4th Press Conference",
  eventDate = "Wednesday, September 23, 2026",
  eventTime = "7:15 PM – 9:00 PM",
  eventVenue = "Holiday Inn & Suites Mississauga West / Meadowvale",
  category = "Guest",
  city = "",
  organizationName = "",
  jobTitle = "",
  preferredLanguage: _preferredLanguage = "ar",
}) {
  return [
    `========================================`,
    `Khaleeji Tour - Event Registration Confirmation`,
    `تأكيد التسجيل الرسمي - المؤتمر الصحفي الرابع`,
    `========================================`,
    ``,
    `Dear / مرحباً ${fullName},`,
    ``,
    `Thank you for registering. Your registration has been confirmed successfully!`,
    `تم استلام وتأكيد تسجيلك لحضور المؤتمر الصحفي الرابع بنجاح.`,
    ``,
    `Registration ID / رقم التسجيل: ${registrationNumber}`,
    `Event / الفعالية: ${eventTitle}`,
    `Date / التاريخ: ${eventDate}`,
    `Time / الوقت: ${eventTime}`,
    `Venue / المكان: ${eventVenue}`,
    `Category / صفة الحضور: ${category}`,
    city ? `City / المدينة: ${city}` : "",
    organizationName ? `Organization / المؤسسة: ${organizationName}` : "",
    jobTitle ? `Position / المسمى الوظيفي: ${jobTitle}` : "",
    ``,
    `Please present your Registration ID or QR code upon arrival at the gate.`,
    `يرجى إبراز رقم التسجيل أو رمز الاستجابة السريعة (QR) عند مدخل الفعالية.`,
    ``,
    `---`,
    `Need help? Contact us at support@khaleejitour.com`,
    `Khaleeji Tour`,
    `5165 Dixie Rd, Mississauga, ON L4W 4G1`,
    `Website: https://www.khaleejitour.com`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generate HTML version of the registration confirmation email.
 */
function generateRegistrationConfirmationHtml({
  fullName = "Valued Guest",
  registrationNumber = "PC4-2026-0001",
  eventTitle = "Official Registration – The 4th Press Conference",
  eventDate = "Wednesday, September 23, 2026",
  eventTime = "7:15 PM – 9:00 PM",
  eventVenue = "Holiday Inn & Suites Mississauga West / Meadowvale",
  category = "Guest",
  city = "",
  organizationName = "",
  jobTitle = "",
  qrImageUrl = "",
  preferredLanguage: _preferredLanguage = "ar",
}) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>Registration Confirmation - ${registrationNumber}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, li, blockquote { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
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
      .email-container {
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
      .mobile-h1 {
        font-size: 20px !important;
        line-height: 1.35 !important;
      }
      .mobile-banner-padding {
        padding: 20px 14px !important;
      }
      .mobile-badge {
        font-size: 11px !important;
        padding: 5px 12px !important;
        letter-spacing: 0.5px !important;
      }
      .mobile-reg-box {
        padding: 14px 12px !important;
      }
      .mobile-reg-id {
        font-size: 17px !important;
        letter-spacing: 1px !important;
      }
      .qr-img {
        width: 150px !important;
        height: 150px !important;
      }
      .qr-container {
        padding: 12px !important;
      }
      /* Stack details rows on narrow screens to eliminate cramped table wrapping */
      .detail-row {
        display: block !important;
        width: 100% !important;
        border-bottom: 1px solid #2F1F17 !important;
        padding: 10px 14px !important;
        box-sizing: border-box !important;
      }
      .detail-label {
        display: block !important;
        width: 100% !important;
        font-size: 11px !important;
        color: #A8A29E !important;
        margin-bottom: 3px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      .detail-val {
        display: block !important;
        width: 100% !important;
        font-size: 13px !important;
        color: #FFFFFF !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }
      .instructions-box {
        padding: 12px 14px !important;
      }
      .instructions-text {
        font-size: 11.5px !important;
        line-height: 1.6 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0F0B08; color: #E8E6E3; word-break: break-word; overflow-wrap: anywhere;">
  <!-- Preheader preview text for inbox -->
  <div style="display: none; font-size: 1px; color: #0F0B08; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your registration for ${eventTitle} is confirmed! Registration ID: ${registrationNumber}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #0F0B08; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #1A120D; border: 1px solid #33241B; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" class="mobile-header-padding" style="background: linear-gradient(180deg, #241710 0%, #1A120D 100%); padding: 32px 20px 24px 20px; border-bottom: 1px solid #33241B;">
              <span style="font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #D4AF37; text-transform: uppercase;">Khaleeji Tour</span>
              <h1 class="mobile-h1" style="margin: 8px 0 0 0; font-size: 24px; font-weight: 800; color: #FFFFFF; line-height: 1.35; word-break: break-word;">
                ${eventTitle}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 15px; color: #C5A059; font-weight: 600; line-height: 1.4;">
                <span dir="rtl" style="unicode-bidi: embed;">التسجيل الرسمي – المؤتمر الصحفي الرابع</span>
              </p>
            </td>
          </tr>

          <!-- Confirmation Status Banner -->
          <tr>
            <td class="mobile-banner-padding" style="padding: 24px 32px; background-color: rgba(212, 175, 55, 0.08); border-bottom: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
              <div class="mobile-badge" style="display: inline-block; padding: 6px 16px; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; color: #4ADE80; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
                ✓ Registration Confirmed &bull; <span dir="rtl">تم تأكيد التسجيل</span>
              </div>
              <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 700; word-break: break-word;">
                Dear ${fullName},
              </h2>
              <p style="margin: 6px 0 0 0; color: #A8A29E; font-size: 14px; line-height: 1.5;">
                We are pleased to welcome your registration. Your spot has been reserved.
              </p>
            </td>
          </tr>

          <!-- Registration ID Card -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 32px 16px 32px; text-align: center;">
              <div class="mobile-reg-box" style="background-color: #241710; border: 1px dashed #D4AF37; border-radius: 12px; padding: 18px; text-align: center;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #A8A29E; font-weight: 600; display: block;">
                  Registration ID &bull; <span dir="rtl">رقم التسجيل</span>
                </span>
                <span class="mobile-reg-id" style="font-size: 20px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; display: block; margin-top: 4px; font-family: monospace; white-space: nowrap;">
                  ${registrationNumber}
                </span>
              </div>
            </td>
          </tr>

          <!-- QR Code Entry Badge (if provided) -->
          ${
            qrImageUrl
              ? `
          <tr>
            <td align="center" class="mobile-padding" style="padding: 0 32px 20px 32px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" class="qr-container" style="background-color: #FFFFFF; padding: 16px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4); text-align: center;">
                    <img src="${qrImageUrl}" alt="Express Entry QR Code" width="180" height="180" class="qr-img" style="display: block; margin: 0 auto; border-radius: 6px; max-width: 100%; height: auto;" />
                    <span style="display: block; margin-top: 10px; font-size: 11px; font-weight: 700; color: #1A120D; letter-spacing: 0.5px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      SCAN AT GATE FOR FAST CHECK-IN
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Event Details Table -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #241710; border-radius: 12px; border: 1px solid #33241B; border-collapse: separate; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 14px 18px; background-color: #2B1D16; border-bottom: 1px solid #38281E; font-size: 13px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px;">
                    Event &amp; Attendee Details
                  </td>
                </tr>

                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; width: 35%; border-bottom: 1px solid #2F1F17; vertical-align: middle;">Date &amp; Time</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">
                    ${eventDate}<br />
                    <span style="color: #D4AF37; font-weight: 500;">${eventTime}</span>
                  </td>
                </tr>

                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">Venue</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">
                    ${eventVenue}
                  </td>
                </tr>

                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">Attendee Category</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">
                    ${category}
                  </td>
                </tr>

                ${
                  city
                    ? `
                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">City</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">${city}</td>
                </tr>`
                    : ""
                }

                ${
                  organizationName
                    ? `
                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">Organization</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">${organizationName}</td>
                </tr>`
                    : ""
                }

                ${
                  jobTitle
                    ? `
                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">Position</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; border-bottom: 1px solid #2F1F17; vertical-align: middle;">${jobTitle}</td>
                </tr>`
                    : ""
                }

                <tr class="detail-row">
                  <td class="detail-label" style="padding: 12px 18px; color: #A8A29E; font-size: 13px; vertical-align: middle;">Registration Status</td>
                  <td class="detail-val" style="padding: 12px 18px; color: #D4AF37; font-weight: 700; font-size: 13px; vertical-align: middle;">
                    Confirmed &bull; <span dir="rtl">مؤكد</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Instructions -->
          <tr>
            <td class="mobile-padding" style="padding: 0 32px 28px 32px;">
              <div class="instructions-box" style="background-color: rgba(212, 175, 55, 0.05); border-left: 3px solid #D4AF37; border-radius: 6px; padding: 14px 16px;">
                <h4 style="margin: 0 0 6px 0; color: #D4AF37; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  Important Instructions &bull; <span dir="rtl">تعليمات هامة</span>
                </h4>
                <p class="instructions-text" style="margin: 0; color: #D1D5DB; font-size: 12px; line-height: 1.6; word-break: break-word;">
                  &bull; Please present this email or your Registration ID at the reception desk.<br />
                  &bull; Doors open at 6:45 PM. The conference starts promptly at 7:15 PM.<br />
                  &bull; <span dir="rtl">يرجى إبراز هذه الرسالة أو رقم التسجيل عند نقطة الاستقبال للدخول.</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="background-color: #140D09; padding: 24px 32px; border-top: 1px solid #2B1D16; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 13px; font-weight: 700;">
                Khaleeji Tour &mdash; Experience the Heritage
              </p>
              <p style="margin: 0 0 10px 0; color: #78716C; font-size: 11px; line-height: 1.5; word-break: break-word;">
                2565 Argentia Road, Mississauga, ON L5N 5V4, Canada<br />
                Email: <a href="mailto:support@khaleejitour.com" style="color: #D4AF37; text-decoration: none;">support@khaleejitour.com</a>
              </p>
              <p style="margin: 0; color: #57534E; font-size: 10px; line-height: 1.4;">
                This transactional email confirms your advance registration on khaleejitour.com.
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
  generateRegistrationConfirmationText,
  generateRegistrationConfirmationHtml,
};
