
'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types'; 
import { Bell, ChevronDown, Menu } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { Button } from '@/components/ui/button';
import { getNavItemsForRole } from '@/lib/nav-items';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { user } = useAuth();
  const { toggleSidebar, activeItem } = useSidebar();
  
  const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

  const getPageTitle = () => {
    const findItem = (items: typeof navItems, path: string): (typeof navItems[0]) | undefined => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const childMatch = findItem(item.children, path);
          if (childMatch) return childMatch;
        }
      }
    };
    const active = findItem(navItems, activeItem);
    return active ? active.label : 'Panel Principal';
  };

  return (
   <div className={cn(
       "h-20 border-b bg-gradient-to-r from-zinc-900 to-neutral-900",
       "flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
    )}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-foreground hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 text-foreground hover:bg-muted">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
        </Button>
        <UserAvatarDropdown />
      </div>
    </div>
  );
}
