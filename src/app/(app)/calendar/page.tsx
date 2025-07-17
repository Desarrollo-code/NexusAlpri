// src/app/(app)/calendar/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, Loader2, AlertTriangle, Trash2, MapPin, Calendar as CalendarIcon, Clock, Save, ChevronLeft, ChevronRight, Video, Paperclip, Link as LinkIcon, X, Check, List, LayoutGrid, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import type { CalendarEvent, User, EventAudienceType, Attachment } from '@/types';
import { format, addMonths, subMonths, startOfMonth, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import ColorfulCalendar from '@/components/colorful-calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { EventSidebar } from '@/components/calendar/event-sidebar';

const eventColors = [
  { value: 'blue', label: 'Evento General', className: 'bg-event-blue' },
  { value: 'green', label: 'Taller/Formación', className: 'bg-event-green' },
  { value: 'red', label: 'Fecha Límite/Urgente', className: 'bg-event-red' },
  { value: 'orange', label: 'Festivo/Vacaciones', className: 'bg-event-orange' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  
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

  const canEdit = useMemo(() => user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR', [user]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch events');
      const data: CalendarEvent[] = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: `No se pudieron cargar los eventos: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    if (!canEdit) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch users");
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudieron cargar los usuarios: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    }
  }, [toast, canEdit]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchUsers();
    }
  }, [fetchEvents, fetchUsers, user]);

  const resetForm = () => {
    setFormTitle(''); setFormDescription(''); setFormLocation('');
    setFormVideoConferenceLink(''); setFormAttachments([]);
    setFormStartDate(''); setFormEndDate(''); setFormAllDay(true);
    setFormAudienceMode('ALL'); setFormAttendees([]);
    setFormColor('blue'); setEventToEdit(null);
    setFormLocationType('physical');
    setNewAttachmentUrl('');
  }

  const handleOpenCreateModal = (date?: Date) => {
    if (!canEdit) return;
    resetForm();
    const targetDate = date || new Date();
    const dateString = format(targetDate, 'yyyy-MM-dd');
    setFormStartDate(`${dateString}T09:00`);
    setFormEndDate(`${dateString}T10:00`);
    setShowEventModal(true);
  };
  
  const handleOpenEventModal = (event: CalendarEvent) => {
    setEventToEdit(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    
    if (event.videoConferenceLink) {
        setFormLocationType('virtual');
        setFormVideoConferenceLink(event.videoConferenceLink);
        setFormLocation('');
    } else {
        setFormLocationType('physical');
        setFormLocation(event.location || '');
        setFormVideoConferenceLink('');
    }

    setFormAllDay(event.allDay);
    setFormStartDate(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
    setFormEndDate(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));
    setFormAudienceMode(event.audienceType || 'ALL');
    setFormAttendees(event.attendees?.map(a => a.id) || []);
    setFormColor(event.color || 'blue');
    setFormAttachments(event.attachments || []);
    setNewAttachmentUrl('');
    setShowEventModal(true);
  };
  
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

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !user?.id) return;
    setIsSaving(true);

    const payload = {
      title: formTitle, 
      description: formDescription, 
      location: formLocationType === 'physical' ? formLocation : null,
      videoConferenceLink: formLocationType === 'virtual' ? formVideoConferenceLink : null,
      start: new Date(formStartDate).toISOString(), 
      end: new Date(formEndDate).toISOString(),
      allDay: formAllDay, 
      audienceType: formAudienceMode,
      attendeeIds: formAudienceMode === 'SPECIFIC' ? formAttendees : [],
      color: formColor, 
      creatorId: user.id,
      attachments: formAttachments,
    };

    const endpoint = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
    const method = eventToEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const updatedEvent = await response.json();
      if (!response.ok) throw new Error(updatedEvent.message || 'Failed to save event');
      toast({ title: 'Éxito', description: `Evento ${eventToEdit ? 'actualizado' : 'creado'}.` });
      fetchEvents();
      setShowEventModal(false);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo guardar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (response.status === 204) {
        toast({ title: 'Éxito', description: 'Evento eliminado.' });
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete event' }));
        throw new Error(errorData.message);
      }
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo eliminar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const eventsForSelectedDate = useMemo(() => {
    return events.filter(e => isSameDay(new Date(e.start), selectedDate));
  }, [events, selectedDate]);

  const modalTitle = !canEdit && eventToEdit ? "Detalles del Evento" : (eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento');
  const modalDescription = !canEdit && eventToEdit ? "Aquí puedes ver la información del evento." : (eventToEdit ? "Modifica los detalles del evento." : "Completa los detalles para agendar un nuevo evento.");

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
        disabled={isSaving || !canEdit}
        className="pl-10"
        placeholder={formLocationType === 'physical' ? 'Nombre de la sala, dirección...' : 'https://meet.google.com/...'}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4"/></Button>
            <h1 className="text-2xl font-bold font-headline text-foreground min-w-[200px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
            </h1>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4"/></Button>
            <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => setCurrentMonth(startOfToday())}>Hoy</Button>
        </div>

        <main className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-0">
          <div className="md:col-span-2 lg:col-span-3 bg-card p-2 sm:p-4 border rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-destructive"><AlertTriangle className="h-8 w-8 mb-2" />Error al cargar: {error}</div>
            ) : (
              <ColorfulCalendar
                className="w-full h-full"
                month={currentMonth}
                events={events}
                onDateSelect={setSelectedDate}
                onEventClick={handleOpenEventModal}
                selectedDay={selectedDate}
              />
            )}
          </div>
          <aside className="hidden md:block md:col-span-1 lg:col-span-1 bg-card p-4 border rounded-lg shadow-sm">
            <EventSidebar 
              selectedDate={selectedDate}
              events={eventsForSelectedDate}
              onCreateEvent={handleOpenCreateModal}
              onEditEvent={handleOpenEventModal}
            />
          </aside>
        </main>
      
      <Dialog open={showEventModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowEventModal(isOpen); }}>
        <DialogContent className="w-[95vw] max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>{modalTitle}</DialogTitle><DialogDescription>{modalDescription}</DialogDescription></DialogHeader>
          <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="sm:col-span-2"><Label htmlFor="event-title">Título del Evento</Label><Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving || !canEdit} /></div>
            
            <div className="sm:col-span-2 space-y-2">
                <Label>Ubicación</Label>
                <RadioGroup value={formLocationType} onValueChange={(v) => setFormLocationType(v as 'physical' | 'virtual')} className="flex gap-4" disabled={isSaving || !canEdit}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="physical" id="loc-physical"/><Label htmlFor="loc-physical">Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="virtual" id="loc-virtual" /><Label htmlFor="loc-virtual">Virtual</Label></div>
                </RadioGroup>
                <LocationInput />
            </div>

            <div className="sm:col-span-2"><Label htmlFor="event-description">Descripción (Opcional)</Label><Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving || !canEdit} rows={3} /></div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"><div className="flex items-center space-x-2 flex-shrink-0"><Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving || !canEdit} /><Label htmlFor="all-day">Todo el día</Label></div>{!formAllDay && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full"><div><Label htmlFor="start-date">Inicio</Label><Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving || !canEdit} /></div><div><Label htmlFor="end-date">Fin</Label><Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving || !canEdit} /></div></div>)}</div>
            
            <div className="sm:col-span-2 border-t pt-4 mt-2 space-y-4">
                <div className="space-y-2">
                    <Label>Adjuntos (Enlaces a documentos, etc.)</Label>
                    <div className="flex gap-2">
                        <Input placeholder="Pega una URL aquí" value={newAttachmentUrl} onChange={(e) => setNewAttachmentUrl(e.target.value)} disabled={isSaving || !canEdit}/>
                        <Button type="button" variant="outline" onClick={handleAddAttachment} disabled={isSaving || !canEdit}>Añadir</Button>
                    </div>
                    {formAttachments.length > 0 && (
                        <div className="space-y-2 rounded-md border p-2">
                            {formAttachments.map((att, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                                        <LinkIcon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{att.name}</span>
                                    </a>
                                    {canEdit && <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setFormAttachments(prev => prev.filter((_, i) => i !== index))}>
                                        <X className="h-4 w-4"/>
                                    </Button>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="sm:col-span-2"><Label>Color del Evento</Label><div className="flex flex-wrap gap-3 mt-2 justify-start">{eventColors.map(({ value, className, label }) => (<div key={value} className="flex flex-col items-center gap-1"><div className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-in-out", formColor === value ? 'border-primary scale-110' : 'border-transparent', canEdit ? "cursor-pointer" : "cursor-default", className)} onClick={() => canEdit && setFormColor(value)} title={label}>{formColor === value && (<Check className="h-4 w-4 text-white" />)}</div><span className="text-xs text-muted-foreground">{label}</span></div>))}</div></div>
            <div className="sm:col-span-2"><Label>Dirigido a</Label><div className="flex items-center gap-2 mt-2"><Users className="h-4 w-4 text-muted-foreground"/><RadioGroup value={formAudienceMode} onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)} className="grid grid-cols-2 md:grid-cols-3 gap-2" disabled={isSaving || !canEdit}><div className="flex items-center space-x-2"><RadioGroupItem value="ALL" id="audience-all" /><Label htmlFor="audience-all">Todos</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" /><Label htmlFor="audience-admin">Admins</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" /><Label htmlFor="audience-instructor">Instructores</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="STUDENT" id="audience-student" /><Label htmlFor="audience-student">Estudiantes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="SPECIFIC" id="audience-specific" /><Label htmlFor="audience-specific">Específicos</Label></div></RadioGroup></div></div>
            {canEdit && formAudienceMode === 'SPECIFIC' && (<div className="sm:col-span-2"><Label>Asistentes Específicos</Label><ScrollArea className="h-40 w-full rounded-md border p-2"><div className="space-y-2">{allUsers.length > 0 ? allUsers.map((u) => (<div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-sm transition-colors"><Checkbox id={`attendee-${u.id}`} checked={formAttendees.includes(u.id)} onCheckedChange={(checked) => { return checked ? setFormAttendees([...formAttendees, u.id]) : setFormAttendees(formAttendees.filter((id) => id !== u.id)); }} disabled={isSaving || !canEdit} /><Label htmlFor={`attendee-${u.id}`} className="font-normal cursor-pointer">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></Label></div>)) : <p className="text-sm text-muted-foreground text-center py-4">No hay otros usuarios.</p>}</div></ScrollArea></div>)}
            <DialogFooter className="sm:col-span-2 mt-4 flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">{canEdit ? (<>{eventToEdit && (<div><Button type="button" variant="destructive" onClick={() => { setEventToDelete(eventToEdit); setShowEventModal(false); }} disabled={isSaving} className="w-full sm:w-auto"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></div>)}<div className="flex flex-col-reverse sm:flex-row gap-2"><Button type="button" variant="outline" onClick={() => setShowEventModal(false)} disabled={isSaving} className="w-full sm:w-auto">Cancelar</Button><Button type="submit" disabled={isSaving} className="w-full sm:w-auto">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (eventToEdit ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)} {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}</Button></div></>) : (<div className="flex justify-end w-full"><Button type="button" variant="outline" onClick={() => setShowEventModal(false)} className="w-full sm:w-auto">Cerrar</Button></div>)}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if(eventToDelete) handleDeleteEvent(eventToDelete.id); setEventToDelete(null); }} disabled={isSaving} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{isSaving && <Loader2 className="mr-2 animate-spin" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
