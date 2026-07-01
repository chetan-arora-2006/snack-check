import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { ScanHistory } from './components/ScanHistory';
import { Doctors } from './components/Doctors';
import { SettingsPage } from './components/SettingsPage';
import { Chatbot } from './components/Chatbot';
import { FamilyHealthPage } from './components/FamilyHealthPage';
import { InvitePage } from './components/InvitePage';
import { ProfilePage } from './components/ProfilePage';
import { ProductCatalog } from './components/ProductCatalog';
import type { ScanDB } from './schemas/scan';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 border border-rose-500/20 bg-rose-500/10 text-rose-400 rounded-3xl max-w-xl mx-auto my-12 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong rendering this view</h2>
          <p className="text-xs font-mono bg-slate-900 border border-slate-800 p-4 rounded-xl text-left overflow-x-auto text-rose-350">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedScan, setSelectedScan] = useState<ScanDB | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
        <svg className="animate-spin h-10 w-10 text-emerald-400 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold tracking-wider uppercase animate-pulse">Initializing SnackCheck...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ErrorBoundary>
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedScan={setSelectedScan} 
          />
        )}
        {activeTab === 'scanner' && <Scanner />}
        {activeTab === 'history' && (
          <ScanHistory 
            selectedScan={selectedScan} 
            setSelectedScan={setSelectedScan} 
          />
        )}
        {activeTab === 'doctors' && <Doctors />}
        {activeTab === 'chatbot' && <Chatbot />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'family' && <FamilyHealthPage />}
        {activeTab === 'invite' && <InvitePage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'catalog' && <ProductCatalog />}
      </ErrorBoundary>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
