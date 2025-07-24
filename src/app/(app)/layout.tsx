// src/app/(app)/layout.tsx
'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { UserRole, NavItem } from '@/types';
import Link from 'next/link';
import { LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, settings, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    // --- Idle Timeout Logic ---
    const handleIdleLogout = useCallback(() => {
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

    // --- Navigation Logic ---
    const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

    // --- Loading and Auth Check ---
     useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/sign-in');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <SidebarProvider>
             <div className="group/app-layout min-h-screen">
                <Sidebar>
                    <SidebarHeader className="group-data-[state=expanded]:px-4 md:group-data-[state=collapsed]:px-2">
                        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground md:group-data-[state=collapsed]:justify-center">
                            <Image
                                src="/uploads/images/logo-nexusalpri.png"
                                alt="NexusAlpri Logo"
                                width={120}
                                height={97.5}
                                className="w-auto h-10"
                                priority
                                data-ai-hint="logo education"
                            />
                            <span className={cn("text-xl font-headline whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>{settings?.platformName || 'NexusAlpri'}</span>
                        </Link>
                    </SidebarHeader>
                    <SidebarContent>
                         <div className="w-full p-2 flex flex-col gap-1">
                             <SidebarMenu>
                                {navItems.map((item) => {
                                    if (item.subItems) {
                                        return (
                                            <div key={item.label} className="flex flex-col gap-1">
                                                <div className="px-4 py-2 text-sm font-semibold text-muted-foreground/70 flex items-center gap-3 md:group-data-[state=collapsed]:hidden">
                                                    {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                                                    {item.label}
                                                </div>
                                                <SidebarMenu className="pl-4 md:group-data-[state=collapsed]:pl-0">
                                                    {item.subItems.map((subItem) => {
                                                        const isActive = pathname.startsWith(subItem.href || '___');
                                                        return (
                                                            <SidebarMenuItem key={subItem.href}>
                                                                <SidebarMenuButton asChild isActive={isActive} disabled={subItem.disabled} className="justify-start gap-3" tooltip={{ children: subItem.label }}>
                                                                    <Link href={subItem.href || '#'}>
                                                                        {subItem.icon && <subItem.icon className="h-5 w-5 shrink-0" />}
                                                                        <span className={cn("font-medium text-base whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>{subItem.label}</span>
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            </SidebarMenuItem>
                                                        )
                                                    })}
                                                </SidebarMenu>
                                            </div>
                                        );
                                    }
                                    
                                    const isActive = item.href ? pathname === item.href : false;
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton asChild isActive={isActive} disabled={item.disabled} className="justify-start gap-3" tooltip={{ children: item.label }}>
                                                <Link href={item.href || '#'}>
                                                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                                                <span className={cn("font-medium text-base whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                         </div>
                    </SidebarContent>
                    <SidebarFooter>
                         <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={logout} variant="ghost" className="justify-start gap-3 w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive" tooltip={{children: "Cerrar Sesión"}}>
                                    <LogOut className="text-destructive h-5 w-5"/>
                                    <span className={cn("font-semibold whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>Cerrar Sesión</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
                
                <div className={cn(
                  "bg-background min-h-screen transition-all duration-300 ease-in-out",
                  "md:group-data-[state=expanded]/app-layout:ml-[var(--sidebar-width)]",
                  "md:group-data-[state=collapsed]/app-layout:ml-[var(--sidebar-width-icon)]"
                )}>
                    <TopBar />
                    <main className="p-4 md:p-6 lg:p-8">
                      {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}