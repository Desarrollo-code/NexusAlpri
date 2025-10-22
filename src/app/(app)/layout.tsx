// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, useSidebar, SidebarProvider } from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { useAuth } from '@/contexts/auth-context';
import { TourGuide } from '@/components/tour/tour-guide';
import { TourProvider, useTour } from '@/contexts/tour-context';
import { AppWatermark } from '@/components/layout/app-watermark';
import { SidebarHeader } from '@/components/layout/sidebar-header';
import { Toaster } from '@/components/ui/toaster';
import { TitleProvider } from '@/contexts/title-context';
import { useTheme } from 'next-themes';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isCollapsed } = useSidebar();
  const { isTourActive, steps, currentStepIndex, nextStep, stopTour } = useTour();
  const { settings, logout, user } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // Aplicar el tema del usuario al montar el layout privado
  React.useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    } else {
      setTheme('light'); // O el tema por defecto para usuarios sin preferencia
    }
  }, [user, setTheme]);

  const handleIdleLogout = React.useCallback(() => {
    logout();
    toast({ title: "Sesión Expirada", description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.", variant: "destructive" });
  }, [logout, toast]);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes ?? 20;
  const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

  useIdleTimeout(handleIdleLogout, idleTimeoutMinutes, isIdleTimeoutEnabled);

  return (
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar>
          <SidebarHeader />
          <SidebarContent />
          <SidebarFooter />
        </Sidebar>
        <div className={cn(
          "relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out bg-background", 
          !isMobile && (isCollapsed ? "ml-20" : "ml-72")
        )}>
          <TopBar />
          <main className="relative flex-1 overflow-y-auto" style={{ transform: 'translateZ(0)' }}>
            <div className="relative z-10 p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        {isTourActive && (
          <TourGuide
            steps={steps}
            currentStepIndex={currentStepIndex}
            onNext={nextStep}
            onStop={stopTour}
          />
        )}
        <AppWatermark />
        <Toaster />
      </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TitleProvider>
          <TourProvider>
              <AppLayoutContent>{children}</AppLayoutContent>
          </TourProvider>
      </TitleProvider>
    </SidebarProvider>
  );
}
