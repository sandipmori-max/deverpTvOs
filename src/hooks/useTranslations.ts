import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, changeLanguage, getAvailableLanguages } from '../i18n';

const useTranslations = () => {
  const { t } = useTranslation();

  return {
    t,
    getCurrentLanguage: () => getCurrentLanguage(),
    changeLanguage: async (language: string) => {
      await changeLanguage(language);
    },

    getAvailableLanguages: () => getAvailableLanguages(),

    getCurrentLanguageDisplayName: () => {
      const currentCode = getCurrentLanguage();
      const languages = getAvailableLanguages();
      const language = languages.find(lang => lang.code === currentCode);
      return language ? language.name : 'English';
    },
  };
};

export default useTranslations;
