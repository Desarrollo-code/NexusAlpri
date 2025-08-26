// src/components/layout/sidebar-header.tsx
'use client';

import { useSidebar } from "../ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Identicon } from "../ui/identicon";
import { getInitials } from "@/lib/utils";

export const SidebarHeader = () => {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className={cn(
      "flex items-center h-20", 
      isCollapsed ? 'justify-center px-2' : 'px-4'
    )}>
      <Link href="/profile" className={cn(
          "flex items-center gap-3 w-full p-2 rounded-lg transition-colors",
          "hover:bg-muted"
        )}>
         <Avatar className={cn(isCollapsed ? 'h-10 w-10' : 'h-12 w-12')}>
             {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
             <AvatarFallback>
                 <Identicon userId={user.id} />
             </AvatarFallback>
         </Avatar>
        
        {!isCollapsed && (
            <div className="overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{getInitials(user.role)}</p>
            </div>
        )}
      </Link>
    </div>
  );
};
