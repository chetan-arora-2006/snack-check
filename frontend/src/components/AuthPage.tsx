import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, User, AlertCircle, ChevronLeft } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthPageProps {
  onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal states for dummy links
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Load Google Identity Services script
  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credential);
    } catch (e: any) {
      setError(e.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  const gsiInitialized = React.useRef(false);

  useEffect(() => {
    // Only add script if it doesn't exist
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const initGsi = () => {
      const clientId = "803898867364-9sc337s4gt4hdrbc0v8pfqv936pkoofj.apps.googleusercontent.com";
      const isPlaceholder = !clientId || clientId.includes("YOUR_GOOGLE") || clientId.includes("your_google");
      
      const btnContainer = document.getElementById("google-signin-div");

      if (window.google && !isPlaceholder && !gsiInitialized.current && btnContainer) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              handleGoogleSuccess(response.credential);
            },
          });
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: "dark", size: "large", type: "standard", width: 340 }
          );
          gsiInitialized.current = true;
        } catch (e) {
          console.error("Failed to initialize Google Auth:", e);
        }
      }
    };

    if (window.google) {
      initGsi();
    } else {
      script.addEventListener('load', initGsi);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initGsi);
      }
    };
  }, [handleGoogleSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isLogin && !agreeToTerms) {
        throw new Error("You must agree to the Terms of Service and Privacy Policy.");
      }
      
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background visual gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute -top-12 left-0 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}
        {/* Brand Logo */}
        <button 
          onClick={onBack}
          disabled={!onBack}
          className={`flex flex-col items-center gap-3 mb-8 w-full ${onBack ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <Activity className="w-8 h-8 text-slate-950" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-200 bg-clip-text text-transparent">
              SnackCheck
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Make informed snack decisions using AI</p>
          </div>
        </button>

        {/* Auth Panel */}
        <div className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex gap-4 mb-6 border-b border-slate-900 pb-4">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-all duration-300 ${
                isLogin ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-all duration-300 ${
                !isLogin ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-2xl mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-emerald-500/20"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the SnackCheck <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-400 hover:underline bg-transparent border-none p-0 cursor-pointer">Terms of Service</button> and <button type="button" onClick={() => setShowPrivacy(true)} className="text-emerald-400 hover:underline bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>, and consent to having my dietary data processed for personalized AI recommendations.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all duration-200 text-sm mt-2 flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-900" />
            </div>
            <span className="relative z-10 px-3 bg-white dark:bg-slate-950/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Authentication SSO Options */}
          <div className="flex flex-col gap-2 items-center">
            {/* Div loaded by Google SDK */}
            <div id="google-signin-div" className="w-full flex justify-center" />
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Terms of Service</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 max-h-60 overflow-y-auto pr-2">
              <p>Welcome to SnackCheck!</p>
              <p>1. By using our service, you agree that the AI-generated health scores and food analysis are for informational purposes only and do not constitute medical advice.</p>
              <p>2. We are not liable for any allergic reactions or health issues arising from inaccuracies in the AI analysis or missing information on product labels.</p>
              <p>3. Always consult with a registered dietitian or doctor before making drastic dietary changes based on our app's recommendations.</p>
            </div>
            <button onClick={() => setShowTerms(false)} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors">
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Privacy Policy</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 max-h-60 overflow-y-auto pr-2">
              <p>Your privacy is critically important to us.</p>
              <p>1. <strong>Data Collection:</strong> We collect your dietary preferences, allergy information, and consumption history to provide personalized AI recommendations.</p>
              <p>2. <strong>AI Processing:</strong> Images of food labels you upload are processed securely. We do not sell your biometric or dietary data to third-party advertisers.</p>
              <p>3. <strong>Security:</strong> All passwords and sensitive information are securely hashed. We use industry-standard encryption for data at rest and in transit.</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors">
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
