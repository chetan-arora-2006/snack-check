import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Camera, 
  History, 
  UserRound, 
  LogOut, 
  Settings, 
  Activity, 
  Sun, 
  Moon, 
  MessageSquare,
  UserPlus,
  User,
  Search
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { 
    user, 
    logout, 
    theme, 
    toggleTheme, 
    updateProfile
  } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        try {
          await updateProfile({ picture: base64String });
        } catch (err) {
          console.error("Failed to upload profile picture:", err);
          alert("Failed to upload profile picture. Please try a smaller image (under 1MB).");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner', icon: Camera },
    { id: 'catalog', label: 'Catalog', icon: Search },
    { id: 'history', label: 'History', icon: History },
    { id: 'doctors', label: 'Consultants', icon: UserRound },
    { id: 'chatbot', label: 'Coach Chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Floating Top Navbar (IntelMeet Style) */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-4 md:px-8 sticky top-0 z-40">
        <header className="glass rounded-full px-6 py-3 flex items-center justify-between border border-slate-850 shadow-md">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
                SnackCheck
              </h1>
              <p className="text-[9px] text-slate-400 tracking-widest uppercase font-semibold leading-none">Nutritional Evaluator</p>
            </div>
          </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Action & Switcher Controls */}
        <div className="flex items-center gap-3">

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile dropdown badge */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 pr-4 transition-all duration-200"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-xl object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate hidden md:inline">{user.name}</span>
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 z-25 animate-in fade-in duration-150">
                      
                      {/* Profile Card Header */}
                      <div className="px-3 py-2.5 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-2">
                        <div className="relative group cursor-pointer mb-2">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-base border border-indigo-200 dark:border-slate-800 shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            Edit
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </label>
                        </div>
                        <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{user.email}</p>
                        {user.nametag ? (
                          <span className="text-[9px] font-extrabold bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mt-1.5 select-all">
                            @{user.nametag}
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400 italic mt-1.5">No nametag created</span>
                        )}
                      </div>

                      {/* Dropdown Options */}
                      <button
                        onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                          activeTab === 'profile'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        } transition-colors`}
                      >
                        <User className="w-4 h-4 text-slate-400" /> My Profile
                      </button>

                      <button
                        onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                          activeTab === 'settings'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        } transition-colors`}
                      >
                        <Settings className="w-4 h-4 text-slate-400" /> My Settings
                      </button>

                      <button
                        onClick={() => { setActiveTab('family'); setProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                          activeTab === 'family'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        } transition-colors`}
                      >
                        <UserRound className="w-4 h-4 text-slate-400" /> Family Health
                      </button>

                      <button
                        onClick={() => { setActiveTab('invite'); setProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                          activeTab === 'invite'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        } transition-colors`}
                      >
                        <UserPlus className="w-4 h-4 text-slate-400" /> Invite Members
                      </button>

                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-600 dark:text-rose-455 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-850 animate-pulse" />
            )}
          </div>
        </div>
      </header>
    </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-2 flex items-center justify-around z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
