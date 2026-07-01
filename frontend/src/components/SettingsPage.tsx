import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import { 
  Check, 
  Scale, 
  ShieldAlert, 
  Sparkles, 
  Save 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const ALLERGY_OPTIONS = ["Gluten", "Dairy", "Peanuts", "Soy", "Tree Nuts", "Eggs", "Fish", "Shellfish", "Sesame"];
  const GOAL_OPTIONS = ["Low Sugar", "Weight Loss", "Heart Healthy", "High Protein", "Low Sodium", "Organic Only"];
  const MEDICAL_OPTIONS = ["Type 2 Diabetes", "Hypertension", "Celiac Disease", "High Cholesterol"];

  // Primary user states
  const [name, setName] = useState(user?.name || "");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    Array.isArray(user?.allergies) ? user.allergies : []
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    Array.isArray(user?.health_goals) ? user.health_goals : []
  );
  const [selectedMedConditions, setSelectedMedConditions] = useState<string[]>(
    Array.isArray(user?.medical_conditions) ? user.medical_conditions : []
  );
  
  // Biometrics
  const [age, setAge] = useState<string>(user?.biometrics?.age?.toString() || "");
  const [gender, setGender] = useState<string>(user?.biometrics?.gender || "Male");
  const [height, setHeight] = useState<string>(user?.biometrics?.height_cm?.toString() || "");
  const [weight, setWeight] = useState<string>(user?.biometrics?.weight_kg?.toString() || "");
  const [targetWeight, setTargetWeight] = useState<string>(user?.biometrics?.target_weight_kg?.toString() || "");

  // Daily Limits
  const [caloriesLimit, setCaloriesLimit] = useState<string>(user?.daily_limits?.calories?.toString() || "2000");
  const [sugarLimit, setSugarLimit] = useState<string>(user?.daily_limits?.sugar_g?.toString() || "36");
  const [sodiumLimit, setSodiumLimit] = useState<string>(user?.daily_limits?.sodium_mg?.toString() || "2300");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form toggles
  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleCondition = (cond: string) => {
    setSelectedMedConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  // Save everything
  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        name,
        allergies: selectedAllergies,
        health_goals: selectedGoals,
        medical_conditions: selectedMedConditions,
        biometrics: {
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
          height_cm: height ? parseFloat(height) : undefined,
          weight_kg: weight ? parseFloat(weight) : undefined,
          target_weight_kg: targetWeight ? parseFloat(targetWeight) : undefined
        },
        daily_limits: {
          calories: caloriesLimit ? parseFloat(caloriesLimit) : 2000.0,
          sugar_g: sugarLimit ? parseFloat(sugarLimit) : 36.0,
          sodium_mg: sodiumLimit ? parseFloat(sodiumLimit) : 2300.0
        }
      });
      setMessage({ type: 'success', text: 'All profile and health record settings updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update profile settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Profile & Health Settings
          </h2>
          <p className="text-slate-400 text-sm mt-1">Configure your biometrics, target thresholds, and family sub-profiles</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-2xl active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/10 transition-all duration-200 text-sm self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm border font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-550/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-550/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Biometrics & Limits */}
        <div className="space-y-8 lg:col-span-1">
          {/* User Bio Details */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-5">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100">Personal Biometrics</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 175"
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 72.5"
                    className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="e.g. 68.0"
                    className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Limits */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-5">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100">Daily Nutrient Budget</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Caloric Limit (kcal)</label>
                <input
                  type="number"
                  value={caloriesLimit}
                  onChange={(e) => setCaloriesLimit(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Added Sugar Limit (grams)</label>
                <input
                  type="number"
                  value={sugarLimit}
                  onChange={(e) => setSugarLimit(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sodium Limit (mg)</label>
                <input
                  type="number"
                  value={sodiumLimit}
                  onChange={(e) => setSodiumLimit(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* MIDDLE COLUMN: Allergies, Goals, and Medical Conditions */}
        <div className="space-y-8 lg:col-span-1">
          {/* Allergens & Intolerances */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100">Allergies & Intolerances</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Select ingredients to trigger critical warnings during label checks.</p>
            
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isSelected 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-450' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {allergy}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Medical Conditions */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100">Medical Conditions</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">AI uses these to dynamically adjust food ratings and alert parameters.</p>
            
            <div className="space-y-2">
              {MEDICAL_OPTIONS.map((cond) => {
                const isSelected = selectedMedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{cond}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Health Targets */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100">Dietary & Health Goals</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {goal}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
