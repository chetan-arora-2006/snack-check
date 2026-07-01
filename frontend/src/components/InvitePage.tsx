import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AtSign, Check, AlertCircle, Trash2, Shield } from 'lucide-react';
import { Card } from './UI/Card';

export const InvitePage: React.FC = () => {
  const { user, apiFetch, updateProfile } = useAuth();
  const [nametagInput, setNametagInput] = useState(user?.nametag || '');
  const [searchTag, setSearchTag] = useState('');
  const [linkedMembers, setLinkedMembers] = useState<any[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [errorTag, setErrorTag] = useState('');
  const [successTag, setSuccessTag] = useState('');
  const [errorSearch, setErrorSearch] = useState('');
  const [successSearch, setSuccessSearch] = useState('');

  const fetchLinkedMembers = async () => {
    setLoadingLinked(true);
    try {
      const data = await apiFetch('/api/user/family/linked');
      setLinkedMembers(data);
    } catch (err) {
      console.error('Failed to load linked family members:', err);
    } finally {
      setLoadingLinked(false);
    }
  };

  useEffect(() => {
    fetchLinkedMembers();
  }, []);

  const handleSaveNametag = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTag('');
    setSuccessTag('');

    const formattedTag = nametagInput.trim().toLowerCase();
    if (!formattedTag) {
      setErrorTag('Nametag cannot be empty');
      return;
    }

    try {
      const updated = await apiFetch('/api/user/nametag', {
        method: 'POST',
        body: JSON.stringify({ nametag: formattedTag }),
      });
      // Trigger context update
      await updateProfile({ nametag: updated.nametag });
      setSuccessTag('Unique nametag saved successfully!');
    } catch (err: any) {
      setErrorTag(err.message || 'Failed to save nametag. It might be taken.');
    }
  };

  const handleLinkMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSearch('');
    setSuccessSearch('');

    const query = searchTag.trim().toLowerCase().replace('@', '');
    if (!query) {
      setErrorSearch('Please enter a nametag to search');
      return;
    }

    try {
      await apiFetch('/api/user/family/link', {
        method: 'POST',
        body: JSON.stringify({ nametag: query }),
      });
      setSuccessSearch(`Successfully linked with @${query}!`);
      setSearchTag('');
      fetchLinkedMembers();
      // Sync local profile state
      await updateProfile({});
    } catch (err: any) {
      setErrorSearch(err.message || 'Failed to find or link member.');
    }
  };

  const handleUnlinkMember = async (memberId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove linked connection with ${name}?`)) {
      return;
    }

    try {
      await apiFetch(`/api/user/family/link/${memberId}`, {
        method: 'DELETE',
      });
      fetchLinkedMembers();
      // Sync local profile state
      await updateProfile({});
    } catch (err: any) {
      alert(err.message || 'Failed to unlink member.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Invite & Link Family
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Select your unique nametag and link with other family members to evaluate and share snack logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Setup & Link */}
        <div className="space-y-6">
          
          {/* Nametag setup */}
          <Card className="p-6 border border-slate-850">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <AtSign className="w-5 h-5 text-indigo-500" />
              Your Unique Nametag
            </h3>
            
            <form onSubmit={handleSaveNametag} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a unique tag so family members can search and link your health profile. Other users can view your active allergies/conditions during evaluations.
              </p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">@</span>
                  <input
                    type="text"
                    required
                    pattern="^[a-zA-Z0-9_]{3,15}$"
                    title="3-15 alphanumeric characters or underscores"
                    value={nametagInput}
                    onChange={(e) => setNametagInput(e.target.value)}
                    placeholder="e.g. chetan12"
                    className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 text-sm rounded-xl pl-8 pr-4 py-2.5 outline-none text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <Check className="w-4 h-4" />
                  Save Tag
                </button>
              </div>

              {errorTag && (
                <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/5 p-3 border border-rose-500/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorTag}</span>
                </div>
              )}

              {successTag && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3 border border-emerald-500/10 rounded-xl">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{successTag}</span>
                </div>
              )}
            </form>
          </Card>

          {/* Link family member */}
          <Card className="p-6 border border-slate-850">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              Link Family Member
            </h3>

            <form onSubmit={handleLinkMember} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter your family member's unique nametag below to send an immediate connection and synchronize health record audits.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  placeholder="Enter their nametag (e.g. rohit)"
                  className="flex-1 bg-slate-900/40 border border-slate-800 focus:border-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none text-slate-100"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Link Profile
                </button>
              </div>

              {errorSearch && (
                <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/5 p-3 border border-rose-500/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorSearch}</span>
                </div>
              )}

              {successSearch && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3 border border-emerald-500/10 rounded-xl">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{successSearch}</span>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Right Side: Linked Connections Circle */}
        <Card className="p-6 border border-slate-850 flex flex-col min-h-[380px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            Linked Family Members ({linkedMembers.length})
          </h3>

          {loadingLinked ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <svg className="animate-spin h-6 w-6 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs">Loading linked connections...</span>
            </div>
          ) : linkedMembers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center mb-3">
                <UserPlus className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-xs font-semibold text-slate-400">No linked members found</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                Search and add family members by their unique nametags to collaborate.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {linkedMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-800 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {member.picture ? (
                      <img src={member.picture} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-800" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-extrabold border border-slate-800">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-xs text-slate-100">{member.name}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">@{member.nametag}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleUnlinkMember(member.id, member.name)}
                    className="p-2 text-rose-450 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="Unlink Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
