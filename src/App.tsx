import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import FamilyHub from './pages/FamilyHub';
import { PersonDetail } from './pages/PersonDetail';
import { AddPerson } from './pages/AddPerson';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Reason: Prevent authenticated users from navigating back to login page
  // This handles the case where navigate(-1) might try to go to /login
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

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
    </Routes>
  );
}

function App() {
  const { language } = useLanguage();

  useEffect(() => {
    // Update HTML attributes when language changes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return <AppRoutes />;
}

export default App;
