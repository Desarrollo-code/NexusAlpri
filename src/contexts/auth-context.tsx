
'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ThemeName } from '@/lib/themes';

interface AuthContextType {
  user: User | null;
  settings: PlatformSettings | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedData: Partial<User>) => void;
  updateSettings: (updatedData: Partial<PlatformSettings>) => void;
  saveTheme: (themeName: ThemeName) => Promise<void>;
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

  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, userRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/auth/me'),
      ]);

      const settingsData = settingsRes.ok ? await settingsRes.json() : DEFAULT_SETTINGS;
      setSettings(settingsData);
      
      const userData = userRes.ok ? (await userRes.json()).user : null;
      setUser(userData);
    } catch (error) {
      console.error("An unexpected error occurred during session initialization:", error);
      setUser(null);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);
  
  const saveTheme = useCallback(async (themeName: ThemeName) => {
    if (!user) return;
    try {
      // Optimistically update local state for immediate UI feedback
      updateUser({ colorTheme: themeName });

      const response = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colorTheme: themeName }),
      });
      const updatedUser = await response.json();
      if (!response.ok) {
        throw new Error(updatedUser.message);
      }

      // Sync with the final state from the server to ensure consistency
      updateUser(updatedUser);
    } catch (error) {
        console.error("Failed to save theme settings:", error);
        // Revert optimistic update on failure
        fetchSessionData(); 
    }
  }, [user, fetchSessionData]);


  const login = useCallback((userData: User) => {
    setUser(userData);
    const params = new URLSearchParams(window.location.search);
    const redirectedFrom = params.get('redirectedFrom');
    router.replace(redirectedFrom || '/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Failed to call logout API", error);
    } finally {
      setUser(null);
      window.location.href = '/sign-in';
    }
  }, []);
  
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

  const contextValue = useMemo(() => ({
    user,
    settings,
    login,
    logout,
    isLoading,
    updateUser,
    updateSettings,
    saveTheme,
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings, saveTheme]);

  if (isLoading && typeof window !== 'undefined' && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
