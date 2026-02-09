import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.toLowerCase() || 'en';
  
  // Handles locale variants like 'en-US', 'tr-TR', 'ru-RU'
  const isEnglish = currentLang.startsWith('en');
  const isTurkish = currentLang.startsWith('tr');
  const isRussian = currentLang.startsWith('ru');

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className={`flex items-center gap-2 text-xs font-semibold ${className}`}>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`transition-colors ${
          isEnglish ? 'text-secondaryRed' : 'text-gray-700 hover:text-secondaryRed'
        }`}
        type="button"
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => handleLanguageChange('tr')}
        className={`transition-colors ${
          isTurkish ? 'text-secondaryRed' : 'text-gray-700 hover:text-secondaryRed'
        }`}
        type="button"
      >
        TR
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => handleLanguageChange('ru')}
        className={`transition-colors ${
          isRussian ? 'text-secondaryRed' : 'text-gray-700 hover:text-secondaryRed'
        }`}
        type="button"
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;
