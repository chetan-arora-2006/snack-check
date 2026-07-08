import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Trophy, Zap, AlertTriangle, ShieldCheck, Medal, Award, Star } from 'lucide-react';

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

  useEffect(() => {
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
    fetchData();
  }, [apiFetch]);

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
    const badges = [];
    if (budget.sugars.percentage < 100) {
      badges.push({ name: 'Sugar Shield', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' });
    } else {
      badges.push({ name: 'Sugar Crash', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' });
    }

    if (budget.sodium.percentage < 100) {
      badges.push({ name: 'Clean Eater', icon: Award, color: 'text-green-500', bg: 'bg-green-500/10' });
    }

    if (todayLogs.length >= 3) {
      badges.push({ name: 'Active Tracker', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' });
    }

    if (budget.calories.percentage >= 90 && budget.calories.percentage <= 110) {
      badges.push({ name: 'Perfect Balance', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' });
    }

    return badges;
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Activity className="text-emerald-500" /> Today's Budget
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {budget && (
            <>
              <CircularProgress title="Calories" status={budget.calories} colorClass="text-orange-500" gradientFrom="#f97316" gradientTo="#fb923c" />
              <CircularProgress title="Sugar" status={budget.sugars} colorClass={budget.sugars.percentage > 100 ? "text-red-500" : "text-blue-500"} gradientFrom={budget.sugars.percentage > 100 ? "#ef4444" : "#3b82f6"} gradientTo={budget.sugars.percentage > 100 ? "#f87171" : "#60a5fa"} />
              <CircularProgress title="Sodium" status={budget.sodium} colorClass={budget.sodium.percentage > 100 ? "text-red-500" : "text-teal-500"} gradientFrom={budget.sodium.percentage > 100 ? "#ef4444" : "#14b8a6"} gradientTo={budget.sodium.percentage > 100 ? "#f87171" : "#2dd4bf"} />
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
            {badges.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Log more snacks to earn badges!</p>
            ) : (
              badges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className={`p-3 rounded-full ${badge.bg}`}>
                    <badge.icon className={`w-6 h-6 ${badge.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{badge.name}</h3>
                </div>
              ))
            )}
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
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {reportLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {user?.weekly_report ? 'Regenerate Report' : 'Generate Report'}
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            {user?.weekly_report ? (
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-col items-center justify-center shrink-0 w-40 h-40 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <span className="text-5xl font-bold text-white drop-shadow-md">{user.weekly_report.score}</span>
                  <span className="text-sm text-purple-200 uppercase tracking-wider font-semibold mt-1">Score</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 drop-shadow-sm">Your Weekly Insights</h3>
                  <p className="text-purple-100 leading-relaxed text-lg">{user.weekly_report.review}</p>
                  <p className="text-purple-300/60 text-xs mt-6 font-medium tracking-wide">
                    Generated on {new Date(user.weekly_report.generated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 text-center py-12">
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
    </div>
  );
};
