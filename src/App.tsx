import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { useZoomTransition } from './context/ZoomTransitionContext';
import { ZoomTransitionOverlay } from './components/ZoomTransitionOverlay';
import CedarBackground from './components/CedarBackground';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load page components for code splitting
const FamilyHub = lazy(() => import('./pages/FamilyHub'));
const PersonDetail = lazy(() => import('./pages/PersonDetail').then(module => ({ default: module.PersonDetail })));
const AddPerson = lazy(() => import('./pages/AddPerson').then(module => ({ default: module.AddPerson })));
const GalleryMode = lazy(() => import('./pages/GalleryMode').then(module => ({ default: module.GalleryMode })));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'));
const Login = lazy(() => import('./pages/Login'));

function AppRoutes() {
  const location = useLocation();
  const { zoomTransition, setZoomPhase, setHiddenPersonId } = useZoomTransition();

  const handleZoomPhaseChange = (phase: 'zoom-in' | 'zoom-out' | 'reveal-card') => {
    setZoomPhase(phase);
    if (phase === 'reveal-card') {
      setHiddenPersonId(null);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Global Cedar Background - always visible */}
      <CedarBackground />
      
      {/* Global Zoom Transition Overlay - renders once regardless of route changes */}
      {zoomTransition && (
        <ZoomTransitionOverlay
          person={zoomTransition.person}
          startRect={zoomTransition.startRect}
          targetPersonId={zoomTransition.targetPersonId}
          showName={zoomTransition.showName}
          imageSrc={zoomTransition.imageSrc}
          onNavigate={zoomTransition.onNavigate}
          onPhaseChange={handleZoomPhaseChange}
        />
      )}

      <LayoutGroup>
        <AnimatePresence initial={false}>
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
