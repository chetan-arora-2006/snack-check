import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import { User, Mail, AtSign, Camera, Check, AlertCircle, Sparkles, Moon, Sun } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, theme, toggleTheme, apiFetch } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [nametag, setNametag] = useState(user?.nametag || '');
  const [avatar, setAvatar] = useState(user?.picture || '');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        setSuccess('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    const trimmedTag = nametag.trim().toLowerCase().replace('@', '');

    if (!trimmedName) {
      setError('Name cannot be empty');
      setSaving(false);
      return;
    }

    try {
      // 1. If nametag changed, verify and update it first
      if (trimmedTag !== user?.nametag) {
        if (trimmedTag) {
          await apiFetch('/api/user/nametag', {
            method: 'POST',
            body: JSON.stringify({ nametag: trimmedTag }),
          });
        } else {
          // If clearing nametag
          await apiFetch('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ nametag: null }),
          });
        }
      }

      // 2. Update name and avatar picture
      await updateProfile({
        name: trimmedName,
        picture: avatar || undefined,
      });

      setSuccess('Profile details updated successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile settings. The nametag may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          My Account
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your public profile identity, avatar picture, unique nametag, and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Card */}
        <div className="md:col-span-1">
          <Card className="p-6 border border-slate-850 flex flex-col items-center text-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Profile Picture</h3>
            
            <div className="relative group cursor-pointer mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-500/20 bg-slate-900/60 flex items-center justify-center shadow-lg">
                {avatar ? (
                  <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
              
              <label className="absolute inset-0 bg-black/65 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">Upload Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                />
              </label>
            </div>

            <p className="font-extrabold text-sm text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{user?.email}</p>
            
            {user?.nametag && (
              <span className="text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full mt-3 block">
                @{user.nametag}
              </span>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-850 w-full text-left space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Account Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <p className="text-xs font-extrabold text-indigo-400">{user?.linked_family_members?.length || 0}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Family Links</p>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <p className="text-xs font-extrabold text-emerald-400">{user?.allergies?.length || 0}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Allergies</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Account settings form */}
        <div className="md:col-span-2">
          <Card className="p-6 border border-slate-850">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-850 pb-3">Profile Information</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider">Display Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-slate-700 text-sm rounded-xl pl-10 pr-4 py-3 outline-none text-slate-200 transition-all"
                  />
                </div>
              </div>

              {/* Nametag Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-355 uppercase tracking-wider">Unique Nametag</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                    <AtSign className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    pattern="^[a-zA-Z0-9_]{3,15}$"
                    title="3-15 alphanumeric characters or underscores"
                    value={nametag}
                    onChange={(e) => setNametag(e.target.value)}
                    placeholder="e.g. chetan12"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-slate-700 text-sm rounded-xl pl-10 pr-4 py-3 outline-none text-slate-200 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Your custom tag for profile sharing. Must be unique, 3-15 characters, containing letters, numbers, or underscores.
                </p>
              </div>

              {/* Email (Read only) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider">Email Address</label>
                <div className="relative opacity-60">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-950 border border-slate-850 text-sm rounded-xl pl-10 pr-4 py-3 outline-none text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Your email is managed by your sign-in provider and cannot be changed here.
                </p>
              </div>

              {/* Theme Settings inline */}
              <div className="space-y-3 pt-4 border-t border-slate-850">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider block">App Layout Theme</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-xs font-bold transition-all ${
                      theme === 'dark' 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-600/5' 
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-xs font-bold transition-all ${
                      theme === 'light' 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-600/5' 
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light Theme
                  </button>
                </div>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="flex items-center gap-2.5 text-xs text-rose-500 bg-rose-500/5 p-3.5 border border-rose-500/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3.5 border border-emerald-500/10 rounded-xl">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/10 text-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Saving changes...' : 'Save Profile Details'}
              </button>

            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
