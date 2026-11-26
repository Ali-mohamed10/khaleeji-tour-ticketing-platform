/**
 * Post-Build SEO & Sitemap Generator
 *
 * Purpose:
 * 1. Generates an XML sitemap with Google Image Sitemap schema for all events and public pages.
 * 2. Pre-renders tailored static HTML files for all public routes into `dist/` with
 *    unique Title, Meta Description, Open Graph, Twitter Cards, Canonical links,
 *    and Schema.org JSON-LD structured data.
 *
 * This guarantees Googlebot, Google Images, Facebook, Twitter, and WhatsApp crawl
 * unique, rich metadata for every single event and page rather than generic SPA fallback tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const SITE_URL = 'https://www.khaleejitour.com';
const DEFAULT_LOGO = `${SITE_URL}/logo.png`;

// Read Supabase config from environment or fallback to project configuration
function getEnvValue(key, fallback = '') {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(ROOT_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match) return match[1].trim();
    }
  } catch {}
  return fallback;
}

const SUPABASE_URL = getEnvValue('VITE_SUPABASE_URL', '');
const SUPABASE_ANON_KEY = getEnvValue('VITE_SUPABASE_ANON_KEY', '');

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchEvents(supabase) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title_en,
        title_ar,
        slug,
        description_en,
        description_ar,
        cover_image_url,
        start_date,
        end_date,
        venue_en,
        venue_ar,
        city_en,
        city_ar,
        status,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Could not fetch events from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ Exception fetching events:', err.message);
    return [];
  }
}

function generateSitemapXml(events) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  // 1. Home Page
  xml += `  <!-- Home Page -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `    <image:image>\n`;
  xml += `      <image:loc>${DEFAULT_LOGO}</image:loc>\n`;
  xml += `      <image:title>Khaleeji Tour - Live Arabic Concerts &amp; Events</image:title>\n`;
  xml += `      <image:caption>Khaleeji Tour live entertainment and ticket booking platform</image:caption>\n`;
  xml += `    </image:image>\n`;
  xml += `  </url>\n\n`;

  // 2. Events Catalog
  xml += `  <!-- Events Catalog -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/events</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `    <image:image>\n`;
  xml += `      <image:loc>${DEFAULT_LOGO}</image:loc>\n`;
  xml += `      <image:title>Upcoming Khaleeji Tour Concerts &amp; Events</image:title>\n`;
  xml += `      <image:caption>Browse and reserve seats for upcoming Gulf concerts and events</image:caption>\n`;
  xml += `    </image:image>\n`;
  xml += `  </url>\n\n`;

  // 3. How It Works
  xml += `  <!-- How It Works Guide -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/how-it-works</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n\n`;

  // 4. Terms & Conditions
  xml += `  <!-- Terms & Conditions -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/terms</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>monthly</changefreq>\n`;
  xml += `    <priority>0.5</priority>\n`;
  xml += `  </url>\n\n`;

  // 5. Privacy Policy
  xml += `  <!-- Privacy Policy -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/privacy</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>monthly</changefreq>\n`;
  xml += `    <priority>0.5</priority>\n`;
  xml += `  </url>\n\n`;

  // 6. Events with High-Res Posters for Google Images
  if (events && events.length > 0) {
    xml += `  <!-- Individual Concert & Event Pages with Posters -->\n`;
    for (const evt of events) {
      if (!evt.slug) continue;
      const lastmod = evt.updated_at ? new Date(evt.updated_at).toISOString().split('T')[0] : today;
      const title = evt.title_en || 'Khaleeji Tour Event';
      const rawDesc = evt.description_en || `${title} live concert tickets`;
      const desc = rawDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/events/${escapeXml(evt.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;

      if (evt.cover_image_url) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(evt.cover_image_url)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(title)} - Khaleeji Tour</image:title>\n`;
        xml += `      <image:caption>${escapeXml(desc)}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n\n`;
    }
  }

  xml += `</urlset>\n`;
  return xml;
}

function injectMetadataIntoHtml(baseHtml, {
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_LOGO,
  structuredData = null,
}) {
  let html = baseHtml;

  // Replace <title>
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace or inject meta description
  if (html.match(/<meta[^>]*name=["']description["'][^>]*>/i)) {
    html = html.replace(
      /<meta[^>]*name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(description)}" />`
    );
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${escapeHtml(description)}" />\n</head>`);
  }

  // Replace Open Graph tags
  html = html.replace(/<meta[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = html.replace(/<meta[^>]*property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${escapeHtml(ogImage)}" />`);

  // Replace Twitter tags
  html = html.replace(/<meta[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta[^>]*name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);

  // Inject or replace canonical link
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`;
  if (html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)) {
    html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
  }

  // Inject JSON-LD Structured Data
  if (structuredData) {
    const jsonLdScript = `\n  <script type="application/ld+json" id="seo-structured-data">\n${JSON.stringify(structuredData, null, 2)}\n  </script>\n`;
    html = html.replace('</head>', `${jsonLdScript}</head>`);
  }

  return html;
}

function writePreRenderedRoute(routePath, htmlContent) {
  const targetDir = path.join(DIST_DIR, routePath.replace(/^\//, ''));
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent, 'utf-8');
}

async function run() {
  console.log('🚀 Starting SEO & Sitemap generation...');
  let events = [];
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    events = await fetchEvents(supabase);
    console.log(`📦 Fetched ${events.length} event(s) from Supabase.`);
  } else {
    console.log('ℹ️ Supabase env vars not configured; generating static SEO pages only.');
  }

  // 1. Generate & Write Sitemap
  const sitemapXml = generateSitemapXml(events);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('✅ Generated public/sitemap.xml with Google Image Sitemap schema.');

  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
    console.log('✅ Synchronized dist/sitemap.xml.');
  }

  // 2. Pre-render Static HTML for Public Pages into dist/
  const distIndexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndexHtmlPath)) {
    console.log('ℹ️ dist/index.html not found yet. Skipping static HTML pre-rendering.');
    return;
  }

  const baseHtml = fs.readFileSync(distIndexHtmlPath, 'utf-8');

  // How It Works page
  const howItWorksHtml = injectMetadataIntoHtml(baseHtml, {
    title: 'How It Works - Ticket Booking Guide | Khaleeji Tour - خليجي تور',
    description: 'Discover how to browse events, select VIP tables with interactive seat maps, and book tickets instantly on Khaleeji Tour.',
    canonicalUrl: `${SITE_URL}/how-it-works`,
    ogImage: DEFAULT_LOGO,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'How It Works - Khaleeji Tour Ticket Booking Guide',
      description: 'Step-by-step guide on how to choose seats and book concert tickets on Khaleeji Tour.',
      url: `${SITE_URL}/how-it-works`,
    },
  });
  writePreRenderedRoute('/how-it-works', howItWorksHtml);
  console.log('✅ Pre-rendered dist/how-it-works/index.html');

  // Terms & Conditions page
  const termsHtml = injectMetadataIntoHtml(baseHtml, {
    title: 'Terms & Conditions - الأحكام والشروط | Khaleeji Tour - خليجي تور',
    description: 'Official terms and conditions governing event ticket purchases and reservations on Khaleeji Tour. Strict no-refund and no-exchange policy.',
    canonicalUrl: `${SITE_URL}/terms`,
    ogImage: DEFAULT_LOGO,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms & Conditions - Khaleeji Tour',
      url: `${SITE_URL}/terms`,
    },
  });
  writePreRenderedRoute('/terms', termsHtml);
  console.log('✅ Pre-rendered dist/terms/index.html');

  // Privacy Policy page
  const privacyHtml = injectMetadataIntoHtml(baseHtml, {
    title: 'Privacy Policy - سياسة الخصوصية | Khaleeji Tour - خليجي تور',
    description: 'Official privacy policy of Khaleeji Tour. All customer data is secured with absolute confidentiality and high-grade security.',
    canonicalUrl: `${SITE_URL}/privacy`,
    ogImage: DEFAULT_LOGO,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy - Khaleeji Tour',
      url: `${SITE_URL}/privacy`,
    },
  });
  writePreRenderedRoute('/privacy', privacyHtml);
  console.log('✅ Pre-rendered dist/privacy/index.html');

  // Events Catalog page
  const eventsCatalogHtml = injectMetadataIntoHtml(baseHtml, {
    title: 'Upcoming Concerts & Events | Khaleeji Tour - خليجي تور',
    description: 'Explore upcoming Gulf concerts and live entertainment events in Canada. Reserve VIP tables and general seats with instant digital tickets.',
    canonicalUrl: `${SITE_URL}/events`,
    ogImage: DEFAULT_LOGO,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Upcoming Khaleeji Tour Concerts & Events',
      url: `${SITE_URL}/events`,
    },
  });
  writePreRenderedRoute('/events', eventsCatalogHtml);
  console.log('✅ Pre-rendered dist/events/index.html');

  // Individual Event Pages
  for (const evt of events) {
    if (!evt.slug) continue;
    const title = `${evt.title_en || 'Concert'} | Khaleeji Tour - خليجي تور`;
    const venue = evt.venue_en || 'Khaleeji Tour Venue';
    const desc = evt.description_en
      ? evt.description_en.replace(/[\r\n]+/g, ' ').slice(0, 160)
      : `Book tickets for ${evt.title_en} at ${venue}. Interactive seat selection and instant digital tickets on Khaleeji Tour.`;
    const poster = evt.cover_image_url || DEFAULT_LOGO;
    const eventUrl = `${SITE_URL}/events/${evt.slug}`;

    const eventJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: evt.title_en,
      description: desc,
      startDate: evt.start_date || undefined,
      endDate: evt.end_date || undefined,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      image: [poster],
      location: {
        '@type': 'Place',
        name: venue,
        address: {
          '@type': 'PostalAddress',
          addressLocality: evt.city_en || 'Ontario',
          addressCountry: 'CA',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: 'Khaleeji Tour',
        url: SITE_URL,
      },
      offers: {
        '@type': 'Offer',
        url: eventUrl,
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString(),
      },
    };

    const eventHtml = injectMetadataIntoHtml(baseHtml, {
      title,
      description: desc,
      canonicalUrl: eventUrl,
      ogImage: poster,
      structuredData: eventJsonLd,
    });

    writePreRenderedRoute(`/events/${evt.slug}`, eventHtml);
    console.log(`✅ Pre-rendered dist/events/${evt.slug}/index.html (${evt.title_en})`);
  }

  console.log('🎉 SEO & Sitemap generation complete!');
}

run().catch((err) => {
  console.error('❌ SEO generation failed:', err);
  process.exit(1);
});
