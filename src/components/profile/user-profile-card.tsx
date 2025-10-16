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
        <Card className="profile-card flex flex-col items-center p-4 h-full bg-card shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <div className="relative mb-3">
                 <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                </Avatar>
            </div>
            
            <div className="text-center flex-grow">
                <CardTitle className="text-lg font-bold font-headline flex items-center justify-center gap-1.5">
                    <span className="truncate max-w-[150px]">{user.name}</span>
                    <VerifiedBadge role={user.role} />
                </CardTitle>
                <CardDescription className="text-xs text-primary font-medium mt-1">
                    {getRoleInSpanish(user.role)}
                </CardDescription>

                {displayProcess && displayProcess.length > 0 && (
                    <div className="mt-3">
                         <div className="flex flex-wrap justify-center gap-1">
                            {displayProcess.map(process => {
                                if (!process) return null;
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
            </div>

            {showMessageButton && (
                 <div className="w-full mt-4">
                    <Button size="sm" variant="outline" className="w-full" onClick={handleSendMessage}>
                        <MessageSquare className="mr-2 h-4 w-4"/> Mensaje
                    </Button>
                </div>
            )}
        </Card>
    );
};
