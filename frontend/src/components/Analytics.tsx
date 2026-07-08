import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Trophy, Zap, AlertTriangle, ShieldCheck, Medal, Award, Star, Settings2, Lock, X } from 'lucide-react';

interface NutrientStatus {
  limit: number;
  consumed: number;
  percentage: number;
}

interface DailyBudgetReport {
  calories: NutrientStatus;
  sugars: NutrientStatus;
  sodium: NutrientStatus;
}

interface ConsumptionResponse {
  id: string;
  product_name: string;
  calories: number;
  sugars: number;
  sodium: number;
}

export const Analytics: React.FC = () => {
  const { user, apiFetch, updateProfile } = useAuth();
  const [budget, setBudget] = useState<DailyBudgetReport | null>(null);
  const [todayLogs, setTodayLogs] = useState<ConsumptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  // Edit Budget Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCalories, setEditCalories] = useState(2000);
  const [editSugar, setEditSugar] = useState(36);
  const [editSodium, setEditSodium] = useState(2300);

  const fetchData = async () => {
    try {
      const [budgetData, logsData] = await Promise.all([
        apiFetch('/api/consumption/daily'),
        apiFetch('/api/consumption/today')
      ]);
      setBudget(budgetData);
      setTodayLogs(logsData);
    } catch (err) {
      console.error("Failed to fetch analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiFetch]);

  const handleEditBudgetClick = () => {
    if (budget) {
      setEditCalories(budget.calories.limit);
      setEditSugar(budget.sugars.limit);
      setEditSodium(budget.sodium.limit);
    }
    setShowEditModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        daily_limits: {
          calories: editCalories,
          sugar_g: editSugar,
          sodium_mg: editSodium
        }
      });
      setShowEditModal(false);
      setLoading(true);
      fetchData(); // re-fetch to update charts
    } catch (error) {
      console.error("Failed to update limits", error);
    }
  };

  const generateWeeklyReport = async () => {
    setReportLoading(true);
    try {
      const report = await apiFetch('/api/analytics/weekly-report', { method: 'POST' });
      await updateProfile({ weekly_report: report }); // Update local user state
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setReportLoading(false);
    }
  };

  const getBadges = () => {
    if (!budget) return [];
    
    // Array of ALL possible achievements
    const allBadges = [
      { 
        id: 'sugar_shield',
        name: 'Sugar Shield', 
        desc: 'Keep sugar consumption under your daily limit.',
        icon: ShieldCheck, 
        color: 'text-blue-500', 
        bg: 'bg-blue-500/10',
        earned: budget.sugars.percentage < 100
      },
      { 
        id: 'sugar_crash',
        name: 'Sugar Crash', 
        desc: 'Oh no! You went over your sugar limit today.',
        icon: AlertTriangle, 
        color: 'text-red-500', 
        bg: 'bg-red-500/10',
        earned: budget.sugars.percentage >= 100
      },
      { 
        id: 'clean_eater',
        name: 'Clean Eater', 
        desc: 'Keep sodium consumption under your daily limit.',
        icon: Award, 
        color: 'text-green-500', 
        bg: 'bg-green-500/10',
        earned: budget.sodium.percentage < 100
      },
      { 
        id: 'active_tracker',
        name: 'Active Tracker', 
        desc: 'Log at least 3 snacks in a single day.',
        icon: Zap, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500/10',
        earned: todayLogs.length >= 3
      },
      { 
        id: 'perfect_balance',
        name: 'Perfect Balance', 
        desc: 'Keep your calories perfectly between 90% and 110% of your goal.',
        icon: Trophy, 
        color: 'text-purple-500', 
        bg: 'bg-purple-500/10',
        earned: budget.calories.percentage >= 90 && budget.calories.percentage <= 110
      }
    ];

    return allBadges;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin text-emerald-500"><Activity size={48} /></div>
      </div>
    );
  }

  const CircularProgress = ({ title, status, colorClass, gradientFrom, gradientTo }: { title: string, status: NutrientStatus, colorClass: string, gradientFrom: string, gradientTo: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(status.percentage, 100);
    const dashoffset = circumference - (percent / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">{title}</h4>
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r={radius} className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="8" fill="transparent" />
            <circle cx="64" cy="64" r={radius} stroke={`url(#gradient-${title})`} strokeWidth="8" fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={dashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gradientFrom} />
                <stop offset="100%" stopColor={gradientTo} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${colorClass}`}>{Math.round(status.percentage)}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">of Limit</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{Math.round(status.consumed)}</span> / {Math.round(status.limit)}
          </p>
        </div>
      </div>
    );
  };

  const badges = getBadges();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 mb-2">Analytics & Achievements</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your daily budgets and view your AI health insights.</p>
        </div>
      </div>

      {/* Budget Tracker */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="text-emerald-500" /> Today's Budget
          </h2>
          <button
            onClick={handleEditBudgetClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" /> Edit Limits
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {budget && (
            <>
              <CircularProgress title="Calories" status={budget.calories} colorClass="text-orange-500" gradientFrom="#f97316" gradientTo="#fb923c" />
              <CircularProgress title="Sugar (g)" status={budget.sugars} colorClass={budget.sugars.percentage > 100 ? "text-red-500" : "text-blue-500"} gradientFrom={budget.sugars.percentage > 100 ? "#ef4444" : "#3b82f6"} gradientTo={budget.sugars.percentage > 100 ? "#f87171" : "#60a5fa"} />
              <CircularProgress title="Sodium (mg)" status={budget.sodium} colorClass={budget.sodium.percentage > 100 ? "text-red-500" : "text-teal-500"} gradientFrom={budget.sodium.percentage > 100 ? "#ef4444" : "#14b8a6"} gradientTo={budget.sodium.percentage > 100 ? "#f87171" : "#2dd4bf"} />
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievements / Gamification */}
        <section className="lg:col-span-1">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Medal className="text-yellow-500" /> Daily Achievements
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            {badges.map((badge) => (
              <div 
                key={badge.id} 
                className={`flex items-start gap-4 p-3 rounded-xl border transition-colors ${
                  badge.earned 
                    ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10' 
                    : 'border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 opacity-60 grayscale hover:grayscale-0'
                }`}
              >
                <div className={`shrink-0 p-3 rounded-full ${badge.earned ? badge.bg : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {badge.earned ? (
                    <badge.icon className={`w-6 h-6 ${badge.color}`} />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${badge.earned ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Weekly Report */}
        <section className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Star className="text-purple-500" /> Weekly AI Dietitian Report
            </h2>
            <button
              onClick={generateWeeklyReport}
              disabled={reportLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              {reportLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {user?.weekly_report ? 'Regenerate Report' : 'Generate Report'}
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden h-[300px] flex items-center">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            {user?.weekly_report ? (
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center w-full">
                <div className="flex flex-col items-center justify-center shrink-0 w-40 h-40 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <span className="text-5xl font-bold text-white drop-shadow-md">{user.weekly_report.score}</span>
                  <span className="text-sm text-purple-200 uppercase tracking-wider font-semibold mt-1">Score</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 drop-shadow-sm">Your Weekly Insights</h3>
                  <p className="text-purple-100 leading-relaxed text-lg">{user.weekly_report.review}</p>
                  <p className="text-purple-300/60 text-xs mt-6 font-medium tracking-wide">
                    Generated on {new Date(user.weekly_report.generated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 text-center w-full">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-6 shadow-inner backdrop-blur-sm">
                  <Activity className="w-10 h-10 text-purple-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 drop-shadow-sm">No Report Yet</h3>
                <p className="text-purple-200/90 max-w-md mx-auto text-lg leading-relaxed">Click the button above to have our AI analyze your logs from the past 7 days and generate a personalized health review.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Budget Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-500" /> Edit Daily Limits
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Calories Limit (kcal)</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    value={editCalories}
                    onChange={(e) => setEditCalories(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sugar Limit (g)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={editSugar}
                    onChange={(e) => setEditSugar(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sodium Limit (mg)</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={editSodium}
                    onChange={(e) => setEditSodium(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
