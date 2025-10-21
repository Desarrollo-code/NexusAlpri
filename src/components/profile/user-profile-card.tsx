// src/components/profile/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getProcessColors } from '@/lib/utils';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import type { User } from '@/types';
import { Button } from '../ui/button';
import { MessageSquare, Briefcase, MoreVertical, Edit, UserCog, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfileCardProps {
    user: User & { process?: { id: string; name: string } | null, processes?: { id: string; name: string }[] };
    onEdit?: (user: User) => void;
    onRoleChange?: (user: User) => void;
    onStatusChange?: (user: User, status: boolean) => void;
}

export const UserProfileCard = ({ user, onEdit, onRoleChange, onStatusChange }: UserProfileCardProps) => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const handleSendMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/messages?new=${user.id}`);
    };
    
    const showMessageButton = currentUser?.id !== user.id;
    const canModify = currentUser?.role === 'ADMINISTRATOR';
    
    const displayProcess = user.process ? [user.process] : (user.processes || []);
    const processColors = user.process ? getProcessColors(user.process.id) : null;

    return (
        <Card className="flex flex-col h-full bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 text-center overflow-hidden">
             <div className="h-16 w-full relative bg-gradient-to-br from-primary/10 to-accent/10">
                 {canModify && (
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/70 hover:bg-black/20 hover:text-white"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit?.(user)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onRoleChange?.(user)}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange?.(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}><UserX className="mr-2 h-4 w-4"/>{user.isActive ? 'Inactivar' : 'Activar'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <CardContent className="pt-12 px-4 pb-4 flex-grow flex flex-col items-center">
                <p className="font-semibold text-lg truncate max-w-[200px]">{user.name}</p>
                <p className="text-sm text-primary font-medium">{getRoleInSpanish(user.role)}</p>
                <p className="text-xs text-muted-foreground break-all">{user.email}</p>

                {displayProcess.length > 0 && (
                     <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {displayProcess.map(p => {
                            const colors = getProcessColors(p.id);
                            return (
                                <Badge 
                                    key={p.id} 
                                    className="text-xs"
                                    style={{
                                        backgroundColor: colors.raw.light,
                                        color: colors.raw.dark,
                                    }}
                                >
                                    {p.name}
                                </Badge>
                            )
                        })}
                    </div>
                )}
            </CardContent>

            {showMessageButton && (
                <CardFooter className="p-2 border-t mt-auto">
                    <Button size="sm" variant="ghost" className="w-full h-8 text-xs" onClick={handleSendMessage}>
                        <MessageSquare className="mr-1.5 h-3 w-3"/> Mensaje
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};
