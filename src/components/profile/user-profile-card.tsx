// src/components/profile/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getProcessColors } from '@/lib/utils';
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
    user: User & { process?: { id: string; name: string } | null, processes?: { id: string; name: string }[] };
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const handleSendMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/messages?new=${user.id}`);
    };
    
    const showMessageButton = currentUser?.id !== user.id;
    
    const displayProcess = user.process ? [user.process] : (user.processes || []);

    return (
        <Card className="flex flex-col items-center p-4 h-full bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 text-center">
            <Avatar className="h-16 w-16 mb-3 border-2 border-border">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
            </Avatar>
            
            <div className="flex-grow">
                <p className="font-semibold text-sm truncate max-w-[150px]">{user.name}</p>
                <p className="text-xs text-primary font-medium">{getRoleInSpanish(user.role)}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
            </div>

            {displayProcess && displayProcess.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3 shrink-0"/>
                     <span className="truncate">{displayProcess.map(p => p.name).join(', ')}</span>
                </div>
            )}

            {showMessageButton && (
                 <div className="w-full mt-3">
                    <Button size="sm" variant="ghost" className="w-full h-8 text-xs" onClick={handleSendMessage}>
                        <MessageSquare className="mr-1.5 h-3 w-3"/> Mensaje
                    </Button>
                </div>
            )}
        </Card>
    );
};
