

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
  SidebarMenuSeparator,
  useSidebar 
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { UserRole, NavItem } from '@/types';
import Link from 'next/link';
import { LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GradientIcon } from '@/components/ui/gradient-icon';

const NavMenuItem = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar(); 

  if (!user) return null;

  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const isParentActive = item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href));

  const filteredSubItems = item.subItems?.filter(sub => sub.roles.includes(user.role)) ?? [];

  if (filteredSubItems.length > 0) {
    return (
        <AccordionItem value={item.label} className="border-none">
          <AccordionTrigger
            className={cn(
              "w-full h-auto p-2 text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground rounded-md text-sm hover:no-underline justify-start gap-3",
              isParentActive && "bg-sidebar-accent/80"
            )}
          >
              <div className="flex items-center gap-3 flex-1">
                <GradientIcon icon={item.icon} isActive={isParentActive} />
                {sidebarState === 'expanded' && <span className="font-semibold text-base">{item.label}</span>}
            </div>
            {sidebarState === 'expanded' && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />}
          </AccordionTrigger>
          <AccordionContent className="p-0 pl-7 mt-1 group-data-[state=collapsed]/sidebar-wrapper:hidden">
            <SidebarMenu className="border-l border-sidebar-border ml-2 pl-3">
              {filteredSubItems.map((subItem) => {
                const isSubItemActive = pathname.startsWith(subItem.href || '');
                return (
                  <SidebarMenuItem key={subItem.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isSubItemActive}
                      size="sm" 
                      className="justify-start gap-2" 
                      tooltip={{ children: subItem.label }}
                    >
                      <Link href={subItem.href || '#'}>
                        <GradientIcon icon={subItem.icon} size="sm" isActive={isSubItemActive} />
                        {sidebarState === 'expanded' && <span className="text-sm font-normal">{subItem.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </AccordionContent>
        </AccordionItem>
      );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} disabled={item.disabled} className="justify-start gap-3" tooltip={{children: item.label}}>
        <Link href={item.href || '#'}>
          <GradientIcon icon={item.icon} isActive={isActive} />
          {sidebarState === 'expanded' && <span className="font-semibold text-base">{item.label}</span>}
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

    const generalItems = navItems.filter(item => !item.subItems || item.subItems.length === 0);
    const adminItems = navItems.find(item => item.label === 'Administración' && item.subItems && item.subItems.length > 0);
    
    return (
        <>
            <Sidebar>
                <SidebarHeader className="group-data-[state=expanded]:px-4 group-data-[state=collapsed]:px-2">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground group-data-[state=collapsed]:justify-center">
                        <Image
                            src="/uploads/images/logo-nexusalpri.png"
                            alt="NexusAlpri Logo"
                            width={120}
                            height={97.5}
                            className="w-auto h-8"
                            priority
                            data-ai-hint="logo education"
                        />
                        <span className="text-xl font-headline group-data-[state=collapsed]:hidden">{settings?.platformName || 'NexusAlpri'}</span>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                     <Accordion
                        type="multiple"
                        defaultValue={openAccordionValue}
                        onValueChange={setOpenAccordionValue}
                        className="w-full p-2"
                    >
                        <SidebarMenu className="overflow-hidden">
                          {generalItems.map((item, index) => (
                              <NavMenuItem key={item.href || item.label} item={item} pathname={pathname} />
                          ))}

                          {adminItems && (
                            <>
                              <SidebarMenuSeparator />
                              <NavMenuItem key={adminItems.label} item={adminItems} pathname={pathname} />
                            </>
                          )}
                        </SidebarMenu>
                    </Accordion>
                </SidebarContent>

                <SidebarFooter>
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={logout} variant="ghost" className="justify-start gap-3 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" tooltip={{children: "Cerrar Sesión"}}>
                                <LogOut className="text-destructive h-5 w-5"/>
                                <span className="font-semibold group-data-[state=collapsed]:hidden">Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <div className={cn(
              "bg-background min-h-screen md:ml-[var(--sidebar-width)] group-data-[state=collapsed]/sidebar-wrapper:md:ml-[var(--sidebar-width-icon)] transition-[margin-left] duration-300 ease-in-out"
            )}>
                <TopBar />
                <main className="p-4 md:p-6 lg:p-8">
                  {children}
                </main>
            </div>

            <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
              <Image
                src="/uploads/images/watermark-alprigrama.png"
                alt="Alprigrama S.A.S. Watermark"
                width={60}
                height={60}
                className="watermark-img"
                data-ai-hint="company logo"
              />
            </div>
        </>
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
