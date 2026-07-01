import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import type { ScanDB } from '../schemas/scan';
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle,
  Clock,
  Coffee,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
  Utensils
} from 'lucide-react';

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

interface ConsumptionItem {
  id: string;
  product_name: string;
  calories: number;
  sugars: number;
  sodium: number;
  consumed_at: string;
}

interface TodayConsumptionProps {
  setActiveTab: (tab: string) => void;
}

export const TodayConsumption: React.FC<TodayConsumptionProps> = ({ setActiveTab }) => {
  const { apiFetch, activeMemberId, user } = useAuth();
  const [items, setItems] = useState<ConsumptionItem[]>([]);
  const [budget, setBudget] = useState<BudgetReport | null>(null);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeName = activeMemberId && user?.family_members
    ? user.family_members.find(m => m.id === activeMemberId)?.name
    : user?.name;

  const memberQuery = activeMemberId ? `?member_id=${activeMemberId}` : '';

  const fetchToday = useCallback(async () => {
    try {
      const [todayItems, todayBudget] = await Promise.all([
        apiFetch(`/api/consumption/today${memberQuery}`),
        apiFetch(`/api/consumption/daily${memberQuery}`)
      ]);
      setItems(todayItems);
      setBudget(todayBudget);
    } catch (err: any) {
      setError(err.message || "Could not load today's consumption.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, memberQuery]);

  useEffect(() => {
    setLoading(true);
    fetchToday();
  }, [fetchToday, activeMemberId]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const scan: ScanDB = await apiFetch(`/api/scan/barcode/${barcode.trim()}${memberQuery}`);
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
      setMessage(`${scan.result.product_name} was added to today's consumption.`);
      setBarcode('');
      await fetchToday();
    } catch (err: any) {
      setError(err.message || 'Could not find or log that barcode.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveItem = async (itemId: string, productName: string) => {
    if (!window.confirm(`Remove ${productName} from today's consumption?`)) return;

    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/consumption/${itemId}`, { method: 'DELETE' });
      setMessage(`${productName} was removed from today's consumption.`);
      await fetchToday();
    } catch (err: any) {
      setError(err.message || 'Could not remove that item.');
    }
  };

  const totals = {
    calories: items.reduce((sum, item) => sum + item.calories, 0),
    sugars: items.reduce((sum, item) => sum + item.sugars, 0),
    sodium: items.reduce((sum, item) => sum + item.sodium, 0)
  };

  const nutrientCards = budget ? [
    { label: 'Calories', value: budget.calories.consumed, limit: budget.calories.limit, unit: 'kcal', color: 'text-emerald-500' },
    { label: 'Sugar', value: budget.sugars.consumed, limit: budget.sugars.limit, unit: 'g', color: budget.sugars.percentage > 100 ? 'text-rose-500' : 'text-teal-500' },
    { label: 'Sodium', value: budget.sodium.consumed, limit: budget.sodium.limit, unit: 'mg', color: budget.sodium.percentage > 100 ? 'text-rose-500' : 'text-blue-500' }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Today's Consumption</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track what {activeName || 'you'} ate today and add packaged foods by barcode.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('scanner')}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all"
        >
          <Camera className="w-4 h-4" />
          Scan Product
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm p-4 rounded-2xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <Coffee className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daily Budget</h3>
          </div>
          {budget ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nutrientCards.map(item => (
                <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className={`text-2xl font-extrabold mt-2 ${item.color}`}>
                    {Math.round(item.value)}
                    <span className="text-xs font-semibold text-slate-500 ml-1">{item.unit}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">of {Math.round(item.limit)} {item.unit}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse" />
          )}
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <Barcode className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add by Barcode</h3>
          </div>
          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode number"
              inputMode="numeric"
              className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!barcode.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 rounded-2xl font-bold text-sm transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Add Food
            </button>
          </form>
        </Card>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Things Eaten Today</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.product_name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(item.consumed_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <span className="text-xs text-slate-500"><strong className="text-slate-900 dark:text-slate-100">{Math.round(item.calories)}</strong> kcal</span>
                    <span className="text-xs text-slate-500"><strong className="text-slate-900 dark:text-slate-100">{item.sugars.toFixed(1)}</strong> g sugar</span>
                    <span className="text-xs text-slate-500"><strong className="text-slate-900 dark:text-slate-100">{Math.round(item.sodium)}</strong> mg sodium</span>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id, item.product_name)}
                    className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Remove from today's consumption"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PlusCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-500 mt-3">No foods logged today yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add one with a barcode or scan a label.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span>Total: {Math.round(totals.calories)} kcal</span>
            <span>{totals.sugars.toFixed(1)} g sugar</span>
            <span>{Math.round(totals.sodium)} mg sodium</span>
          </div>
        )}
      </Card>
    </div>
  );
};
