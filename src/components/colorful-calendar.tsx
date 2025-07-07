// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { DayPicker, type DayContentProps } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { Calendar } from '@/components/ui/calendar'; // Este es el componente Calendar de Shadcn/ui

interface ColorfulCalendarProps {
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  className?: string; // Para pasar clases de Tailwind desde el componente padre
}

// Colores personalizados del tema, si no están definidos, usa valores por defecto
const getEventColorClass = (color?: string): string => {
  switch (color) {
    case 'blue':
      return 'bg-event-blue';
    case 'green':
      return 'bg-event-green';
    case 'red':
      return 'bg-event-red';
    case 'orange':
      return 'bg-event-orange';
    case 'default':
    default:
      return 'bg-event-default';
  }
};

// Componente para renderizar el contenido de cada día
function CustomDayContent(props: DayContentProps) {
  const { date } = props;
  // Accede a los eventos pasados a través de activeModifiers
  const { eventsForDay } = props.activeModifiers as { eventsForDay?: CalendarEvent[] };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <span className="text-foreground">{format(date, 'd')}</span> {/* Asegura que el número del día tenga el color de texto apropiado */}
      {eventsForDay && eventsForDay.length > 0 && (
        <div className="absolute bottom-1.5 flex justify-center items-center space-x-1">
          {eventsForDay.slice(0, 4).map((event) => ( // Muestra hasta 4 puntos de evento
            <div
              key={event.id}
              className={cn('h-1.5 w-1.5 rounded-full', getEventColorClass(event.color))}
              title={event.title} // Muestra el título al pasar el ratón
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ColorfulCalendar({
  events,
  selectedDate,
  onDateSelect,
  className,
}: ColorfulCalendarProps) {
  // Memoiza los eventos por día para mejorar el rendimiento
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const day = format(new Date(event.start), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(event);
    }
    return grouped;
  }, [events]);

  // Modificadores para DayPicker para inyectar eventos en CustomDayContent
  const modifiers = useMemo(() => ({
    eventsForDay: (date: Date) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      return eventsByDay[dayKey] || [];
    },
  }), [eventsByDay]);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={es} // Usa el idioma español
      modifiers={modifiers}
      components={{
        DayContent: CustomDayContent, // Usa nuestro componente personalizado para los días
      }}
      className={className} // Permite pasar clases de Tailwind desde el componente padre para tamaño y posición
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "w-full h-auto p-0 font-normal aria-selected:opacity-100 aspect-square",
          "flex items-center justify-center rounded-md"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        day_today: "bg-accent text-accent-foreground rounded-md",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
    />
  );
}
