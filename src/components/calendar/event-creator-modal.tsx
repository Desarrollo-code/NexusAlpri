"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EventCreatorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventCreatorModal({ open, onOpenChange }: EventCreatorModalProps) {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const title = formData.get('title') as string;
        const time = formData.get('time') as string;
        const description = formData.get('description') as string;
        const categoryId = formData.get('category') as string;
        const allDay = formData.get('allDay') === 'on';

        if (!date || !title) return;

        const start = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        start.setHours(hours, minutes);

        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        setIsLoading(true);
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    start,
                    end,
                    allDay,
                    audienceType: categoryId === "1" ? "ALL" : categoryId === "2" ? "ADMINISTRATOR" : categoryId === "3" ? "INSTRUCTOR" : "STUDENT",
                    color: categoryId === "1" ? "#3b82f6" : categoryId === "2" ? "#ef4444" : categoryId === "3" ? "#10b981" : "#8b5cf6"
                }),
            });
            if (response.ok) {
                onOpenChange(false);
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription>
                        Programa un nuevo evento en el calendario.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título del Evento</Label>
                        <Input id="title" name="title" placeholder="Ej. Reunión de Estrategia" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "P", { locale: es }) : <span>Seleccionar fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Hora</Label>
                            <Input id="time" name="time" type="time" defaultValue="09:00" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select defaultValue="1" name="category">
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">General (Todos)</SelectItem>
                                <SelectItem value="2">Administración</SelectItem>
                                <SelectItem value="3">Instructores</SelectItem>
                                <SelectItem value="4">Estudiantes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Detalles adicionales del evento..." />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="all-day" name="allDay" />
                        <Label htmlFor="all-day" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Todo el día</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : "Crear Evento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
