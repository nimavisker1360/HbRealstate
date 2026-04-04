import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';
import ruTranslations from './locales/ru.json';
import servicesLocaleOverrides from './servicesLocaleOverrides';
import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGE_CODES
} from '../utils/languageRouting';

const isPlainObject = (value) =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, override) => {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override ?? base;
  }

  const merged = { ...base };

  Object.keys(override).forEach((key) => {
    const baseValue = merged[key];
    const overrideValue = override[key];

    merged[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? deepMerge(baseValue, overrideValue)
        : overrideValue;
  });

  return merged;
};

const resources = {
  en: {
    translation: deepMerge(enTranslations, servicesLocaleOverrides.en || {})
  },
  tr: {
    translation: deepMerge(trTranslations, servicesLocaleOverrides.tr || {})
  },
  ru: {
    translation: deepMerge(ruTranslations, servicesLocaleOverrides.ru || {})
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    fallbackLng: DEFAULT_LANGUAGE_CODE,
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage']
    }
  });

export default i18n;
