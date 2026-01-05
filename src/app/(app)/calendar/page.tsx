
"use client";

import React, { useState } from "react";
import { EnhancedCalendar, CalendarEvent } from "@/components/calendar/enhanced-calendar";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Placeholder for create modal

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona tus eventos, reuniones y fechas importantes.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      <EnhancedCalendar onEventClick={handleEventClick} />

      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
