// AppLayout-enhanced.tsx 🌈 Visual creativo & juvenil

'use client';

import React from 'react';
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
import { TopBar } from '@/components/layout/top-bar';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { getNavItemsForRole } from '@/lib/nav-items';
import type { NavItem } from '@/types';

// Función para encontrar el título de la página basado en la ruta
const findPageTitle = (navItems: NavItem[], pathname: string): string | null => {
  for (const item of navItems) {
    if (item.path && (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)))) {
      return item.label;
    }
    if (item.children) {
      const childTitle = findPageTitle(item.children, pathname);
      if (childTitle) return childTitle;
    }
  }
  return null;
};

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, settings, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const { isMobile, isCollapsed } = useSidebar();
  const { theme } = useTheme();
  const pathname = usePathname();

  const handleIdleLogout = React.useCallback(() => {
    logout();
    toast({
      title: "Sesión Expirada",
      description: "Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión de nuevo.",
      variant: "destructive",
    });
  }, [logout, toast]);

  const idleTimeoutMinutes = settings?.idleTimeoutMinutes ?? 20;
  const isIdleTimeoutEnabled = settings?.enableIdleTimeout ?? true;

  useIdleTimeout(handleIdleLogout, idleTimeoutMinutes, isIdleTimeoutEnabled);

  const navItems = React.useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);
  const pageTitle = React.useMemo(() => {
      const title = findPageTitle(navItems, pathname);
      // Casos especiales para rutas dinámicas
      if (pathname.startsWith('/manage-courses/') && pathname.endsWith('/edit')) return 'Editar Curso';
      if (pathname.startsWith('/courses/')) return 'Detalle del Curso';
      return title || 'Panel Principal';
  }, [navItems, pathname]);


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
          !isMobile && (isCollapsed ? "ml-20" : "ml-72")
        )}
      >
        <TopBar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-muted/30">
          <div className="relative z-10">
            {children}
          </div>
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
