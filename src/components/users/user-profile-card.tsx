// src/components/users/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getProcessColors } from '@/lib/utils';
import { getRoleInSpanish, getRoleBadgeVariant } from '@/lib/security-log-utils';
import type { User } from '@/types';
import { Button } from '../ui/button';
import { MessageSquare, Briefcase, MoreVertical, Edit, UserCog, UserX, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfileCardProps {
    user: User & { process?: { id: string; name: string } | null, updatedAt?: string | Date };
    onEdit?: (user: User) => void;
    onRoleChange?: (user: User) => void;
    onStatusChange?: (user: User, status: boolean) => void;
}

export const UserProfileCard = ({ user, onEdit, onRoleChange, onStatusChange }: UserProfileCardProps) => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const canModify = currentUser?.role === 'ADMINISTRATOR';
    
    const process = user.process;
    const processColors = process ? getProcessColors(process.id) : null;

    return (
        <Card className="flex flex-col h-full bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 text-center overflow-hidden">
             <div className="h-14 w-full relative bg-gradient-to-br from-primary/10 to-accent/10">
                 {canModify && (
                    <div className="absolute top-1 right-1 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:bg-black/20 hover:text-white"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit?.(user)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onRoleChange?.(user)}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol/Permisos</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange?.(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}>
                                  <UserX className="mr-2 h-4 w-4"/>
                                  {user.isActive ? 'Inactivar' : 'Activar'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                    <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                        </Avatar>
                        <span className={cn(
                            "absolute bottom-1 right-1 block h-4 w-4 rounded-full border-2 border-card",
                            user.isActive ? "bg-green-500" : "bg-red-500"
                         )} />
                    </div>
                </div>
            </div>

            <CardContent className="pt-12 px-2 pb-3 flex-grow flex flex-col items-center">
                <p className="font-semibold text-base truncate max-w-[180px]">{user.name}</p>
                <p className="text-sm text-primary font-medium">{getRoleInSpanish(user.role)}</p>
                
                 <div className="mt-2 flex items-center flex-wrap justify-center gap-1.5">
                     {process && (
                         <Badge 
                            key={process.id} 
                            className="text-xs py-0.5 px-2 truncate max-w-[140px]"
                            style={{
                                backgroundColor: processColors?.raw.light,
                                color: processColors?.raw.dark,
                            }}
                         >
                            <Briefcase className="mr-1 h-3 w-3"/> {process.name}
                        </Badge>
                     )}
                </div>
            </CardContent>

             <CardFooter className="p-2 border-t mt-auto text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3"/>
                    <span>Últ. Actividad: {format(new Date(user.updatedAt!), "dd MMM yyyy", { locale: es })}</span>
                </div>
            </CardFooter>
        </Card>
    );
};
