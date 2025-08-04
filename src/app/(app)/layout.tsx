// src/app/(app)/layout.tsx
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
import { LogOut, Loader2, ChevronsRight, Search } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { TopBar } from '@/components/layout/top-bar';

// Este componente envuelve toda la lógica del layout autenticado.
function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, settings, logout, isLoading } = useAuth();
    const { toast } = useToast();
    // useSidebar debe ser llamado dentro de un componente que es hijo de SidebarProvider
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
    
    return (
        <div className="flex h-screen bg-muted/30 dark:bg-gray-900/80">
            <Sidebar>
                <SidebarHeader>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                           <Image src="/uploads/images/logo-letter.png" alt="NexusAlpri Logo" width={24} height={24} data-ai-hint="logo letter" />
                        </div>
                        <span className="sidebar-text text-white text-xl font-bold">NexusAlpri</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white sidebar-text" onClick={toggleSidebar} aria-label="Alternar barra lateral">
                           <ChevronsRight className={cn("h-5 w-5 transition-transform", state === "expanded" && "rotate-180")} />
                       </Button>
                </SidebarHeader>

                 <div className="p-4 sidebar-text">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input type="text" id="sidebar-search" name="sidebar-search" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-9" />
                    </div>
                  </div>
                
                <SidebarContent />
                
                <SidebarFooter>
                    <div className="sidebar-text flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} alt={user.name || 'Avatar de usuario'} />
                            <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white text-sm font-medium truncate">{user.name}</p>
                        <p className="text-gray-400 text-xs capitalize truncate">{user.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <Button onClick={logout} className="w-full text-red-300 hover:text-red-200 hover:bg-red-900/20 justify-start gap-3 p-3 h-auto">
                        <LogOut className="h-5 w-5" />
                        <span className="sidebar-text font-medium">Cerrar Sesión</span>
                    </Button>
                </SidebarFooter>
            </Sidebar>
            
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
              state === 'expanded' ? "lg:ml-72" : "lg:ml-20"
            )}>
              <TopBar>
                <Button variant="ghost" size="icon" className="h-9 w-9 hidden lg:flex text-muted-foreground hover:text-foreground" onClick={toggleSidebar} aria-label="Alternar barra lateral">
                    <ChevronsRight className={cn("h-5 w-5 transition-transform", state === "expanded" && "rotate-180")} />
                </Button>
              </TopBar>
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
        </div>
    )
}

// Este componente Wrapper es crucial para que useSidebar() funcione correctamente.
const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider>
        <AppLayout>{children}</AppLayout>
    </SidebarProvider>
);

export default AppLayoutWrapper;