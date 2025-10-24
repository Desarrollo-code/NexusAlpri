// src/components/security/security-log-detail-sheet.tsx
'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getEventDetails, parseUserAgent } from "@/lib/security-log-utils";
import type { SecurityLog } from "@/types";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Button } from "../ui/button";
import { X } from "lucide-react";

const DetailRow = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b">
        <span className="text-sm font-medium text-muted-foreground col-span-1">{label}</span>
        <span className="text-sm text-foreground col-span-2 break-words">{value || 'N/A'}</span>
    </div>
);

export const SecurityLogDetailSheet = ({ log, isOpen, onClose }: { log: SecurityLog, isOpen: boolean, onClose: () => void }) => {
    if (!log) return null;
    
    const eventUI = getEventDetails(log.event, log.details);
    const { browser, os } = parseUserAgent(log.userAgent);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md">
                 <SheetHeader className="text-left pr-12">
                    <div className="flex items-center gap-4 mb-2">
                        <Badge variant={eventUI.variant} className="px-3 py-1 text-sm">{eventUI.label}</Badge>
                        <SheetTitle className="text-xl">Detalle del Evento</SheetTitle>
                    </div>
                    <SheetDescription>
                         {format(new Date(log.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm:ss", { locale: es })}
                    </SheetDescription>
                </SheetHeader>
                <SheetClose asChild className="absolute right-4 top-4">
                  <Button variant="ghost" size="icon"><X className="h-5 w-5"/></Button>
                </SheetClose>
                <div className="py-4 mt-4">
                    <DetailRow label="ID del Evento" value={log.id} />
                    <DetailRow label="Usuario" value={log.user?.name || log.emailAttempt} />
                    <DetailRow label="Descripción" value={eventUI.details} />
                    <Separator className="my-2"/>
                    <DetailRow label="Dirección IP" value={log.ipAddress} />
                    <DetailRow label="Ubicación" value={log.city && log.country ? `${log.city}, ${log.country}` : (log.country || 'Desconocida')} />
                    <Separator className="my-2"/>
                    <DetailRow label="Navegador" value={browser} />
                    <DetailRow label="Sistema Operativo" value={os} />
                    <DetailRow label="User Agent" value={log.userAgent} />
                </div>
            </SheetContent>
        </Sheet>
    );
};
