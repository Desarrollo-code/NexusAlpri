// AppLayout-enhanced.tsx 🌈 Visual creativo & juvenil

'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TitleProvider } from '@/contexts/title-context';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { isMobile, isCollapsed } = useSidebar();
  const { theme } = useTheme();

  const handleIdleLogout = React.useCallback(() => {
    logout();
    toast({
      title: "Sesión Expirada",
      description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.",
      variant: "destructive",
    });
  }, [logout, toast]);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes ?? 20;
  const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

  useIdleTimeout(handleIdleLogout, idleTimeoutMinutes, isIdleTimeoutEnabled);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TitleProvider>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </Sidebar>
      <div
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
          !isMobile && (isCollapsed ? "ml-20" : "ml-72")
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-muted/30">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </TitleProvider>
  );
}

const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useTheme();
    return (
        <SidebarProvider>
            <div className={cn("flex h-screen bg-background text-foreground", theme)}>
                <AppLayout>{children}</AppLayout>
            </div>
        </SidebarProvider>
    );
};

export default AppLayoutWrapper;
