import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.toLowerCase() || 'en';
  
  // Check if language starts with 'en' or 'tr' (handles 'en-US', 'tr-TR', etc.)
  const isEnglish = currentLang.startsWith('en');
  const isTurkish = currentLang.startsWith('tr');

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
    </div>
  );
};

export default LanguageSwitcher;
