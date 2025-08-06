
// AppLayout-enhanced.tsx 🌈 Visual creativo & juvenil

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TopBar } from '@/components/layout/top-bar';
import { Separator } from '@/components/ui/separator';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { isMobile, isCollapsed } = useSidebar();

  const handleIdleLogout = React.useCallback(() => {
    if (user) {
      logout();
      toast({
        title: "Sesión Expirada",
        description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.",
        variant: "destructive",
      });
    }
  }, [logout, toast, user]);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes || 20;
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
    <>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </Sidebar>

      <div
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
          !isMobile && (isCollapsed ? "lg:ml-20" : "lg:ml-72")
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          {children}
        </main>
      </div>
    </>
  );
}

const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex h-screen bg-background text-foreground">
      <AppLayout>{children}</AppLayout>
    </div>
  </SidebarProvider>
);

export default AppLayoutWrapper;
