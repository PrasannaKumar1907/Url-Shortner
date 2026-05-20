import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Bio       from './pages/Bio';

function ToasterWithTheme() {
  const { isDark } = useTheme();
  return (
    <Toaster position="top-right" toastOptions={{
      style: {
        background:   isDark ? '#1e293b' : '#ffffff',
        color:        isDark ? '#f1f5f9' : '#0f172a',
        border:       isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
        borderRadius: '10px', fontSize: '14px',
        boxShadow:    isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
      },
      success: { iconTheme: { primary: '#10b981', secondary: isDark ? '#1e293b' : '#fff' } },
      error:   { iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e293b' : '#fff' } },
    }} />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToasterWithTheme />
          <Routes>
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/bio/:username" element={<Bio />} />
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analytics/:id" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
