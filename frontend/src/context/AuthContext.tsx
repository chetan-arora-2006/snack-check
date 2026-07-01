import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

export interface Biometrics {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
}

export interface DailyLimits {
  calories: number;
  sugar_g: number;
  sodium_mg: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  allergies: string[];
  medical_conditions: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  allergies: string[];
  health_goals: string[];
  theme: string;
  biometrics?: Biometrics;
  medical_conditions: string[];
  daily_limits?: DailyLimits;
  family_members: FamilyMember[];
  nametag?: string;
  linked_family_members: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: loginPassword) => Promise<void>;
  signup: (name: string, email: string, password: signupPassword) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeMemberId: string | null;
  setActiveMemberId: (id: string | null) => void;
}

type loginPassword = string;
type signupPassword = string;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sc_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('sc_token');
    setToken(null);
    setUser(null);
    setActiveMemberId(null);
  }, []);

  // Synchronize token state with local storage and fetch profile
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            if (data.theme) {
              setTheme(data.theme);
              applyTheme(data.theme);
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
        }
      } else {
        // Apply default local storage theme if not logged in
        const savedTheme = localStorage.getItem('sc_theme') as 'light' | 'dark' || 'dark';
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token, logout]);

  const applyTheme = (t: 'light' | 'dark') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sc_theme', t);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    if (user) {
      updateProfile({ theme: newTheme }).catch((e) =>
        console.error("Failed to sync theme to DB:", e)
      );
    }
  };

  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errData.detail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [token, logout]);

  const login = async (email: string, password: loginPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('sc_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      if (data.user.theme) {
        setTheme(data.user.theme);
        applyTheme(data.user.theme);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: signupPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Signup failed' }));
        throw new Error(errData.detail || 'Email already registered');
      }

      const data = await response.json();
      localStorage.setItem('sc_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Google login failed' }));
        throw new Error(errData.detail || 'Verification error');
      }

      const data = await response.json();
      localStorage.setItem('sc_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      if (data.user.theme) {
        setTheme(data.user.theme);
        applyTheme(data.user.theme);
      }
    } finally {
      setIsLoading(false);
    }
  };

  

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updated = await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setUser(updated);
    } catch (err) {
      console.error("Profile update failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      loginWithGoogle,
      logout,
      updateProfile,
      apiFetch,
      theme,
      toggleTheme,
      activeMemberId,
      setActiveMemberId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
