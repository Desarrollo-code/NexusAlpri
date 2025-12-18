// src/components/security/security-log-timeline.tsx
'use client';
import React from 'react';
import type { SecurityLog } from '@/types';
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

const TimelineItem = ({ log, onLogClick, isLast }: { log: SecurityLog, onLogClick: (log: SecurityLog) => void, isLast: boolean }) => {
    const eventUI = getEventDetails(log.event, log.details);
    const IconComponent = iconMap[eventUI.iconName] || ShieldAlert;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 pb-3"
        >
            {/* Time and Line */}
            <div className="flex flex-col items-center pt-1">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                </p>
            </div>

            {/* Card Content */}
            <div className="relative w-full">
                 <div className={cn("absolute left-0 top-3 h-full w-0.5", !isLast && "bg-border")} />
                 <div className="absolute left-[-5.5px] top-3 h-3 w-3 rounded-full bg-background border-2" style={{ borderColor: eventUI.variant === 'destructive' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}/>
                 <div 
                    onClick={() => onLogClick(log)} 
                    className="p-2.5 ml-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                    <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
                         <div className="flex items-center gap-2">
                             <Avatar className="h-7 w-7">
                                 <AvatarImage src={log.user?.avatar || undefined} />
                                 <AvatarFallback><Identicon userId={log.user?.id || log.emailAttempt || ''} /></AvatarFallback>
                             </Avatar>
                             <p className="font-semibold text-sm truncate">{log.user?.name || log.emailAttempt}</p>
                         </div>
                         <Badge variant={eventUI.variant} className="whitespace-nowrap text-xs">{eventUI.label}</Badge>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const SecurityLogTimeline = ({ logs, onLogClick }: { logs: SecurityLog[], onLogClick: (log: SecurityLog) => void }) => {
    return (
        <ScrollArea className="h-[600px] pr-4">
            <div className="relative">
                <AnimatePresence>
                    {logs.map((log, index) => (
                        <TimelineItem 
                            key={log.id} 
                            log={log} 
                            onLogClick={onLogClick} 
                            isLast={index === logs.length - 1} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
};
