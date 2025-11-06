import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { HiddenModeProvider } from './context/HiddenModeContext'
import { NavigationProvider } from './context/NavigationContext'
import { ZoomTransitionProvider } from './context/ZoomTransitionContext'
import { DeviceProvider } from './context/DeviceContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <HiddenModeProvider>
            <NavigationProvider>
              <ZoomTransitionProvider>
                <DeviceProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </DeviceProvider>
              </ZoomTransitionProvider>
            </NavigationProvider>
          </HiddenModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
