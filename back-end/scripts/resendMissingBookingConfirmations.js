/**
 * Resend Missing Booking Confirmation Emails
 *
 * Scans all bookings with status 'PAID' where confirmation_email_sent_at is NULL,
 * and delivers the booking confirmation email with ticket code and QR code.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { supabaseAdmin } = require('../services/supabaseAdmin');
const emailService = require('../services/email.service');
const bookingService = require('../services/booking.service');

async function resendMissing() {
  console.log('--- Scanning for Confirmed Bookings Missing Confirmation Emails ---');

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, customer_email, total_amount, currency, status, confirmation_email_sent_at, created_at')
    .eq('status', 'PAID')
    .is('confirmation_email_sent_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error querying bookings:', error);
    process.exit(1);
  }

  console.log(`Found ${bookings.length} paid booking(s) without confirmation email.`);

  for (const b of bookings) {
    console.log(`\nProcessing: ${b.customer_name} <${b.customer_email}> (Booking: ${b.id})`);
    try {
      const fullBooking = await bookingService.getBookingById(b.id);
      if (!fullBooking) {
        console.warn(`Could not load full booking for ${b.id}`);
        continue;
      }

      const ticket = fullBooking.tickets?.[0];
      console.log(`Ticket Code: ${ticket?.ticket_code || 'N/A'}`);

      const result = await emailService.sendBookingConfirmationEmail({
        booking: fullBooking,
        ticket,
        bookingId: b.id,
        force: true, // Force send to clear the backlog
      });

      if (result.success) {
        console.log(`SUCCESS: Email dispatched to ${b.customer_email}. Resend ID: ${result.data?.id}`);
      } else {
        console.error(`FAILED: Could not send to ${b.customer_email}. Error:`, result.error || result.reason);
      }

      // Small delay between sends to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err) {
      console.error(`Exception while resending for ${b.id}:`, err);
    }
  }

  console.log('\n--- Finished Processing Missing Confirmation Emails ---');
}

resendMissing().catch(console.error);
