/**
 * Admin New Ticket Booking Notification Email Template
 *
 * Dispatched to event administrators whenever a customer successfully
 * pays for and books a ticket for any event on Khaleeji Tour.
 */

/**
 * Generate plain text version of the admin booking notification email.
 */
function generateAdminBookingNotificationText({
  customerName = 'Valued Customer',
  customerEmail = '',
  customerPhone = '',
  ticketCode = 'KT-TICKET',
  bookingId: _bookingId = '',
  eventTitle = 'Khaleeji Tour Event',
  eventDate = 'TBD',
  eventVenue = 'TBD',
  tables = [],
  totalAmount = '0.00',
  currency = 'CAD',
  paymentMethod = 'Stripe',
  stripePaymentIntentId = '',
  bookedAt = new Date().toISOString(),
}) {
  const cleanPhone = (customerPhone || '').replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

  const tableLines = tables.length > 0
    ? tables.map((t) => `  - ${t.table_name || `Table #${t.table_code || ''}`}: ${t.seats_count || 1} seat(s) ($${Number(t.unit_price || 0).toFixed(2)})`).join('\n')
    : '  - General Admission Ticket';

  const baseUrl = (process.env.FRONTEND_URL || 'https://www.khaleejitour.com').replace(/\/+$/, '');
  const adminUrl = `${baseUrl}/admin`;

  return [
    `========================================`,
    `Khaleeji Tour - New Booking Notification`,
    `إشعار حجز تذكرة جديد`,
    `========================================`,
    ``,
    `A new ticket order was completed (${paymentMethod || 'Stripe'}).`,
    ``,
    `--- ORDER SUMMARY / ملخص الطلب ---`,
    `Event / الفعالية: ${eventTitle}`,
    `Ticket Code / كود التذكرة: ${ticketCode}`,
    `Booking ID / رقم الحجز: ${bookingId}`,
    `Payment Method / طريقة الدفع: ${paymentMethod || 'Stripe'}`,
    `Total Paid / المبلغ المدفوع: $${Number(totalAmount).toFixed(2)} ${currency}`,
    `Booked At / وقت الحجز: ${bookedAt}`,
    stripePaymentIntentId ? `Payment Reference: ${stripePaymentIntentId}` : '',
    ``,
    `--- CUSTOMER DETAILS / بيانات العميل ---`,
    `Customer Name / الاسم: ${customerName}`,
    `Email / البريد: ${customerEmail}`,
    `Phone / الهاتف: ${customerPhone}${waLink ? ` (WhatsApp: ${waLink})` : ''}`,
    ``,
    `--- EVENT & VENUE / تفاصيل الفعالية ---`,
    `Date & Time / الموعد: ${eventDate}`,
    `Venue / المكان: ${eventVenue}`,
    ``,
    `--- RESERVED SEATING / المقاعد المحجوزة ---`,
    tableLines,
    ``,
    `Review in Admin Dashboard: ${adminUrl}`,
    `Reply directly to this email to contact the customer.`,
  ].filter(Boolean).join('\n');
}

/**
 * Generate HTML version of the admin booking notification email.
 */
function generateAdminBookingNotificationHtml({
  customerName = 'Valued Customer',
  customerEmail = '',
  customerPhone = '',
  ticketCode = 'KT-TICKET',
  bookingId: _bookingId = '',
  eventTitle = 'Khaleeji Tour Event',
  eventDate = 'TBD',
  eventVenue = 'TBD',
  tables = [],
  totalAmount = '0.00',
  currency = 'CAD',
  paymentMethod = 'Stripe',
  stripePaymentIntentId = '',
  bookedAt: _bookedAt = new Date().toISOString(),
  adminUrl: customAdminUrl,
}) {
  const cleanPhone = (customerPhone || '').replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
  const baseUrl = (process.env.FRONTEND_URL || 'https://www.khaleejitour.com').replace(/\/+$/, '');
  const adminUrl = customAdminUrl || `${baseUrl}/admin`;

  const formattedTotal = Number(totalAmount || 0).toFixed(2);

  const tablesHtml = tables.length > 0
    ? tables.map((t) => {
        const seatsCount = t.seats_count || 1;
        const seatText = seatsCount === 1 ? '1 Seat' : `${seatsCount} Seats`;
        const priceText = t.unit_price ? `$${Number(t.unit_price).toFixed(2)}` : '';
        return `
        <tr class="stack-row">
          <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 8px 0 0 8px; font-size: 14.5px; font-weight: 700; color: #F7F1E8; vertical-align: middle;">
            ${t.table_name || `Table #${t.table_code || ''}`}
          </td>
          <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 8px 8px 0; font-size: 15px; font-weight: 700; color: #C9A96B; text-align: right; vertical-align: middle;">
            ${seatText} ${priceText ? `&bull; <span style="color: #BDAF9D; font-size: 14px;">${priceText}</span>` : ''}
          </td>
        </tr>
      `;
      }).join('')
    : `
        <tr class="stack-row">
          <td colspan="2" style="padding: 12px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 8px; font-size: 14.5px; color: #BDAF9D; text-align: center;">
            General Admission Ticket
          </td>
        </tr>
      `;

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>New Ticket Booking - ${customerName} ($${formattedTotal} ${currency}) [${paymentMethod}]</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: Arial, sans-serif !important; }
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
      .mobile-ticket-code {
        font-size: 22px !important;
        letter-spacing: 1px !important;
      }
      .mobile-amount-badge {
        font-size: 15.5px !important;
        padding: 6px 14px !important;
      }
      /* Stack rows on narrow screens to prevent cramped table wrapping */
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
        text-align: left !important;
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
        text-align: left !important;
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #120C0A; padding: 24px 12px;">
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
                New Ticket Booking Confirmed! &#x1F39F;&#xFE0F;
              </h1>
              <p class="mobile-subtitle" style="margin: 0; font-size: 16px; color: #BDAF9D; line-height: 1.5; text-align: center;">
                <span dir="rtl" style="unicode-bidi: isolate;">تم تأكيد حجز تذكرة مدفوعة في:</span> <span dir="ltr" style="unicode-bidi: isolate; color: #C9A96B; font-weight: 800;">${eventTitle}</span>
              </p>
            </td>
          </tr>

          <!-- Quick Highlight Badge (Ticket Code & Total Amount) -->
          <tr>
            <td class="mobile-padding" style="padding: 20px 32px 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mobile-badge-box" style="background-color: #241814; border: 1px solid #3E2A22; border-radius: 14px; padding: 16px 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 13px; color: #BDAF9D; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px;">
                      Ticket Code / كود التذكرة
                    </div>
                    <div class="mobile-ticket-code" style="font-size: 23px; font-weight: 800; color: #C9A96B; font-family: monospace; letter-spacing: 1px; margin-top: 3px; white-space: nowrap;">
                      ${ticketCode}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div class="mobile-amount-badge" style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ADE80; font-size: 16px; font-weight: 800; padding: 7px 15px; border-radius: 20px; white-space: nowrap;">
                      &#10003; $${formattedTotal} ${currency}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Information Table -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 16px;">
              <div style="font-size: 13.5px; font-weight: 800; color: #C9A96B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Customer Details &bull; بيانات العميل
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 0 8px;">

                <!-- Full Name -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; width: 36%; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Customer Name / الاسم
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17.5px; font-weight: 800; color: #FFFFFF; word-break: break-word; overflow-wrap: anywhere; vertical-align: middle;">
                    ${customerName}
                  </td>
                </tr>

                <!-- Email Address -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Email / البريد
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 600; word-break: break-word; overflow-wrap: anywhere; vertical-align: middle;">
                    <a href="mailto:${customerEmail}" style="color: #C9A96B; text-decoration: none; font-family: monospace; word-break: break-all;">${customerEmail}</a>
                  </td>
                </tr>

                <!-- Phone / WhatsApp -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Phone / الهاتف
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17.5px; font-weight: 700; color: #FFFFFF; vertical-align: middle;">
                    <span style="font-family: monospace; white-space: nowrap;">${customerPhone || 'Not provided'}</span>
                    ${waLink ? `
                      <span class="mobile-wa-link" style="margin-left: 8px;">
                        <a href="${waLink}" target="_blank" style="display: inline-block; background-color: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.4); color: #25D366; text-decoration: none; font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 7px; white-space: nowrap;">
                          WhatsApp &rarr;
                        </a>
                      </span>
                    ` : ''}
                  </td>
                </tr>

                <!-- Payment Method -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Payment Method / طريقة الدفع
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 700; color: #FFFFFF; vertical-align: middle;">
                    <span style="display: inline-block; background-color: rgba(201, 169, 107, 0.16); border: 1px solid rgba(201, 169, 107, 0.45); color: #E2CA97; font-size: 14px; font-weight: 800; padding: 5px 14px; border-radius: 8px; letter-spacing: 0.3px;">
                      ${paymentMethod || 'Stripe'}
                    </span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Event & Seating Details -->
          <tr>
            <td class="mobile-padding" style="padding: 6px 32px 16px;">
              <div style="font-size: 13.5px; font-weight: 800; color: #C9A96B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Event &amp; Reserved Seating &bull; تفاصيل المقاعد
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 0 8px;">

                <!-- Event Title -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; width: 36%; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Event / الفعالية
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 17px; font-weight: 700; color: #FFFFFF; word-break: break-word; vertical-align: middle;">
                    ${eventTitle}
                  </td>
                </tr>

                <!-- Date & Time -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Date &amp; Time / الموعد
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 600; color: #FFFFFF; word-break: break-word; vertical-align: middle;">
                    ${eventDate}
                  </td>
                </tr>

                <!-- Venue -->
                <tr class="stack-row">
                  <td class="stack-cell-label" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 10px 0 0 10px; font-size: 14px; font-weight: 700; color: #BDAF9D; vertical-align: middle;">
                    Venue / المكان
                  </td>
                  <td class="stack-cell-value" style="padding: 11px 16px; background-color: #221713; border: 1px solid #2D1E18; border-radius: 0 10px 10px 0; font-size: 16.5px; font-weight: 600; color: #FFFFFF; word-break: break-word; vertical-align: middle;">
                    ${eventVenue}
                  </td>
                </tr>

              </table>

              <!-- Tables / Seats itemized -->
              <div style="margin-top: 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 0 6px;">
                  ${tablesHtml}
                </table>
              </div>
            </td>
          </tr>

          <!-- Financial & Transaction Info Box -->
          <tr>
            <td class="mobile-padding" style="padding: 4px 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #221713; border: 1px solid #2D1E18; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 13px; color: #BDAF9D; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                      Total Paid / إجمالي المدفوع
                    </div>
                    <div style="font-size: 22px; font-weight: 800; color: #D4AF37; margin-top: 3px;">
                      $${formattedTotal} ${currency}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="font-size: 11px; color: #BDAF9D; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;">
                      Method / الوسيلة
                    </div>
                    <div style="font-size: 14.5px; font-weight: 800; color: #4ADE80;">
                      &#10003; ${paymentMethod || 'Stripe'}
                    </div>
                    ${stripePaymentIntentId && !stripePaymentIntentId.startsWith('OFFLINE_') ? `
                      <div style="font-size: 11px; font-family: monospace; color: #BDAF9D; max-width: 170px; word-break: break-all; margin-top: 3px;">${stripePaymentIntentId}</div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Admin Call to Action Buttons -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 28px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="mobile-btn-container" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: #C9A96B; text-align: center;">
                    <a href="${adminUrl}" target="_blank" class="mobile-btn" style="background: #C9A96B; border: 1px solid #C9A96B; font-family: sans-serif; font-size: 17px; font-weight: 800; line-height: 1.2; text-decoration: none; padding: 16px 36px; color: #1B120F; border-radius: 12px; display: inline-block; letter-spacing: 0.5px; white-space: nowrap;">
                      Open Bookings Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 13.5px; color: #BDAF9D; line-height: 1.5; word-break: break-word;">
                You can reply directly to this email to contact the customer (<a href="mailto:${customerEmail}" style="color: #C9A96B; text-decoration: none; font-weight: 700;">${customerEmail}</a>).
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="padding: 16px 32px; background-color: #140E0C; border-top: 1px solid #2D1E18; text-align: center; font-size: 13px; color: #88746B; line-height: 1.5;">
              Khaleeji Tour Automated Ticketing Dispatcher &bull; 5165 Dixie Rd, Mississauga, ON
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
  generateAdminBookingNotificationText,
  generateAdminBookingNotificationHtml,
};
