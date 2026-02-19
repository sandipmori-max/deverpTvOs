import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en';
import hi from './translations/hi';
import gu from './translations/gu';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    gu: { translation: gu },
  },
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem('user-language', language);
};

export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'gu', name: 'ગુજરાતી' },
  ];
};
