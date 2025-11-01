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
            if (userData.user?.theme) {
              setTheme(userData.user.theme);
            }
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

  const logout = useCallback(() => {
    setUser(null);
    setTheme('light');
    
    // Perform server-side logout in the background
    fetch('/api/auth/logout', { method: 'POST' }).catch(err => console.error("Fallo al llamar a la API de logout en segundo plano:", err));
    
    // Force a full page refresh to the sign-in page to clear all state
    window.location.href = '/sign-in';
  }, [setTheme]);
  
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      // El cambio de tema ya se maneja de forma optimista en los componentes que lo llaman.
      // Aquí solo actualizamos el estado del usuario.
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
