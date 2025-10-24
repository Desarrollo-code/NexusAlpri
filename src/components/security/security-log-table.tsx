// src/components/security/security-log-table.tsx
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getEventDetails, parseUserAgent } from "@/lib/security-log-utils";
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Identicon } from '@/components/ui/identicon';
import type { SecurityLog } from "@/types";
import { Monitor, Smartphone, Globe } from "lucide-react";
import React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'HH:mm:ss', { locale: es });
    if (isYesterday(date)) return 'Ayer';
    return format(date, "d MMM, yyyy", { locale: es });
};


export const SecurityLogTable = ({ logs, onRowClick }: { logs: SecurityLog[], onRowClick: (log: SecurityLog) => void }) => {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[25%]">Usuario</TableHead>
                        <TableHead className="w-[15%]">Evento</TableHead>
                        <TableHead className="w-[20%] hidden md:table-cell">Dispositivo</TableHead>
                        <TableHead className="hidden lg:table-cell">IP y Ubicación</TableHead>
                        <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => {
                        const eventUI = getEventDetails(log.event as any, log.details);
                        const { browser, os } = parseUserAgent(log.userAgent);
                        const isMobileDevice = os === 'Android' || os === 'iOS';

                        return (
                            <TableRow key={log.id} onClick={() => onRowClick(log)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={log.user?.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={log.user?.id || log.emailAttempt || ''} /></AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{log.user?.name || log.emailAttempt}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={eventUI.variant} className="gap-1.5 whitespace-nowrap text-xs py-1 px-2">
                                        {eventUI.icon} {eventUI.label}
                                    </Badge>
                                </TableCell>
                                 <TableCell className="hidden md:table-cell">
                                    <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                {isMobileDevice ? <Smartphone className="h-3.5 w-3.5"/> : <Monitor className="h-3.5 w-3.5"/>}
                                                <span>{browser}, {os}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs break-words">
                                            <p>{log.userAgent}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                 <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                    <div>{log.ipAddress}</div>
                                    <div>{log.city}, {log.country}</div>
                                 </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(log.createdAt)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
