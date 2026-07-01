import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import { UserRound, Heart, ShieldAlert, Sparkles, Check } from 'lucide-react';

export const FamilyHealthPage: React.FC = () => {
  const { user, apiFetch, activeMemberId, setActiveMemberId } = useAuth();
  const [linkedMembers, setLinkedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinkedMembers = async () => {
    setLoading(false);
    setLoading(true);
    try {
      const data = await apiFetch('/api/user/family/linked');
      setLinkedMembers(data);
    } catch (err) {
      console.error('Failed to load linked family members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedMembers();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Family Health Details
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            View biometrics, allergies, and nutrient budgets for all linked family profiles.
          </p>
        </div>
        
        {/* Active Scan Profile Indicator */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 self-start md:self-auto shadow-md">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Active Scan Target: <span className="underline font-extrabold">
            {activeMemberId ? (linkedMembers.find(m => m.id === activeMemberId)?.name || 'Sub-profile') : `${user?.name} (You)`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Loading family health profiles...</span>
        </div>
      ) : linkedMembers.length === 0 ? (
        <Card className="p-12 border border-slate-850 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center mb-4">
            <UserRound className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No Linked Family Profiles</h3>
          <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
            Invite and link your family members using unique nametags first. Once they connect, their health records will compile here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Primary Profile Card (Owner) */}
          <Card className={`p-6 border transition-all duration-300 flex flex-col justify-between ${!activeMemberId ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' : 'border-slate-850'}`}>
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-base border border-slate-800">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-100 flex items-center gap-2">
                      {user?.name}
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Primary</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">@{user?.nametag || 'no_tag'}</p>
                  </div>
                </div>

                {!activeMemberId ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" />
                    Active Scan Target
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveMemberId(null)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Select Target
                  </button>
                )}
              </div>

              {/* Health Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Biometrics</h4>
                  <div className="text-xs space-y-1 text-slate-350">
                    <p>Age: <span className="font-bold text-slate-200">{user?.biometrics?.age || '—'}</span></p>
                    <p>Gender: <span className="font-bold text-slate-200">{user?.biometrics?.gender || '—'}</span></p>
                    <p>Height: <span className="font-bold text-slate-200">{user?.biometrics?.height_cm ? `${user.biometrics.height_cm} cm` : '—'}</span></p>
                    <p>Weight: <span className="font-bold text-slate-200">{user?.biometrics?.weight_kg ? `${user.biometrics.weight_kg} kg` : '—'}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Budget Limits</h4>
                  <div className="text-xs space-y-1 text-slate-350">
                    <p>Calories: <span className="font-bold text-slate-200">{user?.daily_limits?.calories} kcal</span></p>
                    <p>Sugar limit: <span className="font-bold text-slate-200">{user?.daily_limits?.sugar_g} g</span></p>
                    <p>Sodium limit: <span className="font-bold text-slate-200">{user?.daily_limits?.sodium_mg} mg</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-850 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Allergies
                  </h4>
                  {user?.allergies && user.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.allergies.map((allergy, i) => (
                        <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg text-[9px]">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No warnings configured</span>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-indigo-400" /> Medical
                  </h4>
                  {user?.medical_conditions && user.medical_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.medical_conditions.map((med, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg text-[9px]">
                          {med}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No conditions configured</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Linked Family Members Cards */}
          {linkedMembers.map((member) => (
            <Card 
              key={member.id} 
              className={`p-6 border transition-all duration-300 flex flex-col justify-between ${activeMemberId === member.id ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' : 'border-slate-850'}`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {member.picture ? (
                      <img src={member.picture} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-slate-850" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-base border border-slate-850">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-100">{member.name}</h3>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">@{member.nametag}</p>
                    </div>
                  </div>

                  {activeMemberId === member.id ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                      Active Scan Target
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveMemberId(member.id)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Select Target
                    </button>
                  )}
                </div>

                {/* Health Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Biometrics</h4>
                    <div className="text-xs space-y-1 text-slate-350">
                      <p>Age: <span className="font-bold text-slate-200">{member.biometrics?.age || '—'}</span></p>
                      <p>Gender: <span className="font-bold text-slate-200">{member.biometrics?.gender || '—'}</span></p>
                      <p>Height: <span className="font-bold text-slate-200">{member.biometrics?.height_cm ? `${member.biometrics.height_cm} cm` : '—'}</span></p>
                      <p>Weight: <span className="font-bold text-slate-200">{member.biometrics?.weight_kg ? `${member.biometrics.weight_kg} kg` : '—'}</span></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Budget Limits</h4>
                    <div className="text-xs space-y-1 text-slate-350">
                      <p>Calories: <span className="font-bold text-slate-200">{member.daily_limits?.calories} kcal</span></p>
                      <p>Sugar limit: <span className="font-bold text-slate-200">{member.daily_limits?.sugar_g} g</span></p>
                      <p>Sodium limit: <span className="font-bold text-slate-200">{member.daily_limits?.sodium_mg} mg</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-850 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Allergies
                    </h4>
                    {member.allergies && member.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.allergies.map((allergy: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg text-[9px]">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No warnings configured</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-indigo-400" /> Medical
                    </h4>
                    {member.medical_conditions && member.medical_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.medical_conditions.map((med: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg text-[9px]">
                            {med}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No conditions configured</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

        </div>
      )}
    </div>
  );
};
