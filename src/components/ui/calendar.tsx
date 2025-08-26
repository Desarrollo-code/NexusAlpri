"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"
import { format } from "date-fns"
import { es } from 'date-fns/locale';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CustomCaption(props: any) {
  const { fromDate, toDate } = useDayPicker();
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  
  const displayMonth = format(props.displayMonth, "MMMM yyyy", { locale: es });

  return (
    <div className="flex justify-center items-center px-2 pt-1 relative">
       <Button
        variant="ghost"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="h-7 w-7 p-0 absolute left-1"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="font-semibold text-sm capitalize">{displayMonth}</h2>
       <Button
         variant="ghost"
         disabled={!nextMonth}
         onClick={() => nextMonth && goToMonth(nextMonth)}
         className="h-7 w-7 p-0 absolute right-1"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}


function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption_layout: 'dropdown-buttons',
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // We use our custom caption
        nav_button: "hidden", // We use our custom caption buttons
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
      components={{
        Caption: CustomCaption,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
