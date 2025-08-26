// src/app/(app)/calendar/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, Loader2, AlertTriangle, Trash2, MapPin, Calendar as CalendarIcon, Clock, Save, ChevronLeft, ChevronRight, Video, Paperclip, Link as LinkIcon, X, Check, List, LayoutGrid, Users, User, Edit } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import type { CalendarEvent, User as AppUser, EventAudienceType, Attachment } from '@/types';
import { format, addMonths, subMonths, startOfMonth, isSameDay, startOfToday, setMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { EventList } from '@/components/calendar/event-sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventDetailsView } from '@/components/calendar/event-details-view';
import { useTitle } from '@/contexts/title-context';
import ColorfulCalendar from '@/components/colorful-calendar';


const eventColors = [
  { value: 'blue', label: 'Evento General', color: 'bg-blue-500' },
  { value: 'green', label: 'Taller/Formación', color: 'bg-green-500' },
  { value: 'red', label: 'Fecha Límite/Urgente', color: 'bg-red-500' },
  { value: 'orange', label: 'Festivo/Vacaciones', color: 'bg-orange-500' },
];


export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); 

  const [isSaving, setIsSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  
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
  
  const canCreateEvent = useMemo(() => user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR', [user]);
  const canEditSelectedEvent = useMemo(() => {
    if (!user || !selectedEvent) return false;
    if (user.role === 'ADMINISTRATOR') return true;
    if (user.role === 'INSTRUCTOR' && selectedEvent.creatorId === user.id) return true;
    return false;
  }, [user, selectedEvent]);

  useEffect(() => {
    setPageTitle('Calendario');
  }, [setPageTitle]);

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
    if (!canCreateEvent) return;
    try {
      const res = await fetch('/api/users/list');
      if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch users");
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudieron cargar los usuarios: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    }
  }, [toast, canCreateEvent]);

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
    setFormColor('blue'); setSelectedEvent(null);
    setFormLocationType('physical');
    setNewAttachmentUrl('');
    setIsEditMode(false);
  }

  const handleOpenCreateModal = (date?: Date) => {
    if (!canCreateEvent) return;
    resetForm();
    const targetDate = date || new Date();
    const dateString = format(targetDate, 'yyyy-MM-dd');
    setFormStartDate(`${dateString}T09:00`);
    setFormEndDate(`${dateString}T10:00`);
    setIsEditMode(true); // Go directly to edit mode for new events
    setShowEventModal(true);
  };
  
  const handleOpenEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
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
    setIsEditMode(false); // Always start in view mode
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
      creatorId: user?.id,
      attachments: formAttachments,
    };

    const endpoint = selectedEvent ? `/api/events/${selectedEvent.id}` : '/api/events';
    const method = selectedEvent ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const updatedEvent = await response.json();
      if (!response.ok) throw new Error(updatedEvent.message || 'Failed to save event');
      toast({ title: 'Éxito', description: `Evento ${selectedEvent ? 'actualizado' : 'creado'}.` });
      fetchEvents();
      if (selectedEvent) {
          setSelectedEvent(updatedEvent); // Update the selected event with new data
          setIsEditMode(false); // Go back to view mode
      } else {
          setShowEventModal(false); // Close modal on new creation
      }
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo guardar: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!canEditSelectedEvent) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (response.status === 204) {
        toast({ title: 'Éxito', description: 'Evento eliminado.' });
        setEvents(prev => prev.filter(event => event.id !== eventId));
        setShowEventModal(false);
        setEventToDelete(null); // Clear deletion state
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
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(setMonth(currentMonth, date.getMonth()));
  };

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
  
  return (
    <div className={cn("flex flex-col h-full md:h-[calc(100vh-8rem)] gap-4 md:gap-6", isMobile && "space-y-4")}>
        <header className="flex-shrink-0 flex items-center gap-4">
             {isMobile ? (
                 <div className="flex-grow"></div>
             ) : (
                <>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4"/></Button>
                    <h1 className="text-2xl font-bold font-headline text-foreground min-w-[150px] sm:min-w-[200px] text-center capitalize">
                        {format(currentMonth, "MMMM yyyy", { locale: es })}
                    </h1>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4"/></Button>
                    <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => { setCurrentMonth(startOfToday()); setSelectedDate(startOfToday()); }}>Hoy</Button>
                </>
             )}
            <div className="ml-auto">
               {canCreateEvent && (
                  <Button size="sm" onClick={() => handleOpenCreateModal(selectedDate)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {!isMobile && 'Crear'}
                  </Button>
               )}
            </div>
        </header>

        <main className={cn("flex-grow min-h-0", isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6')}>
          <div className={cn("md:col-span-2 lg:col-span-3 flex flex-col min-h-0", isMobile ? "" : "bg-card p-2 sm:p-4 border rounded-lg shadow-sm")}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-destructive"><AlertTriangle className="h-8 w-8 mb-2" />Error al cargar: {error}</div>
            ) : (
                <>
                {isMobile ? (
                     <div className="flex justify-center">
                         <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(day) => day && handleDateSelect(day)}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            className="rounded-md border bg-card"
                            locale={es}
                            showOutsideDays
                         />
                     </div>
                ) : (
                    <div className={cn("h-full w-full", "overflow-x-auto thin-scrollbar")}>
                        <ColorfulCalendar
                            className="w-full h-full"
                            month={currentMonth}
                            events={events}
                            onDateSelect={handleDateSelect}
                            onEventClick={handleOpenEventModal}
                            selectedDay={selectedDate}
                        />
                    </div>
                 )}
                </>
            )}
          </div>
          <aside className="md:col-span-1 lg:col-span-1 md:bg-card md:p-4 md:border rounded-lg md:shadow-sm">
            <EventList 
              selectedDate={selectedDate}
              events={eventsForSelectedDate}
              onEditEvent={handleOpenEventModal}
            />
          </aside>
        </main>
      
      <Dialog open={showEventModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowEventModal(isOpen); }}>
        <DialogContent className={cn("w-[95vw] max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-lg", selectedEvent && canEditSelectedEvent && "border-primary shadow-primary/20")}>
          <DialogHeader className="flex flex-row items-center justify-between p-6 pb-0">
            <div className="space-y-1.5">
                <DialogTitle>{(selectedEvent && !isEditMode) ? selectedEvent.title : (isEditMode ? (selectedEvent ? "Editar Evento" : "Crear Evento") : "Detalles del Evento")}</DialogTitle>
                <DialogDescription>{isEditMode ? "Completa los detalles para agendar un nuevo evento." : "Información detallada sobre el evento."}</DialogDescription>
            </div>
             {canEditSelectedEvent && !isEditMode && (
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="icon" onClick={() => setEventToDelete(selectedEvent)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            )}
          </DialogHeader>
           <ScrollArea className="flex-1 pr-3 -mr-6">
                <div className="py-4 px-6 pr-6">
                 {isEditMode ? (
                    <form id="event-form" onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="sm:col-span-2"><Label htmlFor="event-title">Título del Evento</Label><Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving} /></div>
                      <div className="sm:col-span-2 space-y-2">
                          <Label>Ubicación</Label>
                           <RadioGroup value={formLocationType} onValueChange={(v) => setFormLocationType(v as 'physical' | 'virtual')} className="flex gap-4" disabled={isSaving}>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="physical" id="loc-physical"/><Label htmlFor="loc-physical">Física</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="virtual" id="loc-virtual" /><Label htmlFor="loc-virtual">Virtual</Label></div>
                          </RadioGroup>
                          <LocationInput />
                      </div>
                      <div className="sm:col-span-2"><Label htmlFor="event-description">Descripción</Label><Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving} rows={3} /></div>
                      <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"><div className="flex items-center space-x-2 flex-shrink-0"><Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving} /><Label htmlFor="all-day">Todo el día</Label></div>{!formAllDay && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full"><div><Label htmlFor="start-date">Inicio</Label><Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving} /></div><div><Label htmlFor="end-date">Fin</Label><Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving} /></div></div>)}</div>
                      <div className="sm:col-span-2 border-t pt-4 mt-2 space-y-4">
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
                                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setFormAttachments(prev => prev.filter((_, i) => i !== index))}>
                                                  <X className="h-4 w-4"/>
                                              </Button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Color del Evento</Label>
                        <div className="flex flex-wrap gap-3 mt-2 justify-start">
                          {eventColors.map(({ value, color, label }) => (
                            <div key={value} className="flex flex-col items-center gap-1.5" onClick={() => setFormColor(value)} title={label}>
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer",
                                  color,
                                  formColor === value ? 'border-primary ring-2 ring-offset-2 ring-primary scale-110 shadow-lg' : 'border-transparent'
                                )}
                              >
                                {formColor === value && (<Check className="h-5 w-5 text-white" />)}
                              </div>
                              <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2"><Label>Dirigido a</Label><div className="flex items-center gap-2 mt-2"><Users className="h-4 w-4 text-muted-foreground"/><RadioGroup value={formAudienceMode} onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)} className="grid grid-cols-2 md:grid-cols-3 gap-2" disabled={isSaving}><div className="flex items-center space-x-2"><RadioGroupItem value="ALL" id="audience-all" /><Label htmlFor="audience-all">Todos</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" /><Label htmlFor="audience-admin">Admins</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" /><Label htmlFor="audience-instructor">Instructores</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="STUDENT" id="audience-student" /><Label htmlFor="audience-student">Estudiantes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="SPECIFIC" id="audience-specific" /><Label htmlFor="audience-specific">Específicos</Label></div></RadioGroup></div></div>
                      {formAudienceMode === 'SPECIFIC' && (<div className="sm:col-span-2"><Label>Asistentes Específicos</Label><ScrollArea className="h-40 w-full rounded-md border p-2"><div className="space-y-2">{allUsers.length > 0 ? allUsers.map((u) => (<div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-sm transition-colors"><Checkbox id={`attendee-${u.id}`} checked={formAttendees.includes(u.id)} onCheckedChange={(checked) => { return checked ? setFormAttendees([...formAttendees, u.id]) : setFormAttendees(formAttendees.filter((id) => id !== u.id)); }} disabled={isSaving} /><Label htmlFor={`attendee-${u.id}`} className="font-normal cursor-pointer">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></Label></div>)) : <p className="text-sm text-muted-foreground text-center py-4">No hay otros usuarios.</p>}</div></ScrollArea></div>)}
                    </form>
                 ) : selectedEvent ? (
                    <EventDetailsView event={selectedEvent} />
                 ) : null}
                </div>
           </ScrollArea>
           <DialogFooter className="p-6 pt-4 sm:col-span-2 mt-auto flex flex-col-reverse sm:flex-row sm:justify-end w-full gap-2 border-t">
              {isEditMode ? (
                <>
                  <div className="flex-grow">
                     <Button type="button" variant="outline" onClick={() => selectedEvent ? setIsEditMode(false) : setShowEventModal(false)} disabled={isSaving} className="w-full sm:w-auto">Cancelar</Button>
                  </div>
                  <div className="flex justify-end w-full sm:w-auto">
                     <Button form="event-form" type="submit" disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {selectedEvent ? 'Guardar Cambios' : 'Crear Evento'}
                      </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-end w-full">
                  <Button type="button" variant="outline" onClick={() => setShowEventModal(false)} className="w-full sm:w-auto">Cerrar</Button>
                </div>
              )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if(eventToDelete) handleDeleteEvent(eventToDelete.id); }} disabled={isSaving} className={cn(buttonVariants({ variant: "destructive" }))}>{isSaving && <Loader2 className="mr-2 animate-spin" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
