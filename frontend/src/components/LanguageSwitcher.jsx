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
    <div className={`flex items-center bg-gray-100 rounded-full p-1 ${className}`}>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
          isEnglish
            ? 'bg-[#06a84e] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('tr')}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
          isTurkish
            ? 'bg-[#06a84e] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        TR
      </button>
    </div>
  );
};

export default LanguageSwitcher;
