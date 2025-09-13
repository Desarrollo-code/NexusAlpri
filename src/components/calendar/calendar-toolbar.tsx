// src/components/calendar/calendar-toolbar.tsx
'use client';
import React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Rows, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CalendarView } from '@/app/(app)/calendar/page';

interface CalendarToolbarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
}

export function CalendarToolbar({ currentDate, setCurrentDate, view, setView }: CalendarToolbarProps) {

  const handleNav = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
        break;
    }
  };
  
  const getTitle = () => {
    switch(view) {
        case 'month': return format(currentDate, "MMMM yyyy", { locale: es });
        case 'week': 
            const start = format(startOfWeek(currentDate, {weekStartsOn: 1}), 'd MMM', { locale: es });
            const end = format(endOfWeek(currentDate, {weekStartsOn: 1}), 'd MMM yyyy', { locale: es });
            return `${start} - ${end}`;
        case 'day': return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full" id="calendar-nav-controls">
      <div className="flex items-center gap-2 justify-center md:justify-start">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleNav('prev')}><ChevronLeft className="h-4 w-4" /></Button>
        <h2 className="text-xl md:text-2xl font-bold font-headline capitalize w-48 text-center truncate">{getTitle()}</h2>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleNav('next')}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" className="h-9 hidden sm:flex" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
      </div>
      <div className="flex-shrink-0">
         <Select value={view} onValueChange={(value) => setView(value as CalendarView)}>
            <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="day"><Rows className="inline-block mr-2 h-4 w-4"/>Día</SelectItem>
                <SelectItem value="week"><Calendar className="inline-block mr-2 h-4 w-4"/>Semana</SelectItem>
                <SelectItem value="month"><Columns className="inline-block mr-2 h-4 w-4"/>Mes</SelectItem>
            </SelectContent>
         </Select>
      </div>
    </div>
  );
}
