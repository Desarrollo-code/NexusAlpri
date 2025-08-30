// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, useSidebar, SidebarProvider } from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import Image from 'next/image';
import { SidebarHeader } from '@/components/layout/sidebar-header';
import { TourProvider, useTour } from '@/contexts/tour-context';
import { TourGuide } from '@/components/tour/tour-guide';
import { ThemeProvider } from '@/components/theme-provider';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { settings } = useAuth();
  const { isMobile, isCollapsed } = useSidebar();
  const { isTourActive, steps, currentStepIndex, nextStep, stopTour } = useTour();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </Sidebar>
      <div className={cn("relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out", !isMobile && (isCollapsed ? "ml-20" : "ml-72"))}>
        <TopBar />
        <main className="flex-1 overflow-y-auto relative bg-background">
          <DecorativeHeaderBackground />
          <div className="relative z-10 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      {settings?.watermarkUrl && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <Image src={settings.watermarkUrl} alt="Alprigrama Watermark" width={60} height={60} className="opacity-50" data-ai-hint="logo company" priority style={{ width: 'auto', height: 'auto' }}/>
        </div>
      )}
      {isTourActive && (
        <TourGuide
          steps={steps}
          currentStepIndex={currentStepIndex}
          onNext={nextStep}
          onStop={stopTour}
        />
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, logout, isLoading } = useAuth();
  const { toast } = useToast();

  const handleIdleLogout = React.useCallback(() => {
    logout();
    toast({ title: "Sesión Expirada", description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.", variant: "destructive" });
  }, [logout, toast]);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes ?? 20;
  const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

  useIdleTimeout(handleIdleLogout, idleTimeoutMinutes, isIdleTimeoutEnabled);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <ColorfulLoader />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <TourProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </TourProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
