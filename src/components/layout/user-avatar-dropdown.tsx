
// src/components/layout/user-avatar-dropdown.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, Palette, Check, Eye } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { UserRole } from '@/types';
import { AVAILABLE_THEMES } from '../theme-provider';
import { Identicon } from '../ui/identicon';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import { useTour } from '@/contexts/tour-context';


function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                <span>Cambiar Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        {AVAILABLE_THEMES.map((t) => (
                           <DropdownMenuRadioItem key={t.value} value={t.value}>
                             {t.label}
                           </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
}


export function UserAvatarDropdown() {
  const { user, logout, settings } = useAuth();
  const { forceStartTour } = useTour();


  if (!user) return null;
  

  const userDisplayName = user.name || "Usuario";
  const userDisplayEmail = user.email || "No email";
  const userAppRole = user.role;
  const avatarSrc = user.avatar;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10 p-0">
          <Avatar className="h-9 w-9 bg-primary/20 text-primary-foreground">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={userDisplayName} data-ai-hint="user avatar" /> : null}
            <AvatarFallback>
                <Identicon userId={user.id} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userDisplayEmail}
            </p>
            {userAppRole && (
              <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                Rol: {getRoleInSpanish(userAppRole)}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={() => forceStartTour('profile', [])} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            <span>Ver Guía</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        {userAppRole === 'ADMINISTRATOR' && (
            <DropdownMenuItem asChild>
                 <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                 </Link>
            </DropdownMenuItem>
        )}
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
