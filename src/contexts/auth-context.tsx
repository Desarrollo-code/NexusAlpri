
'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTheme as useNextTheme } from 'next-themes';
import { getTheme, type ColorTheme, isLight, defaultThemes } from '@/lib/themes';

interface AuthContextType {
  user: User | null;
  settings: PlatformSettings | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedData: Partial<User>) => void;
  updateSettings: (updatedData: Partial<PlatformSettings>) => void;
  // Theme properties
  theme: string;
  applyTheme: (themeName: string, customColors?: any) => void;
  saveTheme: (themeName: string, customColors?: any) => Promise<void>;
  customTheme: ColorTheme;
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
  
  const { setTheme: setNextTheme } = useNextTheme();
  const [theme, setTheme] = useState('corporate-blue');
  const [customTheme, setCustomTheme] = useState<ColorTheme>(getTheme('custom'));

  const applyTheme = useCallback((themeName: string, customColors?: any) => {
    let themeToApply = getTheme(themeName);
    if (themeName === 'custom') {
        const finalCustomColors = customColors || user?.customThemeColors || getTheme('custom').colors;
        themeToApply = { ...getTheme('custom'), colors: finalCustomColors as ColorTheme['colors'] };
        setCustomTheme(themeToApply);
    }
    
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        Object.entries(themeToApply.colors).forEach(([key, value]) => {
            const cssVar = `--${key}`;
            root.style.setProperty(cssVar, value);
        });

        const resolvedTheme = isLight(themeToApply.colors.background) ? 'light' : 'dark';
        setNextTheme(resolvedTheme);
    }
    setTheme(themeName);
  }, [setNextTheme, user]);


  const saveTheme = useCallback(async (themeName: string, customColors?: any) => {
    if (!user) return;
    try {
        const payload: Partial<User> = { colorTheme: themeName };
        if (themeName === 'custom') {
            payload.customThemeColors = customColors || customTheme.colors;
        }

        const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const updatedUser = await response.json();
        if (!response.ok) throw new Error(updatedUser.message);

        // Update user context locally, which will trigger theme application via useEffect
        setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);

    } catch (error) {
        console.error("Failed to save theme settings:", error);
    }
  }, [user, customTheme.colors]);

  useEffect(() => {
    const fetchSessionData = async () => {
        setIsLoading(true);
        try {
          const [settingsRes, userRes] = await Promise.all([
            fetch('/api/settings').catch(() => null),
            fetch('/api/auth/me').catch(() => null),
          ]);
    
          const settingsData = settingsRes?.ok ? await settingsRes.json() : DEFAULT_SETTINGS;
          setSettings(settingsData);
          
          const userData = userRes?.ok ? (await userRes.json()).user : null;
          setUser(userData);

        } catch (error) {
          console.error("An unexpected error occurred during session initialization:", error);
          setUser(null);
          setSettings(DEFAULT_SETTINGS);
        } finally {
          setIsLoading(false);
        }
    };
    fetchSessionData();
  }, []);
  
  // Apply theme whenever user data changes
  useEffect(() => {
    if (user) {
        const themeName = user.colorTheme || 'corporate-blue';
        const customColors = user.customThemeColors as ColorTheme['colors'] | null;
        applyTheme(themeName, customColors);
    } else if (!isLoading) {
        // Apply a default theme if user is logged out
        applyTheme('corporate-blue');
    }
  }, [user, isLoading, applyTheme]);


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
    theme,
    applyTheme,
    saveTheme,
    customTheme,
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings, theme, customTheme, applyTheme, saveTheme]);

  if (isLoading && !user && !settings) {
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
