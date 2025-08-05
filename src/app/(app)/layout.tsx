
'use client';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
  SidebarHeader,
  SidebarToggle
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { LogOut, Loader2, ChevronsLeft } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TopBar } from '@/components/layout/top-bar';
import { Separator } from '@/components/ui/separator';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();

  const handleIdleLogout = React.useCallback(() => {
    if (user) {
      logout();
      toast({
        title: "Sesión Expirada",
        description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.",
        variant: "destructive"
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

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <Image
                    src="/uploads/images/logo-letter.png"
                    alt="NexusAlpri Logo"
                    width={28}
                    height={28}
                    className="w-auto h-auto"
                />
            </div>
            <span className="sidebar-text text-sidebar-foreground text-xl font-bold font-headline">NexusAlpri</span>
          </div>
        </SidebarHeader>

        <SidebarContent />

        <SidebarFooter>
          <div className="flex items-center gap-3 mb-4 p-3 bg-black/20 rounded-lg overflow-hidden">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar || undefined} alt={user.name || 'Avatar de usuario'} />
              <AvatarFallback className="bg-gradient-to-br from-chart-2 to-chart-1 text-white font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="sidebar-text flex-1 overflow-hidden">
              <p className="text-sidebar-foreground text-sm font-medium truncate">{user.name}</p>
              <p className="text-muted-foreground text-xs capitalize truncate">{user.role.toLowerCase()}</p>
            </div>
          </div>
           <Separator className="my-2 bg-sidebar-border" />
           <div className="flex items-center justify-between">
              <Button
                onClick={logout}
                variant="ghost"
                className="flex-grow text-sidebar-foreground hover:text-sidebar-foreground hover:bg-black/20 justify-start gap-3 p-3 h-auto"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="sidebar-text font-medium">Cerrar Sesión</span>
              </Button>
              <SidebarToggle className="hidden lg:flex" />
           </div>
        </SidebarFooter>
      </Sidebar>

      <div
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
          "lg:ml-72",
          state === 'collapsed' && "lg:ml-20"
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
