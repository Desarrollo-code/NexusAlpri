'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ColorfulLoader } from '@/components/ui/colorful-loader';

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
    resourceCategories: ["General", "Recursos Humanos", "Ventas"],
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

  const fetchSessionData = useCallback(async () => {
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
  }, [setTheme]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

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
    // This will trigger a re-render in DynamicThemeProvider
  }, []);

  const updateTheme = useCallback(async (newTheme: string) => {
    if (!user) return;
    updateUser({ theme: newTheme });
    setTheme(newTheme);

    try {
      await fetch(`/api/users/${user.id}/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
       console.error('Error saving theme:', error);
       // Optional: revert optimistic update
       updateUser({ theme: user.theme });
       setTheme(user.theme || 'dark');
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <ColorfulLoader />
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
