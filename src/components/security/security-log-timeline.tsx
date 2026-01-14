// src/components/security/security-log-timeline.tsx
'use client';
import React from 'react';
import type { SecurityLog, SecurityLogEvent } from '@/types';
import { getEventDetails } from '@/lib/security-log-utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert, BookMarked } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: Record<string, React.ElementType> = {
    ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert, BookMarked
};

const TimelineItem = ({ log, onLogClick, isLast, compact }: { log: SecurityLog, onLogClick: (log: SecurityLog) => void, isLast: boolean, compact: boolean }) => {
    const eventUI = getEventDetails(log.event as SecurityLogEvent, log.details);
    const IconComponent = iconMap[eventUI.iconName] || ShieldAlert;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-4 pb-3"
        >
            {/* Time and Line */}
            <div className="flex flex-col items-center pt-0.5">
                <p className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'HH:mm')}
                </p>
            </div>

            {/* Card Content */}
            <div className="relative w-full">
                <div className={cn("absolute left-0 top-3 h-full w-0.5", !isLast && "bg-border")} />
                <div className="absolute left-[-5.5px] top-2.5 h-3 w-3 rounded-full bg-background border-2" style={{ borderColor: eventUI.variant === 'destructive' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }} />
                <div
                    onClick={() => onLogClick(log)}
                    className="p-1.5 ml-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={log.user?.avatar || undefined} />
                            <AvatarFallback className="text-[9px]"><Identicon userId={log.user?.id || log.emailAttempt || ''} /></AvatarFallback>
                        </Avatar>
                        <p className="text-sm truncate text-foreground/80">{log.user?.name || log.emailAttempt}</p>
                    </div>
                    <Badge variant={eventUI.variant} className="whitespace-nowrap text-[11px] py-0 px-1.5 h-5 font-medium">
                        {eventUI.label}
                    </Badge>
                </div>
            </div>
        </motion.div>
    );
};

export const SecurityLogTimeline = ({ logs, onLogClick, compact = false }: { logs: SecurityLog[], onLogClick: (log: SecurityLog) => void, compact?: boolean }) => {
    const containerClasses = compact ? "max-h-[300px] pr-2" : "h-[70vh] pr-4";
    return (
        <ScrollArea className={containerClasses}>
            <div className="relative">
                <AnimatePresence>
                    {logs.map((log, index) => (
                        <TimelineItem
                            key={log.id}
                            log={log}
                            onLogClick={onLogClick}
                            isLast={index === logs.length - 1}
                            compact={compact}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
};
