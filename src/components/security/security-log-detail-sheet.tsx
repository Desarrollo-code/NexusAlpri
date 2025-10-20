// src/components/security/security-log-detail-sheet.tsx
'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getEventDetails, parseUserAgent } from "@/lib/security-log-utils";
import type { SecurityLog } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DetailRow = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b">
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
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-3">
                        <Badge variant={eventUI.variant} className="px-3 py-1 text-sm">{eventUI.label}</Badge>
                        Detalle del Evento
                    </SheetTitle>
                    <SheetDescription>
                         {format(new Date(log.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm:ss", { locale: es })}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <DetailRow label="ID del Evento" value={log.id} />
                    <DetailRow label="Usuario" value={log.user?.name || log.emailAttempt} />
                    <DetailRow label="Descripción" value={eventUI.details} />
                    <Separator />
                    <DetailRow label="Dirección IP" value={log.ipAddress} />
                    <DetailRow label="Ubicación" value={log.city && log.country ? `${log.city}, ${log.country}` : (log.country || 'Desconocida')} />
                    <Separator />
                    <DetailRow label="Navegador" value={browser} />
                    <DetailRow label="Sistema Operativo" value={os} />
                    <DetailRow label="User Agent" value={log.userAgent} />
                </div>
            </SheetContent>
        </Sheet>
    );
};
