// src/app/(app)/calendar/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, Loader2, AlertTriangle, Edit, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { CalendarEvent } from '@/types';
import { startOfToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { calendarTour } from '@/lib/tour-steps';
import { EventEditorModal } from '@/components/calendar/event-editor-modal';
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar';
import { DatePickerSidebar } from '@/components/calendar/date-picker-sidebar';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { expandRecurringEvents } from '@/lib/calendar-utils';

export type CalendarView = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  const [baseEvents, setBaseEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [view, setView] = useState<CalendarView>('month');
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalDate, setModalDate] = useState<Date | undefined>(undefined);

  const canCreateEvent = useMemo(() => user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR', [user]);

  useEffect(() => {
    setPageTitle('Calendario');
    startTour('calendar', calendarTour);
  }, [setPageTitle, startTour]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch events');
      const data: CalendarEvent[] = await response.json();
      setBaseEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: `No se pudieron cargar los eventos: ${err instanceof Error ? err.message : ''}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [fetchEvents, user]);

  const displayedEvents = useMemo(() => {
      let rangeStart, rangeEnd;
      switch(view) {
          case 'month':
              rangeStart = startOfWeek(startOfMonth(currentDate));
              rangeEnd = endOfWeek(endOfMonth(currentDate));
              break;
          case 'week':
              rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
              rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
              break;
          case 'day':
              rangeStart = startOfDay(currentDate);
              rangeEnd = endOfDay(currentDate);
              break;
      }
      return expandRecurringEvents(baseEvents, rangeStart, rangeEnd);
  }, [baseEvents, currentDate, view]);

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // Re-fetch all events to correctly handle recurring event updates
    fetchEvents();
  };

  const handleEventDelete = (eventId: string) => {
    // Re-fetch all events to correctly handle recurring event deletions
    fetchEvents();
  };
  
  const handleOpenModal = (eventOrDate?: CalendarEvent | Date) => {
      if (eventOrDate instanceof Date) { // Clicked on a time slot
        if (!canCreateEvent) return;
        setSelectedEvent(null);
        setModalDate(eventOrDate);
      } else if (eventOrDate) { // Clicked on an existing event
        const originalEvent = baseEvents.find(e => e.id === (eventOrDate.parentId || eventOrDate.id));
        setSelectedEvent(originalEvent || eventOrDate);
        setModalDate(new Date(eventOrDate.start));
      } else { // Clicked "Create Event" button
         if (!canCreateEvent) return;
        setSelectedEvent(null);
        setModalDate(new Date());
      }
      setShowEventModal(true);
  }

  const renderView = () => {
    const viewProps = { currentDate, events: displayedEvents, onEventClick: handleOpenModal, onSlotClick: handleOpenModal };
    switch (view) {
        case 'month': return <MonthView {...viewProps} />;
        case 'week': return <WeekView {...viewProps} />;
        case 'day': return <DayView {...viewProps} />;
        default: return <MonthView {...viewProps} />;
    }
  }

  return (
    <div className={cn("flex flex-col h-[calc(100vh-8rem)] gap-4 md:gap-6")}>
      <header className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CalendarToolbar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            view={view}
            setView={setView}
        />
        <div className="flex items-center gap-2 w-full justify-between md:w-auto md:justify-end">
          <Button variant="outline" size="sm" onClick={() => forceStartTour('calendar', calendarTour)}>
            <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
          </Button>
          {canCreateEvent && (
            <Button size={isMobile ? 'sm' : 'default'} onClick={() => handleOpenModal()} id="create-event-btn">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Evento
            </Button>
          )}
        </div>
      </header>

      <main className={cn("flex-grow min-h-0", isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-4 gap-6')}>
        {!isMobile && (
             <aside className="md:col-span-1 lg:col-span-1" id="calendar-sidebar">
                <DatePickerSidebar
                    selectedDate={currentDate}
                    onDateSelect={setCurrentDate}
                    events={displayedEvents}
                    onEventClick={handleOpenModal}
                 />
             </aside>
        )}
        <div className={cn("md:col-span-3 lg:col-span-3 flex flex-col min-h-0 bg-card rounded-lg border shadow-sm", isMobile ? "" : "p-0")} id="calendar-main-view">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive"><AlertTriangle className="h-8 w-8 mb-2" />Error al cargar: {error}</div>
          ) : (
             <div className={cn("h-full w-full", view !== 'month' && "overflow-auto thin-scrollbar")}>
                {renderView()}
             </div>
          )}
        </div>
      </main>
      
      <EventEditorModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
        selectedDate={modalDate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />
    </div>
  );
}
