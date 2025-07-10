
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
  SidebarSeparator,
  useSidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { UserRole, NavItem } from '@/types'; 
import Link from 'next/link';
import { LogOut, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const NavMenuItem = ({ item, pathname, index }: { item: NavItem, pathname: string, index: number }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const filteredSubItems = item.subItems?.filter(sub => sub.roles.includes(user.role)) ?? [];
  const iconColorClass = `text-chart-${(index % 5) + 1}`;

  if (filteredSubItems.length > 0) {
    return (
        <AccordionItem value={item.label} className="border-none">
          <AccordionTrigger className={cn(
            buttonVariants({ variant: 'ghost', size: 'default' }),
            "w-full justify-between h-auto p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}>
            <div className="flex items-center gap-2">
              <item.icon className={cn(iconColorClass)} />
              <span>{item.label}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 pl-5">
            <SidebarMenu className="border-l border-sidebar-border ml-1 pl-3">
              {filteredSubItems.map((subItem, subIndex) => (
                <SidebarMenuItem key={subItem.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(subItem.href)} size="sm">
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

  // Regular menu item without sub-items
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={item.href ? pathname.startsWith(item.href) : false} disabled={item.disabled}>
        <Link href={item.href || '#'}>
          <item.icon className={cn(iconColorClass)} />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const handleIdleLogout = useCallback(() => {
    // Check if user is still considered logged in to prevent multiple calls
    if (user) { // Check against the user state
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/sign-in'); 
    }
  }, [isLoading, user, router]);

  const navItems = getNavItemsForRole(user?.role || 'STUDENT');

  const [openAccordionValue, setOpenAccordionValue] = useState<string[]>(() => {
    const parentItem = navItems.find(item =>
      item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href))
    );
    return parentItem ? [parentItem.label] : [];
  });
  
  if (isLoading || !user || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-shrink-0 border-r bg-sidebar p-2 hidden md:flex flex-col">
        <div className="p-4">
           <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
             <Image 
              src="/uploads/images/logo-nexusalpri.png" 
              alt="NexusAlpri Logo" 
              width={120} 
              height={97.5}
              className="w-auto h-8"
              priority
              data-ai-hint="logo education"
            />
            <span className="text-xl font-headline">{settings.platformName || 'NexusAlpri'}</span>
          </Link>
        </div>
        <Separator className="bg-sidebar-border" />
        <div className="flex-1 overflow-y-auto mt-4">
          <Accordion
            type="multiple"
            value={openAccordionValue}
            onValueChange={setOpenAccordionValue}
            className="w-full"
          >
            <SidebarMenu>
              {navItems.map((item, index) => (
                  <NavMenuItem key={item.href || item.label} item={item} pathname={pathname} index={index} />
              ))}
            </SidebarMenu>
          </Accordion>
        </div>
        <Separator className="bg-sidebar-border" />
        <div className="p-2 mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={logout} variant="ghost" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full justify-start">
                        <LogOut className="text-destructive"/>
                        <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
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
