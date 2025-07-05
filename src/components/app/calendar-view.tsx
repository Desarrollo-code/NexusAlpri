'use client';

import { cn } from "@/lib/utils";
import { events } from "@/lib/data";

const CalendarView = () => {
  const year = 2025;
  const month = 6; // 0-indexed for July

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  
  const today = 4; // As per requirement

  const getEventsForDay = (day: number) => {
    return events.filter(event => new Date(event.date).getDate() === day);
  };

  return (
    <div className="grid grid-cols-7 h-full border-t border-l rounded-lg overflow-hidden">
      {weekDays.map(day => (
        <div key={day} className="text-center font-medium p-2 border-b text-muted-foreground text-sm">
          {day}
        </div>
      ))}
      {calendarDays.map((day, index) => {
        const isToday = day === today;
        const dayEvents = day ? getEventsForDay(day) : [];

        return (
          <div key={index} className="relative border-b border-r min-h-[120px] p-2 flex flex-col gap-1 overflow-y-auto">
            {day && (
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-sm",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {day}
              </div>
            )}
            {dayEvents.map(event => (
                 <div key={event.id} className="text-xs p-1 rounded-md bg-accent text-accent-foreground truncate">
                    {event.title}
                 </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;
