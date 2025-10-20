// src/components/security/security-log-timeline.tsx
'use client';
import React from 'react';
import type { SecurityLog } from '@/types';
import { getEventDetails, parseUserAgent } from '@/lib/security-log-utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Monitor, Smartphone, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const TimelineItem = ({ log, onLogClick, isLast }: { log: SecurityLog, onLogClick: (log: SecurityLog) => void, isLast: boolean }) => {
    const eventUI = getEventDetails(log.event, log.details);
    const { browser, os } = parseUserAgent(log.userAgent);
    const isMobileDevice = os === 'Android' || os === 'iOS';
    const hasGeo = log.country || log.city;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3"
        >
            {/* Time and Line */}
            <div className="flex flex-col items-center">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                </p>
                <div className="relative mt-1">
                     <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center",
                        eventUI.variant === 'destructive' ? 'bg-destructive' : 'bg-primary'
                     )}>
                         {React.cloneElement(eventUI.icon, { className: "h-4 w-4 text-primary-foreground"})}
                     </div>
                     {!isLast && <div className="absolute top-full left-1/2 w-0.5 h-full bg-border -translate-x-1/2 mt-1" />}
                </div>
            </div>

            {/* Card Content */}
            <div className="w-full pb-6 pt-1">
                <div 
                    onClick={() => onLogClick(log)} 
                    className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                    <div className="flex items-start justify-between flex-wrap gap-x-4 gap-y-1">
                         <div className="flex items-center gap-2">
                             <Avatar className="h-7 w-7">
                                 <AvatarImage src={log.user?.avatar || undefined} />
                                 <AvatarFallback><Identicon userId={log.user?.id || log.emailAttempt || ''} /></AvatarFallback>
                             </Avatar>
                             <p className="font-semibold text-sm truncate">{log.user?.name || log.emailAttempt}</p>
                         </div>
                         <Badge variant={eventUI.variant} className="whitespace-nowrap">{eventUI.label}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pl-9">
                        <div className="flex items-center gap-1.5">
                            {isMobileDevice ? <Smartphone className="h-3.5 w-3.5"/> : <Monitor className="h-3.5 w-3.5"/>}
                            <span className="truncate">{browser}, {os}</span>
                        </div>
                        {hasGeo && (
                            <div className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5"/>
                                <span className="truncate">{log.ipAddress} - {log.city}, {log.country}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const SecurityLogTimeline = ({ logs, onLogClick }: { logs: SecurityLog[], onLogClick: (log: SecurityLog) => void }) => {
    return (
        <ScrollArea className="h-[70vh] pr-4">
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
