
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, Palette, Check } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { UserRole } from '@/types';
import { AVAILABLE_THEMES } from '../theme-provider';


function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const { updateTheme } = useAuth();

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme); // from next-themes, for immediate visual feedback
        updateTheme(newTheme); // from our auth context, to save to DB
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                <span>Cambiar Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
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
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const getRoleInSpanish = (role: UserRole) => {
    switch (role) {
        case 'ADMINISTRATOR': return 'Administrador';
        case 'INSTRUCTOR': return 'Instructor';
        case 'STUDENT': return 'Estudiante';
        default: return role;
    }
  }

  const userDisplayName = user.name || "Usuario";
  const userDisplayEmail = user.email || "No email";
  const userAppRole = user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 p-0">
          <Avatar className="h-9 w-9 bg-white/20 text-primary-foreground">
            <AvatarImage src={user.avatar || undefined} alt={userDisplayName} data-ai-hint="user avatar" />
            <AvatarFallback>{getInitials(userDisplayName)}</AvatarFallback>
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
