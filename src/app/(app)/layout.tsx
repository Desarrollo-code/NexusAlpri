
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { UserRole, NavItem } from '@/types'; 
import Link from 'next/link';
import { LogOut, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';


const NavMenuItem = ({ item, pathname, index }: { item: NavItem, pathname: string, index: number }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const filteredSubItems = item.subItems?.filter(sub => sub.roles.includes(user.role)) ?? [];
  const iconColorClass = `text-chart-${(index % 5) + 1}`;

  if (filteredSubItems.length > 0) {
    return (
        <AccordionItem value={item.label} className="border-none">
          <AccordionTrigger className={cn(
            "w-full justify-between h-auto p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md text-sm",
            "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          )}>
            <div className="flex items-center gap-3">
              <item.icon className={cn(iconColorClass, "h-5 w-5")} />
              <span className="font-semibold">{item.label}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 pl-6 mt-1">
            <SidebarMenu className="border-l border-sidebar-border ml-2 pl-4">
              {filteredSubItems.map((subItem, subIndex) => (
                <SidebarMenuItem key={subItem.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(subItem.href)} size="sm" className="justify-start">
                    <Link href={subItem.href}>
                      <subItem.icon className={cn(`text-chart-${(subIndex % 5) + 1}`)}/>
                      <span>{subItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </AccordionContent>
        </AccordionItem>
      );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={item.href ? pathname.startsWith(item.href) : false} disabled={item.disabled} className="justify-start gap-3">
        <Link href={item.href || '#'}>
          <item.icon className={cn(iconColorClass, "h-5 w-5")} />
          <span className="font-semibold">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, settings, logout } = useAuth();
    const pathname = usePathname();
    const { toast } = useToast();
  
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

    const navItems = getNavItemsForRole(user?.role || 'STUDENT');

    const [openAccordionValue, setOpenAccordionValue] = useState<string[]>(() => {
        const parentItem = navItems.find(item =>
        item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href))
        );
        return parentItem ? [parentItem.label] : [];
    });

    if (!user || !settings) {
        return (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full">
            <Sidebar>
                <SidebarHeader>
                    <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground p-2">
                        <Image 
                            src="/uploads/images/logo-nexusalpri.png" 
                            alt="NexusAlpri Logo" 
                            width={120} 
                            height={97.5}
                            className="w-auto h-8"
                            priority
                            data-ai-hint="logo education"
                        />
                        <span className="text-xl font-headline group-data-[state=collapsed]:hidden">{settings.platformName || 'NexusAlpri'}</span>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                     <Accordion
                        type="multiple"
                        value={openAccordionValue}
                        onValueChange={setOpenAccordionValue}
                        className="w-full p-2"
                    >
                        <SidebarMenu>
                        {navItems.map((item, index) => (
                            <NavMenuItem key={item.href || item.label} item={item} pathname={pathname} index={index} />
                        ))}
                        </SidebarMenu>
                    </Accordion>
                </SidebarContent>

                <SidebarFooter>
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={logout} variant="ghost" className="justify-start gap-3 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                <LogOut className="text-destructive h-5 w-5"/>
                                <span className="font-semibold group-data-[state=collapsed]:hidden">Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <div className="flex-1 flex flex-col md:ml-[var(--sidebar-width)] group-data-[state=collapsed]/sidebar-wrapper:md:ml-[var(--sidebar-width-icon)] transition-[margin-left] duration-300 ease-in-out">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30">
                {children}
                </main>
            </div>
            
            <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
                <Image
                    src="/uploads/images/watermark-alprigrama.png" 
                    alt="Alprigrama S.A.S. Watermark"
                    width={120} 
                    height={120} 
                    className="opacity-40 w-[70px] h-auto"
                    priority 
                    data-ai-hint="company logo"
                />
            </div>
        </div>
    );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
        <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
