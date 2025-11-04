import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { useZoomTransition } from './context/ZoomTransitionContext';
import { ZoomTransitionOverlay } from './components/ZoomTransitionOverlay';
import CedarBackground from './components/CedarBackground';
import FamilyHub from './pages/FamilyHub';
import { PersonDetail } from './pages/PersonDetail';
import { AddPerson } from './pages/AddPerson';
import { GalleryMode } from './pages/GalleryMode';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

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
          </Routes>
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
