
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
  SidebarHeader
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { LogOut, Loader2, ChevronsLeft } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TopBar } from '@/components/layout/top-bar';

function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, settings, logout, isLoading } = useAuth();
    const { toast } = useToast();
    const { state, toggleSidebar } = useSidebar();

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
            <div className="flex h-screen w-screen items-center justify-center bg-background">
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
        <div className="flex h-screen bg-muted/30 dark:bg-gray-900/80">
            <Sidebar>
                <SidebarHeader>
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-black-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                           <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={40} height={40} className="w-auto h-auto" data-ai-hint="logo letter" />
                        </div>
                        <span className="sidebar-text text-white text-xl font-bold">NexusAlpri</span>
                      </div>
                </SidebarHeader>

                <SidebarContent />
                
                <SidebarFooter>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg overflow-hidden">
                         <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={user.avatar || undefined} alt={user.name || 'Avatar de usuario'} />
                            <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="sidebar-text flex-1 overflow-hidden">
                            <p className="text-white text-sm font-medium truncate">{user.name}</p>
                            <p className="text-gray-400 text-xs capitalize truncate">{user.role.toLowerCase()}</p>
                        </div>
                    </div>
                    <Button onClick={logout} className="w-full text-red-300 hover:text-red-200 hover:bg-red-900/20 justify-start gap-3 p-3 h-auto">
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <span className="sidebar-text font-medium">Cerrar Sesión</span>
                    </Button>
                </SidebarFooter>
            </Sidebar>

            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "fixed top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/70 backdrop-blur-sm text-foreground/80 hover:bg-background hover:text-foreground border transition-all duration-300 ease-in-out z-50",
                    "hover:scale-110 active:scale-95 hidden lg:flex",
                    state === "expanded" ? "left-[calc(theme(width.72)-1.125rem)]" : "left-[calc(theme(width.20)-1.125rem)]"
                )}
                onClick={toggleSidebar}
                aria-label="Alternar barra lateral"
            >
                <ChevronsLeft className={cn("h-5 w-5 transition-transform", state === "collapsed" && "rotate-180")} />
            </Button>
            
            <div className={cn(
                  "relative flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
                  "lg:ml-72",
                  state === 'collapsed' && "lg:ml-20"
                )}>
                  <TopBar/>
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                  </main>
            </div>
        </div>
    )
}

const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider>
        <AppLayout>{children}</AppLayout>
    </SidebarProvider>
);

export default AppLayoutWrapper;
