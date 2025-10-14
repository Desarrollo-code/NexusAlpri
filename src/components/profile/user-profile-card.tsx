// src/components/profile/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getInitials, getProcessColors } from '@/lib/utils';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import type { User } from '@/types';
import { VerifiedBadge } from '../ui/verified-badge';
import { Button } from '../ui/button';
import { MessageSquare, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface UserProfileCardProps {
    user: User & { processes?: { id: string; name: string }[] };
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const handleSendMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/messages?new=${user.id}`);
    };
    
    const showMessageButton = currentUser?.id !== user.id;

    return (
        <Card className="profile-card border-none shadow-none bg-card">
            <div className="card__img">
                <div className="card__img--gradient" />
            </div>
            <div className="card__avatar">
                <Avatar className="avatar">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                </Avatar>
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-bold font-headline flex items-center justify-center gap-2">
                    {user.name}
                    <VerifiedBadge role={user.role} />
                </CardTitle>
                <CardDescription className="card__subtitle">
                    {user.email}
                </CardDescription>
                <div className="mt-2 text-sm font-semibold text-primary">{getRoleInSpanish(user.role)}</div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {user.processes && user.processes.length > 0 && (
                    <div className="mt-3">
                         <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center justify-center gap-2"><Briefcase className="h-4 w-4"/> Procesos</h4>
                         <div className="flex flex-wrap justify-center gap-1.5">
                            {user.processes.map(process => {
                                const colors = getProcessColors(process.id);
                                return (
                                    <Badge key={process.id} variant="secondary" style={{ backgroundColor: colors.raw.light, color: colors.raw.dark, borderColor: colors.raw.medium }} className="border">
                                        {process.name}
                                    </Badge>
                                )
                            })}
                         </div>
                    </div>
                )}
            </CardContent>
            {showMessageButton && (
                 <CardFooter className="p-4 pt-0">
                    <Button size="sm" className="w-full" onClick={handleSendMessage}>
                        <MessageSquare className="mr-2 h-4 w-4"/> Enviar Mensaje
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};
