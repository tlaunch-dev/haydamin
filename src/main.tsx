import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { HiddenModeProvider } from './context/HiddenModeContext'
import { NavigationProvider } from './context/NavigationContext'
import { DeviceProvider } from './context/DeviceContext'
import { PlaybackProvider } from './context/PlaybackContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register service worker and handle updates
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically update when a new version is available
    // Combined with skipWaiting + clientsClaim in vite.config.ts,
    // this ensures immediate activation without requiring users to close tabs
    console.log('New version available, updating...')
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
    // Check for updates every hour
    registration && setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000) // 1 hour
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <HiddenModeProvider>
            <NavigationProvider>
              <DeviceProvider>
                <PlaybackProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </PlaybackProvider>
              </DeviceProvider>
            </NavigationProvider>
          </HiddenModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
