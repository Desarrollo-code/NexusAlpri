
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

const NavMenuItem = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const { user } = useAuth();
  // No necesitas sidebarState aquí a menos que lo uses para un efecto visual directo en el NavMenuItem
  // const { state: sidebarState } = useSidebar();

  if (!user) return null;

  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const isParentActive = item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href));

  // Filtrar sub-elementos basados en roles del usuario
  const filteredSubItems = useMemo(() => {
    return item.subItems?.filter(sub => sub.roles.includes(user.role)) ?? [];
  }, [item.subItems, user.role]);

  if (filteredSubItems.length > 0) {
    return (
        <AccordionItem value={item.label} className="border-none">
          <AccordionTrigger
            className={cn(
              "w-full h-auto p-2 text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground rounded-md text-sm hover:no-underline justify-start gap-3",
              isParentActive && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
              <div className="flex items-center gap-3 flex-1">
                {item.icon && <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isParentActive || isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground")} />}
                <span className={cn("font-semibold text-base whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>{item.label}</span>
            </div>
            {/* Solo muestra el icono de chevron si hay subitems filtrados */}
            {filteredSubItems.length > 0 && (
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", "md:group-data-[state=collapsed]:hidden")} />
            )}
          </AccordionTrigger>
          <AccordionContent className="p-0 pl-7 mt-1 md:group-data-[state=collapsed]:hidden">
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
                        {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                        <span className="text-sm font-normal md:group-data-[state=collapsed]:hidden whitespace-nowrap">{subItem.label}</span>
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

  // Si no tiene subItems o los subItems filtrados están vacíos, renderiza como un item normal
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} disabled={item.disabled} className="justify-start gap-3" tooltip={{children: item.label}}>
        <Link href={item.href || '#'}>
          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
          <span className={cn("font-semibold text-base whitespace-nowrap", "md:group-data-[state=collapsed]:hidden")}>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, settings, logout } = useAuth();
    const pathname = usePathname();
    const { toast } = useToast();
    const { state: sidebarState } = useSidebar(); // Aquí obtienes el estado de la barra lateral

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

    // Usa useMemo para memoizar navItems si user.role no cambia con frecuencia
    const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

    const [openAccordionValue, setOpenAccordionValue] = useState<string[]>(() => {
        const parentItem = navItems.find(item =>
        item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href))
        );
        return parentItem ? [parentItem.label] : [];
    });

    // Usa useEffect para actualizar openAccordionValue si el pathname cambia y una nueva sección debe estar abierta
    useEffect(() => {
        const parentItem = navItems.find(item =>
            item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href))
        );
        const newOpenValue = parentItem ? [parentItem.label] : [];
        // Solo actualiza si es diferente para evitar renderizados innecesarios
        if (JSON.stringify(newOpenValue) !== JSON.stringify(openAccordionValue)) {
            setOpenAccordionValue(newOpenValue);
        }
    }, [pathname, navItems, openAccordionValue]);


    const generalItems = useMemo(() => navItems.filter(item => !item.subItems || item.subItems.length === 0), [navItems]);
    const adminItems = useMemo(() => navItems.find(item => item.label === 'Administración' && item.subItems && item.subItems.length > 0), [navItems]);

    return (
        <div className="group/app-layout">
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
                     <Accordion
                        type="multiple"
                        // Asegúrate de que defaultValue y onValueChange usen el mismo estado
                        value={openAccordionValue} // Usa 'value' en lugar de 'defaultValue' para un componente controlado
                        onValueChange={setOpenAccordionValue}
                        className="w-full p-2"
                    >
                        <SidebarMenu className="overflow-hidden">
                          {generalItems.map((item) => ( // No necesitas el index si item.href o item.label son únicos
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
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si isLoading termina y no hay usuario, redirigir a sign-in
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
