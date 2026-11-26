import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'event' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | null;
}

/**
 * SEO component
 * 
 * Dynamically manages document title, meta descriptions, Open Graph,
 * Twitter cards, canonical tags, and JSON-LD structured data.
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
  structuredData = null,
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const defaultTitle = isArabic
    ? 'خليجي تور | حجز تذاكر الحفلات والفعاليات'
    : 'Khaleeji Tour | Concert & Event Ticket Booking';
  const defaultDescription = isArabic
    ? 'احجز تذاكر حفلات وفعاليات خليجي تور الحصرية مع اختيار المقاعد التفاعلي وتذاكر إلكترونية فورية.'
    : 'Discover and book tickets for premium Khaleeji Tour concerts and events. Choose your perfect seats interactively with instant digital tickets.';
  const defaultKeywords = isArabic
    ? 'خليجي تور, حجز تذاكر, حفلات خليجية, فعاليات كندا, ويندزر, حفلات اونتاريو, تذاكر فعاليات'
    : 'Khaleeji Tour, concert tickets, Gulf events, Windsor Ontario, live entertainment, ticket booking, VIP tables';
  const defaultImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const pageTitle = title
    ? `${title} | Khaleeji Tour - خليجي تور`
    : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageImage = image || defaultImage;

  useEffect(() => {
    // 1. Update Title
    document.title = pageTitle;

    // Helper to update or create a meta tag
    const setMetaTag = (attribute: string, name: string, content?: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', pageDescription);
    setMetaTag('name', 'keywords', pageKeywords);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', title || defaultTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:image', pageImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Khaleeji Tour');
    setMetaTag('property', 'og:locale', isArabic ? 'ar_AR' : 'en_US');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title || defaultTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:image', pageImage);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 6. JSON-LD Structured Data
    const existingScript = document.getElementById('seo-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const script = document.getElementById('seo-structured-data');
      if (script) script.remove();
    };
  }, [
    pageTitle,
    pageDescription,
    pageKeywords,
    pageImage,
    currentUrl,
    type,
    noIndex,
    structuredData,
    title,
    defaultTitle,
    isArabic,
  ]);

  return <></>;
};

export default SEO;
