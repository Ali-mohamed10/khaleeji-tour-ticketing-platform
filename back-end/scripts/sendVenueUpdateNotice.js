/**
 * Venue Update Notice Dispatcher Script
 *
 * Purpose:
 *   Sends official venue update notification emails to attendees of the 4th Press Conference
 *   for Khaleeji Tour – The Titan Edition.
 *
 * Safety & Modes:
 *   1) Test Mode (Default / Safe):
 *      node scripts/sendVenueUpdateNotice.js --test admin@example.com
 *      (Sends ONLY to the specified test email or TEST_EMAIL env var)
 *
 *   2) Broadcast Mode (Live):
 *      node scripts/sendVenueUpdateNotice.js --broadcast
 *      (Fetches all confirmed attendees from Supabase, deduplicates emails, and sends)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Resend } = require('resend');
const { supabaseAdmin } = require('../services/supabaseAdmin');
const {
  generateVenueUpdateText,
  generateVenueUpdateHtml,
} = require('../templates/venueUpdateNotification');

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('❌ Error: RESEND_API_KEY environment variable is missing.');
  process.exit(1);
}
const resend = new Resend(resendApiKey);

// Helper for delays between emails
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean and sanitize email addresses
function sanitizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  let clean = rawEmail.trim().toLowerCase();
  // Strip trailing or leading punctuation/symbols often mistyped
  clean = clean.replace(/^[@.]+|[@.]+$/g, '');
  // Fix common typo if ends with @
  clean = clean.replace(/@+$/, '');
  // Normalize known domain typo (e.g. gmill.com -> gmail.com)
  clean = clean.replace(/@gmill\.com$/i, '@gmail.com');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean : null;
}

/**
 * Send an email to a single recipient
 */
async function sendNoticeEmail({ toEmail, recipientName, isTest = false }) {
  const subject = 'تحديث مهم لموقع المؤتمر الصحفي الرابع – خليجي تور | 23 سبتمبر 2026';
  const htmlContent = generateVenueUpdateHtml({ recipientName });
  const textContent = generateVenueUpdateText({ recipientName });

  const response = await resend.emails.send({
    from: 'Khaleeji Tour <support@khaleejitour.com>',
    to: [toEmail],
    reply_to: 'support@khaleejitour.com',
    subject: isTest ? `[TEST] ${subject}` : subject,
    html: htmlContent,
    text: textContent,
    headers: {
      'X-Entity-Ref-ID': `VENUE-UPDATE-PC4-${Date.now()}`,
    },
    tags: [
      { name: 'category', value: isTest ? 'test_venue_update' : 'press_conference_venue_update' },
    ],
  });

  return response;
}

/**
 * Main execution routine
 */
async function run() {
  const args = process.argv.slice(2);
  const isBroadcast = args.includes('--broadcast') || args.includes('--all') || args.includes('--live');
  const isTestArg = args.includes('--test');

  // Determine test email if in test mode
  let testEmail = process.env.TEST_EMAIL || '';
  if (isTestArg) {
    const idx = args.indexOf('--test');
    if (args[idx + 1] && !args[idx + 1].startsWith('--')) {
      testEmail = args[idx + 1].trim();
    }
  }
  if (!isBroadcast && !testEmail) {
    console.error('❌ Error: Provide --test <email> or set TEST_EMAIL environment variable.');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('📢 Khaleeji Tour – 4th Press Conference Venue Update');
  console.log('====================================================');

  if (!isBroadcast) {
    // ------------------------------------------------------------------
    // TEST MODE
    // ------------------------------------------------------------------
    console.log(`🧪 Running in TEST MODE`);
    console.log(`🎯 Recipient: ${testEmail}`);
    console.log(`📤 Sending test email via Resend...`);

    try {
      const response = await sendNoticeEmail({
        toEmail: testEmail,
        recipientName: 'Ali Mohamed',
        isTest: true,
      });

      if (response?.error) {
        console.error('❌ Resend rejected email:', response.error);
        process.exit(1);
      }

      console.log('✅ Test email sent successfully!');
      console.log(`📧 Resend Message ID: ${response?.data?.id || 'OK'}`);
      console.log(`📬 Delivered to: ${testEmail}`);
      console.log('----------------------------------------------------');
      console.log('💡 Note: You can review the email in your inbox.');
      console.log('   When ready to broadcast to all attendees, run:');
      console.log('   node scripts/sendVenueUpdateNotice.js --broadcast');
      console.log('====================================================');
      return;
    } catch (err) {
      console.error('❌ Failed to send test email:', err.message);
      process.exit(1);
    }
  }

  // ------------------------------------------------------------------
  // BROADCAST MODE (LIVE TO ALL ATTENDEES)
  // ------------------------------------------------------------------
  console.log(`🚀 Running in BROADCAST MODE (Sending to ALL confirmed attendees)`);
  console.log('⏳ Fetching attendees from Supabase...');

  const { data: attendees, error: rpcError } = await supabaseAdmin.rpc('get_event_registrations_attendees', {
    p_event_id: '',
  });

  if (rpcError) {
    console.error('❌ Failed to fetch attendees from Supabase:', rpcError.message);
    process.exit(1);
  }

  if (!attendees || attendees.length === 0) {
    console.warn('⚠️ No attendees found in database.');
    return;
  }

  console.log(`📋 Total attendees retrieved from DB: ${attendees.length}`);

  // Deduplicate and sanitize recipients
  const emailMap = new Map();
  for (const att of attendees) {
    const clean = sanitizeEmail(att.email);
    if (!clean) {
      console.warn(`⚠️ Skipping invalid email "${att.email}" for ${att.full_name || 'Attendee'}`);
      continue;
    }
    // Keep the most complete attendee record
    if (!emailMap.has(clean)) {
      emailMap.set(clean, {
        email: clean,
        name: att.full_name || 'السادة الضيوف الكرام',
        regNum: att.registration_number || '',
      });
    }
  }

  const recipients = Array.from(emailMap.values());
  console.log(`🎯 Unique valid recipients to email: ${recipients.length}`);
  console.log('----------------------------------------------------');

  let successCount = 0;
  let failCount = 0;
  const failedList = [];

  for (let i = 0; i < recipients.length; i++) {
    const item = recipients[i];
    const progress = `[${i + 1}/${recipients.length}]`;

    try {
      console.log(`${progress} Sending to: ${item.email} (${item.name})...`);
      const res = await sendNoticeEmail({
        toEmail: item.email,
        recipientName: item.name,
        isTest: false,
      });

      if (res?.error) {
        console.error(`❌ Failed for ${item.email}:`, res.error.message);
        failCount++;
        failedList.push({ email: item.email, reason: res.error.message });
      } else {
        console.log(`   ✅ Sent! (ID: ${res?.data?.id || 'OK'})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception for ${item.email}:`, err.message);
      failCount++;
      failedList.push({ email: item.email, reason: err.message });
    }

    // Rate-limiting delay between sends
    if (i < recipients.length - 1) {
      await sleep(300);
    }
  }

  console.log('====================================================');
  console.log('📊 BROADCAST SUMMARY:');
  console.log(`✅ Successfully sent: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  if (failedList.length > 0) {
    console.log('Failed recipients:');
    failedList.forEach((f) => console.log(`   - ${f.email}: ${f.reason}`));
  }
  console.log('====================================================');
}

run();
