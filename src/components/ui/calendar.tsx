"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker" // Asegúrate de tener 'react-day-picker' instalado: npm install react-day-picker

import { cn } from "@/lib/utils" // Asumo que `cn` es una utilidad para combinar clases de Tailwind.
import { buttonVariants } from "@/components/ui/button" // Asumo que `buttonVariants` define estilos base para botones.

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      // ***** CAMBIOS CLAVE AQUI PARA EL TAMAÑO GENERAL DEL CALENDARIO *****
      // Agregamos 'w-full' para que el calendario ocupe todo el ancho disponible de su contenedor.
      // 'max-w-xl' lo limita a un ancho máximo en pantallas grandes (ajusta este valor si lo necesitas más pequeño o grande).
      // El 'p-3' es un padding general.
      className={cn("p-3 w-full max-w-xl", className)}
      classNames={{
        // ***** CLASES EXISTENTES Y AJUSTES DE TAMAÑO PARA LOS ELEMENTOS INTERNOS *****
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        // Aumentamos el tamaño del texto para el mes y el año
        caption_label: "text-lg font-semibold", // Antes: text-sm font-medium
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          // Hacemos los botones de navegación más grandes y un poco más visibles
          "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100" // Antes: h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        // Aumentamos el tamaño del texto para los días de la semana
        head_cell:
          "text-muted-foreground rounded-md w-full font-normal text-sm", // Antes: text-[0.8rem]

        // ***** SOLUCIÓN PARA LA CONCATENACIÓN DE DÍAS Y AJUSTE DE CELDAS *****
        // La clave aquí es cómo 'cell' y 'day' se dimensionan dentro de la 'row'.
        // 'row' ya es 'flex w-full', lo que significa que sus hijos se distribuirán.
        // Si 'cell' o 'day' también tuvieran 'w-full', competirían por el 100% y causarían el problema.
        row: "flex w-full mt-2", // Se mantiene igual. 'flex w-full' es bueno para distribuir las celdas.
        cell: "text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          // *** IMPORTANTE: Se eliminó 'w-full' de aquí. El flexbox de 'row' ahora distribuye las celdas. ***
          // Aumentamos el tamaño del texto para los números de los días.
          // Antes: "w-full text-center text-sm p-0..."
        day: cn(
          buttonVariants({ variant: "ghost" }),
          // *** IMPORTANTE: Se eliminó 'w-full' y 'aspect-square' de aquí. ***
          // Ahora cada día tiene un tamaño fijo (h-10 w-10), lo que asegura que no se compriman.
          // Puedes ajustar 'h-10 w-10' (ej: h-12 w-12, h-14 w-14) para controlar el tamaño de cada "casilla" del día.
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100" // Antes: "h-full w-full aspect-square p-0..."
        ),

        // Clases para el estado de selección de días (mantienen sus valores anteriores)
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        // Aumentamos el tamaño de los iconos de navegación para que sean proporcionales al nuevo tamaño del calendario.
        IconLeft: ({ ...props }) => <ChevronLeft className="h-6 w-6" {...props} />, // Antes: h-4 w-4
        IconRight: ({ ...props }) => <ChevronRight className="h-6 w-6" {...props} />, // Antes: h-4 w-4
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }