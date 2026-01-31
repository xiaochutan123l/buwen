'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language, TranslationKeys } from './translations';
import { useBuwenStore } from '@/store/useBuwenStore';

interface I18nContextType {
  t: TranslationKeys;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useBuwenStore();
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    // 检测浏览器语言
    const detectLanguage = (): Language => {
      if (settings.language !== 'auto') {
        return settings.language as Language;
      }
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
      return 'en';
    };

    setLanguageState(detectLanguage());
  }, [settings.language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    updateSettings({ language: lang });
  };

  const value: I18nContextType = {
    t: translations[language],
    language,
    setLanguage,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
