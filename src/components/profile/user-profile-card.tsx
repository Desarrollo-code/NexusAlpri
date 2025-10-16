// src/components/profile/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getProcessColors } from '@/lib/utils';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import type { User } from '@/types';
import { Button } from '../ui/button';
import { MessageSquare, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

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
    const processColors = user.process ? getProcessColors(user.process.id) : null;

    return (
        <Card className="flex flex-col h-full bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 text-center overflow-hidden">
            {/* Cabecera decorativa */}
            <div className="h-16 w-full relative bg-gradient-to-br from-primary/10 to-accent/10">
                 {/* Avatar superpuesto */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[-50%]">
                    <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Contenido principal de la tarjeta */}
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

            {/* Pie de la tarjeta con acciones */}
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
