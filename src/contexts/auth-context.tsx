// src/contexts/auth-context.tsx
'use client';

import type { User, PlatformSettings } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { supabaseBrowserClient } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  settings: PlatformSettings | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedData: Partial<User>) => void;
  updateSettings: (updatedData: Partial<PlatformSettings>) => void;
  signInWithGoogle: () => Promise<void>;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    platformName: "NexusAlpri",
    allowPublicRegistration: true,
    enableEmailNotifications: true,
    emailWhitelist: "",
    resourceCategories: ["General", "Recursos Humanos", "Ventas"],
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: true,
    enableIdleTimeout: true,
    idleTimeoutMinutes: 20,
    require2faForAdmins: false,
    publicPagesBgUrl: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setTheme } = useTheme();

  const fetchSessionData = useCallback(async () => {
    console.log('[AuthContext] Iniciando fetchSessionData...');
    try {
        const [settingsRes, userRes] = await Promise.all([
            fetch('/api/settings', { cache: 'no-store' }),
            fetch('/api/auth/me', { cache: 'no-store' }),
        ]);

        const settingsData = settingsRes.ok ? await settingsRes.json() : DEFAULT_SETTINGS;
        setSettings(settingsData);
        console.log('[AuthContext] Configuración cargada:', settingsData.platformName);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
          console.log('[AuthContext] Sesión de usuario encontrada:', userData.user.email);
        } else {
          setUser(null);
          console.log('[AuthContext] No se encontró sesión de usuario (status: ' + userRes.status + ').');
        }
    } catch (error) {
        console.error("[AuthContext] Fallo al obtener los datos de la sesión:", error);
        setUser(null);
        setSettings(DEFAULT_SETTINGS);
    } finally {
        setIsLoading(false);
        console.log('[AuthContext] finalizó fetchSessionData.');
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    const params = new URLSearchParams(window.location.search);
    const redirectedFrom = params.get('redirectedFrom');
    router.replace(redirectedFrom || '/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        fetch('/api/auth/logout', { method: 'POST' }),
        supabaseBrowserClient.auth.signOut(),
      ]);
    } catch (error) {
      console.error("Fallo al llamar a la API de logout o Supabase", error);
    } finally {
      setUser(null);
      setTheme('dark'); 
      router.push('/sign-in');
    }
  }, [router, setTheme]);

  const signInWithGoogle = async () => {
    const { error } = await supabaseBrowserClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };
  
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
    signInWithGoogle
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings]);

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
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
