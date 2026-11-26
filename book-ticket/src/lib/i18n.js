import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from '../locales/en/translation.json';
import translationAR from '../locales/ar/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Sync html lang and dir attributes dynamically for SEO & accessibility
const syncHtmlAttributes = (lng) => {
  if (typeof document !== 'undefined') {
    const isAr = lng && lng.startsWith('ar');
    document.documentElement.lang = isAr ? 'ar' : 'en';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }
};

// Initial sync
syncHtmlAttributes(i18n.language);

// On language change
i18n.on('languageChanged', (lng) => {
  syncHtmlAttributes(lng);
});

export default i18n;
