import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden shadow-sm active:shadow-inner active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border-primary/80 border bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "border-destructive/80 border bg-gradient-to-b from-destructive/90 to-destructive text-destructive-foreground hover:from-destructive hover:to-destructive active:from-destructive/90 active:to-destructive/80",
        outline:
          "border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-secondary/80 border bg-gradient-to-b from-secondary/90 to-secondary text-secondary-foreground hover:from-secondary hover:to-secondary active:from-secondary/90 active:to-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Si asChild es true, no podemos añadir elementos extra.
    // El componente padre se encargará de renderizar el contenido.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }

    // Si es un botón normal, añadimos el efecto de brillo.
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span 
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-80"
            aria-hidden="true"
        />
        <span className="relative z-10">{props.children}</span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
