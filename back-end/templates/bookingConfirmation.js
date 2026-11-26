/**
 * Booking Confirmation Email Template
 *
 * Purpose: Generates responsive HTML email with Khaleeji Tour branding.
 * Anti-spam & Deliverability best practices:
 *   - Public HTTPS image URLs (compatible with Gmail / Google Image Proxy)
 *   - High-contrast white box for QR Code (ensures dark-mode scan accuracy)
 *   - Preheader text for inbox preview
 *   - High text-to-image ratio
 *   - Physical mailing address in footer (CAN-SPAM)
 *   - Proper alt tags on all images
 *   - Unsubscribe note
 */

/**
 * Generate plain text version of the booking confirmation email.
 *
 * @param {Object} params
 * @returns {string} Plain text email body
 */
function generateBookingConfirmationText({
  customerName = 'Valued Guest',
  eventTitle = 'Khaleeji Tour Event',
  eventDate = 'TBD',
  eventVenue = 'TBD',
  ticketCode = 'KT-TICKET',
  tables = [],
  totalAmount = '0.00',
  currency = 'CAD',
  ticketUrl = 'https://www.khaleejitour.com/my-tickets',
}) {
  const tableLines = tables.length > 0
    ? tables.map((t) => `  - ${t.table_name || `Table #${t.table_code || ''}`}: ${t.seats_count || 1} seat(s)`).join('\n')
    : '  - General Admission Ticket';

  return [
    `Khaleeji Tour - Booking Confirmation`,
    ``,
    `Dear ${customerName},`,
    ``,
    `Your payment has been confirmed and your ticket has been issued.`,
    ``,
    `Event: ${eventTitle}`,
    `Date: ${eventDate}`,
    `Venue: ${eventVenue}`,
    ``,
    `Ticket Code: ${ticketCode}`,
    `Please present this code or QR at the venue entrance.`,
    ``,
    `Reserved Seating:`,
    tableLines,
    ``,
    `Total Paid: $${Number(totalAmount).toFixed(2)} ${currency}`,
    ``,
    `View your ticket online: ${ticketUrl}`,
    ``,
    `---`,
    `Questions? Contact us at support@khaleejitour.com`,
    ``,
    `Khaleeji Tour`,
    `5165 Dixie Rd, Mississauga, ON L4W 4G1`,
    `Website: https://www.khaleejitour.com`,
    `WhatsApp Support: +1 (647) 906-7468`,
    ``,
    `This is a transactional email related to your booking. You are receiving it because you completed a purchase on khaleejitour.com.`,
  ].join('\n');
}

/**
 * Generate HTML version of the booking confirmation email.
 *
 * @param {Object} params
 * @returns {string} Complete HTML email string
 */
function generateBookingConfirmationHtml({
  customerName = 'Valued Guest',
  eventTitle = 'Khaleeji Tour Event',
  eventDate = 'TBD',
  eventVenue = 'TBD',
  ticketCode = 'KT-TICKET',
  qrImageUrl = '',
  tables = [],
  totalAmount = '0.00',
  currency = 'CAD',
  ticketUrl = 'https://www.khaleejitour.com/my-tickets',
}) {
  const tablesHtml = tables.length > 0
    ? tables.map((t) => {
        const seatsCount = t.seats_count || 1;
        const seatText = seatsCount === 1 ? '1 Seat' : `${seatsCount} Seats`;
        return `
        <tr style="border-bottom: 1px solid #2B1D16;">
          <td style="padding: 12px 10px 12px 20px; color: #FFFFFF; font-weight: 600; font-size: 14px;">
            ${t.table_name || `Table #${t.table_code || ''}`}
          </td>
          <td style="padding: 12px 20px 12px 10px; text-align: right; color: #D4AF37; font-weight: bold; font-size: 14px;">
            ${seatText}
          </td>
        </tr>
      `;
      }).join('')
    : `
        <tr style="border-bottom: 1px solid #2B1D16;">
          <td colspan="2" style="padding: 12px 20px; color: #FFFFFF; font-size: 14px;">
            General Admission Ticket
          </td>
        </tr>
      `;

  const fallbackQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(ticketCode)}&size=320&margin=1&ecLevel=H&format=png`;
  const resolvedQrUrl = qrImageUrl || fallbackQrUrl;

  // Preheader: invisible text shown in inbox preview
  const preheaderText = `Your booking for ${eventTitle} is confirmed. Ticket ${ticketCode} is ready.`;

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Booking Confirmation - ${eventTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0E0908;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E6E1DF;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; display: block; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0E0908; word-spacing: normal;">

  <!-- Preheader (inbox preview text, hidden from email body) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheaderText}
    ${'&zwnj;&nbsp;'.repeat(30)}
  </div>

  <center style="width: 100%; background-color: #0E0908; padding: 30px 10px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #19110E; border: 1px solid #38271E; border-radius: 16px; overflow: hidden; margin: 0 auto;">
      
      <!-- Brand Header -->
      <tr>
        <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid #2B1D16; background: linear-gradient(180deg, #241814 0%, #19110E 100%);">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #D4AF37;">
            Khaleeji Tour
          </div>
          <div style="font-size: 11px; letter-spacing: 2px; color: #A69188; margin-top: 4px;">
            Event Ticketing &amp; Entertainment
          </div>
        </td>
      </tr>

      <!-- Confirmation Banner -->
      <tr>
        <td style="padding: 25px 30px 15px 30px; text-align: center;">
          <div style="display: inline-block; padding: 6px 16px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 50px; color: #D4AF37; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 15px;">
            &#10003; Payment Confirmed
          </div>
          <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3;">
            Your ticket for ${eventTitle} is ready
          </h1>
          <p style="color: #B5A49D; font-size: 14px; margin: 0; line-height: 1.6;">
            Dear <strong style="color: #FFFFFF;">${customerName}</strong>, your reservation has been confirmed. Below is your official event admission pass.
          </p>
        </td>
      </tr>

      <!-- QR Code & Ticket Code Box -->
      <tr>
        <td style="padding: 10px 30px 25px 30px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #211612; border: 1px solid #3D2B21; border-radius: 12px; text-align: center;">
            <tr>
              <td align="center" style="padding: 24px 20px 16px 20px;">
                <!-- White frame wrapper around QR code for clear scanning -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                  <tr>
                    <td align="center" style="padding: 12px; background-color: #FFFFFF; border-radius: 12px;">
                      <img
                        src="${resolvedQrUrl}"
                        alt="Ticket QR Code ${ticketCode}"
                        width="160"
                        height="160"
                        style="display: block; width: 160px; height: 160px; border: 0; margin: 0 auto; background-color: #FFFFFF;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 20px 22px 20px;">
                <div style="font-size: 11px; letter-spacing: 2px; color: #8F7C73; font-weight: 600; text-transform: uppercase;">
                  Ticket Code
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 700; color: #D4AF37; letter-spacing: 3px; margin-top: 4px;">
                  ${ticketCode}
                </div>
                <div style="font-size: 11px; color: #A8958D; margin-top: 6px;">
                  Please present this QR code at the venue entrance.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Event & Booking Details -->
      <tr>
        <td style="padding: 0 30px 20px 30px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #160F0C; border: 1px solid #2B1D16; border-radius: 12px;">
            <tr>
              <td style="padding: 18px 20px 12px 20px; border-bottom: 1px solid #2B1D16;">
                <div style="font-size: 11px; letter-spacing: 1px; color: #8F7C73; font-weight: 600;">Event</div>
                <div style="font-size: 16px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${eventTitle}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 20px; border-bottom: 1px solid #2B1D16;">
                <div style="font-size: 11px; letter-spacing: 1px; color: #8F7C73; font-weight: 600;">Date &amp; Time</div>
                <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-top: 2px;">${eventDate}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 20px 18px 20px;">
                <div style="font-size: 11px; letter-spacing: 1px; color: #8F7C73; font-weight: 600;">Venue</div>
                <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-top: 2px;">${eventVenue}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Table Allocations -->
      <tr>
        <td style="padding: 0 30px 25px 30px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #160F0C; border: 1px solid #2B1D16; border-radius: 12px;">
            <tr>
              <td colspan="2" style="padding: 18px 20px 10px 20px; border-bottom: 1px solid #33231B; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #D4AF37;">
                Reserved Seating
              </td>
            </tr>
            ${tablesHtml}
            <tr>
              <td style="padding: 16px 10px 18px 20px; color: #8F7C73; font-size: 13px; font-weight: 600;">
                Total Paid
              </td>
              <td style="padding: 16px 20px 18px 10px; text-align: right; color: #D4AF37; font-size: 18px; font-weight: 800;">
                $${Number(totalAmount).toFixed(2)} ${currency}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td style="padding: 0 30px 30px 30px; text-align: center;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="21%" strokecolor="#D4AF37" fillcolor="#D4AF37">
            <w:anchorlock/>
            <center style="color:#140E0C;font-family:sans-serif;font-size:14px;font-weight:bold;">View Ticket Online</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${ticketUrl}" style="display: inline-block; background-color: #D4AF37; color: #140E0C; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; letter-spacing: 1px;">
            View Ticket Online
          </a>
          <!--<![endif]-->
        </td>
      </tr>

      <!-- Footer with Physical Address (CAN-SPAM compliance) -->
      <tr>
        <td style="padding: 25px 30px; background-color: #120B09; border-top: 1px solid #2B1D16; text-align: center; font-size: 12px; color: #85746C; line-height: 1.7;">
          <div>Questions about your booking? Contact us at</div>
          <div style="margin-top: 4px;">
            <a href="mailto:support@khaleejitour.com" style="color: #D4AF37; text-decoration: none; font-weight: 600;">
              support@khaleejitour.com
            </a>
          </div>
          <div style="margin-top: 14px; font-size: 11px; color: #5C4E48; line-height: 1.6;">
            Khaleeji Tour &middot; Ontario, Canada<br>
            This is a transactional email related to your purchase on khaleejitour.com.
          </div>
          <div style="margin-top: 10px; font-size: 10px; color: #4A3D38;">
            &copy; ${new Date().getFullYear()} Khaleeji Tour. All rights reserved.
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `.trim();
}

module.exports = { generateBookingConfirmationHtml, generateBookingConfirmationText };
