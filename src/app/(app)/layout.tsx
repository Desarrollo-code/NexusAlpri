// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, useSidebar, SidebarProvider } from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import Image from 'next/image';
import { SidebarHeader } from '@/components/layout/sidebar-header';
import { TourProvider, useTour } from '@/contexts/tour-context';
import { TourGuide } from '@/components/tour/tour-guide';
import { Toaster } from '@/components/ui/toaster';
import AppWatermark from '@/components/layout/app-watermark';
import { TitleProvider } from '@/contexts/title-context';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isCollapsed } = useSidebar();
  const { isTourActive, steps, currentStepIndex, nextStep, stopTour } = useTour();
  const { settings, logout } = useAuth();
  const { toast } = useToast();

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
        <Toaster />
        <AppWatermark />
      </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Envolvemos todo el layout privado con los providers del lado del cliente.
  return (
    <AuthProvider>
        <TitleProvider>
            <SidebarProvider>
              <TourProvider>
                <AppLayoutContent>{children}</AppLayoutContent>
              </TourProvider>
            </SidebarProvider>
        </TitleProvider>
    </AuthProvider>
  );
}
