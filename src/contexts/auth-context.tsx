'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, PlatformSettings } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  settings: PlatformSettings | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateSettings: (settingsData: Partial<PlatformSettings>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultSettings: PlatformSettings = {
    platformName: 'NexusAlpri',
    allowPublicRegistration: false,
    enableEmailNotifications: true,
    require2faForAdmins: true,
    idleTimeoutMinutes: 30,
    enableIdleTimeout: true,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: true,
    resourceCategories: ["General", "Políticas", "Guías", "Manuales", "Videos"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSessionAndSettings = useCallback(async () => {
    // No need to fetch if we are on a public route already and not logged in
    const isPublicPath = ['/sign-in', '/sign-up'].some(p => pathname.startsWith(p));
    if (!user && isPublicPath) {
        setIsLoading(false);
        // Still fetch settings for public pages
        if (!settings) {
            try {
                const settingsResponse = await fetch('/api/settings', { cache: 'no-store' });
                if (settingsResponse.ok) {
                    setSettings(await settingsResponse.json());
                } else {
                    setSettings(defaultSettings);
                }
            } catch (e) {
                setSettings(defaultSettings);
            }
        }
        return;
    }
    
    setIsLoading(true);
    try {
        const [userResponse, settingsResponse] = await Promise.all([
            fetch('/api/auth/me', { cache: 'no-store' }),
            fetch('/api/settings', { cache: 'no-store' })
        ]);

        if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData.user);
        } else {
            setUser(null);
        }

        if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setSettings(settingsData);
        } else {
            setSettings(defaultSettings);
        }

    } catch (error) {
      console.error('Failed to fetch session or settings:', error);
      setUser(null);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, user, settings]);

  useEffect(() => {
    fetchSessionAndSettings();
  }, [fetchSessionAndSettings]);

  const login = (userData: User) => {
    setUser(userData);
    const params = new URLSearchParams(window.location.search);
    const redirectedFrom = params.get('redirectedFrom');
    router.push(redirectedFrom || '/dashboard');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
    } catch(e) {
      console.error("Logout failed", e);
    } finally {
      setUser(null);
      router.push('/sign-in');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const updateSettings = (settingsData: Partial<PlatformSettings>) => {
    setSettings(prev => prev ? { ...prev, ...settingsData } : defaultSettings);
  };
  
   if (isLoading) {
     return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
   }

  return (
    <AuthContext.Provider value={{ user, settings, isLoading, login, logout, updateUser, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
