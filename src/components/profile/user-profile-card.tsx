// src/components/profile/user-profile-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { getInitials } from '@/lib/utils';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import type { User } from '@/types';
import { VerifiedBadge } from '../ui/verified-badge';

interface UserProfileCardProps {
    user: User;
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
    return (
        <Card className="profile-card border-none shadow-none">
            <div className="card__img">
                <div className="card__img--gradient" />
            </div>
            <div className="card__avatar">
                <Avatar className="avatar">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                </Avatar>
            </div>
            <CardContent className="px-6 pb-6 pt-4">
                <CardTitle className="text-xl font-bold font-headline flex items-center justify-center gap-2">
                    {user.name}
                    <VerifiedBadge role={user.role} />
                </CardTitle>
                <CardDescription className="card__subtitle">
                    {user.email}
                </CardDescription>
                <div className="mt-4 text-sm font-semibold text-primary">{getRoleInSpanish(user.role)}</div>
            </CardContent>
        </Card>
    );
};
