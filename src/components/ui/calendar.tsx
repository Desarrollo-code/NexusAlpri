"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation, type DateFormatter, type DayContentRenderer } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { es } from 'date-fns/locale';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { CalendarEvent } from "@/types";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    events?: CalendarEvent[];
}

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };
  return colorMap[color as string] || 'bg-primary';
};


function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  events = [],
  ...props
}: CalendarProps) {
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
        const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
        if (!map.has(dayKey)) {
            map.set(dayKey, []);
        }
        map.get(dayKey)!.push(event);
    });
    return map;
  }, [events]);

  const DayContentWithEvents: DayContentRenderer = (dayProps) => {
    const dayKey = format(dayProps.date, 'yyyy-MM-dd');
    const dayEvents = eventsByDay.get(dayKey) || [];

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            <span>{dayProps.date.getDate()}</span>
            {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                    {dayEvents.slice(0, 3).map(event => (
                        <div key={event.id} className={cn("h-1.5 w-1.5 rounded-full", getEventColorClass(event.color))} />
                    ))}
                </div>
            )}
        </div>
    )
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "hidden",
        caption_label: "hidden", 
        nav: "hidden",
        nav_button: "hidden", 
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      locale={es} // Aseguramos el locale español
      components={{
        DayContent: DayContentWithEvents,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
