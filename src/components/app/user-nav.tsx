'use client'

import { logout } from "@/actions/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import Link from "next/link"

const getRoleLabel = (role: string) => {
    switch(role) {
        case 'administrator': return 'Administrador';
        case 'instructor': return 'Instructor';
        case 'student': return 'Estudiante';
        default: return 'Usuario';
    }
}

export default function UserNav({ role }: { role: string }) {
  const userInitial = role.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt="@shadcn" data-ai-hint="user avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Usuario Demo</p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleLabel(role)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          {role === 'administrator' && (
             <Link href="/settings">
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Ajustes</span>
                </DropdownMenuItem>
             </Link>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
          <button type="submit" className="w-full">
            <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
