// src/app/(app)/calendar/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, Loader2, AlertTriangle, Trash2, MapPin, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
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
import type { CalendarEvent, User, EventAudienceType } from '@/types'; // Importa tus tipos
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import ColorfulCalendar from '@/components/colorful-calendar'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // State for the new layout
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formAllDay, setFormAllDay] = useState(true);
  const [formAudienceMode, setFormAudienceMode] = useState<EventAudienceType>('SPECIFIC');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  // Nuevo estado para el color del evento en el formulario
  const [formColor, setFormColor] = useState<string>('default'); // Default color

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data: CalendarEvent[] = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: "No se pudieron cargar los eventos del calendario.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (err) {
      toast({ title: 'Error', description: "No se pudieron cargar los usuarios para la lista de asistentes.", variant: 'destructive' });
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchUsers();
    }
  }, [fetchEvents, fetchUsers, user]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormLocation('');
    setFormStartDate('');
    setFormEndDate('');
    setFormAllDay(true);
    setFormAudienceMode('SPECIFIC');
    setFormAttendees([]);
    setFormColor('default'); // Restablecer color a default
    setEventToEdit(null);
  }

  const handleOpenCreateModal = (date?: Date) => {
    resetForm();
    const targetDate = date || new Date();
    const dateString = format(targetDate, 'yyyy-MM-dd');
    setFormStartDate(`${dateString}T09:00`); // Hora por defecto
    setFormEndDate(`${dateString}T10:00`); // Hora por defecto
    setShowEventModal(true);
  };

  const handleOpenEditModal = (event: CalendarEvent) => {
    setEventToEdit(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormLocation(event.location || '');
    setFormAllDay(event.allDay);
    // Format dates for datetime-local input
    const start = new Date(event.start);
    const end = new Date(event.end);
    setFormStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
    setFormEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    setFormAudienceMode(event.audienceType || 'SPECIFIC');
    setFormAttendees(event.attendees?.map(a => a.id) || []);
    setFormColor(event.color || 'default'); // Carga el color del evento al editar
    setShowEventModal(true);
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title: formTitle,
      description: formDescription,
      location: formLocation,
      start: new Date(formStartDate).toISOString(),
      end: new Date(formEndDate).toISOString(),
      allDay: formAllDay,
      audienceType: formAudienceMode,
      attendeeIds: formAudienceMode === 'SPECIFIC' ? formAttendees : [],
      color: formColor, // Envía el color al backend
    };

    const endpoint = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
    const method = eventToEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

      toast({ title: 'Éxito', description: `Evento ${eventToEdit ? 'actualizado' : 'creado'} correctamente.` });
      setShowEventModal(false);
      fetchEvents();
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo guardar el evento.`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete event');
      toast({ title: 'Éxito', description: 'Evento eliminado.' });
      setEventToDelete(null);
      fetchEvents();
      setShowEventModal(false); // Close edit modal if it was open for the deleted event
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar el evento.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  // Los eventos para el calendario se pasan directamente, sin necesidad de FullCalendar formatting
  const calendarEvents = useMemo(() => events, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter(event => isSameDay(new Date(event.start), selectedDate))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, selectedDate]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="shadow-lg lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive"><AlertTriangle className="h-8 w-8 mb-2" />Error al cargar.</div>
          ) : (
            <ColorfulCalendar
              events={calendarEvents}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">
                Eventos para el {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-3">
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map(event => (
                      <div key={event.id} onClick={() => handleOpenEditModal(event)} className="p-3 rounded-lg border flex items-start gap-3 cursor-pointer hover:bg-muted transition-colors">
                        <div className={cn('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', `bg-event-${event.color || 'default'}`)}></div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3" />
                            {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No hay eventos para este día.</p>
                  </div>
                )}
              </ScrollArea>
              <Separator className="my-4" />
              <Button className="w-full" onClick={() => handleOpenCreateModal(selectedDate)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Evento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showEventModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowEventModal(isOpen); }}>
        {/* Aumentamos el tamaño máximo del diálogo a 3xl para dar más espacio si es necesario */}
        <DialogContent className="sm:max-w-2xl md:max-w-3xl overflow-y-auto max-h-[90vh] bg-black">
          <DialogHeader>
            <DialogTitle>{eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
            <DialogDescription>Completa los detalles del evento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 py-2">
            {/* Título y Descripción: Full-width en móviles, 2/3 en tablets, 1/3 en grandes */}
            <div className="sm:col-span-2 lg:col-span-3"> {/* Título en línea completa */}
              <Label htmlFor="event-title">Título del Evento</Label>
              <Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving} />
            </div>

            <div className="sm:col-span-2 lg:col-span-3"> {/* Ubicación en línea completa */}
              <Label htmlFor="event-location">Ubicación o Plataforma (Ej: Sala 3, Zoom)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="event-location" value={formLocation} onChange={e => setFormLocation(e.target.value)} disabled={isSaving} className="pl-10" />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3"> {/* Descripción en línea completa */}
              <Label htmlFor="event-description">Descripción (Opcional)</Label>
              <Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving} rows={3} /> {/* Aumentamos las filas para mejor visualización */}
            </div>

            {/* Fechas y Horas: Agrupados y flexibles */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"> {/* Contenedor para "Todo el día" y fechas/horas */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving} />
                <Label htmlFor="all-day">Todo el día</Label>
              </div>
              {/* Inputs de fecha/hora: Ocultar si es todo el día, alinear en una fila */}
              {!formAllDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full"> {/* Flex-grow para que ocupe el espacio restante */}
                  <div>
                    <Label htmlFor="start-date">Inicio</Label>
                    <Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving} />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Fin</Label>
                    <Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving} />
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Color: Centrado si está solo, o en una columna */}
            <div className="sm:col-span-2 lg:col-span-3"> {/* Ocupa el ancho completo para centrar */}
              <Label>Color del Evento</Label>
              <div className="flex flex-wrap gap-3 mt-2 justify-start"> {/* flex-wrap para responsividad */}
                {['blue', 'green', 'red', 'orange', 'default'].map((colorOption) => (
                  <div
                    key={colorOption}
                    className={`h-8 w-8 rounded-full cursor-pointer border-2 ${formColor === colorOption ? 'border-primary scale-110' : 'border-transparent'} flex items-center justify-center transition-all duration-200 ease-in-out`}
                    onClick={() => setFormColor(colorOption)}
                    style={{ backgroundColor: `hsl(var(--event-${colorOption}))` }}
                    title={colorOption}
                  >
                    {formColor === colorOption && (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dirigido a: Radio Group flexible */}
            <div className="sm:col-span-2 lg:col-span-3"> {/* Ocupa el ancho completo */}
              <Label>Dirigido a</Label>
              <RadioGroup
                value={formAudienceMode}
                onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2" // Más columnas si hay espacio
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="ALL" id="audience-all" /><Label htmlFor="audience-all">Todos</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" /><Label htmlFor="audience-admin">Administradores</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" /><Label htmlFor="audience-instructor">Instructores</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="STUDENT" id="audience-student" /><Label htmlFor="audience-student">Estudiantes</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="SPECIFIC" id="audience-specific" /><Label htmlFor="audience-specific">Personas Específicas</Label></div>
              </RadioGroup>
            </div>

            {/* Asistentes Específicos: Scrollable y con estilo mejorado */}
            {formAudienceMode === 'SPECIFIC' && (
              <div className="sm:col-span-2 lg:col-span-3"> {/* Ocupa el ancho completo */}
                <Label>Asistentes Específicos</Label>
                <ScrollArea className="h-40 w-full rounded-md border p-2">
                  <div className="space-y-2">
                    {allUsers.length > 0 ? allUsers.map((u) => (
                      <div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-sm transition-colors">
                        <Checkbox
                          id={`attendee-${u.id}`}
                          checked={formAttendees.includes(u.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? setFormAttendees([...formAttendees, u.id])
                              : setFormAttendees(formAttendees.filter((id) => id !== u.id));
                          }}
                        />
                        <Label htmlFor={`attendee-${u.id}`} className="font-normal cursor-pointer">
                          {u.name} <span className="text-xs text-muted-foreground">({u.email})</span>
                        </Label>
                      </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4">No hay otros usuarios para invitar.</p>}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Footer del Diálogo */}
            <DialogFooter className="sm:col-span-2 lg:col-span-3 mt-4 flex justify-between w-full">
              <div>
                {eventToEdit && (
                  <Button type="button" variant="destructive" onClick={() => { setEventToDelete(eventToEdit); setShowEventModal(false); }} disabled={isSaving}>
                    <Trash2 className="mr-2" /> Eliminar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEventModal(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 animate-spin" />}
                  {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving && <Loader2 className="mr-2 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
