import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import 'leaflet/dist/leaflet.css';
import './leafletSetup';
import './index.css';
import App from './App.jsx';

// Apply dark mode from localStorage before first paint
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '8px', fontSize: '14px' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
