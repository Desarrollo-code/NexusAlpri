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
import type { CalendarEvent, User, EventAudienceType } from '@/types';
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

  // Inicializa selectedDate con la fecha actual. Este es el punto clave.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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
  const [formAudienceMode, setFormAudienceMode] = useState<EventAudienceType>('SPECIFIC');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [formColor, setFormColor] = useState<string>('default');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        // Manejo de errores más robusto para respuestas no-JSON
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to fetch events');
        } catch {
          throw new Error(errorText || `Failed to fetch events. Server responded with: ${errorText.substring(0, 100)}...`);
        }
      }
      const data: CalendarEvent[] = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: `No se pudieron cargar los eventos del calendario: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    // Solo admins e instructores pueden ver/gestionar usuarios
    if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
         const errorText = await res.text();
         try {
           const errorData = JSON.parse(errorText);
           throw new Error(errorData.message || "Failed to fetch users");
         } catch {
           throw new Error(errorText || `Failed to fetch users. Server responded with: ${errorText.substring(0, 100)}...`);
         }
      }
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (err) {
      toast({ title: 'Error', description: `No se pudieron cargar los usuarios: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) { // Asegura que solo se intenten cargar datos si hay un usuario logeado
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
    setFormColor('default');
    setEventToEdit(null);
  }

  const handleOpenCreateModal = (date?: Date) => {
    resetForm();
    const targetDate = date || new Date(); // Si no se pasa fecha, usa la actual
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
    const start = new Date(event.start);
    const end = new Date(event.end);
    setFormStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
    setFormEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    setFormAudienceMode(event.audienceType || 'SPECIFIC');
    setFormAttendees(event.attendees?.map(a => a.id) || []);
    setFormColor(event.color || 'default');
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
      color: formColor,
    };

    const endpoint = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
    const method = eventToEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to save event');
        } catch {
          throw new Error(errorText || `Failed to save event. Server responded with: ${errorText.substring(0, 100)}...`);
        }
      }

      toast({ title: 'Éxito', description: `Evento ${eventToEdit ? 'actualizado' : 'creado'} correctamente.` });
      setShowEventModal(false);
      fetchEvents(); // Refresca los eventos después de guardar
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo guardar el evento: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return; // Asegura que hay un evento seleccionado para borrar
    setIsSaving(true);
    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to delete event');
        } catch {
          throw new Error(errorText || `Failed to delete event. Server responded with: ${errorText.substring(0, 100)}...`);
        }
      }
      toast({ title: 'Éxito', description: 'Evento eliminado.' });
      setEventToDelete(null); // Limpia el evento a eliminar
      fetchEvents(); // Refresca los eventos después de eliminar
      setShowEventModal(false); // Cierra el modal de edición si estaba abierto
    } catch (err) {
      toast({ title: 'Error', description: `No se pudo eliminar el evento: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const calendarEvents = useMemo(() => events, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []; // Retorna un array vacío si no hay fecha seleccionada
    return events
      .filter(event => isSameDay(new Date(event.start), selectedDate))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()); // Ordena por hora de inicio
  }, [events, selectedDate]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="shadow-lg lg:col-span-3 bg-dark-background text-light-text border-border"> {/* Ajuste de color de fondo y borde */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px] text-light-text">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />Error al cargar: {error}
            </div>
          ) : (
            <div className="flex justify-center items-center py-4">
              <ColorfulCalendar
                // Tamaño: 'max-w-4xl' para hacerlo más grande.
                // Posición: `ml-auto` empuja a la derecha, `mr-10` define un margen a la derecha.
                // Puedes ajustar `mr-10` (que son 40px) para moverlo más o menos a la derecha.
                // Si quieres centrarlo y solo desplazarlo, la alternativa es:
                // className="w-full max-w-4xl mx-auto transform translate-x-4"
                // Donde `translate-x-4` lo movería 16px a la derecha del centro.
                className="w-full max-w-4xl ml-40"// Este lo alinea a la derecha con un margen.
                events={calendarEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-lg bg-dark-background text-light-text border-border"> {/* Ajuste de color de fondo y borde */}
            <CardHeader>
              <CardTitle className="text-lg text-primary-foreground"> {/* Título en color de contraste */}
                Eventos para el {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-3">
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map(event => (
                      <div key={event.id} onClick={() => handleOpenEditModal(event)} className="p-3 rounded-lg border border-border flex items-start gap-3 cursor-pointer hover:bg-muted transition-colors">
                        <div className={cn('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', `bg-event-${event.color || 'default'}`)}></div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm text-foreground">{event.title}</p>
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
              <Separator className="my-4 bg-border" /> {/* Separador con color de contraste */}
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleOpenCreateModal(selectedDate)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Evento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showEventModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowEventModal(isOpen); }}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl overflow-y-auto max-h-[90vh] bg-dark-background text-light-text border-border"> {/* Ajuste de color */}
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">{eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los detalles del evento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 py-2">
            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="event-title" className="text-foreground">Título del Evento</Label>
              <Input id="event-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} required disabled={isSaving} className="bg-input text-foreground border-border" />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="event-location" className="text-foreground">Ubicación o Plataforma (Ej: Sala 3, Zoom)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="event-location" value={formLocation} onChange={e => setFormLocation(e.target.value)} disabled={isSaving} className="pl-10 bg-input text-foreground border-border" />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="event-description" className="text-foreground">Descripción (Opcional)</Label>
              <Textarea id="event-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={isSaving} rows={3} className="bg-input text-foreground border-border" />
            </div>

            <div className="lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Switch id="all-day" checked={formAllDay} onCheckedChange={setFormAllDay} disabled={isSaving} className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" />
                <Label htmlFor="all-day" className="text-foreground">Todo el día</Label>
              </div>
              {!formAllDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full">
                  <div>
                    <Label htmlFor="start-date" className="text-foreground">Inicio</Label>
                    <Input id="start-date" type="datetime-local" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} required disabled={isSaving} className="bg-input text-foreground border-border" />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-foreground">Fin</Label>
                    <Input id="end-date" type="datetime-local" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} required disabled={isSaving} className="bg-input text-foreground border-border" />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="text-foreground">Color del Evento</Label>
              <div className="flex flex-wrap gap-3 mt-2 justify-start">
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

            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="text-foreground">Dirigido a</Label>
              <RadioGroup
                value={formAudienceMode}
                onValueChange={(value) => setFormAudienceMode(value as EventAudienceType)}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="ALL" id="audience-all" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="audience-all">Todos</Label></div>
                <div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="ADMINISTRATOR" id="audience-admin" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="audience-admin">Administradores</Label></div>
                <div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="INSTRUCTOR" id="audience-instructor" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="audience-instructor">Instructores</Label></div>
                <div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="STUDENT" id="audience-student" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="audience-student">Estudiantes</Label></div>
                <div className="flex items-center space-x-2 text-foreground"><RadioGroupItem value="SPECIFIC" id="audience-specific" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><Label htmlFor="audience-specific">Personas Específicas</Label></div>
              </RadioGroup>
            </div>

            {formAudienceMode === 'SPECIFIC' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Label className="text-foreground">Asistentes Específicos</Label>
                <ScrollArea className="h-40 w-full rounded-md border border-border p-2 bg-input"> {/* Fondo del scroll área */}
                  <div className="space-y-2">
                    {allUsers.length > 0 ? allUsers.map((u) => (
                      <div key={u.id} className="flex items-center space-x-2 p-1 hover:bg-accent/50 rounded-sm transition-colors">
                        <Checkbox
                          id={`attendee-${u.id}`}
                          checked={formAttendees.includes(u.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? setFormAttendees([...formAttendees, u.id])
                              : setFormAttendees(formAttendees.filter((id) => id !== u.id));
                          }}
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor={`attendee-${u.id}`} className="font-normal cursor-pointer text-foreground">
                          {u.name} <span className="text-xs text-muted-foreground">({u.email})</span>
                        </Label>
                      </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4">No hay otros usuarios para invitar.</p>}
                  </div>
                </ScrollArea>
              </div>
            )}

            <DialogFooter className="sm:col-span-2 lg:col-span-3 mt-4 flex justify-between w-full">
              <div>
                {eventToEdit && (
                  <Button type="button" variant="destructive" onClick={() => { setEventToDelete(eventToEdit); setShowEventModal(false); }} disabled={isSaving}>
                    <Trash2 className="mr-2" /> Eliminar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEventModal(false)} disabled={isSaving} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving && <Loader2 className="mr-2 animate-spin" />}
                  {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent className="bg-dark-background text-light-text border-border"> {/* Ajuste de color */}
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary-foreground">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará el evento "<strong>{eventToDelete?.title}</strong>".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving} className="border-border text-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={isSaving} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isSaving && <Loader2 className="mr-2 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}