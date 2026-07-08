import React from 'react';
import { ScanLine, MessageSquareHeart, Users, ShieldAlert, ArrowRight, HeartPulse, Activity } from 'lucide-react';

interface LandingPageProps {
  onAction: () => void;
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAction, isAuthenticated = false }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 selection:bg-emerald-500/30 transition-colors duration-300 font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SnackCheck</span>
          </button>
          <button 
            onClick={onAction}
            className="px-5 py-2 text-sm font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-emerald-400 rounded-full transition-colors shadow-sm"
          >
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        {/* Background glow (Light & Dark) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400/20 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
            <Activity className="w-4 h-4" />
            Empowering Healthier Choices
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
            Know exactly what <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-cyan-400">
              you are eating.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Food labels are intentionally confusing. Hidden sugars, dangerous trans fats, and excess sodium are hiding in plain sight. 
            SnackCheck uses AI to decode nutrition facts instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onAction}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 active:scale-95 text-white dark:text-slate-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Scanning Free'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Read Labels Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">Why reading labels is critical</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                Most packaged foods use deceptive marketing. "Zero Sugar" might mean chemical sweeteners. "High Protein" often comes with 500mg of sodium. 
                Without reading the label, you're flying blind with your health.
              </p>
              <ul className="space-y-6">
                {[
                  "Avoid hidden allergens and inflammatory oils",
                  "Track your true sodium and sugar intake",
                  "Ensure your family gets real nutritional value"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Visual block */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200 to-teal-200 dark:from-emerald-500/20 dark:to-cyan-500/20 blur-3xl rounded-[3rem] transition-all group-hover:blur-[40px] duration-500 opacity-60 dark:opacity-100" />
              <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 lg:p-10 rounded-[2rem] shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 tracking-wider uppercase">Nutrition Facts</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">Serving Size 1 cup (228g)</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-rose-500 dark:text-rose-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-4 border-b-4 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-xl">Calories</span>
                    <span className="text-4xl font-black text-slate-900 dark:text-white">250</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Total Fat 12g</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Sodium 470mg</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">20%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Added Sugars 10g</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">Everything you need to eat smarter</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">We provide the tools to instantly analyze, track, and improve your daily consumption with beautiful interfaces.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquareHeart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">AI Dietitian Chatbot</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Chat personally with our AI dietitian. Ask for alternatives, get personalized limits based on your body metrics, and receive instant advice.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ScanLine className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Instant Analysis</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Scan barcodes or upload photos of nutritional labels. We'll break down the ingredients and give it a simple health grade out of 10.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Family Profiles</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Link accounts with your family members or create local profiles for your children to keep track of everyone's daily sugar and sodium intake.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-400/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">Ready to take back control?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 font-medium">
            Join thousands of others making informed, healthier decisions every day.
          </p>
          <button 
            onClick={onAction}
            className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 active:scale-95 text-white dark:text-slate-950 font-bold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 mx-auto"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Create Your Free Account'}
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

    </div>
  );
};
