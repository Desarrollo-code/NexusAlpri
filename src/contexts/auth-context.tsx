
'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTheme as useNextTheme } from 'next-themes';
import { getTheme, type ColorTheme, isLight } from '@/lib/themes';

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
  setTheme: (theme: string) => void;
  customTheme: ColorTheme;
  setCustomTheme: (theme: ColorTheme) => void;
  applyTheme: (themeName: string, customColors?: any) => void;
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
  
  // Theme state now lives inside the AuthProvider
  const { setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [theme, _setTheme] = useState('corporate-blue');
  const [customTheme, _setCustomTheme] = useState<ColorTheme>(getTheme('custom'));

  const applyTheme = useCallback((themeName: string, customColors?: any) => {
    const themeToApply = themeName === 'custom' && customColors ? { name: 'custom', label: 'Personalizado', colors: customColors } : getTheme(themeName);
    
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        Object.entries(themeToApply.colors).forEach(([key, value]) => {
            const cssVar = `--${key}`;
            root.style.setProperty(cssVar, value);
        });

        const newResolvedTheme = isLight(themeToApply.colors.background) ? 'light' : 'dark';
        if (resolvedTheme !== newResolvedTheme) {
            setNextTheme(newResolvedTheme);
        }
    }
    
    _setTheme(themeName);
    if (themeName === 'custom' && customColors) {
        _setCustomTheme(themeToApply);
    }
  }, [resolvedTheme, setNextTheme]);


  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, userRes] = await Promise.all([
        fetch('/api/settings').catch(e => {
            console.error("Network error fetching settings:", e);
            return { ok: false, json: () => Promise.resolve({ message: "Network error" }) } as any as Response;
        }),
        fetch('/api/auth/me').catch(e => {
            console.error("Network error fetching user session:", e);
            return { ok: false, json: () => Promise.resolve({ user: null }) } as any as Response;
        }),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      } else {
        console.warn('Could not fetch platform settings, using default values. This may be due to a database connection issue.');
        setSettings(DEFAULT_SETTINGS);
      }

      if (userRes.ok) {
        const { user: userData } = await userRes.json();
        setUser(userData);
        if (userData) {
          applyTheme(userData.colorTheme || 'corporate-blue', userData.customThemeColors);
        } else {
          applyTheme('corporate-blue');
        }
      } else {
        setUser(null);
        applyTheme('corporate-blue');
      }
    } catch (error) {
      console.error("An unexpected error occurred during session initialization:", error);
      setUser(null);
      setSettings(DEFAULT_SETTINGS);
      applyTheme('corporate-blue');
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    if (userData) {
        applyTheme(userData.colorTheme || 'corporate-blue', userData.customThemeColors);
    }
    const params = new URLSearchParams(window.location.search);
    const redirectedFrom = params.get('redirectedFrom');
    router.replace(redirectedFrom || '/dashboard');
  }, [router, applyTheme]);

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
      const newUser = { ...prevUser, ...updatedData };
      // If theme was part of the update, re-apply it
      if (updatedData.colorTheme || updatedData.customThemeColors) {
          applyTheme(newUser.colorTheme || 'corporate-blue', newUser.customThemeColors);
      }
      return newUser;
    });
  }, [applyTheme]);

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
    setTheme: _setTheme,
    customTheme,
    setCustomTheme: _setCustomTheme,
    applyTheme,
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings, theme, customTheme, applyTheme]);

  if (isLoading) {
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
