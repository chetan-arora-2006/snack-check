import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import type { ScanDB } from '../schemas/scan';
import { 
  Search, 
  Trash2, 
  Eye, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ScanHistoryProps {
  selectedScan: ScanDB | null;
  setSelectedScan: (scan: ScanDB | null) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ selectedScan, setSelectedScan }) => {
  const { apiFetch, user, activeMemberId } = useAuth();
  const [scans, setScans] = useState<ScanDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  // Fetch scan history
  const loadHistory = useCallback(async () => {
    try {
      const historyList: ScanDB[] = await apiFetch('/api/scan/history' + (activeMemberId ? `?member_id=${activeMemberId}` : ''));
      setScans(historyList);
    } catch (e: any) {
      setError(e.message || "Failed to load scan history.");
    }
  }, [apiFetch, activeMemberId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteScan = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    if (!confirm("Are you sure you want to delete this scan from your history?")) return;
    
    try {
      await apiFetch(`/api/scan/${scanId}`, {
        method: 'DELETE'
      });
      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
      }
      loadHistory(); // reload list
    } catch (err: any) {
      alert(err.message || "Failed to delete scan.");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
  };

  const getScoreColorHex = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  // Filter scan list
  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.result.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || scan.result.health_grade.charAt(0) === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Circular gauge config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const getStrokeDashoffset = (score: number) => {
    return circumference - (score / 100) * circumference;
  };

  // Match allergens with user allergies
  const getProfileAllergenMatches = (reportAllergens: string[]) => {
    if (!user || !user.allergies) return [];
    return reportAllergens.filter(allergen => 
      user.allergies.some(userAllergy => 
        allergen.toLowerCase().includes(userAllergy.toLowerCase()) || 
        userAllergy.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-100">Scan History</h2>
        <p className="text-slate-400 text-sm mt-1">Review, search, and manage your past AI-evaluated snacks.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Search and Filters Hub */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/50 focus:bg-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200"
          />
        </div>

        {/* Grade Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'A', 'B', 'C', 'D', 'F'].map((grade) => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                gradeFilter === grade
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.03)]'
                  : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {grade === 'All' ? 'All Grades' : `Grade ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid */}
      {filteredScans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScans.map((scan) => (
            <Card
              key={scan.id}
              hoverable
              onClick={() => setSelectedScan(scan)}
              className="flex flex-col justify-between border border-slate-900 p-5 group h-44"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition-colors">
                      {scan.result.product_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-650" />
                      {new Date(scan.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border ${getScoreColor(scan.result.health_rating)} flex-shrink-0`}>
                    {scan.result.health_grade}
                  </div>
                </div>

                {/* Allergen Check */}
                {scan.result.warnings.allergens.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-semibold bg-rose-500/5 border border-rose-500/10 px-2.5 py-1 rounded-lg w-max">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Contains: {scan.result.warnings.allergens.join(', ')}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Score: {scan.result.health_rating}/100</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleDeleteScan(scan.id, e)}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-80 group-hover:opacity-100"
                    title="Delete Scan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedScan(scan)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-750 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="glass p-12 rounded-3xl border border-slate-900 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Search className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm font-semibold">No evaluation records found matching filters.</p>
          <p className="text-[10px] text-slate-650 mt-1 max-w-[240px]">Try adjusting your search terms or scan a new product.</p>
        </div>
      )}

      {/* Details View Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Scan Details</h3>
                <p className="text-xs text-slate-500">Evaluated on {new Date(selectedScan.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedScan(null)}
                className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Allergen Warning */}
              {getProfileAllergenMatches(selectedScan.result.warnings.allergens).length > 0 && (
                <div className="flex gap-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-2.5xl items-start">
                  <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Allergy Conflict Warning!</h4>
                    <p className="text-xs text-rose-400/90 mt-1">
                      This product contains ingredients matching your profile allergy list: <strong>{getProfileAllergenMatches(selectedScan.result.warnings.allergens).join(', ')}</strong>. Eating this snack is not recommended.
                    </p>
                  </div>
                </div>
              )}

              {/* Layout grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Score */}
                <div className="flex flex-col items-center text-center p-6 bg-slate-900/10 rounded-2.5xl border border-slate-900 relative">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold absolute top-4 left-6">
                    Health Grading
                  </span>

                  <div className="relative w-40 h-40 flex items-center justify-center my-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="80" 
                        cy="80" 
                        r={radius} 
                        stroke="rgba(255,255,255,0.03)" 
                        strokeWidth="9" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="80" 
                        cy="80" 
                        r={radius} 
                        stroke={getScoreColorHex(selectedScan.result.health_rating)} 
                        strokeWidth="9" 
                        fill="transparent" 
                        strokeDasharray={circumference}
                        strokeDashoffset={getStrokeDashoffset(selectedScan.result.health_rating)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-100">{selectedScan.result.health_grade}</span>
                      <span className="text-[10px] text-slate-500 font-semibold mt-1">Score {selectedScan.result.health_rating}/100</span>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-100">{selectedScan.result.product_name}</h4>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{selectedScan.result.summary}</p>
                </div>

                {/* Nutrients & warnings */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Nutrients grid */}
                  <div className="p-6 bg-slate-900/10 rounded-2.5xl border border-slate-900">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Nutrient Values <span className="text-[10px] text-slate-500 font-normal lowercase">(per 100g)</span></h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Calories', val: selectedScan.result.nutrients.calories, unit: 'kcal', warning: false },
                        { label: 'Sugars', val: selectedScan.result.nutrients.sugars, unit: 'g', warning: selectedScan.result.warnings.high_sugar, tag: 'High Sugar!' },
                        { label: 'Total Fat', val: selectedScan.result.nutrients.fat, unit: 'g', warning: false },
                        { label: 'Sat. Fat', val: selectedScan.result.nutrients.saturated_fat, unit: 'g', warning: selectedScan.result.warnings.high_saturated_fat, tag: 'High Sat. Fat!' },
                        { label: 'Protein', val: selectedScan.result.nutrients.protein, unit: 'g', warning: false },
                        { label: 'Sodium', val: selectedScan.result.nutrients.sodium, unit: 'mg', warning: selectedScan.result.warnings.high_sodium, tag: 'High Sodium!' },
                        { label: 'Fiber', val: selectedScan.result.nutrients.fiber, unit: 'g', warning: false, positive: true }
                      ].map((nut, i) => {
                        if (nut.val === null) return null;
                        return (
                          <div key={i} className={`p-3 rounded-2xl border transition-all ${
                            nut.warning 
                              ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                              : nut.positive 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                : 'bg-slate-900/40 border-slate-850/80 text-slate-300'
                          }`}>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{nut.label}</p>
                            <p className="text-base font-extrabold text-slate-100 mt-1">
                              {nut.val} <span className="text-[10px] font-semibold text-slate-500">{nut.unit}</span>
                            </p>
                            {nut.warning && (
                              <span className="inline-block text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 px-1 py-0.5 rounded-full mt-1.5">
                                {nut.tag}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warnings columns */}
                  {(selectedScan.result.warnings.additives.length > 0 || selectedScan.result.warnings.allergens.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Allergens */}
                      <div className="p-5 bg-slate-900/10 rounded-2.5xl border border-slate-900">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Allergens Detected</h4>
                        {selectedScan.result.warnings.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedScan.result.warnings.allergens.map((allergen, i) => (
                              <span key={i} className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-[10px] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {allergen}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            No common allergens detected.
                          </p>
                        )}
                      </div>

                      {/* Additives */}
                      <div className="p-5 bg-slate-900/10 rounded-2.5xl border border-slate-900">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Additives Analysis</h4>
                        {selectedScan.result.warnings.additives.length > 0 ? (
                          <div className="space-y-3">
                            {selectedScan.result.warnings.additives.map((additive, i) => (
                              <div key={i} className="flex justify-between items-start gap-2 border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                                <div>
                                  <p className="text-[11px] font-bold text-slate-200">{additive.name}</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{additive.description}</p>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  additive.hazard === 'High' 
                                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                                    : additive.hazard === 'Moderate'
                                      ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
                                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                }`}>
                                  {additive.hazard}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            No synthetic additives identified.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Ingredient categorization */}
              <div className="p-6 bg-slate-900/10 rounded-2.5xl border border-slate-900">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ingredients Category Audit</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Beneficial */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Beneficial</span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 min-h-[100px] space-y-0.5">
                      {selectedScan.result.ingredients_analysis.beneficial.map((ing, i) => (
                        <p key={i} className="text-xs text-slate-300">• {ing}</p>
                      ))}
                    </div>
                  </div>

                  {/* Neutral */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Info className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Neutral</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 min-h-[100px] space-y-0.5">
                      {selectedScan.result.ingredients_analysis.neutral.map((ing, i) => (
                        <p key={i} className="text-xs text-slate-300">• {ing}</p>
                      ))}
                    </div>
                  </div>

                  {/* Avoid */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Minimize / Avoid</span>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 min-h-[100px] space-y-0.5">
                      {selectedScan.result.ingredients_analysis.avoid.map((ing, i) => (
                        <p key={i} className="text-xs text-slate-300">• {ing}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternatives */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                  Healthier Alternatives
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedScan.result.healthier_alternatives.map((alt, i) => (
                    <div key={i} className="bg-slate-900/10 p-4 rounded-2.5xl border border-slate-900 hover:border-emerald-500/20 hover:bg-slate-900/30 transition-all flex items-start justify-between gap-4 group">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors">{alt.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{alt.description}</p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-900 flex justify-end gap-3 bg-slate-950/40">
              <button
                onClick={(e) => {
                  handleDeleteScan(selectedScan.id, e);
                }}
                className="px-5 py-2.5 rounded-xl border border-rose-500/10 hover:border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-xs font-bold text-rose-400 flex items-center gap-2 transition-colors mr-auto"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
              <button
                onClick={() => setSelectedScan(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 transition-colors"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
