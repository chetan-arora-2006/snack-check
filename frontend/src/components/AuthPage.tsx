import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthPage: React.FC = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Look for client ID from configuration or use fallback
      const clientId = "803898867364-9sc337s4gt4hdrbc0v8pfqv936pkoofj.apps.googleusercontent.com";
      const isPlaceholder = !clientId || clientId.includes("YOUR_GOOGLE") || clientId.includes("your_google");
      
      if (window.google && !isPlaceholder) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              handleGoogleSuccess(response.credential);
            },
          });
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-div"),
            { theme: "dark", size: "large", type: "standard", width: 340 }
          );
        } catch (e) {
          console.error("Failed to initialize Google Auth:", e);
        }
      }
    };

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credential);
    } catch (e: any) {
      setError(e.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoGoogleLogin = async () => {
    // Generate a mock token for backend verification bypass
    const mockEmail = `demo_${Math.floor(Math.random() * 9000) + 1000}@snackcheck.com`;
    const mockToken = `mock_token_${mockEmail}`;
    handleGoogleSuccess(mockToken);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background visual gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <Activity className="w-8 h-8 text-slate-950" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              SnackCheck
            </h1>
            <p className="text-slate-400 text-sm mt-1">Make informed snack decisions using AI</p>
          </div>
        </div>

        {/* Auth Panel */}
        <div className="glass rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <div className="flex gap-4 mb-6 border-b border-slate-900 pb-4">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-all duration-300 ${
                isLogin ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-all duration-300 ${
                !isLogin ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
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
                    className="w-full bg-slate-900/60 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
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
                  className="w-full bg-slate-900/60 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
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
                  className="w-full bg-slate-900/60 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
                />
              </div>
            </div>

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
              <div className="w-full border-t border-slate-900" />
            </div>
            <span className="relative z-10 px-3 bg-slate-950/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Authentication SSO Options */}
          <div className="flex flex-col gap-2 items-center">
            {/* Div loaded by Google SDK */}
            <div id="google-signin-div" className="w-full flex justify-center" />
            
            {/* Developer mock Google login */}
            <button
              onClick={handleDemoGoogleLogin}
              disabled={loading}
              className="w-full max-w-[340px] flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 text-xs text-emerald-400 font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Demo Sign In (Skip Google Setup)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
