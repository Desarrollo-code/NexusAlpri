// src/app/(app)/calendar/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, Loader2, AlertTriangle, Trash2, MapPin, Calendar as CalendarIcon, Clock, Check, Save, ChevronLeft, ChevronRight, Eye, List, LayoutGrid } from 'lucide-react';
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
import type { CalendarEvent, User, EventAudienceType } from '@/types';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import ColorfulCalendar from '@/components/colorful-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const getEventColorClass = (color?: string): string => {
  switch (color) {
    case 'blue': return 'bg-event-blue text-white';
    case 'green': return 'bg-event-green text-white';
    case 'red': return 'bg-event-red text-white';
    case 'orange': return 'bg-event-orange text-white';
    default: return 'bg-primary text-primary-foreground';
  }
};

const eventColors = [
  { value: 'blue', label: 'Evento General', className: 'bg-event-blue' },
  { value: 'green', label: 'Taller/Formación', className: 'bg-event-green' },
  { value: 'red', label: 'Fecha Límite/Urgente', className: 'bg-event-red' },
  { value: 'orange', label: 'Festivo/Vacaciones', className: 'bg-event-orange' },
];


export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formAllDay, setFormAllDay] = useState(true);
  const [formAudienceMode, setFormAudienceMode] = useState<EventAudienceType>('ALL');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [formColor, setFormColor] = useState<string>('blue');

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
    setFormStartDate(''); setFormEndDate(''); setFormAllDay(true);
    setFormAudienceMode('ALL'); setFormAttendees([]);
    setFormColor('blue'); setEventToEdit(null);
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
    setFormTitle(event.title); setFormDescription(event.description || '');
    setFormLocation(event.location || ''); setFormAllDay(event.allDay);
    setFormStartDate(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
    setFormEndDate(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));
    setFormAudienceMode(event.audienceType || 'ALL');
    setFormAttendees(event.attendees?.map(a => a.id) || []);
    setFormColor(event.color || 'blue');
    setShowEventModal(true);
  }
  
  const handleDayClick = (day: Date, eventsOnDay: CalendarEvent[]) => {
      setSelectedDayEvents(eventsOnDay);
      setShowDayEventsModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !user?.id) return;
    setIsSaving(true);
    const payload = {
      title: formTitle, description: formDescription, location: formLocation,
      start: new Date(formStartDate).toISOString(), end: new Date(formEndDate).toISOString(),
      allDay: formAllDay, audienceType: formAudienceMode,
      attendeeIds: formAudienceMode === 'SPECIFIC' ? formAttendees : [],
      color: formColor, creatorId: user.id
    };
    const endpoint = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
    const method = eventToEdit ? 'PUT' : 'POST';
    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const updatedEvent = await response.json();
      if (!response.ok) throw new Error(updatedEvent.message || 'Failed to save event');
      toast({ title: 'Éxito', description: `Evento ${eventToEdit ? 'actualizado' : 'creado'}.` });
      fetchEvents(); // Refetch all events to update the calendar
      setShowEventModal(false);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo guardar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete || !canEdit) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete event');
      toast({ title: 'Éxito', description: 'Evento eliminado.' });
      setEvents(prev => prev.filter(event => event.id !== eventToDelete.id));
      setEventToDelete(null); 
      setShowEventModal(false); 
      setShowDayEventsModal(false);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo eliminar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleOpenDeleteDialogFromModal = () => {
      if (eventToEdit) {
        setEventToDelete(eventToEdit);
        setShowEventModal(false);
      }
  };

  const modalTitle = !canEdit && eventToEdit ? "Detalles del Evento" : (eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento');
  const modalDescription = !canEdit && eventToEdit ? "Aquí puedes ver la información del evento." : (eventToEdit ? "Modifica los detalles del evento." : "Completa los detalles para agendar un nuevo evento.");

  const AgendaView = () => {
    const upcomingEvents = events
      .filter(event => new Date(event.start) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return (
      <div className="space-y-4">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <Card key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenEventModal(event)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center text-center w-16">
                    <span className="text-sm font-semibold text-primary uppercase">{format(new Date(event.start), 'MMM', { locale: es })}</span>
                    <span className="text-2xl font-bold">{format(new Date(event.start), 'd')}</span>
                </div>
                <div className={cn('w-1.5 h-16 rounded-full', getEventColorClass(event.color || 'blue'))}></div>
                <div className="flex-grow">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Clock className="h-4 w-4" />
                        {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'p', { locale: es })} - ${format(new Date(event.end), 'p', { locale: es })}`}
                    </p>
                    {event.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin className="h-4 w-4" />{event.location}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No hay eventos próximos.</p>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-primary">Calendario Corporativo</h1>
          <p className="text-muted-foreground">Coordina, planifica y visualiza los eventos de tu organización.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4"/></Button>
            <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4"/></Button>
            <Button variant="outline" size="icon" onClick={() => setViewMode(prev => prev === 'month' ? 'agenda' : 'month')}>
                {viewMode === 'month' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
            {canEdit && <Button onClick={() => handleOpenCreateModal()}><PlusCircle className="mr-2 h-4 w-4" /> Crear Evento</Button>}
        </div>
      </div>
      
      {viewMode === 'month' ? (
          <>
            <Card className="max-w-full mx-auto w-full shadow-lg bg-card text-foreground border-border p-2 sm:p-4">
                {isLoading ? (
                <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : error ? (
                <div className="flex flex-col items-center justify-center h-96 text-destructive"><AlertTriangle className="h-8 w-8 mb-2" />Error al cargar: {error}</div>
                ) : (
                <ColorfulCalendar
                    className="w-full"
                    events={events}
                    onDateSelect={handleDayClick}
                    numberOfMonths={1}
                    month={currentDate}
                />
                )}
            </Card>
            <Card className="p-4 shadow-lg max-w-full mx-auto w-full">
                <h3 className="text-lg font-semibold mb-3">Leyenda</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {eventColors.map(colorInfo => (
                    <div key={colorInfo.value} className="flex items-center gap-2">
                        <div className={cn('h-4 w-4 rounded-full', colorInfo.className)}></div>
                        <span className="text-sm text-muted-foreground">{colorInfo.label}</span>
                    </div>
                    ))}
                </div>
            </Card>
          </>
      ) : (
          <AgendaView />
      )}
      
      <Dialog open={showDayEventsModal} onOpenChange={setShowDayEventsModal}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Eventos del {selectedDayEvents.length > 0 ? format(new Date(selectedDayEvents[0].start), "d 'de' MMMM", { locale: es }) : ''}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                <div className="space-y-3">
                  {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => (
                      <div key={event.id} className="p-3 rounded-lg border border-border flex items-start gap-3">
                           <div className={cn('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', getEventColorClass(event.color || 'blue'))}></div>
                           <div className="flex-grow">
                             <p className="font-semibold text-sm text-foreground">{event.title}</p>
                             <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                               <Clock className="h-3 w-3" />
                               {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'p', { locale: es })} - ${format(new Date(event.end), 'p', { locale: es })}`}
                             </p>
                             {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin className="h-3 w-3" />{event.location}</p>}
                             {event.description && <p className="text-xs text-muted-foreground mt-2">{event.description}</p>}
                           </div>
                           <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowDayEventsModal(false); handleOpenEventModal(event); }}><Eye className="h-4 w-4"/></Button>
                           </div>
                      </div>
                  )) : (
                      <p className="text-center text-muted-foreground py-4">No hay eventos para este día.</p>
                  )}
              </div>
              </ScrollArea>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDayEventsModal(false)}>Cerrar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={showEventModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowEventModal(isOpen); }}>
        <DialogContent className="w-[95vw] max-w-2xl overflow-y-auto max-h-[90vh] bg-card">
          <DialogHeader><DialogTitle className="text-foreground">{modalTitle}</DialogTitle><DialogDescription className="text-muted-foreground">{modalDescription}</DialogDescription></DialogHeader>
          <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="sm:col-span-2"><Label htmlFor="event-title" className="text-foreground">Título del Evento</Label><Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving || !canEdit} className="bg-input text-foreground border-border" /></div>
            <div className="sm:col-span-2"><Label htmlFor="event-location" className="text-foreground">Ubicación (Ej: Sala 3, Zoom)</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="event-location" value={formLocation} onChange={e => setFormLocation(e.target.value)} disabled={isSaving || !canEdit} className="pl-10 bg-input text-foreground border-border" /></div></div>
            <div className="sm:col-span-2"><Label htmlFor="event-description" className="text-foreground">Descripción (Opcional)</Label><Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving || !canEdit} rows={3} className="bg-input text-foreground border-border" /></div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"><div className="flex items-center space-x-2 flex-shrink-0"><Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving || !canEdit} /><Label htmlFor="all-day" className="text-foreground">Todo el día</Label></div>{!formAllDay && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full"><div><Label htmlFor="start-date" className="text-foreground">Inicio</Label><Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving || !canEdit} className="bg-input text-foreground border-border" /></div><div><Label htmlFor="end-date" className="text-foreground">Fin</Label><Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving || !canEdit} className="bg-input text-foreground border-border" /></div></div>)}</div>
            <div className="sm:col-span-2"><Label className="text-foreground">Color del Evento</Label><div className="flex flex-wrap gap-3 mt-2 justify-start">{eventColors.map(({ value, className }) => (<div key={value} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-in-out", formColor === value ? 'border-primary scale-110' : 'border-transparent', canEdit ? "cursor-pointer" : "cursor-default", className)} onClick={() => canEdit && setFormColor(value)} title={value}>{formColor === value && (<Check className="h-4 w-4 text-white" />)}</div>))}</div></div>
            <div className="sm:col-span-2"><Label className="text-foreground">Dirigido a</Label><RadioGroup value={formAudienceMode} onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)} className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2" disabled={isSaving || !canEdit}><div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="ALL" id="audience-all" /><Label htmlFor="audience-all">Todos</Label></div><div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" /><Label htmlFor="audience-admin">Admins</Label></div><div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" /><Label htmlFor="audience-instructor">Instructores</Label></div><div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="STUDENT" id="audience-student" /><Label htmlFor="audience-student">Estudiantes</Label></div><div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="SPECIFIC" id="audience-specific" /><Label htmlFor="audience-specific">Específicos</Label></div></RadioGroup></div>
            {canEdit && formAudienceMode === 'SPECIFIC' && (<div className="sm:col-span-2"><Label className="text-foreground">Asistentes Específicos</Label><ScrollArea className="h-40 w-full rounded-md border border-border p-2 bg-input"><div className="space-y-2">{allUsers.length > 0 ? allUsers.map((u) => (<div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-accent/50 rounded-sm transition-colors"><Checkbox id={`attendee-${u.id}`} checked={formAttendees.includes(u.id)} onCheckedChange={(checked) => { return checked ? setFormAttendees([...formAttendees, u.id]) : setFormAttendees(formAttendees.filter((id) => id !== u.id)); }} disabled={isSaving || !canEdit} /><Label htmlFor={`attendee-${u.id}`} className="font-normal cursor-pointer text-foreground">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></Label></div>)) : <p className="text-sm text-muted-foreground text-center py-4">No hay otros usuarios.</p>}</div></ScrollArea></div>)}
            <DialogFooter className="sm:col-span-2 mt-4 flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">{canEdit ? (<>{eventToEdit && (<div><Button type="button" variant="destructive" onClick={handleOpenDeleteDialogFromModal} disabled={isSaving} className="w-full sm:w-auto"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></div>)}<div className="flex flex-col-reverse sm:flex-row gap-2"><Button type="button" variant="outline" onClick={() => setShowEventModal(false)} disabled={isSaving} className="w-full sm:w-auto">Cancelar</Button><Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (eventToEdit ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)} {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}</Button></div></>) : (<div className="flex justify-end w-full"><Button type="button" variant="outline" onClick={() => setShowEventModal(false)} className="w-full sm:w-auto">Cerrar</Button></div>)}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent className="bg-card text-foreground border-border w-[95vw] max-w-md"><AlertDialogHeader><AlertDialogTitle className="text-foreground">¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteEvent} disabled={isSaving} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{isSaving && <Loader2 className="mr-2 animate-spin" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
