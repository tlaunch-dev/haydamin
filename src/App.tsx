import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import FamilyHub from './pages/FamilyHub';
import { PersonDetail } from './pages/PersonDetail';

function App() {
  const { language } = useLanguage();

  useEffect(() => {
    // Update HTML attributes when language changes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <Routes>
      <Route path="/" element={<FamilyHub />} />
      <Route path="/hub/:personId" element={<FamilyHub />} />
      <Route path="/person/:personId" element={<PersonDetail />} />
    </Routes>
  );
}

export default App;
