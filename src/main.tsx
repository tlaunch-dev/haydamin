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

// Set up console capture early, before any components render
// Store logs in a global array that MobileConsole can read
(window as any).__mobileConsoleLogs = [];
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  originalLog(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  (window as any).__mobileConsoleLogs.push({
    time: new Date().toLocaleTimeString(),
    level: 'log',
    message,
    args
  });
  // Keep last 100 logs
  if ((window as any).__mobileConsoleLogs.length > 100) {
    (window as any).__mobileConsoleLogs.shift();
  }
};

console.warn = (...args: any[]) => {
  originalWarn(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  (window as any).__mobileConsoleLogs.push({
    time: new Date().toLocaleTimeString(),
    level: 'warn',
    message,
    args
  });
  if ((window as any).__mobileConsoleLogs.length > 100) {
    (window as any).__mobileConsoleLogs.shift();
  }
};

console.error = (...args: any[]) => {
  originalError(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  (window as any).__mobileConsoleLogs.push({
    time: new Date().toLocaleTimeString(),
    level: 'error',
    message,
    args
  });
  if ((window as any).__mobileConsoleLogs.length > 100) {
    (window as any).__mobileConsoleLogs.shift();
  }
};

console.log('[main] Console capture initialized');

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
