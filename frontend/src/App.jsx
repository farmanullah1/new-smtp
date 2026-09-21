import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmailPreviewsPage } from './pages/EmailPreviewsPage';
import { SmtpDiagnosticsPage } from './pages/SmtpDiagnosticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Shield } from 'lucide-react';

const MainShell = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
          animation: 'pulse 1.5s infinite'
        }}>
          <Shield size={26} color="#ffffff" />
        </div>
        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
          Verifying security session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'templates' && <EmailPreviewsPage />}
        {activeTab === 'diagnostics' && <SmtpDiagnosticsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: '#64748b',
        fontSize: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        Farmanullah Ansari Company &bull; SMTP & Authentication Platform &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainShell />
      </AuthProvider>
    </ToastProvider>
  );
}
