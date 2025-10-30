// src/contexts/auth-context.tsx
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
    setIsLoading(true);
    try {
        const [settingsRes, userRes] = await Promise.allSettled([
            fetch('/api/settings', { cache: 'no-store' }),
            fetch('/api/auth/me', { cache: 'no-store' })
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
            setSettings(await settingsRes.value.json());
        } else {
            console.warn("[AuthContext] No se pudo cargar la configuración, usando valores por defecto.");
            setSettings(DEFAULT_SETTINGS);
        }
        
        if (userRes.status === 'fulfilled' && userRes.value.ok) {
            const userData = await userRes.value.json();
            setUser(userData.user);
        } else {
            setUser(null);
        }
    } catch (error) {
        console.error("[AuthContext] Excepción al obtener los datos de la sesión:", error);
        setUser(null);
        setSettings(DEFAULT_SETTINGS);
    } finally {
        setIsLoading(false);
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

  const logout = useCallback(() => {
    // Fire and forget the API call
    fetch('/api/auth/logout', { method: 'POST' }).catch(err => console.error("Fallo al llamar a la API de logout en segundo plano:", err));
    
    // Perform immediate client-side changes
    setUser(null);
    setTheme('light'); 
    router.push('/sign-in');
  }, [router, setTheme]);
  
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      if (updatedData.theme && updatedData.theme !== prevUser.theme) {
          setTheme(updatedData.theme);
      }
      return { ...prevUser, ...updatedData };
    });
  }, [setTheme]);

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
  }), [user, settings, login, logout, isLoading, updateUser, updateSettings]);

  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
          <ColorfulLoader />
        </div>
      )
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
