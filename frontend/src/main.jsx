import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#12141d', color: '#e2e4ef', border: '1px solid #1e2030', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" },
          success: { iconTheme: { primary: '#34d399', secondary: '#12141d' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#12141d' } },
        }} />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
