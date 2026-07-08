import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Scanner = lazy(() => import('./components/Scanner').then(m => ({ default: m.Scanner })));
const ScanHistory = lazy(() => import('./components/ScanHistory').then(m => ({ default: m.ScanHistory })));
const Doctors = lazy(() => import('./components/Doctors').then(m => ({ default: m.Doctors })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const Chatbot = lazy(() => import('./components/Chatbot').then(m => ({ default: m.Chatbot })));
const FamilyHealthPage = lazy(() => import('./components/FamilyHealthPage').then(m => ({ default: m.FamilyHealthPage })));
const InvitePage = lazy(() => import('./components/InvitePage').then(m => ({ default: m.InvitePage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ProductCatalog = lazy(() => import('./components/ProductCatalog').then(m => ({ default: m.ProductCatalog })));
const TodayConsumption = lazy(() => import('./components/TodayConsumption').then(m => ({ default: m.TodayConsumption })));

const FallbackLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-slate-500 dark:text-slate-400">
    <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-4" />
    <p className="text-sm font-semibold tracking-wider uppercase animate-pulse">Loading view...</p>
  </div>
);
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
  const [showAuth, setShowAuth] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
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
    if (showAuth) {
      return <AuthPage onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onAction={() => setShowAuth(true)} isAuthenticated={false} />;
  }

  if (showLanding) {
    return <LandingPage onAction={() => setShowLanding(false)} isAuthenticated={true} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onGoHome={() => setShowLanding(true)}>
      <ErrorBoundary>
        <Suspense fallback={<FallbackLoader />}>
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
          {activeTab === 'consumption' && <TodayConsumption setActiveTab={setActiveTab} />}
        </Suspense>
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
