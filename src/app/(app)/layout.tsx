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
import { GradientIcon } from '@/components/ui/gradient-icon';


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, settings, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { state } = useSidebar();

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
        <div className="min-h-screen bg-muted/30">
            <Sidebar>
                <SidebarHeader>
                    <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
                        <Image
                            src="/uploads/images/logo-nexusalpri.png"
                            alt="NexusAlpri Logo"
                            width={120}
                            height={97.5}
                            className="w-auto h-10"
                            priority
                            data-ai-hint="logo education"
                        />
                        <span className="text-xl font-headline whitespace-nowrap">{settings?.platformName || 'NexusAlpri'}</span>
                    </Link>
                </SidebarHeader>
                
                <SidebarMenuSeparator />

                <SidebarContent>
                     <div className="w-full p-2 flex flex-col gap-1">
                         <SidebarMenu>
                            {navItems.map((item, index) => {
                                const isSubMenu = item.subItems && item.subItems.length > 0;
                                
                                return (
                                    <React.Fragment key={item.href || item.label}>
                                        {isSubMenu ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="px-4 py-2 text-sm font-semibold text-sidebar-foreground/70 flex items-center gap-3">
                                                    {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                                                    <span className="whitespace-nowrap">{item.label}</span>
                                                </div>
                                                <SidebarMenu className="pl-4">
                                                    {item.subItems?.map((subItem) => {
                                                        const isActive = subItem.href ? pathname.startsWith(subItem.href) : false;
                                                        return (
                                                            <SidebarMenuItem key={subItem.href}>
                                                                <SidebarMenuButton asChild isActive={isActive} disabled={subItem.disabled} className="justify-start gap-3" tooltip={{ children: subItem.label }}>
                                                                    <Link href={subItem.href || '#'}>
                                                                        <GradientIcon icon={subItem.icon} isActive={isActive} />
                                                                        <span className="font-medium text-base whitespace-nowrap">{subItem.label}</span>
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            </SidebarMenuItem>
                                                        )
                                                    })}
                                                </SidebarMenu>
                                            </div>
                                        ) : (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild isActive={pathname === item.href} disabled={item.disabled} className="justify-start gap-3" tooltip={{ children: item.label }}>
                                                    <Link href={item.href || '#'}>
                                                        <GradientIcon icon={item.icon} isActive={pathname === item.href} />
                                                        <span className="font-medium text-base whitespace-nowrap">{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        )}
                                        
                                        {navItems.length > 1 && !isSubMenu && navItems[index+1]?.subItems && <SidebarMenuSeparator />}
                                    </React.Fragment>
                                );
                            })}
                        </SidebarMenu>
                     </div>
                </SidebarContent>

                <SidebarMenuSeparator />
                
                <SidebarFooter>
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={logout} variant="ghost" className="justify-start gap-3 w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive" tooltip={{children: "Cerrar Sesión"}}>
                                <LogOut className="text-destructive h-5 w-5"/>
                                <span className="font-semibold whitespace-nowrap">Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            
            <div 
              className="main-content"
              style={{
                paddingLeft: `var(--sidebar-${state}-width, var(--sidebar-width))`
              }}
            >
                <TopBar />
                <main className="p-4 md:p-6 lg:p-8">
                  {children}
                </main>
                <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
                    <Image
                        src="/uploads/images/watermark-alprigrama.png"
                        alt="Alprigrama S.A.S. Watermark"
                        width={60}
                        height={60}
                        priority
                        className="watermark-img"
                        data-ai-hint="company logo"
                    />
                </div>
            </div>
        </div>
    )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </SidebarProvider>
    );
}
