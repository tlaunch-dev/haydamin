import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import CedarBackground from './components/CedarBackground';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load page components for code splitting
const FamilyHub = lazy(() => import('./pages/FamilyHub'));
const PersonDetail = lazy(() => import('./pages/PersonDetail').then(module => ({ default: module.PersonDetail })));
const AddPerson = lazy(() => import('./pages/AddPerson').then(module => ({ default: module.AddPerson })));
const GalleryMode = lazy(() => import('./pages/GalleryMode').then(module => ({ default: module.GalleryMode })));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage').then(module => ({ default: module.MemoriesPage })));
const Login = lazy(() => import('./pages/Login'));

function AppRoutes() {
  const location = useLocation();

  // Scroll to top on route change (important for iOS Safari)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Global Cedar Background - always visible */}
      <CedarBackground />

      <LayoutGroup>
        <AnimatePresence initial={false} mode="wait">
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location} key={location.pathname}>
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
              <Route
                path="/memories"
                element={
                  <ProtectedRoute>
                    <MemoriesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </LayoutGroup>
    </div>
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
