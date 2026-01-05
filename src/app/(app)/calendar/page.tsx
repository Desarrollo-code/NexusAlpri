
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        {/* Title handled by TopBar, showing description here */}
        <p className="text-muted-foreground text-lg">
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
