// src/lib/calendar-utils.ts
import { 
    addDays, 
    addWeeks, 
    addMonths, 
    addYears, 
    isWithinInterval, 
    isSameDay, 
    startOfDay, 
    endOfDay,
    eachDayOfInterval,
    differenceInDays
} from 'date-fns';
import type { CalendarEvent } from '@/types';
import type { RecurrenceType } from '@prisma/client';

/**
 * Expande un array de eventos base (incluyendo recurrentes) a una lista
 * de todas las ocurrencias individuales dentro de un rango de fechas.
 * 
 * @param baseEvents - El array de eventos base, tal como se obtiene de la DB.
 * @param rangeStart - La fecha de inicio del rango a expandir.
 * @param rangeEnd - La fecha de fin del rango a expandir.
 * @returns Un array de todas las ocurrencias de eventos dentro del rango.
 */
export function expandRecurringEvents(
  baseEvents: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const allOccurrences: CalendarEvent[] = [];

  baseEvents.forEach(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Si el evento no es recurrente, simplemente lo añadimos si está en el rango.
    if (event.recurrence === 'NONE') {
      // Un evento se considera en el rango si su inicio o su fin están dentro,
      // o si el evento abarca completamente el rango.
      const eventInterval = { start: eventStart, end: eventEnd };
      const rangeInterval = { start: rangeStart, end: rangeEnd };
      
      const overlaps = 
        isWithinInterval(eventStart, rangeInterval) ||
        isWithinInterval(eventEnd, rangeInterval) ||
        (isWithinInterval(rangeStart, eventInterval) && isWithinInterval(rangeEnd, eventInterval));

      if (overlaps) {
        allOccurrences.push(event);
      }
      return;
    }

    // --- Lógica para expandir eventos recurrentes ---
    let cursor = eventStart;
    const finalEndDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : rangeEnd;
    
    // Iteramos desde el inicio del evento hasta el final de la recurrencia o el final del rango,
    // lo que ocurra primero.
    while (cursor <= finalEndDate) {
      if (cursor >= rangeStart && cursor <= rangeEnd) { // Asegurarnos de que la ocurrencia está dentro del rango visible
        const duration = eventEnd.getTime() - eventStart.getTime();
        
        const occurrenceStart = new Date(cursor.getTime());
        const occurrenceEnd = new Date(cursor.getTime() + duration);

        // Creamos una nueva "ocurrencia" del evento para este día.
        allOccurrences.push({
          ...event,
          id: `${event.id}-${cursor.toISOString().split('T')[0]}`, // ID único para la ocurrencia
          parentId: event.id,
          start: occurrenceStart.toISOString(),
          end: occurrenceEnd.toISOString(),
        });
      }
      
      // Salimos del bucle si el cursor ya pasó el rango visible para optimizar
      if (cursor > rangeEnd) break;
      
      // Avanzamos el cursor según el tipo de recurrencia.
      switch (event.recurrence) {
        case 'DAILY':
          cursor = addDays(cursor, 1);
          break;
        case 'WEEKLY':
          cursor = addWeeks(cursor, 1);
          break;
        case 'MONTHLY':
          cursor = addMonths(cursor, 1);
          break;
        case 'YEARLY':
          cursor = addYears(cursor, 1);
          break;
        default: // NONE o cualquier otro caso
          return; // Salimos del bucle si no es recurrente.
      }
    }
  });

  return allOccurrences;
}
