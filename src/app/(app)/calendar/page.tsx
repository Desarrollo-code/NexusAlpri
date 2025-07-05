import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import CalendarView from "@/components/app/calendar-view";

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold font-headline">Julio 2025</h1>
            <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="hidden md:inline-flex ml-4">Hoy</Button>
        </div>
        <div className="flex items-center gap-2">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Evento
            </Button>
        </div>
      </header>
      <div className="flex-1">
        <CalendarView />
      </div>
    </div>
  );
}
