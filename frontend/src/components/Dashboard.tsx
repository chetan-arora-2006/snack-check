import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import type { ScanDB } from '../schemas/scan';
import { 
  PlusCircle, 
  UserSquare2, 
  Activity, 
  Calendar, 
  ShieldAlert, 
  TrendingUp, 
  ChevronRight,
  Apple,
  Check,
  Coffee
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedScan: (scan: ScanDB) => void;
}

interface BudgetNutrient {
  limit: number;
  consumed: number;
  percentage: number;
}

interface BudgetReport {
  calories: BudgetNutrient;
  sugars: BudgetNutrient;
  sodium: BudgetNutrient;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedScan }) => {
  const { apiFetch, user, activeMemberId } = useAuth();
  
  const [stats, setStats] = useState({
    totalScans: 0,
    avgScore: 0,
    consultationsCount: 0
  });
  
  const [recentScans, setRecentScans] = useState<ScanDB[]>([]);
  const [healthTipIndex, setHealthTipIndex] = useState(0);
  const [budget, setBudget] = useState<BudgetReport | null>(null);

  const healthTips = [
    "Check the ingredient lists: Ingredients are listed in descending order by weight. Avoid products where sugar, salt, or oils are in the first three ingredients.",
    "Look out for hidden sugars: High fructose corn syrup, dextrose, maltose, cane juice, and agave nectar are all sugar names.",
    "Sodium levels: A product with more than 500mg of sodium per 100g is considered high sodium. Opt for snacks under 140mg per serving.",
    "Fiber to Carb ratio: Look for grain snacks with at least 1g of dietary fiber for every 10g of carbohydrates to ensure sustained energy release.",
    "Saturated vs Unsaturated Fats: Keep saturated fats low (less than 5g per 100g) and prefer products rich in dietary fiber from flax and chia seeds."
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      const scanUrl = `/api/scan/history${activeMemberId ? `?member_id=${activeMemberId}` : ''}`;
      const scans: ScanDB[] = await apiFetch(scanUrl);
      
      const filteredScans = scans;

      setRecentScans(filteredScans.slice(0, 3));
      
      // Calculate average health rating
      let totalScore = 0;
      filteredScans.forEach(s => totalScore += s.result.health_rating);
      const avg = filteredScans.length > 0 ? Math.round(totalScore / filteredScans.length) : 0;

      // Fetch consultations
      const consultations = await apiFetch('/api/doctor/consultations');

      setStats({
        totalScans: filteredScans.length,
        avgScore: avg,
        consultationsCount: consultations.length
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  }, [apiFetch, activeMemberId]);

  const fetchBudget = useCallback(async () => {
    try {
      const url = `/api/consumption/daily${activeMemberId ? `?member_id=${activeMemberId}` : ''}`;
      const data = await apiFetch(url);
      setBudget(data);
    } catch (err) {
      console.error("Failed to fetch daily budget metrics:", err);
    }
  }, [apiFetch, activeMemberId]);

  useEffect(() => {
    fetchDashboardData();
    fetchBudget();
  }, [fetchDashboardData, fetchBudget]);

  useEffect(() => {
    // Rotate health tips every 8 seconds
    const interval = setInterval(() => {
      setHealthTipIndex((prev) => (prev + 1) % healthTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [healthTips.length]);

  const handleLogConsumption = async (e: React.MouseEvent, scan: ScanDB) => {
    e.stopPropagation(); // Stop navigation click
    try {
      await apiFetch('/api/consumption/log', {
        method: 'POST',
        body: JSON.stringify({
          product_name: scan.result.product_name,
          calories: scan.result.nutrients.calories || 0,
          sugars: scan.result.nutrients.sugars || 0,
          sodium: scan.result.nutrients.sodium || 0,
          member_id: activeMemberId
        })
      });
      // Trigger budget reload
      fetchBudget();
    } catch (err) {
      console.error("Failed to log consumption:", err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const activeName = activeMemberId && user?.family_members
    ? user.family_members.find(m => m.id === activeMemberId)?.name
    : user?.name;

  // SVG Circular progress builder
  const CircularProgress: React.FC<{
    percentage: number;
    colorClass: string;
    label: string;
    current: number;
    limit: number;
    unit: string;
  }> = ({ percentage, colorClass, label, current, limit, unit }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const fillPercentage = Math.min(percentage, 100);
    const strokeDashoffset = circumference - (fillPercentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center text-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className={`stroke-current ${colorClass} transition-all duration-700 ease-out`}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{Math.round(percentage)}%</span>
            <span className="text-[8px] text-slate-500 uppercase font-semibold">{unit}</span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-2">{label}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">{Math.round(current)} / {limit} {unit}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Welcome back, <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{activeName}</span>!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is a summary of today's health budget and snack audits.</p>
        </div>
      </div>

      {/* Daily Limits Budget Rings */}
      {budget && (
        <Card
          hoverable
          onClick={() => setActiveTab('consumption')}
          className="p-6 border-slate-800"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-emerald-400" />
              Today's Consumption Tracker Budget
            </h3>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              View foods <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <CircularProgress
              percentage={budget.calories.percentage}
              colorClass="text-emerald-500"
              label="Calories"
              current={budget.calories.consumed}
              limit={budget.calories.limit}
              unit="kcal"
            />
            <CircularProgress
              percentage={budget.sugars.percentage}
              colorClass={budget.sugars.percentage > 100 ? "text-rose-500 animate-pulse" : "text-teal-400"}
              label="Sugar limit"
              current={budget.sugars.consumed}
              limit={budget.sugars.limit}
              unit="g"
            />
            <CircularProgress
              percentage={budget.sodium.percentage}
              colorClass={budget.sodium.percentage > 100 ? "text-rose-500 animate-pulse" : "text-blue-450"}
              label="Sodium limit"
              current={budget.sodium.consumed}
              limit={budget.sodium.limit}
              unit="mg"
            />
          </div>
        </Card>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluated Snacks ({activeMemberId ? "Member" : "You"})</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.totalScans}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-5 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Health Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-extrabold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore || '--'}
              </span>
              {stats.avgScore > 0 && <span className="text-xs text-slate-500">/ 100</span>}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-5 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booked Consultations</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.consultationsCount}</p>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Actions & Tips */}
        <div className="lg:col-span-2 space-y-8">
          {/* Action Hub */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-4">Snack Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab('scanner')}
                className="group border border-emerald-100 dark:border-slate-800 bg-emerald-50 dark:bg-slate-900/20 hover:bg-emerald-100 dark:hover:bg-slate-900/40 p-6 rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-44 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-emerald-400 transition-colors">Scan Snack Label</h4>
                  <p className="text-xs text-slate-400 mt-1">Upload a nutritional table, list ingredients, or check barcodes.</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('doctors')}
                className="group border border-blue-100 dark:border-slate-800 bg-blue-50 dark:bg-slate-900/20 hover:bg-blue-100 dark:hover:bg-slate-900/40 p-6 rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-44 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UserSquare2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-blue-400 transition-colors">Consult a Nutritionist</h4>
                  <p className="text-xs text-slate-400 mt-1">Schedule online appointments with registered professional dietitians.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Tip Widget */}
          <div className="border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Apple className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Did you know?</h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm mt-2 leading-relaxed transition-all duration-500">
                  {healthTips[healthTipIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Scans */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Recent Scans</h3>
            {stats.totalScans > 3 && (
              <button 
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-350 flex items-center gap-0.5 cursor-pointer"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-4">
              {recentScans.map((scan) => (
                <Card 
                  key={scan.id} 
                  hoverable
                  onClick={() => {
                    setSelectedScan(scan);
                    setActiveTab('history');
                  }}
                  className="flex items-center justify-between p-4 border border-slate-800"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold border ${getScoreBg(scan.result.health_rating)} ${getScoreColor(scan.result.health_rating)} flex-shrink-0`}>
                      {scan.result.health_grade}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm truncate">{scan.result.product_name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                        {new Date(scan.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleLogConsumption(e, scan)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/20 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500 transition-colors"
                      title="Log Consumption for today"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    {scan.result.warnings.allergens.length > 0 && (
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400" title="Contains Allergens">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-3xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[220px]">
              <p className="text-slate-500 text-sm">No scans logged for this profile.</p>
              <button 
                onClick={() => setActiveTab('scanner')}
                className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold transition-colors"
              >
                Scan Your First Snack
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
