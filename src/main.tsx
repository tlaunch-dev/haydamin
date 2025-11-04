import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { HiddenModeProvider } from './context/HiddenModeContext'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <HiddenModeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HiddenModeProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>,
)
