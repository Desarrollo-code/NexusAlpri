
"use client";

import React, { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS, es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    List,
    Filter,
    Plus,
    Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- MOCK DATA & TYPES ---

export type EventCategory = {
    id: string;
    name: string;
    color: string;
};

export type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    categoryId: string;
    color?: string;
    description?: string;
    location?: string;
    allDay?: boolean;
    isInteractive?: boolean;
    creatorId?: string;
    attendees?: { id: string, name: string, avatar?: string | null }[];
};

// --- LOCALIZER SETUP ---

const locales = {
    "en-US": enUS,
    "es": es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// --- COMPONENTS ---

interface ToolbarProps {
    date: Date;
    view: View;
    onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
    onViewChange: (view: View) => void;
    categories: EventCategory[];
    selectedCategories: string[];
    onCategoryChange: (categoryId: string) => void;
}

const CustomToolbar: React.FC<ToolbarProps> = ({
    date,
    view,
    onNavigate,
    onViewChange,
    categories,
    selectedCategories,
    onCategoryChange,
}) => {
    return (
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between p-2">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onNavigate("PREV")}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onNavigate("TODAY")}
                    className="text-sm font-medium"
                >
                    Hoy
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onNavigate("NEXT")}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold ml-2 capitalize">
                    {format(date, "MMMM yyyy", { locale: es })}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2 dashed-border">
                            <Filter className="h-4 w-4" />
                            Filtrar
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4" align="end">
                        <h4 className="font-medium mb-2">Categorías</h4>
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={cat.id}
                                        checked={selectedCategories.includes(cat.id)}
                                        onCheckedChange={() => onCategoryChange(cat.id)}
                                        style={{
                                            borderColor: cat.color,
                                            backgroundColor: selectedCategories.includes(cat.id) ? cat.color : undefined
                                        }}
                                    />
                                    <label
                                        htmlFor={cat.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {cat.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="bg-muted p-1 rounded-lg flex items-center">
                    <Button
                        variant={view === Views.MONTH ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange(Views.MONTH)}
                        className="text-xs"
                    >
                        Mes
                    </Button>
                    <Button
                        variant={view === Views.WEEK ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange(Views.WEEK)}
                        className="text-xs"
                    >
                        Semana
                    </Button>
                    <Button
                        variant={view === Views.DAY ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange(Views.DAY)}
                        className="text-xs"
                    >
                        Día
                    </Button>
                    <Button
                        variant={view === Views.AGENDA ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange(Views.AGENDA)}
                        className="text-xs"
                    >
                        Agenda
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface EnhancedCalendarProps {
    onEventClick?: (event: CalendarEvent) => void;
    refreshTrigger?: number;
}

const CATEGORIES: EventCategory[] = [
    { id: "ALL", name: "Todos", color: "#3b82f6" },
    { id: "ADMINISTRATOR", name: "Administración", color: "#8b5cf6" },
    { id: "INSTRUCTOR", name: "Instructores", color: "#10b981" },
    { id: "STUDENT", name: "Estudiantes", color: "#f59e0b" },
];

export function EnhancedCalendar({ onEventClick, refreshTrigger }: EnhancedCalendarProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        CATEGORIES.map((c) => c.id)
    );

    React.useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/events');
                if (response.ok) {
                    const data = await response.json();
                    const formatted = data.map((e: any) => ({
                        ...e,
                        start: new Date(e.start),
                        end: new Date(e.end),
                        categoryId: e.audienceType || "ALL"
                    }));
                    setEvents(formatted);
                }
            } catch (err) {
                console.error("Fetch events failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [refreshTrigger]);

    const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
        let newDate = new Date(date);
        if (action === "TODAY") newDate = new Date();
        else {
            const back = action === "PREV" ? -1 : 1;
            if (view === Views.MONTH) newDate.setMonth(newDate.getMonth() + back);
            if (view === Views.WEEK) newDate.setDate(newDate.getDate() + 7 * back);
            if (view === Views.DAY) newDate.setDate(newDate.getDate() + 1 * back);
        }
        setDate(newDate);
    };

    const handleCategoryChange = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.filter((id) => id !== catId)
                : [...prev, catId]
        );
    };

    const filteredEvents = useMemo(() => {
        return events.filter((evt) => selectedCategories.includes(evt.categoryId));
    }, [events, selectedCategories]);

    const eventStyleGetter = (event: CalendarEvent) => {
        const category = CATEGORIES.find((c) => c.id === event.categoryId) || CATEGORIES[0];
        const backgroundColor = event.color || category.color;
        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: event.isInteractive ? "2px solid #ef4444" : "0px",
                boxShadow: event.isInteractive ? "0 0 10px rgba(239, 68, 68, 0.4)" : "none",
                display: "block",
            },
        };
    };

    if (isLoading) {
        return <div className="h-[800px] flex items-center justify-center border rounded-xl"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="min-h-[600px] lg:h-[800px] flex flex-col bg-background p-2 md:p-4 rounded-xl border shadow-sm">
            <CustomToolbar
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onViewChange={setView}
                categories={CATEGORIES}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
            />

            <motion.div
                key={view}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
            >
                <Calendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        toolbar: () => null, // We used our custom toolbar
                    }}
                    messages={{
                        next: "Siguiente",
                        previous: "Anterior",
                        today: "Hoy",
                        month: "Mes",
                        week: "Semana",
                        day: "Día",
                        agenda: "Agenda",
                        date: "Fecha",
                        time: "Hora",
                        event: "Evento",
                        noEventsInRange: "No hay eventos en este rango",
                    }}
                    culture="es"
                    onSelectEvent={(event) => onEventClick?.(event)}
                />
            </motion.div>
        </div>
    );
}
