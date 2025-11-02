import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import FamilyHub from './pages/FamilyHub';
import { PersonDetail } from './pages/PersonDetail';
import { AddPerson } from './pages/AddPerson';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { language } = useLanguage();

  useEffect(() => {
    // Update HTML attributes when language changes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<FamilyHub />} />
      <Route path="/hub/:personId" element={<FamilyHub />} />
      <Route path="/person/:personId" element={<PersonDetail />} />
      <Route
        path="/add-person"
        element={
          <ProtectedRoute>
            <AddPerson />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
