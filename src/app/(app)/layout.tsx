// src/app/(app)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';


function IdleTimeoutDialog({ isOpen, onStay, countdown }: { isOpen: boolean, onStay: () => void, countdown: number }) {
  return (
    <AlertDialog open={isOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <AlertDialogTitle className="text-center">¿Sigues ahí?</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                    Tu sesión está a punto de cerrarse por inactividad.
                    <br />
                    La sesión se cerrará en <span className="font-bold">{countdown}</span> segundos.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-center gap-4">
                <Button onClick={onStay} className="w-full">Continuar Sesión</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isCollapsed } = useSidebar();
  const { isTourActive, steps, currentStepIndex, nextStep, stopTour } = useTour();
  const { settings, logout, user } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const [isIdlePromptVisible, setIsIdlePromptVisible] = useState(false);
  const [promptCountdown, setPromptCountdown] = useState(60);

  const handleIdleLogout = React.useCallback(() => {
    setIsIdlePromptVisible(false);
    logout();
    toast({ title: "Sesión Expirada", description: "Tu sesión se ha cerrado por inactividad.", variant: "destructive" });
  }, [logout, toast]);

  const handleIdlePrompt = React.useCallback(() => {
    setIsIdlePromptVisible(true);
    setPromptCountdown(60);
  }, []);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes ?? 20;
  const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

  const { stay } = useIdleTimeout(handleIdleLogout, handleIdlePrompt, idleTimeoutMinutes, 60, isIdleTimeoutEnabled);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isIdlePromptVisible && promptCountdown > 0) {
      interval = setInterval(() => {
        setPromptCountdown(prev => prev - 1);
      }, 1000);
    } else if (isIdlePromptVisible && promptCountdown === 0) {
      handleIdleLogout();
    }
    return () => clearInterval(interval);
  }, [isIdlePromptVisible, promptCountdown, handleIdleLogout]);


  const handleStay = () => {
    setIsIdlePromptVisible(false);
    stay();
  };
  
  React.useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    } else {
      setTheme('light');
    }
  }, [user, setTheme]);

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
            <div className="relative z-10 p-4 md:p-5 lg:p-6">
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
        <IdleTimeoutDialog isOpen={isIdlePromptVisible} onStay={handleStay} countdown={promptCountdown}/>
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
