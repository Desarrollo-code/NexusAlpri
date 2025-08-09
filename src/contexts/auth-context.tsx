
'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AuthContextType {
  user: User | null;
  settings: PlatformSettings | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedData: Partial<User>) => void;
  updateSettings: (updatedData: Partial<PlatformSettings>) => void;
  updateTheme: (newTheme: string) => Promise<void>;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    platformName: "NexusAlpri",
    allowPublicRegistration: true,
    enableEmailNotifications: true,
    resourceCategories: [],
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: true,
    enableIdleTimeout: true,
    idleTimeoutMinutes: 20,
    require2faForAdmins: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const fetchSessionData = async () => {
        try {
            const [settingsRes, userRes] = await Promise.all([
                fetch('/api/settings'),
                fetch('/api/auth/me'),
            ]);

            const settingsData = settingsRes.ok ? await settingsRes.json() : DEFAULT_SETTINGS;
            setSettings(settingsData);
            
            if (userRes.ok) {
              const userData = await userRes.json();
              setUser(userData.user);
              if (userData.user?.theme) {
                setTheme(userData.user.theme);
              }
            } else {
              setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch session data:", error);
            setUser(null);
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchSessionData();
    // The dependency array is intentionally empty to run this effect only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    if (userData.theme) {
        setTheme(userData.theme);
    }
    const params = new URLSearchParams(window.location.search);
    const redirectedFrom = params.get('redirectedFrom');
    router.replace(redirectedFrom || '/dashboard');
  }, [router, setTheme]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Failed to call logout API", error);
    } finally {
      setUser(null);
      setTheme('dark'); // Reset to default theme on logout
      router.push('/sign-in');
    }
  }, [router, setTheme]);
  
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...updatedData };
    });
  }, []);

  const updateSettings = useCallback((updatedData: Partial<PlatformSettings>) => {
    setSettings(prevSettings => {
      if (!prevSettings) return null;
      return { ...prevSettings, ...updatedData };
    });
  }, []);

  const updateTheme = useCallback(async (newTheme: string) => {
    if (!user) return;
    // Optimistic UI update
    setTheme(newTheme);
    updateUser({ theme: newTheme });

    try {
      const res = await fetch(`/api/users/${user.id}/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
      if (!res.ok) {
        // Revert on failure
        setTheme(user.theme || 'dark');
        updateUser({ theme: user.theme });
        console.error('Failed to save theme to database');
      }
    } catch (error) {
       // Revert on failure
       setTheme(user.theme || 'dark');
       updateUser({ theme: user.theme });
       console.error('Error saving theme:', error);
    }
  }, [user, setTheme, updateUser]);


  const contextValue = useMemo(() => ({
    user,
    settings,
    login,
    logout,
    isLoading,
    updateUser,
    updateSettings,
    updateTheme,
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings, updateTheme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
