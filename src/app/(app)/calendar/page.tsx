
"use client";

import React, { useState } from "react";
import { EnhancedCalendar, CalendarEvent } from "@/components/calendar/enhanced-calendar";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { EventCreatorModal } from "@/components/calendar/event-creator-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTitle } from "@/contexts/title-context";

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { setPageTitle, setHeaderActions } = useTitle();

  React.useEffect(() => {
    setPageTitle("Calendario");
    setHeaderActions(
      <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
        <Plus className="h-4 w-4" />
        Nuevo Evento
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setPageTitle, setHeaderActions]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  return (
    <div className="w-full px-8 pt-0 pb-12 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1 text-left max-w-4xl">
        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          Gestiona y organiza todos tus eventos, reuniones y fechas importantes en un solo lugar.
        </p>
      </div>

      <EnhancedCalendar onEventClick={handleEventClick} />

      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EventCreatorModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
