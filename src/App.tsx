import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import FamilyHub from './pages/FamilyHub';
import { PersonDetail } from './pages/PersonDetail';
import { AddPerson } from './pages/AddPerson';
import { GalleryMode } from './pages/GalleryMode';
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FamilyHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hub/:personId"
        element={
          <ProtectedRoute>
            <FamilyHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:personId"
        element={
          <ProtectedRoute>
            <PersonDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-person"
        element={
          <ProtectedRoute>
            <AddPerson />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <GalleryMode />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
