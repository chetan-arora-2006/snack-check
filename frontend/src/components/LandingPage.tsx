import React from 'react';
import { ScanLine, MessageSquareHeart, Users, ShieldAlert, ArrowRight, HeartPulse, Activity } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <ScanLine className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-white">SnackCheck</span>
          </div>
          <button 
            onClick={onSignIn}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <Activity className="w-3 h-3" />
            Empowering Healthier Choices
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Know exactly what <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              you are eating.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Food labels are intentionally confusing. Hidden sugars, dangerous trans fats, and excess sodium are hiding in plain sight. 
            SnackCheck uses AI to decode nutrition facts instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onSignIn}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              Start Scanning Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Read Labels Section */}
      <section className="py-20 px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Why reading labels is critical</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Most packaged foods use deceptive marketing. "Zero Sugar" might mean chemical sweeteners. "High Protein" often comes with 500mg of sodium. 
                Without reading the label, you're flying blind with your health.
              </p>
              <ul className="space-y-4">
                {[
                  "Avoid hidden allergens and inflammatory oils",
                  "Track your true sodium and sugar intake",
                  "Ensure your family gets real nutritional value"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-3 h-3 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Visual block */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-[3rem]" />
              <div className="relative bg-slate-950 border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Nutrition Facts</div>
                    <div className="text-xl font-bold text-white">Serving Size 1 cup (228g)</div>
                  </div>
                  <HeartPulse className="w-8 h-8 text-rose-500" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-800">
                    <span className="text-slate-300 font-semibold">Calories</span>
                    <span className="text-2xl font-bold text-white">250</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Total Fat 12g</span>
                    <span className="text-rose-400 font-medium font-mono">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Sodium 470mg</span>
                    <span className="text-rose-400 font-medium font-mono">20%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Added Sugars 10g</span>
                    <span className="text-rose-400 font-medium font-mono">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Everything you need to eat smarter</h2>
            <p className="text-slate-400 text-lg">We provide the tools to instantly analyze, track, and improve your daily consumption.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900 transition-colors">
              <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquareHeart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Dietitian Chatbot</h3>
              <p className="text-slate-400 leading-relaxed">
                Chat personally with our AI dietitian. Ask for alternatives, get personalized limits based on your body metrics, and receive instant nutritional advice.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <ScanLine className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Analysis</h3>
              <p className="text-slate-400 leading-relaxed">
                Scan barcodes or upload photos of nutritional labels. We'll break down the ingredients and give it a simple health grade out of 10.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Family Profiles</h3>
              <p className="text-slate-400 leading-relaxed">
                Link accounts with your family members or create local profiles for your children to keep track of everyone's daily sugar and sodium intake.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-slate-800 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to take back control?</h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of others making informed, healthier decisions every day.
          </p>
          <button 
            onClick={onSignIn}
            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
          >
            Create Your Free Account
          </button>
        </div>
      </section>

    </div>
  );
};
