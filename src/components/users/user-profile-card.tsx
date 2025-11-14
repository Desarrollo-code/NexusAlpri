// src/components/users/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getProcessColors } from '@/lib/utils';
import { getRoleInSpanish, getRoleBadgeVariant } from '@/lib/security-log-utils';
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
import { Checkbox } from '../ui/checkbox';

interface UserProfileCardProps {
    user: User & { process?: { id: string; name: string } | null, processes?: { id: string; name: string }[] };
    onEdit?: (user: User) => void;
    onRoleChange?: (user: User) => void;
    onStatusChange?: (user: User, status: boolean) => void;
    isSelected?: boolean;
    onSelectionChange?: (id: string, selected: boolean) => void;
}

export const UserProfileCard = ({ user, onEdit, onRoleChange, onStatusChange, isSelected, onSelectionChange }: UserProfileCardProps) => {
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
             <div className="h-14 w-full relative bg-primary">
                 {canModify && (
                    <div className="absolute top-1 right-1 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/70 hover:bg-black/20 hover:text-white"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit?.(user)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onRoleChange?.(user)}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange?.(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}><UserX className="mr-2 h-4 w-4"/>{user.isActive ? 'Inactivar' : 'Activar'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                 {onSelectionChange && (
                    <div className="absolute top-2 left-2 z-20">
                         <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)}
                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent-foreground/50 border-accent/70 bg-background/80 backdrop-blur-sm"
                        />
                    </div>
                 )}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                    <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <CardContent className="pt-12 px-2 pb-3 flex-grow flex flex-col items-center">
                <p className="font-semibold text-lg truncate max-w-[180px]">{user.name}</p>
                <p className="text-sm text-primary font-medium">{getRoleInSpanish(user.role)}</p>
                
                 <div className="mt-2 flex items-center flex-wrap justify-center gap-1.5">
                     <Badge variant={user.isActive ? "default" : "secondary"} className={cn("text-xs py-0.5 px-2", user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500/30" : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-500/30")}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                     </Badge>
                     {displayProcess.length > 0 && displayProcess[0] && (
                         <Badge 
                            key={displayProcess[0].id} 
                            className="text-xs py-0.5 px-2"
                            style={{
                                backgroundColor: getProcessColors(displayProcess[0].id).raw.light,
                                color: getProcessColors(displayProcess[0].id).raw.dark,
                            }}
                         >
                            <Briefcase className="mr-1 h-3 w-3"/> {displayProcess[0].name}
                        </Badge>
                     )}
                </div>
            </CardContent>

            {showMessageButton && (
                <CardFooter className="p-1 border-t mt-auto">
                    <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={handleSendMessage}>
                        <MessageSquare className="mr-1.5 h-3 w-3"/> Mensaje
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};
