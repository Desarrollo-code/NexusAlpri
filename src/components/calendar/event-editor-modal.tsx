// src/components/calendar/event-editor-modal.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalendarEvent, User as AppUser, EventAudienceType, Attachment, RecurrenceType } from '@/types';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { EventDetailsView } from '@/components/calendar/event-details-view';
import { Separator } from '@/components/ui/separator';
import { Identicon } from '@/components/ui/identicon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, MapPin, Video, Link as LinkIcon, X, Check, Users, Edit, Trash2, Repeat, CalendarIcon, Hand } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const eventColors = [
  { value: 'blue', label: 'Evento General', color: 'bg-event-blue' },
  { value: 'green', label: 'Taller/Formación', color: 'bg-event-green' },
  { value: 'orange', label: 'Festivo/Importante', color: 'bg-event-orange' },
  { value: 'red', label: 'Fecha Límite/Urgente', color: 'bg-event-red' },
];

interface EventEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    selectedDate?: Date;
    onEventUpdate: (event: CalendarEvent) => void;
    onEventDelete: (eventId: string) => void;
}

export function EventEditorModal({ isOpen, onClose, event, selectedDate, onEventUpdate, onEventDelete }: EventEditorModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLocationType, setFormLocationType] = useState<'physical' | 'virtual'>('physical');
    const [formLocation, setFormLocation] = useState('');
    const [formVideoConferenceLink, setFormVideoConferenceLink] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formAllDay, setFormAllDay] = useState(true);
    const [formAudienceMode, setFormAudienceMode] = useState<EventAudienceType>('ALL');
    const [formAttendees, setFormAttendees] = useState<string[]>([]);
    const [formColor, setFormColor] = useState<string>('blue');
    const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);
    const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [formRecurrence, setFormRecurrence] = useState<RecurrenceType>('NONE');
    const [formRecurrenceEndDate, setFormRecurrenceEndDate] = useState<Date | undefined>(undefined);
    const [formIsInteractive, setFormIsInteractive] = useState(false);

    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);

    const canEditSelectedEvent = useMemo(() => {
        if (!user || !event) return false;
        if (user.role === 'ADMINISTRATOR') return true;
        if (user.role === 'INSTRUCTOR' && event.creatorId === user.id) return true;
        return false;
    }, [user, event]);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                 setIsEditMode(false);
                 setEventToDelete(null);
            }, 200);
            return;
        }

        if (event) { // Editing existing event
            setFormTitle(event.title);
            setFormDescription(event.description || '');
            setFormLocationType(event.videoConferenceLink ? 'virtual' : 'physical');
            setFormLocation(event.location || '');
            setFormVideoConferenceLink(event.videoConferenceLink || '');
            setFormAllDay(event.allDay);
            setFormStartDate(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
            setFormEndDate(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));
            setFormAudienceMode(event.audienceType || 'ALL');
            setFormAttendees(event.attendees?.map(a => a.id) || []);
            setFormColor(event.color || 'blue');
            setFormAttachments(event.attachments || []);
            setFormRecurrence(event.recurrence || 'NONE');
            setFormRecurrenceEndDate(event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined);
            setFormIsInteractive(event.isInteractive || false);
            setIsEditMode(false);
        } else { // Creating new event
            const targetDate = selectedDate || new Date();
            const dateString = format(targetDate, 'yyyy-MM-dd');
            setFormTitle('');
            setFormDescription('');
            setFormLocation('');
            setFormVideoConferenceLink('');
            setFormAllDay(true);
            setFormStartDate(`${dateString}T09:00`);
            setFormEndDate(`${dateString}T10:00`);
            setFormAudienceMode('ALL');
            setFormAttendees([]);
            setFormColor('blue');
            setFormAttachments([]);
            setFormRecurrence('NONE');
            setFormRecurrenceEndDate(undefined);
            setFormIsInteractive(false);
            setIsEditMode(true);
        }

    }, [event, selectedDate, isOpen]);
    
    useEffect(() => {
        if (isOpen && (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR')) {
            fetch('/api/users/list')
                .then(res => res.json())
                .then(data => setAllUsers(data.users.filter((u:AppUser) => u.id !== user?.id)))
        }
    }, [isOpen, user]);

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            title: formTitle, description: formDescription,
            location: formLocationType === 'physical' ? formLocation : null,
            videoConferenceLink: formLocationType === 'virtual' ? formVideoConferenceLink : null,
            start: new Date(formStartDate).toISOString(), end: new Date(formEndDate).toISOString(),
            allDay: formAllDay, audienceType: formAudienceMode,
            attendeeIds: formAudienceMode === 'SPECIFIC' ? formAttendees : [],
            color: formColor, attachments: formAttachments,
            recurrence: formRecurrence,
            recurrenceEndDate: formRecurrence !== 'NONE' ? formRecurrenceEndDate?.toISOString() : null,
            isInteractive: formIsInteractive,
        };

        const endpoint = event ? `/api/events/${event.id}` : '/api/events';
        const method = event ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const updatedEvent = await response.json();
            if (!response.ok) throw new Error(updatedEvent.message || 'Failed to save event');
            
            toast({ title: 'Éxito', description: `Evento ${event ? 'actualizado' : 'creado'}.` });
            onEventUpdate(updatedEvent);
            if (event) {
                setIsEditMode(false);
            } else {
                onClose();
            }
        } catch (err) {
            toast({ title: 'Error', description: `No se pudo guardar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/events/${eventToDelete.id}`, { method: 'DELETE' });
            if (response.status !== 204) throw new Error((await response.json()).message || 'Failed to delete event');
            
            toast({ title: 'Éxito', description: 'Evento eliminado.' });
            onEventDelete(eventToDelete.id);
            onClose();
        } catch (err) {
            toast({ title: 'Error', description: `No se pudo eliminar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
            setEventToDelete(null);
        }
    }
    
    const handleAddAttachment = () => {
      if (newAttachmentUrl.trim()) {
          try {
              new URL(newAttachmentUrl); // Validate URL
              setFormAttachments(prev => [...prev, { url: newAttachmentUrl.trim(), name: newAttachmentUrl.trim() }]);
              setNewAttachmentUrl('');
          } catch (_) {
              toast({ title: "URL Inválida", description: "Por favor, ingresa una URL válida.", variant: "destructive" });
          }
      }
    };
    
    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
    }, [allUsers, userSearch]);

    const handleUserShareToggle = (userId: string, checked: boolean) => {
      setFormAttendees(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
    }

    const LocationInput = () => (
      <div className="relative">
        {formLocationType === 'physical' ? (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        ) : (
          <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          id={formLocationType === 'physical' ? 'event-location' : 'event-video-link'}
          type={formLocationType === 'physical' ? 'text' : 'url'}
          value={formLocationType === 'physical' ? formLocation : formVideoConferenceLink}
          onChange={e => formLocationType === 'physical' ? setFormLocation(e.target.value) : setFormVideoConferenceLink(e.target.value)}
          disabled={isSaving}
          className="pl-10"
          placeholder={formLocationType === 'physical' ? 'Nombre de la sala, dirección...' : 'https://meet.google.com/...'}
        />
      </div>
    );
    
    const renderContent = () => {
        if (isEditMode) {
           return (
              <form id="event-form" onSubmit={handleSaveEvent} className="space-y-4">
                  <div><Label htmlFor="event-title">Título del Evento</Label><Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving} /></div>
                  <div className="space-y-2">
                      <Label>Ubicación</Label>
                       <RadioGroup value={formLocationType} onValueChange={(v) => setFormLocationType(v as 'physical' | 'virtual')} className="flex gap-4" disabled={isSaving}>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="physical" id="loc-physical"/><Label htmlFor="loc-physical">Física</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="virtual" id="loc-virtual" /><Label htmlFor="loc-virtual">Virtual</Label></div>
                      </RadioGroup>
                      <LocationInput />
                  </div>
                  <div><Label htmlFor="event-description">Descripción</Label><Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving} rows={3} /></div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"><div className="flex items-center space-x-2 flex-shrink-0"><Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving} /><Label htmlFor="all-day">Todo el día</Label></div>{!formAllDay && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full"><div><Label htmlFor="start-date">Inicio</Label><Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving} /></div><div><Label htmlFor="end-date">Fin</Label><Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving} /></div></div>)}</div>
                  <div className="space-y-2">
                      <Label>Color del Evento</Label>
                      <RadioGroup value={formColor} onValueChange={setFormColor} className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 mt-2 justify-start">
                        {eventColors.map(({ value, color, label }) => (
                          <div key={value}>
                             <RadioGroupItem value={value} id={`color-${value}`} className="sr-only" />
                             <Label 
                                htmlFor={`color-${value}`}
                                className={cn(
                                    "flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-colors",
                                    formColor === value ? "border-primary ring-2 ring-primary" : "border-muted-foreground/20 hover:border-primary/50"
                                )}
                             >
                                <div className={cn("w-5 h-5 rounded-full mb-1.5", color)} />
                                <span className="text-xs font-medium">{label}</span>
                             </Label>
                          </div>
                        ))}
                      </RadioGroup>
                  </div>
                  <Separator />
                   <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Repeat className="h-4 w-4"/> Recurrencia</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select value={formRecurrence} onValueChange={(v) => setFormRecurrence(v as RecurrenceType)}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="NONE">No se repite</SelectItem>
                              <SelectItem value="DAILY">Diariamente</SelectItem>
                              <SelectItem value="WEEKLY">Semanalmente</SelectItem>
                              <SelectItem value="MONTHLY">Mensualmente</SelectItem>
                              <SelectItem value="YEARLY">Anualmente</SelectItem>
                          </SelectContent>
                        </Select>
                        {formRecurrence !== 'NONE' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("justify-start text-left font-normal", !formRecurrenceEndDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formRecurrenceEndDate ? format(formRecurrenceEndDate, "PPP", {locale: es}) : <span>Fin de la repetición</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formRecurrenceEndDate} onSelect={setFormRecurrenceEndDate} initialFocus locale={es}/></PopoverContent>
                            </Popover>
                        )}
                      </div>
                  </div>
                  <Separator />
                   <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="is-interactive" className="flex items-center gap-2 font-semibold">
                            <Hand className="h-4 w-4 text-primary"/> Evento Interactivo
                        </Label>
                        <Switch id="is-interactive" checked={formIsInteractive} onCheckedChange={setFormIsInteractive} disabled={isSaving}/>
                     </div>
                     <p className="text-xs text-muted-foreground">Si se activa, los usuarios verán una alerta el día del evento para confirmar su participación.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                        <Label>Adjuntos</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Pega una URL aquí" value={newAttachmentUrl} onChange={(e) => setNewAttachmentUrl(e.target.value)} disabled={isSaving}/>
                            <Button type="button" variant="outline" onClick={handleAddAttachment} disabled={isSaving}>Añadir</Button>
                        </div>
                        {formAttachments.length > 0 && (
                            <div className="space-y-2 rounded-md border p-2">
                                {formAttachments.map((att, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                                            <LinkIcon className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{att.name}</span>
                                        </a>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setFormAttachments(prev => prev.filter((_, i) => i !== index))}><X className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dirigido a</Label><RadioGroup value={formAudienceMode} onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)} className="grid grid-cols-2 md:grid-cols-3 gap-2" disabled={isSaving}><div className="flex items-center space-x-2"><RadioGroupItem value="ALL" id="audience-all" /><Label htmlFor="audience-all">Todos</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" /><Label htmlFor="audience-admin">Administradores</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" /><Label htmlFor="audience-instructor">Instructores</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="STUDENT" id="audience-student" /><Label htmlFor="audience-student">Estudiantes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="SPECIFIC" id="audience-specific" /><Label htmlFor="audience-specific">Específicos</Label></div></RadioGroup>
                    </div>
                    {formAudienceMode === 'SPECIFIC' && (<div><Label>Asistentes Específicos</Label><div className="p-3 border rounded-lg"><Input placeholder="Buscar usuarios para compartir..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                            <ScrollArea className="h-32">
                                <div className="space-y-2">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                                        <Checkbox id={`attendee-${u.id}`} checked={formAttendees.includes(u.id)} onCheckedChange={c => handleUserShareToggle(u.id, !!c)} />
                                        <Label htmlFor={`attendee-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                                            <Avatar className="h-7 w-7"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id}/></AvatarFallback></Avatar>
                                            {u.name}
                                        </Label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea></div></div>)}
                </form>
            );
        }
        if (event) {
            return <EventDetailsView event={event} />;
        }
        return null;
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className={cn("w-[95vw] max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-lg", event && canEditSelectedEvent && "border-primary shadow-primary/20")}>
                    <DialogHeader className="flex flex-row items-center justify-between p-6 pb-0">
                        <div className="space-y-1.5">
                            <DialogTitle>{(event && !isEditMode) ? event.title : (isEditMode ? (event ? "Editar Evento" : "Crear Evento") : "Detalles del Evento")}</DialogTitle>
                            <DialogDescription>{isEditMode ? "Completa los detalles del evento." : "Información detallada sobre el evento."}</DialogDescription>
                        </div>
                        {event && canEditSelectedEvent && !isEditMode && (
                            <div className="flex items-center gap-2">
                                {event.isInteractive && <Button variant="secondary" size="sm" onClick={() => setShowParticipantsModal(true)}>Ver Participantes</Button>}
                                <Button variant="destructive" size="icon" onClick={() => setEventToDelete(event)}><Trash2 className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}><Edit className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 pr-6 thin-scrollbar">
                        {renderContent()}
                    </div>
                    <DialogFooter className="p-6 pt-4 sm:col-span-2 flex flex-row w-full justify-end gap-2 border-t">
                        {isEditMode ? (
                            <>
                                <Button type="button" variant="outline" onClick={() => event ? setIsEditMode(false) : onClose()} disabled={isSaving}>Cancelar</Button>
                                <Button form="event-form" type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {event ? 'Guardar Cambios' : 'Crear Evento'}
                                </Button>
                            </>
                        ) : (
                            <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0"><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteEvent} disabled={isSaving} className={cn(buttonVariants({ variant: "destructive" }))}>{isSaving && <Loader2 className="mr-2 animate-spin" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
            
            {event && <ParticipantsModal isOpen={showParticipantsModal} onClose={() => setShowParticipantsModal(false)} event={event} />}
        </>
    )
}

const ParticipantsModal = ({ isOpen, onClose, event }: { isOpen: boolean, onClose: () => void, event: CalendarEvent }) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && event) {
            setIsLoading(true);
            fetch(`/api/events/participations?eventId=${event.parentId || event.id}&occurrenceDate=${new Date(event.start).toISOString()}`)
                .then(res => res.json())
                .then(data => setParticipants(data))
                .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de participantes.", variant: "destructive"}))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, event, toast]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Participantes de "{event.title}"</DialogTitle>
                    <DialogDescription>
                        Usuarios que confirmaron su participación el {format(new Date(event.start), "d 'de' MMMM", {locale: es})}.
                    </DialogDescription>
                </DialogHeader>
                 <ScrollArea className="max-h-80">
                    {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div> :
                     participants.length > 0 ? (
                        <div className="space-y-3 p-1">
                          {participants.map(p => (
                             <div key={p.id} className="flex items-center gap-3">
                                 <Avatar className="h-9 w-9"><AvatarImage src={p.user.avatar || ''}/><AvatarFallback><Identicon userId={p.userId}/></AvatarFallback></Avatar>
                                 <p className="font-medium">{p.user.name}</p>
                             </div>
                          ))}
                        </div>
                     ) : (
                         <p className="text-center text-sm text-muted-foreground p-8">Nadie ha confirmado su participación todavía.</p>
                     )}
                 </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
